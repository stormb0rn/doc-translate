import { ACCEPTED_FILE_TYPES, getMaxSize } from "./constants";
import type { UploadedFile } from "./types";

// Validate a single file
export function validateFile(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Please upload JPG, PNG, or PDF files.`;
  }
  const maxSize = getMaxSize(file.type);
  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024);
    return `File "${file.name}" exceeds ${limitMB}MB limit.`;
  }
  return null;
}

// Read file as base64
export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

// Create an UploadedFile object from a File
export async function processFile(file: File): Promise<UploadedFile> {
  const base64 = await readFileAsBase64(file);
  const isImage = file.type.startsWith("image/");

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    preview: isImage ? `data:${file.type};base64,${base64}` : "",
    base64,
    mediaType: file.type,
  };
}
