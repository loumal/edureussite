"use client";

import { trpc } from "@/lib/trpc/client";
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
      <div className="h-16 rounded-2xl bg-[var(--color-paper-warm)] animate-pulse" />
    );
  }

  if (!def) return null;

  // ── Défi complété : affichage discret de victoire ──────────────────────────
  if (def.complete) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-xl">✅</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-700">Défi du jour complété !</p>
          {def.score !== null && (
            <p className="text-xs text-amber-600 mt-0.5">Score {def.score}% · +50 XP bonus gagnés 🏆</p>
          )}
        </div>
      </div>
    );
  }

  // ── Défi disponible : format "bonus optionnel" ─────────────────────────────
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4">
      {/* En-tête — clairement positionné comme bonus */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">⭐</span>
          <span className="text-xs font-black uppercase tracking-wider text-amber-600">
            Défi bonus du jour
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5">
          <span className="text-[10px]">⏰</span>
          <span className="text-[10px] font-bold text-amber-700">Jusqu'à minuit</span>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl flex-shrink-0">
          {MATIERE_EMOJI[def.matiere] ?? "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
            {MATIERE_LABEL[def.matiere] ?? def.matiere}
          </p>
          <p className="text-sm font-semibold text-[var(--color-ink)] leading-snug line-clamp-1">
            {def.notion}
          </p>
        </div>
        <Link
          href={`/eleve/exercices/nouveau?matiere=${def.matiere}&defi=true`}
          className="flex-shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 transition-colors whitespace-nowrap"
        >
          +{def.xpBonus} XP →
        </Link>
      </div>

      {/* Sous-texte motivateur */}
      <p className="text-[10px] text-amber-600 mt-2.5 font-medium">
        Optionnel · Gagne des XP bonus en relevant ce défi en plus de ta mission du jour
      </p>
    </div>
  );
}
