"use client";

import type { TranslationResult, UploadedFile } from "@/lib/types";

interface PdfDownloadProps {
  result: TranslationResult;
  files: UploadedFile[];
}

export default function PdfDownload({ result, files }: PdfDownloadProps) {
  // PDF generation will be implemented in Phase 4
  // For now, show a placeholder button
  const handleDownload = async () => {
    // Dynamic import to avoid SSR issues with @react-pdf/renderer
    const { generatePdf } = await import("@/pdf/generate-pdf");
    await generatePdf(result, files);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Download PDF
    </button>
  );
}
