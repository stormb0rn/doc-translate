import type {
  TranslationResult,
  Section,
  KeyValueSection,
  TableSection,
  ParagraphSection,
} from "./types";

// Generate Typst source code from TranslationResult
export function generateTypstSource(result: TranslationResult): string {
  const e = escapeTypst;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });

  const sections = result.sections.map(renderSection).join("\n\n");
  const layoutHeader = renderLayoutHeader(result, e);
  const notes = result.translatorNotes
    ? `
#v(16pt)
#block(
  width: 100%,
  inset: 12pt,
  radius: 4pt,
  fill: rgb("#fefce8"),
  stroke: 0.5pt + rgb("#facc15"),
)[
  #text(8pt, weight: "semibold", fill: rgb("#a16207"))[TRANSLATOR NOTES]
  #v(4pt)
  #text(9pt, fill: rgb("#854d0e"))[${e(result.translatorNotes)}]
]`
    : "";

  return `
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 2cm, right: 2cm),
  footer: context {
    let page-num = counter(page).get().first()
    let total = counter(page).final().first()
    set text(8pt, fill: luma(140))
    grid(
      columns: (1fr, 1fr),
      align(left)[EZ Doc Translate],
      align(right)[#page-num / #total],
    )
  },
)

#set text(font: ("Inter", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB"), size: 10pt)
#set par(leading: 0.7em, justify: true)

${layoutHeader}

${sections}

${notes}

#v(20pt)
#line(length: 100%, stroke: 0.3pt + luma(220))
#v(4pt)
#text(8pt, fill: luma(160))[
  Generated on ${dateStr} by EZ Doc Translate.
]
`;
}

// Render layout-specific header
function renderLayoutHeader(
  result: TranslationResult,
  e: (s: string) => string
): string {
  const { layout, title, metadata } = result;
  const inst = metadata.institution ? e(metadata.institution) : "";
  const date = metadata.date ? e(metadata.date) : "";
  const subject = metadata.subject ? e(metadata.subject) : "";

  switch (layout) {
    case "product_info":
      return `
// Product info header
#block(
  width: 100%,
  inset: 16pt,
  radius: 0pt,
  fill: rgb("#1e3a5f"),
)[
  #align(center)[
    #text(20pt, weight: "bold", fill: white)[${e(title)}]
    ${inst ? `#v(4pt)\n    #text(10pt, fill: rgb("#cbd5e1"))[${inst}]` : ""}
  ]
]
#v(12pt)`;

    case "legal_document":
      return `
// Legal document header
#align(center)[
  #text(22pt, weight: "bold")[${e(title)}]
  ${inst ? `#v(4pt)\n  #text(10pt, fill: luma(100))[${inst}]` : ""}
  ${date ? `#v(2pt)\n  #text(9pt, fill: luma(140))[${date}]` : ""}
]
#v(8pt)
#line(length: 100%, stroke: 1.5pt + luma(60))
#v(2pt)
#line(length: 100%, stroke: 0.5pt + luma(60))
#v(12pt)`;

    case "id_card":
      return `
// ID card header
#block(
  width: 100%,
  above: 0pt,
  stroke: (top: 3pt + rgb("#dc2626")),
)[
  #v(12pt)
  #align(center)[
    #box(
      inset: (x: 8pt, y: 3pt),
      radius: 2pt,
      fill: rgb("#fef2f2"),
      stroke: 0.5pt + rgb("#fca5a5"),
    )[#text(7pt, weight: "bold", fill: rgb("#dc2626"))[IDENTITY]]
    #v(8pt)
    #text(20pt, weight: "bold")[${e(title)}]
    ${subject ? `#v(4pt)\n    #text(11pt, fill: luma(80))[${subject}]` : ""}
    ${inst ? `#v(2pt)\n    #text(9pt, fill: luma(140))[${inst}]` : ""}
  ]
]
#v(12pt)`;

    default:
      // formal_report
      return `
// Formal report header
#text(18pt, weight: "bold")[${e(title)}]
${inst ? `#v(2pt)\n#text(10pt, fill: luma(100))[${inst}]` : ""}
${date ? `#v(2pt)\n#text(9pt, fill: luma(140))[${date}]` : ""}
#v(4pt)
#line(length: 100%, stroke: 0.5pt + luma(200))
#v(8pt)`;
  }
}

// Render a section by type
function renderSection(section: Section): string {
  switch (section.type) {
    case "key_value":
      return renderKeyValue(section);
    case "table":
      return renderTable(section);
    case "paragraph":
      return renderParagraph(section);
  }
}

function renderKeyValue(section: KeyValueSection): string {
  const e = escapeTypst;
  const rows = section.items
    .map(
      (item) =>
        `    [#text(weight: "semibold", fill: luma(80))[${e(item.key)}]], [${e(item.value)}],`
    )
    .join("\n");

  return `
// ${section.heading}
#text(12pt, weight: "semibold")[${e(section.heading)}]
#v(4pt)
#table(
  columns: (35%, 1fr),
  inset: 6pt,
  stroke: (bottom: 0.5pt + luma(240)),
${rows}
)`;
}

function renderTable(section: TableSection): string {
  const e = escapeTypst;
  const colCount = section.headers.length;
  const cols = Array(colCount).fill("1fr").join(", ");

  const headerCells = section.headers
    .map((h) => `    [#text(weight: "semibold", fill: luma(80))[${e(h)}]],`)
    .join("\n");

  const dataCells = section.rows
    .map((row) => row.map((cell) => `    [${e(cell)}],`).join("\n"))
    .join("\n");

  return `
// ${section.heading}
#text(12pt, weight: "semibold")[${e(section.heading)}]
#v(4pt)
#table(
  columns: (${cols}),
  inset: 6pt,
  stroke: (bottom: 0.5pt + luma(230)),
  fill: (x, y) => if y == 0 { luma(245) } else { none },
  table.header(
${headerCells}
  ),
${dataCells}
)`;
}

function renderParagraph(section: ParagraphSection): string {
  const e = escapeTypst;
  return `
// ${section.heading}
#text(12pt, weight: "semibold")[${e(section.heading)}]
#v(4pt)
#text(10pt)[${e(section.content)}]
#v(6pt)`;
}

// Escape special Typst characters
function escapeTypst(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/#/g, "\\#")
    .replace(/\$/g, "\\$")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>")
    .replace(/@/g, "\\@")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}
