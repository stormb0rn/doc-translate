"use client";

import { DOCUMENT_TYPE_LABELS } from "@/lib/constants";

interface DocumentTypeBadgeProps {
  type: string;
}

export default function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  const label = DOCUMENT_TYPE_LABELS[type] || type;
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {label}
    </span>
  );
}
