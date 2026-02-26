import { Document, pdf } from "@react-pdf/renderer";
import { registerFonts } from "./fonts/register";
import type { TranslationResult, UploadedFile } from "@/lib/types";
import FormalReport from "./templates/formal-report";
import ProductInfo from "./templates/product-info";
import LegalDocument from "./templates/legal-document";
import IdCard from "./templates/id-card";

function TranslationDocument({
  result,
  files,
}: {
  result: TranslationResult;
  files: UploadedFile[];
}) {
  const props = { result, files };

  return (
    <Document>
      {result.layout === "product_info" && <ProductInfo {...props} />}
      {result.layout === "legal_document" && <LegalDocument {...props} />}
      {result.layout === "id_card" && <IdCard {...props} />}
      {result.layout === "formal_report" && <FormalReport {...props} />}
    </Document>
  );
}

export async function generatePdf(result: TranslationResult, files: UploadedFile[]) {
  registerFonts();

  const blob = await pdf(
    <TranslationDocument result={result} files={files} />
  ).toBlob();

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_translation.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
