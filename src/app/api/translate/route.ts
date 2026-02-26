import { NextRequest, NextResponse } from "next/server";
import { translateDocument } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

interface FilePayload {
  base64: string;
  mediaType: string;
  fileName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const files: FilePayload[] = body.files;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (files.length > 20) {
      return NextResponse.json({ error: "Too many files (max 20)" }, { status: 400 });
    }

    const result = await translateDocument(files);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
