import { NextRequest, NextResponse } from "next/server";
import { generateTypstSource } from "@/lib/typst-template";
import type { TranslationResult } from "@/lib/types";

// Cache compiler across requests for warm starts
let compilerPromise: Promise<
  import("@myriaddreamin/typst.ts").TypstCompiler
> | null = null;

async function getCompiler() {
  if (compilerPromise) return compilerPromise;
  compilerPromise = (async () => {
    const { createTypstCompiler, initOptions } = await import(
      "@myriaddreamin/typst.ts"
    );
    const compiler = createTypstCompiler();
    await compiler.init({
      beforeBuild: [
        // Load text + CJK fonts for Chinese character support
        initOptions.preloadFontAssets({ assets: ["text", "cjk"] }),
      ],
    });
    return compiler;
  })();
  return compilerPromise;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = body.result as TranslationResult;

    if (!result || !result.title) {
      return NextResponse.json(
        { error: "Missing translation result" },
        { status: 400 }
      );
    }

    // Generate Typst source and compile to PDF
    const typstSource = generateTypstSource(result);
    const compiler = await getCompiler();

    compiler.addSource("/main.typ", typstSource);

    const { CompileFormatEnum } = await import(
      "@myriaddreamin/typst.ts/compiler"
    );
    const { result: pdfBytes } = await compiler.compile({
      mainFilePath: "/main.typ",
      format: CompileFormatEnum.pdf,
    });

    if (!pdfBytes) {
      return NextResponse.json(
        { error: "Failed to compile PDF" },
        { status: 500 }
      );
    }

    const filename = `${result.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_typst.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Typst PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
