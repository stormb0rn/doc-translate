"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/upload-zone";
import FileList from "@/components/file-list";
import TranslateButton from "@/components/translate-button";
import TranslationPreview from "@/components/translation-preview";
import PdfDownload from "@/components/pdf-download";
import PdfPreview from "@/components/pdf-preview";
import DocumentTypeBadge from "@/components/document-type-badge";
import ErrorMessage from "@/components/error-message";
import type { UploadedFile, TranslationResult } from "@/lib/types";

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<"idle" | "translating" | "done" | "error">("idle");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"text" | "pdf">("pdf");

  const handleFilesAdded = useCallback((newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    // Reset previous results when new files are added
    setResult(null);
    setStatus("idle");
    setError(null);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleTranslate = useCallback(async () => {
    if (files.length === 0) return;
    setStatus("translating");
    setError(null);
    setResult(null);

    try {
      const payload = files.map((f) => ({
        base64: f.base64,
        mediaType: f.mediaType,
        fileName: f.file.name,
      }));

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: payload }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Translation failed (${res.status})`);
      }

      const data: TranslationResult = await res.json();
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus("error");
    }
  }, [files]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setResult(null);
    setStatus("idle");
    setError(null);
  }, []);

  const isTranslating = status === "translating";

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

        {/* File list */}
        <FileList
          files={files}
          onRemove={handleRemove}
          disabled={isTranslating}
        />

        {/* Translate button */}
        {files.length > 0 && !result && (
          <TranslateButton
            onClick={handleTranslate}
            loading={isTranslating}
            fileCount={files.length}
          />
        )}

        {/* Error */}
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

        {/* Translation result */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <DocumentTypeBadge type={result.documentType} />
              <div className="flex gap-2">
                <PdfDownload result={result} files={files} />
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
              <PdfPreview result={result} />
            ) : (
              <TranslationPreview result={result} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
        Powered by Claude AI &middot; Translations are for reference only
      </footer>
    </div>
  );
}
