import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  cover: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter",
    color: "#666",
    textAlign: "center",
    marginBottom: 6,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "#1a1a1a",
    marginVertical: 20,
  },
  badge: {
    fontSize: 9,
    fontFamily: "Inter",
    color: "#999",
    marginTop: 40,
  },
});

interface PdfCoverProps {
  title: string;
  institution?: string;
  subject?: string;
  date?: string;
}

export default function PdfCover({ title, institution, subject, date }: PdfCoverProps) {
  return (
    <View style={styles.cover}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.divider} />
      {institution && <Text style={styles.meta}>{institution}</Text>}
      {subject && <Text style={styles.meta}>{subject}</Text>}
      {date && <Text style={styles.meta}>{date}</Text>}
      <Text style={styles.badge}>Translated by DocTranslate</Text>
    </View>
  );
}
