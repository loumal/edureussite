"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors print:hidden"
    >
      🖨️ Exporter PDF
    </button>
  );
}
