import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "Inter",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  content: {
    fontSize: 9,
    fontFamily: "Inter",
    color: "#374151",
    lineHeight: 1.6,
  },
});

interface PdfParagraphProps {
  heading: string;
  content: string;
}

export default function PdfParagraph({ heading, content }: PdfParagraphProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
}
