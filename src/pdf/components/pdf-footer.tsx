import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    fontSize: 7,
    fontFamily: "Inter",
    color: "#999",
  },
});

export default function PdfFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.text}>Translated by DocTranslate (AI-powered)</Text>
      <Text
        style={styles.text}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}
