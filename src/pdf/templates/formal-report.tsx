import { Page, StyleSheet } from "@react-pdf/renderer";
import type { TranslationResult, UploadedFile } from "@/lib/types";
import PdfHeader from "../components/pdf-header";
import PdfFooter from "../components/pdf-footer";
import PdfTable from "../components/pdf-table";
import PdfKeyValue from "../components/pdf-key-value";
import PdfParagraph from "../components/pdf-paragraph";
import PdfImagePage from "../components/pdf-image-page";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Inter",
    fontSize: 10,
  },
  imagePage: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Inter",
  },
});

interface FormalReportProps {
  result: TranslationResult;
  files: UploadedFile[];
}

export default function FormalReport({ result, files }: FormalReportProps) {
  const imageFiles = files.filter((f) => f.preview);

  return (
    <>
      {/* Translation page */}
      <Page size="A4" style={styles.page}>
        <PdfHeader title={result.title} institution={result.metadata.institution} />
        {result.sections.map((section, i) => {
          switch (section.type) {
            case "key_value":
              return <PdfKeyValue key={i} heading={section.heading} items={section.items} />;
            case "table":
              return <PdfTable key={i} heading={section.heading} headers={section.headers} rows={section.rows} />;
            case "paragraph":
              return <PdfParagraph key={i} heading={section.heading} content={section.content} />;
          }
        })}
        <PdfFooter />
      </Page>

      {/* Original image pages */}
      {imageFiles.map((f, i) => (
        <Page key={`img-${i}`} size="A4" style={styles.imagePage}>
          <PdfImagePage src={f.preview} label={`Original Document - ${f.file.name}`} />
          <PdfFooter />
        </Page>
      ))}
    </>
  );
}
