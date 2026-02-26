import { ACCEPTED_FILE_TYPES, ACCEPTED_HEIC_TYPES, getMaxSize } from "./constants";
import type { UploadedFile } from "./types";

// Validate a single file — also accept HEIC by filename for browsers
// that report empty or generic MIME types for .heic files
function isHeicByName(file: File): boolean {
  return /\.heic$/i.test(file.name) || /\.heif$/i.test(file.name);
}

export function validateFile(file: File): string | null {
  const accepted = ACCEPTED_FILE_TYPES.includes(file.type) || isHeicByName(file);
  if (!accepted) {
    return `Unsupported file type: ${file.type || "unknown"}. Please upload JPG, PNG, HEIC, or PDF files.`;
  }
  const maxSize = getMaxSize(file.type || "image/heic");
  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024);
    return `File "${file.name}" exceeds ${limitMB}MB limit.`;
  }
  return null;
}

// Read file as base64
export function readFileAsBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read file`));
    reader.readAsDataURL(file);
  });
}

// Convert HEIC/HEIF to JPEG using heic2any
async function convertHeicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  // heic2any may return an array for multi-image HEIC; take the first
  return Array.isArray(result) ? result[0] : result;
}

function isHeic(file: File): boolean {
  return ACCEPTED_HEIC_TYPES.includes(file.type) || isHeicByName(file);
}

// Create an UploadedFile object from a File
export async function processFile(file: File): Promise<UploadedFile> {
  let blob: File | Blob = file;
  let mediaType = file.type;

  // Convert HEIC to JPEG before processing
  if (isHeic(file)) {
    blob = await convertHeicToJpeg(file);
    mediaType = "image/jpeg";
  }

  const base64 = await readFileAsBase64(blob);
  const isImage = mediaType.startsWith("image/");

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    preview: isImage ? `data:${mediaType};base64,${base64}` : "",
    base64,
    mediaType,
  };
}
