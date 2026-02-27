// Core types for EZ Translation

export type DocumentType =
  | "medical_lab_report"
  | "medical_prescription"
  | "medication_label"
  | "legal_contract"
  | "legal_certificate"
  | "education_transcript"
  | "education_diploma"
  | "government_hukou"
  | "government_id"
  | "general";

export type LayoutType =
  | "formal_report"
  | "product_info"
  | "legal_document"
  | "id_card";

export interface KeyValueItem {
  key: string;
  value: string;
}

export interface KeyValueSection {
  type: "key_value";
  heading: string;
  items: KeyValueItem[];
}

export interface TableSection {
  type: "table";
  heading: string;
  headers: string[];
  rows: string[][];
}

export interface ParagraphSection {
  type: "paragraph";
  heading: string;
  content: string;
}

export type Section = KeyValueSection | TableSection | ParagraphSection;

export interface TranslationResult {
  documentType: DocumentType;
  title: string;
  metadata: {
    institution?: string;
    subject?: string;
    date?: string;
    [key: string]: string | undefined;
  };
  sections: Section[];
  layout: LayoutType;
  translatorNotes?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview: string; // base64 data URL for images, empty for PDFs
  base64: string; // raw base64 data
  mediaType: string;
}

export interface TranslationState {
  status: "idle" | "uploading" | "translating" | "done" | "error";
  files: UploadedFile[];
  result: TranslationResult | null;
  error: string | null;
}

// Batch processing types
export interface BatchProgress {
  current: number;
  total: number;
}

export interface BatchResult {
  batchIndex: number;
  fileNames: string[];
  result: TranslationResult | null;
  error: string | null;
}
