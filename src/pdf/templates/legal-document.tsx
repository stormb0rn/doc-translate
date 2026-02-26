import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { TranslationResult, UploadedFile } from "@/lib/types";
import PdfCover from "../components/pdf-cover";
import PdfFooter from "../components/pdf-footer";
import PdfTable from "../components/pdf-table";
import PdfKeyValue from "../components/pdf-key-value";
import PdfParagraph from "../components/pdf-paragraph";
import PdfImagePage from "../components/pdf-image-page";

const styles = StyleSheet.create({
  coverPage: {
    padding: 40,
    fontFamily: "Inter",
  },
  page: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Inter",
    fontSize: 10,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 6,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  certification: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 4,
  },
  certText: {
    fontSize: 8,
    fontFamily: "Inter",
    color: "#666",
    lineHeight: 1.5,
  },
  imagePage: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Inter",
  },
});

interface LegalDocumentProps {
  result: TranslationResult;
  files: UploadedFile[];
}

export default function LegalDocument({ result, files }: LegalDocumentProps) {
  const imageFiles = files.filter((f) => f.preview);

  return (
    <>
      {/* Cover page */}
      <Page size="A4" style={styles.coverPage}>
        <PdfCover
          title={result.title}
          institution={result.metadata.institution}
          subject={result.metadata.subject}
          date={result.metadata.date}
        />
      </Page>

      {/* Content page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{result.title}</Text>
        </View>

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

        <View style={styles.certification}>
          <Text style={styles.certText}>
            This document has been translated from Chinese to English using AI-assisted translation.
            This translation is provided for informational purposes only and does not constitute a
            certified legal translation.
          </Text>
        </View>
        <PdfFooter />
      </Page>

      {imageFiles.map((f, i) => (
        <Page key={`img-${i}`} size="A4" style={styles.imagePage}>
          <PdfImagePage src={f.preview} label={`Original Document - ${f.file.name}`} />
          <PdfFooter />
        </Page>
      ))}
    </>
  );
}
