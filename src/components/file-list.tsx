"use client";

import type { UploadedFile } from "@/lib/types";
import { formatFileSize } from "@/lib/constants";

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export default function FileList({ files, onRemove, disabled }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <p className="text-sm font-medium text-zinc-700">
        {files.length} file{files.length > 1 ? "s" : ""} selected
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((f) => (
          <div
            key={f.id}
            className="group relative flex flex-col items-center rounded-lg border border-zinc-200 bg-white p-2"
          >
            {/* Thumbnail or PDF icon */}
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
            <p className="mt-1.5 w-full truncate text-center text-xs text-zinc-600">
              {f.file.name}
            </p>
            <p className="text-xs text-zinc-400">{formatFileSize(f.file.size)}</p>
            {/* Remove button */}
            {!disabled && (
              <button
                onClick={() => onRemove(f.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove ${f.file.name}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
