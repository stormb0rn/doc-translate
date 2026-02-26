"use client";

import { useCallback, useState, useRef } from "react";
import { ACCEPT_STRING, MAX_FILE_COUNT } from "@/lib/constants";
import { validateFile, processFile } from "@/lib/file-utils";
import type { UploadedFile } from "@/lib/types";

interface UploadZoneProps {
  files: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export default function UploadZone({ files, onFilesAdded, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(fileList);
      const remaining = MAX_FILE_COUNT - files.length;

      if (incoming.length > remaining) {
        setError(`You can upload up to ${MAX_FILE_COUNT} files. ${remaining} slots remaining.`);
        return;
      }

      // Validate all files first
      for (const file of incoming) {
        const err = validateFile(file);
        if (err) {
          setError(err);
          return;
        }
      }

      // Process files
      const processed = await Promise.all(incoming.map(processFile));
      onFilesAdded(processed);
    },
    [files.length, onFilesAdded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="w-full">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          px-6 py-12 transition-all cursor-pointer
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
          ${dragOver ? "border-blue-500 bg-blue-50" : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}
        `}
      >
        <svg className="mb-3 h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3.75 3.75 0 013.572 5.283A4.125 4.125 0 0117.25 19.5H6.75z" />
        </svg>
        <p className="text-sm font-medium text-zinc-700">
          Drop files here or <span className="text-blue-600">browse</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          JPG, PNG, HEIC (max 5MB) or PDF (max 20MB) &middot; Up to {MAX_FILE_COUNT} files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          onChange={onChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
