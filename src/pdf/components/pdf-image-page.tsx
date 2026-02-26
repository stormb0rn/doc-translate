import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 8,
    fontFamily: "Inter",
    color: "#999",
    marginBottom: 4,
  },
  image: {
    width: "100%",
    objectFit: "contain",
  },
});

interface PdfImagePageProps {
  src: string; // base64 data URL
  label?: string;
}

export default function PdfImagePage({ src, label }: PdfImagePageProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Image style={styles.image} src={src} />
    </View>
  );
}
