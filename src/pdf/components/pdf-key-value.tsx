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
  row: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  key: {
    width: "35%",
    fontSize: 9,
    fontWeight: 600,
    fontFamily: "Inter",
    color: "#525252",
  },
  value: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Inter",
    color: "#1a1a1a",
  },
});

interface PdfKeyValueProps {
  heading: string;
  items: { key: string; value: string }[];
}

export default function PdfKeyValue({ heading, items }: PdfKeyValueProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.key}>{item.key}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}
