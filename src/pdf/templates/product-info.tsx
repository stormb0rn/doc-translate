import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { TranslationResult, UploadedFile } from "@/lib/types";
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
  header: {
    backgroundColor: "#1e3a5f",
    padding: 16,
    marginHorizontal: -40,
    marginTop: -40,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#ffffff",
    textAlign: "center",
  },
  headerSub: {
    fontSize: 10,
    fontFamily: "Inter",
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 4,
  },
  warning: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 8,
    fontFamily: "Inter",
    color: "#92400e",
    fontWeight: 600,
  },
  imagePage: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Inter",
  },
});

interface ProductInfoProps {
  result: TranslationResult;
  files: UploadedFile[];
}

export default function ProductInfo({ result, files }: ProductInfoProps) {
  const imageFiles = files.filter((f) => f.preview);

  return (
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{result.title}</Text>
          {result.metadata.institution && (
            <Text style={styles.headerSub}>{result.metadata.institution}</Text>
          )}
        </View>

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            This is an AI-generated translation for reference only. Always consult a healthcare
            professional before using any medication.
          </Text>
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
