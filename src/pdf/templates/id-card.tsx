import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { TranslationResult, UploadedFile } from "@/lib/types";
import PdfFooter from "../components/pdf-footer";
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#dc2626",
    paddingBottom: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#ffffff",
  },
  imagePage: {
    padding: 40,
    paddingBottom: 60,
    fontFamily: "Inter",
  },
});

interface IdCardProps {
  result: TranslationResult;
  files: UploadedFile[];
}

export default function IdCard({ result, files }: IdCardProps) {
  const imageFiles = files.filter((f) => f.preview);

  return (
    <>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{result.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>IDENTITY</Text>
          </View>
        </View>

        {result.sections.map((section, i) => {
          switch (section.type) {
            case "key_value":
              return <PdfKeyValue key={i} heading={section.heading} items={section.items} />;
            case "paragraph":
              return <PdfParagraph key={i} heading={section.heading} content={section.content} />;
            default:
              return null;
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
