"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardLabel } from "@/components/ui/card";
import Link from "next/link";

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ANGLAIS: "🇬🇧", ARTS: "🎨",
  ETHIQUE: "⚖️", EDUCATION_PHYSIQUE: "⚽",
};

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais", ARTS: "Arts",
  ETHIQUE: "Éthique", EDUCATION_PHYSIQUE: "Éd. physique",
};

export function DefJourWidget() {
  const { data: def, isLoading } = trpc.gamification.getDefJour.useQuery();

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-28 rounded bg-[var(--color-paper-warm)] animate-pulse mb-3" />
        <div className="h-16 rounded-xl bg-[var(--color-paper-warm)] animate-pulse" />
      </Card>
    );
  }

  if (!def) return null;

  return (
    <Card className="p-5 relative overflow-hidden">
      {/* Fond gradient discret */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <CardLabel>Défi du jour</CardLabel>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1">
            <span className="text-xs">⏰</span>
            <span className="text-[11px] font-bold text-amber-700">Aujourd&apos;hui seulement</span>
          </div>
        </div>

        {def.complete ? (
          <div className="text-center py-3">
            <div className="text-3xl mb-1">✅</div>
            <p className="text-sm font-bold text-[var(--color-success)]">Défi complété !</p>
            {def.score !== null && (
              <p className="text-xs text-[var(--color-ink-soft)] mt-1">Score : {def.score}%</p>
            )}
            <p className="text-xs text-amber-600 font-semibold mt-1">+{50} XP bonus gagnés 🏆</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl flex-shrink-0">
                {MATIERE_EMOJI[def.matiere] ?? "📚"}
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                  {MATIERE_LABEL[def.matiere] ?? def.matiere}
                </p>
                <p className="text-sm font-semibold text-[var(--color-ink)] leading-snug">
                  Maîtrise : {def.notion}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">⭐</span>
                <span className="text-xs font-bold text-amber-600">+{def.xpBonus} XP bonus</span>
              </div>
              <Link
                href={`/eleve/exercices/nouveau?matiere=${def.matiere}&defi=true`}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 transition-colors"
              >
                Relever le défi →
              </Link>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
