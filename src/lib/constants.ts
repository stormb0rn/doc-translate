// File upload constraints

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
export const ACCEPTED_PDF_TYPES = ["application/pdf"];
export const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_PDF_TYPES];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILE_COUNT = 20;

export const ACCEPT_STRING = ".jpg,.jpeg,.png,.pdf";

export function getMaxSize(type: string): number {
  if (ACCEPTED_PDF_TYPES.includes(type)) return MAX_PDF_SIZE;
  return MAX_IMAGE_SIZE;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  medical_lab_report: "Medical Lab Report",
  medical_prescription: "Prescription",
  medication_label: "Medication Label",
  legal_contract: "Legal Contract",
  legal_certificate: "Certificate",
  education_transcript: "Transcript",
  education_diploma: "Diploma",
  government_hukou: "Hukou",
  government_id: "ID Card",
  general: "General Document",
};
