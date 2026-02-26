"use client";

import type { TranslationResult, Section } from "@/lib/types";

interface TranslationPreviewProps {
  result: TranslationResult;
}

function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "key_value":
      return (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">{section.heading}</h3>
          <dl className="space-y-1">
            {section.items.map((item, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <dt className="min-w-[120px] font-medium text-zinc-500">{item.key}</dt>
                <dd className="text-zinc-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );

    case "table":
      return (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">{section.heading}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  {section.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 font-medium text-zinc-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-zinc-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-zinc-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "paragraph":
      return (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-800">{section.heading}</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {section.content}
          </p>
        </div>
      );
  }
}

export default function TranslationPreview({ result }: TranslationPreviewProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      {/* Title bar */}
      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">{result.title}</h2>
        {result.metadata.institution && (
          <p className="mt-0.5 text-sm text-zinc-500">{result.metadata.institution}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-400">
          {result.metadata.subject && <span>{result.metadata.subject}</span>}
          {result.metadata.date && <span>{result.metadata.date}</span>}
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-zinc-100 px-6">
        {result.sections.map((section, i) => (
          <div key={i} className="py-4">
            <SectionRenderer section={section} />
          </div>
        ))}
      </div>

      {/* Translator notes */}
      {result.translatorNotes && (
        <div className="border-t border-zinc-200 px-6 py-4">
          <p className="text-xs text-zinc-400">
            <span className="font-medium">Translator Notes:</span> {result.translatorNotes}
          </p>
        </div>
      )}
    </div>
  );
}
