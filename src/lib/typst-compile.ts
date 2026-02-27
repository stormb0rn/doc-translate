import { generateTypstSource } from "./typst-template";
import type { TranslationResult } from "./types";

// Compile TranslationResult to PDF using Typst WASM (browser-side)
export async function compileTypstPdf(
  result: TranslationResult
): Promise<Blob> {
  const typstSource = generateTypstSource(result);

  const { createTypstCompiler, initOptions } = await import(
    "@myriaddreamin/typst.ts"
  );
  const { CompileFormatEnum } = await import(
    "@myriaddreamin/typst.ts/compiler"
  );

  const compiler = createTypstCompiler();
  await compiler.init({
    beforeBuild: [
      initOptions.preloadFontAssets({ assets: ["text", "cjk"] }),
    ],
  });

  compiler.addSource("/main.typ", typstSource);

  const { result: pdfBytes } = await compiler.compile({
    mainFilePath: "/main.typ",
    format: CompileFormatEnum.pdf,
  });

  if (!pdfBytes) {
    throw new Error("Typst compilation returned empty result");
  }

  return new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
}
