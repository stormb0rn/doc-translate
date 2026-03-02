"use client";

import { useState, useEffect, useRef } from "react";
import type { UploadedFile, BatchProgress } from "@/lib/types";
import { formatFileSize } from "@/lib/constants";

interface TranslatingOverlayProps {
  files: UploadedFile[];
  batchProgress?: BatchProgress | null;
  reasoningText?: string;
  streamPhase?: "idle" | "reasoning" | "translating";
}

const STAGES = [
  "Scanning document...",
  "Extracting text...",
  "Translating to English...",
];

export default function TranslatingOverlay({ files, batchProgress, reasoningText, streamPhase }: TranslatingOverlayProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const reasoningRef = useRef<HTMLDivElement>(null);

  // Reset stage when batch changes
  useEffect(() => {
    setStageIndex(0);
  }, [batchProgress?.current]);

  // Fake stage rotation only when no streaming data
  useEffect(() => {
    if (streamPhase && streamPhase !== "idle") return;
    const timer = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [streamPhase]);

  // Auto-scroll reasoning text
  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.scrollTop = reasoningRef.current.scrollHeight;
    }
  }, [reasoningText]);

  const isBatched = batchProgress && batchProgress.total > 1;
  const progressPct = batchProgress
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;

  // Determine stage text based on streaming phase
  const isStreaming = streamPhase && streamPhase !== "idle";
  const stageText = isStreaming
    ? streamPhase === "reasoning"
      ? "AI is analyzing the document..."
      : "Translating..."
    : STAGES[stageIndex];

  return (
    <div className="w-full space-y-6">
      {/* Stage indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="relative h-5 w-5">
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping" />
            <div className="absolute inset-0.5 rounded-full bg-blue-500" />
          </div>
          <p className="text-sm font-medium text-zinc-700 transition-all duration-500">
            {stageText}
          </p>
        </div>
        {isBatched && (
          <p className="text-xs text-zinc-500">
            Processing batch {batchProgress.current} of {batchProgress.total}...
          </p>
        )}
      </div>

      {/* Reasoning text display */}
      {reasoningText && (
        <div
          ref={reasoningRef}
          className="mx-auto max-h-40 w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
        >
          <p className="text-xs italic text-zinc-500 whitespace-pre-wrap leading-relaxed">
            {reasoningText.length > 800 ? "..." + reasoningText.slice(-800) : reasoningText}
          </p>
        </div>
      )}

      {/* File cards with scan animation */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((f, i) => (
          <div
            key={f.id}
            className="relative flex flex-col items-center rounded-lg border-2 border-blue-400 bg-white p-2 overflow-hidden"
            style={{
              animation: "glow-pulse 2s ease-in-out infinite",
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {/* Thumbnail or PDF icon */}
            <div className="relative h-24 w-full rounded overflow-hidden">
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="h-24 w-full rounded object-cover"
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded bg-red-50">
                  <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              )}

              {/* Scan line */}
              <div
                className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-80"
                style={{
                  animation: "scan-line 2s ease-in-out infinite",
                  animationDelay: `${i * 0.4}s`,
                }}
              />

              {/* Blue overlay tint */}
              <div className="pointer-events-none absolute inset-0 rounded bg-blue-500/10" />
            </div>

            <p className="mt-1.5 w-full truncate text-center text-xs text-zinc-600">
              {f.file.name}
            </p>
            <p className="text-xs text-zinc-400">{formatFileSize(f.file.size)}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mx-auto w-full max-w-md">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          {isBatched ? (
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          ) : (
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400"
              style={{
                width: "40%",
                animation: "progress-slide 1.5s ease-in-out infinite",
              }}
            />
          )}
        </div>
        {isBatched && (
          <p className="mt-1 text-center text-xs text-zinc-400">{progressPct}%</p>
        )}
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: -4px;
          }
          50% {
            top: calc(100% - 4px);
          }
          100% {
            top: -4px;
          }
        }
        @keyframes glow-pulse {
          0%, 100% {
            border-color: rgb(96 165 250);
            box-shadow: 0 0 8px rgb(96 165 250 / 0.3);
          }
          50% {
            border-color: rgb(59 130 246);
            box-shadow: 0 0 20px rgb(59 130 246 / 0.5);
          }
        }
        @keyframes progress-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(350%);
          }
        }
      `}</style>
    </div>
  );
}
