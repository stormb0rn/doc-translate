import { NextRequest, NextResponse } from "next/server";
import { translateDocument, translateDocumentStream, type ModelKey } from "@/lib/claude";

export const runtime = "edge";

interface FilePayload {
  base64: string;
  mediaType: string;
  fileName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const files: FilePayload[] = body.files;
    const stream: boolean = body.stream === true;
    const validModels = ["kimi", "seed", "gemini", "claude"] as const;
    const model: ModelKey = validModels.includes(body.model) ? body.model : "kimi";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json({ error: "Too many files (max 20)" }, { status: 400 });
    }

    // Streaming path — return SSE
    if (stream) {
      const sseStream = translateDocumentStream(files, model);
      return new Response(sseStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming path — unchanged
    const result = await translateDocument(files, model);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
