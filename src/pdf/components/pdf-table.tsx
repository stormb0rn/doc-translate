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
  table: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d4",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  headerCell: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    fontWeight: 600,
    fontFamily: "Inter",
    color: "#525252",
  },
  cell: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    fontFamily: "Inter",
    color: "#374151",
  },
});

interface PdfTableProps {
  heading: string;
  headers: string[];
  rows: string[][];
}

export default function PdfTable({ heading, headers, rows }: PdfTableProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          {headers.map((h, i) => (
            <Text key={i} style={styles.headerCell}>
              {h}
            </Text>
          ))}
        </View>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((cell, ci) => (
              <Text key={ci} style={styles.cell}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
