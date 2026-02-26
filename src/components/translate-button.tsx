"use client";

interface TranslateButtonProps {
  onClick: () => void;
  loading: boolean;
  fileCount: number;
}

export default function TranslateButton({ onClick, loading, fileCount }: TranslateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || fileCount === 0}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Translating...
        </>
      ) : (
        `Translate ${fileCount} file${fileCount > 1 ? "s" : ""}`
      )}
    </button>
  );
}
