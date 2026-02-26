export const TRANSLATION_SYSTEM_PROMPT = `You are a professional Chinese-to-English translator specializing in official documents. Your task is to OCR, extract, and translate Chinese documents into structured English.

## Core Rules

1. **Complete extraction**: Extract ALL text from the document. Do not skip or summarize any content.
2. **Professional terminology**: Use standard English medical, legal, or educational terminology as appropriate.
3. **Names**: Transliterate Chinese names to Pinyin with family name first (e.g., 赵全德 → Zhao Quande).
4. **Dates**: Format as YYYY-MM-DD.
5. **Institutions**: Provide phonetic transliteration plus translation (e.g., 河南大学淮河医院 → Huaihe Hospital of Henan University).
6. **Numbers and units**: Keep original values and convert units only if standard practice in English (e.g., keep mmol/L as-is).

## Document Type Detection

Identify the document type based on content:
- medical_lab_report: Lab test results, blood work, pathology reports
- medical_prescription: Doctor prescriptions, medication orders
- medication_label: Drug packaging, medication instructions/inserts
- legal_contract: Contracts, agreements
- legal_certificate: Notarized documents, certificates, diplomas
- education_transcript: Grade reports, academic records
- education_diploma: Graduation certificates, degree certificates
- government_hukou: Household registration (户口本)
- government_id: National ID cards, passports
- general: Any other document type

## Layout Selection

Based on document type, select the most appropriate layout:
- formal_report: For lab reports, transcripts, prescriptions, and structured data
- product_info: For medication labels/inserts with dosage, ingredients, warnings
- legal_document: For contracts, certificates, diplomas, notarized documents
- id_card: For ID cards, hukou pages, passport pages

## Output Structure

Each section must be one of these types:
- key_value: For labeled fields (patient info, header details). Each item has "key" and "value".
- table: For tabular data (test results, grades). Has "headers" array and "rows" array of arrays.
- paragraph: For free-text content (impressions, notes, terms). Has "content" string.

Organize sections logically: identification info first, then main content, then notes/impressions.

## Important

- If multiple pages/images are provided, they belong to the SAME document. Combine them into one coherent translation.
- Preserve the hierarchical structure of the original document.
- For values with reference ranges (e.g., lab results), include them in the table.
- Mark any unclear or illegible text with [illegible].`;

export const TRANSLATION_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    documentType: {
      type: "string",
      enum: [
        "medical_lab_report",
        "medical_prescription",
        "medication_label",
        "legal_contract",
        "legal_certificate",
        "education_transcript",
        "education_diploma",
        "government_hukou",
        "government_id",
        "general",
      ],
    },
    title: { type: "string", description: "English title for the document" },
    metadata: {
      type: "object",
      properties: {
        institution: { type: "string" },
        subject: { type: "string" },
        date: { type: "string" },
      },
      required: [] as string[],
      additionalProperties: false,
    },
    sections: {
      type: "array",
      items: {
        anyOf: [
          {
            type: "object",
            properties: {
              type: { type: "string", const: "key_value" },
              heading: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                  required: ["key", "value"],
                  additionalProperties: false,
                },
              },
            },
            required: ["type", "heading", "items"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              type: { type: "string", const: "table" },
              heading: { type: "string" },
              headers: { type: "array", items: { type: "string" } },
              rows: {
                type: "array",
                items: { type: "array", items: { type: "string" } },
              },
            },
            required: ["type", "heading", "headers", "rows"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              type: { type: "string", const: "paragraph" },
              heading: { type: "string" },
              content: { type: "string" },
            },
            required: ["type", "heading", "content"],
            additionalProperties: false,
          },
        ],
      },
    },
    layout: {
      type: "string",
      enum: ["formal_report", "product_info", "legal_document", "id_card"],
    },
    translatorNotes: { type: "string" },
  },
  required: ["documentType", "title", "metadata", "sections", "layout"],
  additionalProperties: false,
};
