import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "Inter",
    color: "#666",
    marginTop: 4,
  },
});

interface PdfHeaderProps {
  title: string;
  institution?: string;
}

export default function PdfHeader({ title, institution }: PdfHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {institution && <Text style={styles.subtitle}>{institution}</Text>}
    </View>
  );
}
