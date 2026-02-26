import Anthropic from "@anthropic-ai/sdk";
import { TRANSLATION_SYSTEM_PROMPT, TRANSLATION_JSON_SCHEMA } from "./prompts";
import type { TranslationResult } from "./types";

const anthropic = new Anthropic();

interface FileInput {
  base64: string;
  mediaType: string;
  fileName: string;
}

// Build content blocks for the Claude API request
function buildContentBlocks(files: FileInput[]): Anthropic.MessageCreateParams["messages"][0]["content"] {
  const blocks: Anthropic.ContentBlockParam[] = [];

  for (const file of files) {
    if (file.mediaType === "application/pdf") {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.base64,
        },
      });
    } else {
      // Image types: image/jpeg, image/png
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: file.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: file.base64,
        },
      });
    }
  }

  blocks.push({
    type: "text",
    text: "Please OCR, translate, and structure this Chinese document into English. Return the structured JSON.",
  });

  return blocks;
}

export async function translateDocument(files: FileInput[]): Promise<TranslationResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildContentBlocks(files),
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: TRANSLATION_JSON_SCHEMA,
      },
    },
  });

  // Extract text from response
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const result: TranslationResult = JSON.parse(textBlock.text);
  return result;
}
