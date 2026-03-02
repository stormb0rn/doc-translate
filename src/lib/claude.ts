import { TRANSLATION_SYSTEM_PROMPT, TRANSLATION_JSON_SCHEMA } from "./prompts";
import type { TranslationResult, TranslateStreamEvent } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ModelKey = "kimi" | "seed" | "gemini" | "claude";

const MODEL_MAP: Record<ModelKey, string> = {
  kimi: "moonshotai/kimi-k2.5",
  seed: "bytedance-seed/seed-2.0-mini",
  gemini: "google/gemini-3-flash-preview",
  claude: "anthropic/claude-sonnet-4-6",
};

interface FileInput {
  base64: string;
  mediaType: string;
  fileName: string;
}

// Build OpenAI-compatible content blocks for OpenRouter
function buildContentParts(files: FileInput[]) {
  const parts: Record<string, unknown>[] = [];

  for (const file of files) {
    if (file.mediaType === "application/pdf") {
      // OpenRouter supports file content type for PDFs
      parts.push({
        type: "file",
        file: {
          filename: file.fileName,
          file_data: `data:application/pdf;base64,${file.base64}`,
        },
      });
    } else {
      // Images use image_url with data URL
      parts.push({
        type: "image_url",
        image_url: {
          url: `data:${file.mediaType};base64,${file.base64}`,
        },
      });
    }
  }

  parts.push({
    type: "text",
    text: `Please OCR, translate, and structure this Chinese document into English. Return the structured JSON.

Required JSON schema:
${JSON.stringify(TRANSLATION_JSON_SCHEMA, null, 2)}`,
  });

  return parts;
}

export async function translateDocument(files: FileInput[], model: ModelKey = "kimi"): Promise<TranslationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_MAP[model],
      messages: [
        { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
        { role: "user", content: buildContentParts(files) },
      ],
      max_tokens: 8192,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error?.message || `OpenRouter API error (${response.status})`
    );
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No response from AI model");
  }

  // Strip markdown code fences — some models wrap JSON in ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  const cleaned = (fenceMatch ? fenceMatch[1] : text).trim();
  const result: TranslationResult = JSON.parse(cleaned);
  return result;
}

function cleanJsonContent(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  return (fence ? fence[1] : raw).trim();
}

// Format a single SSE event
function sseEvent(event: TranslateStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

// Streaming translation — returns a ReadableStream of SSE events
export function translateDocumentStream(
  files: FileInput[],
  model: ModelKey = "kimi",
): ReadableStream<Uint8Array> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      if (!apiKey) {
        controller.enqueue(encoder.encode(sseEvent({ type: "error", message: "OPENROUTER_API_KEY is not configured" })));
        controller.close();
        return;
      }

      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL_MAP[model],
            messages: [
              { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
              { role: "user", content: buildContentParts(files) },
            ],
            max_tokens: 8192,
            stream: true,
            reasoning: { effort: "medium" },
          }),
        });

        if (!response.ok || !response.body) {
          const err = await response.json().catch(() => null);
          const msg = err?.error?.message || `OpenRouter API error (${response.status})`;
          controller.enqueue(encoder.encode(sseEvent({ type: "error", message: msg })));
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let contentAccum = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") continue;

            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              if (delta.reasoning) {
                controller.enqueue(encoder.encode(sseEvent({ type: "reasoning", text: delta.reasoning })));
              }
              if (delta.content) {
                contentAccum += delta.content;
                controller.enqueue(encoder.encode(sseEvent({ type: "content", text: delta.content })));
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }

        // Parse the accumulated content into TranslationResult
        const cleaned = cleanJsonContent(contentAccum);
        const result: TranslationResult = JSON.parse(cleaned);
        controller.enqueue(encoder.encode(sseEvent({ type: "done", result })));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream translation failed";
        controller.enqueue(encoder.encode(sseEvent({ type: "error", message: msg })));
      } finally {
        controller.close();
      }
    },
  });
}
