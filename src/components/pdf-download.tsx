"use client";

import { useState } from "react";
import type { TranslationResult, UploadedFile } from "@/lib/types";

interface PdfDownloadProps {
  result: TranslationResult;
  files: UploadedFile[];
}

export default function PdfDownload({ result, files }: PdfDownloadProps) {
  const [typstLoading, setTypstLoading] = useState(false);
  const [classicLoading, setClassicLoading] = useState(false);

  // Download via server-side Typst compiler
  const handleTypstDownload = async () => {
    setTypstLoading(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      downloadBlob(
        blob,
        `${result.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_typst.pdf`
      );
    } catch (err) {
      console.error("Typst PDF error:", err);
    } finally {
      setTypstLoading(false);
    }
  };

  // Download via client-side @react-pdf/renderer
  const handleClassicDownload = async () => {
    setClassicLoading(true);
    try {
      const { generatePdf } = await import("@/pdf/generate-pdf");
      await generatePdf(result, files);
    } catch (err) {
      console.error("Classic PDF error:", err);
    } finally {
      setClassicLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleTypstDownload}
        disabled={typstLoading}
        className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        {typstLoading ? <Spinner /> : <DownloadIcon />}
        Download PDF (Typst)
      </button>
      <button
        onClick={handleClassicDownload}
        disabled={classicLoading}
        className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
      >
        {classicLoading ? <Spinner /> : <DownloadIcon />}
        Download PDF (Classic)
      </button>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}
