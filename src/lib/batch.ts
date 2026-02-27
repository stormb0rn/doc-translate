import { BATCH_THRESHOLD, BATCH_SIZE } from "./constants";
import type {
  UploadedFile,
  TranslationResult,
  BatchProgress,
  BatchResult,
} from "./types";
import type { ModelKey } from "./claude";

const REQUEST_TIMEOUT = 55_000; // 55s — stay under Vercel's 60s limit
const RETRY_DELAY = 2_000;

interface FilePayload {
  base64: string;
  mediaType: string;
  fileName: string;
}

// Split files into batches: PDFs get their own batch, images grouped by BATCH_SIZE
function splitIntoBatches(files: UploadedFile[]): UploadedFile[][] {
  const batches: UploadedFile[][] = [];
  let imageBuf: UploadedFile[] = [];

  for (const f of files) {
    if (f.mediaType === "application/pdf") {
      // Flush any pending images first
      if (imageBuf.length > 0) {
        batches.push([...imageBuf]);
        imageBuf = [];
      }
      // PDF gets its own batch
      batches.push([f]);
    } else {
      imageBuf.push(f);
      if (imageBuf.length >= BATCH_SIZE) {
        batches.push([...imageBuf]);
        imageBuf = [];
      }
    }
  }
  if (imageBuf.length > 0) {
    batches.push(imageBuf);
  }
  return batches;
}

// Single batch API call with timeout
async function callTranslateAPI(
  files: FilePayload[],
  model: ModelKey,
): Promise<TranslationResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, model }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || `Translation failed (${res.status})`);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Call API with one retry on failure
async function callWithRetry(
  files: FilePayload[],
  model: ModelKey,
): Promise<TranslationResult> {
  try {
    return await callTranslateAPI(files, model);
  } catch (err) {
    // Wait then retry once
    await new Promise((r) => setTimeout(r, RETRY_DELAY));
    return await callTranslateAPI(files, model);
  }
}

// Merge multiple TranslationResults into one (when documentTypes match)
function mergeResults(results: TranslationResult[]): TranslationResult {
  const base = results[0];
  const merged: TranslationResult = {
    ...base,
    sections: [],
    metadata: { ...base.metadata },
  };

  for (const r of results) {
    merged.sections.push(...r.sections);
    // Merge metadata — later values fill in gaps
    for (const [k, v] of Object.entries(r.metadata)) {
      if (v && !merged.metadata[k]) {
        merged.metadata[k] = v;
      }
    }
  }

  // Combine translator notes
  const notes = results
    .map((r) => r.translatorNotes)
    .filter(Boolean)
    .join("\n");
  if (notes) merged.translatorNotes = notes;

  return merged;
}

// Decide whether to merge results or keep separate
function mergeOrSeparate(batchResults: BatchResult[]): TranslationResult[] {
  const successful = batchResults.filter((b) => b.result !== null);
  if (successful.length === 0) return [];
  if (successful.length === 1) return [successful[0].result!];

  // Check if all have the same documentType
  const firstType = successful[0].result!.documentType;
  const allSame = successful.every(
    (b) => b.result!.documentType === firstType,
  );

  if (allSame) {
    return [mergeResults(successful.map((b) => b.result!))];
  }

  // Different types — return separately
  return successful.map((b) => b.result!);
}

export interface BatchTranslationResult {
  results: TranslationResult[];
  batchResults: BatchResult[];
  hasFailures: boolean;
}

// Main entry: handles both single-request and batched flows
export async function translateWithBatching(
  files: UploadedFile[],
  model: ModelKey,
  onProgress?: (progress: BatchProgress) => void,
): Promise<BatchTranslationResult> {
  // Below threshold — single request (unchanged behavior)
  if (files.length < BATCH_THRESHOLD) {
    const payload = files.map((f) => ({
      base64: f.base64,
      mediaType: f.mediaType,
      fileName: f.file.name,
    }));

    onProgress?.({ current: 1, total: 1 });

    try {
      const result = await callWithRetry(payload, model);
      return {
        results: [result],
        batchResults: [
          {
            batchIndex: 0,
            fileNames: files.map((f) => f.file.name),
            result,
            error: null,
          },
        ],
        hasFailures: false,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      return {
        results: [],
        batchResults: [
          {
            batchIndex: 0,
            fileNames: files.map((f) => f.file.name),
            result: null,
            error: msg,
          },
        ],
        hasFailures: true,
      };
    }
  }

  // Batched flow
  const batches = splitIntoBatches(files);
  const batchResults: BatchResult[] = [];

  for (let i = 0; i < batches.length; i++) {
    onProgress?.({ current: i + 1, total: batches.length });

    const batch = batches[i];
    const payload: FilePayload[] = batch.map((f) => ({
      base64: f.base64,
      mediaType: f.mediaType,
      fileName: f.file.name,
    }));

    try {
      const result = await callWithRetry(payload, model);
      batchResults.push({
        batchIndex: i,
        fileNames: batch.map((f) => f.file.name),
        result,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Translation failed";
      batchResults.push({
        batchIndex: i,
        fileNames: batch.map((f) => f.file.name),
        result: null,
        error: msg,
      });
    }
  }

  const results = mergeOrSeparate(batchResults);
  const hasFailures = batchResults.some((b) => b.error !== null);

  return { results, batchResults, hasFailures };
}

// Retry only failed batches
export async function retryFailedBatches(
  files: UploadedFile[],
  previousBatchResults: BatchResult[],
  model: ModelKey,
  onProgress?: (progress: BatchProgress) => void,
): Promise<BatchTranslationResult> {
  const batches = splitIntoBatches(files);
  const failedIndices = previousBatchResults
    .filter((b) => b.error !== null)
    .map((b) => b.batchIndex);

  const newBatchResults = [...previousBatchResults];
  let progressCount = 0;
  const totalRetries = failedIndices.length;

  for (const idx of failedIndices) {
    progressCount++;
    onProgress?.({ current: progressCount, total: totalRetries });

    const batch = batches[idx];
    if (!batch) continue;

    const payload: FilePayload[] = batch.map((f) => ({
      base64: f.base64,
      mediaType: f.mediaType,
      fileName: f.file.name,
    }));

    try {
      const result = await callWithRetry(payload, model);
      newBatchResults[idx] = {
        batchIndex: idx,
        fileNames: batch.map((f) => f.file.name),
        result,
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Retry failed";
      newBatchResults[idx] = {
        batchIndex: idx,
        fileNames: batch.map((f) => f.file.name),
        result: null,
        error: msg,
      };
    }
  }

  const results = mergeOrSeparate(newBatchResults);
  const hasFailures = newBatchResults.some((b) => b.error !== null);

  return { results, batchResults: newBatchResults, hasFailures };
}
