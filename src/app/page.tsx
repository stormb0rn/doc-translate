"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/upload-zone";
import FileList from "@/components/file-list";
import TranslateButton from "@/components/translate-button";
import TranslatingOverlay from "@/components/translating-overlay";
import TranslationPreview from "@/components/translation-preview";
import PdfDownload from "@/components/pdf-download";
import PdfPreview from "@/components/pdf-preview";
import DocumentTypeBadge from "@/components/document-type-badge";
import ErrorMessage from "@/components/error-message";
import type { UploadedFile, TranslationResult, TranslateStreamEvent, BatchProgress, BatchResult } from "@/lib/types";
import type { ModelKey } from "@/lib/claude";
import { translateWithBatching, translateWithStreaming, retryFailedBatches } from "@/lib/batch";
import { findDuplicate } from "@/lib/file-utils";

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<"idle" | "translating" | "done" | "error">("idle");
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"text" | "pdf">("pdf");
  const [model, setModel] = useState<ModelKey>("kimi");
  const [activeResultIdx, setActiveResultIdx] = useState(0);
  const [duplicateWarnings, setDuplicateWarnings] = useState<Map<string, string>>(new Map());
  const [reasoningText, setReasoningText] = useState("");
  const [streamPhase, setStreamPhase] = useState<"idle" | "reasoning" | "translating">("idle");

  const handleFilesAdded = useCallback((newFiles: UploadedFile[]) => {
    const updated = [...files, ...newFiles];
    setFiles(updated);

    // Check for duplicates among new files
    const warnings = new Map(duplicateWarnings);
    for (const nf of newFiles) {
      const dup = findDuplicate(nf, updated);
      if (dup) {
        warnings.set(nf.id, dup.file.name);
      }
    }
    if (warnings.size > duplicateWarnings.size) {
      setDuplicateWarnings(warnings);
    }

    // Reset previous results when new files are added
    setResults([]);
    setBatchResults([]);
    setStatus("idle");
    setError(null);
    setActiveResultIdx(0);
  }, [files, duplicateWarnings]);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDuplicateWarnings((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleTranslate = useCallback(async () => {
    if (files.length === 0) return;
    setStatus("translating");
    setError(null);
    setResults([]);
    setBatchResults([]);
    setBatchProgress(null);
    setActiveResultIdx(0);
    setReasoningText("");
    setStreamPhase("idle");

    try {
      // Use streaming for all requests
      const outcome = await translateWithStreaming(files, model, (event: TranslateStreamEvent) => {
        if (event.type === "reasoning" && event.text) {
          setStreamPhase("reasoning");
          setReasoningText((prev) => prev + event.text);
        } else if (event.type === "content") {
          setStreamPhase("translating");
        }
      });

      setBatchResults(outcome.batchResults);
      setResults(outcome.results);

      if (outcome.results.length > 0) {
        setStatus("done");
      } else {
        setError("Translation failed. Please try again.");
        setStatus("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus("error");
    } finally {
      setBatchProgress(null);
      setStreamPhase("idle");
    }
  }, [files, model]);

  const handleRetryFailed = useCallback(async () => {
    if (batchResults.length === 0) return;
    setStatus("translating");
    setBatchProgress(null);
    setError(null);

    try {
      const outcome = await retryFailedBatches(files, batchResults, model, (p) => {
        setBatchProgress(p);
      });

      setBatchResults(outcome.batchResults);
      setResults(outcome.results);
      setStatus("done");

      if (outcome.hasFailures) {
        const failedNames = outcome.batchResults
          .filter((b) => b.error)
          .flatMap((b) => b.fileNames);
        setError(`Some files still failed: ${failedNames.join(", ")}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
      setStatus("error");
    } finally {
      setBatchProgress(null);
    }
  }, [files, batchResults, model]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResults([]);
    setBatchResults([]);
    setStatus("idle");
    setError(null);
    setBatchProgress(null);
    setActiveResultIdx(0);
    setDuplicateWarnings(new Map());
    setReasoningText("");
    setStreamPhase("idle");
  }, []);

  const isTranslating = status === "translating";
  const hasResults = results.length > 0;
  const activeResult = results[activeResultIdx] ?? null;
  const hasFailedBatches = batchResults.some((b) => b.error !== null);

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          DocTranslate
        </h1>
        <p className="mt-2 text-zinc-500">
          AI-powered Chinese to English document translation
        </p>
      </header>

      <main className="space-y-6">
        {/* Upload area */}
        <UploadZone
          files={files}
          onFilesAdded={handleFilesAdded}
          disabled={isTranslating}
        />

        {/* Duplicate warnings */}
        {duplicateWarnings.size > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {Array.from(duplicateWarnings.entries()).map(([id, dupName]) => {
              const f = files.find((file) => file.id === id);
              return f ? (
                <p key={id}>
                  &quot;{f.file.name}&quot; appears to be a duplicate of &quot;{dupName}&quot;
                </p>
              ) : null;
            })}
          </div>
        )}

        {/* Model selector */}
        <div className="flex items-center justify-center gap-1 rounded-lg bg-zinc-100 p-1">
          <button
            onClick={() => setModel("kimi")}
            disabled={isTranslating}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              model === "kimi"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            } disabled:opacity-50`}
          >
            Kimi <span className="text-xs text-emerald-600">Free</span>
          </button>
          <button
            onClick={() => setModel("seed")}
            disabled={isTranslating}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              model === "seed"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            } disabled:opacity-50`}
          >
            Seed <span className="text-xs text-emerald-600">Free</span>
          </button>
          <button
            onClick={() => setModel("gemini")}
            disabled={isTranslating}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              model === "gemini"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            } disabled:opacity-50`}
          >
            Gemini <span className="text-xs text-emerald-600">Free</span>
          </button>
          <button
            onClick={() => setModel("claude")}
            disabled={isTranslating}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              model === "claude"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            } disabled:opacity-50`}
          >
            Claude <span className="text-xs text-violet-600">Pro</span>
          </button>
        </div>

        {/* File list / Translating overlay */}
        {isTranslating ? (
          <TranslatingOverlay files={files} batchProgress={batchProgress} reasoningText={reasoningText} streamPhase={streamPhase} />
        ) : (
          <>
            <FileList
              files={files}
              onRemove={handleRemove}
              disabled={false}
            />
            {files.length > 0 && !hasResults && (
              <TranslateButton
                onClick={handleTranslate}
                loading={false}
                fileCount={files.length}
              />
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="space-y-2">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
            {hasFailedBatches && status === "done" && (
              <button
                onClick={handleRetryFailed}
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                Retry failed batches
              </button>
            )}
          </div>
        )}

        {/* Translation result */}
        {hasResults && activeResult && (
          <div className="space-y-4">
            {/* Multi-result tabs */}
            {results.length > 1 && (
              <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveResultIdx(i)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeResultIdx === i
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {r.title || `Document ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <DocumentTypeBadge type={activeResult.documentType} />
              <div className="flex gap-2">
                <PdfDownload result={activeResult} files={files} />
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  New Translation
                </button>
              </div>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
              <button
                onClick={() => setPreviewTab("pdf")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  previewTab === "pdf"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                PDF Preview
              </button>
              <button
                onClick={() => setPreviewTab("text")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  previewTab === "text"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Text Preview
              </button>
            </div>

            {previewTab === "pdf" ? (
              <PdfPreview result={activeResult} />
            ) : (
              <TranslationPreview result={activeResult} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
        Powered by AI &middot; Translations are for reference only
      </footer>
    </div>
  );
}
