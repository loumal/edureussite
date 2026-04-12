"use client";

import Link from "next/link";

// ── Aller plus loin — Choix libre de matière / notion / difficulté ──────────
// Ce widget remplace l'ancien "Défi du jour XP bonus".
// Il invite l'élève à explorer librement au-delà de son défi du jour.

export function DefJourWidget() {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(91,79,207,0.25)] bg-gradient-to-r from-[rgba(91,79,207,0.03)] to-white px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(91,79,207,0.08)] text-xl flex-shrink-0">
            ✨
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[var(--color-ink)]">Aller plus loin</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              Choisis librement ta matière, ta notion, ta difficulté
            </p>
          </div>
        </div>
        <Link
          href="/eleve/exercices/nouveau"
          className="flex-shrink-0 rounded-xl border-2 border-[rgba(91,79,207,0.2)] bg-white px-4 py-2 text-xs font-bold text-[var(--color-purple)] hover:bg-[rgba(91,79,207,0.06)] hover:border-[rgba(91,79,207,0.35)] transition-all whitespace-nowrap"
        >
          Explorer →
        </Link>
      </div>
    </div>
  );
}
