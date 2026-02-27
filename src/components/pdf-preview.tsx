"use client";

import { useEffect, useState } from "react";
import type { TranslationResult } from "@/lib/types";

interface PdfPreviewProps {
  result: TranslationResult;
}

export default function PdfPreview({ result }: PdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoke: string | null = null;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Client-side Typst WASM compilation
        const { compileTypstPdf } = await import("@/lib/typst-compile");
        const blob = await compileTypstPdf(result);
        const url = URL.createObjectURL(blob);
        revoke = url;
        setPdfUrl(url);
      } catch (err) {
        console.error("PDF preview error:", err);
        setError("PDF preview generation failed");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [result]);

  if (loading) {
    return (
      <div className="flex h-[700px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          Generating PDF preview...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
        <p className="text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl!}
      className="h-[700px] w-full rounded-xl border border-zinc-200"
      title="PDF Preview"
    />
  );
}
