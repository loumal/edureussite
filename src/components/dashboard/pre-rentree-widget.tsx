"use client";

import type { NiveauScolaire } from "@/generated/prisma";

// Sujets de découverte par palier scolaire
const SUJETS_PALIER: Record<string, { emoji: string; label: string; accroche: string }[]> = {
  primaire: [
    { emoji: "🔢", label: "Mathématiques", accroche: "Pourquoi 3 × 4 donne le même résultat que 4 × 3 ?" },
    { emoji: "📖", label: "Français", accroche: "Comment les mots changent-ils selon le genre et le nombre ?" },
    { emoji: "🌍", label: "Univers social", accroche: "Comment vivaient les gens au Québec il y a 200 ans ?" },
    { emoji: "🔬", label: "Sciences", accroche: "Pourquoi la glace flotte-t-elle sur l'eau ?" },
  ],
  secondaire_bas: [
    { emoji: "🔢", label: "Mathématiques", accroche: "Comment les algèbres nous aident à résoudre des mystères ?" },
    { emoji: "✍️", label: "Français", accroche: "Qu'est-ce qui fait qu'une phrase est vraiment percutante ?" },
    { emoji: "⚗️", label: "Sciences & techno", accroche: "Comment les scientifiques ont découvert que la Terre est ronde ?" },
    { emoji: "🗺️", label: "Géographie & histoire", accroche: "Pourquoi les frontières du monde ont-elles tant changé ?" },
  ],
  secondaire_haut: [
    { emoji: "📐", label: "Mathématiques", accroche: "Comment les fonctions décrivent-elles le monde réel ?" },
    { emoji: "📝", label: "Français", accroche: "Qu'est-ce qui distingue un texte littéraire d'un texte ordinaire ?" },
    { emoji: "⚛️", label: "Sciences", accroche: "Comment les atomes forment-ils tout ce qui nous entoure ?" },
    { emoji: "💡", label: "Éthique & citoyenneté", accroche: "Comment prendre des décisions justes face à des dilemmes complexes ?" },
  ],
};

function getSujets(niveauScolaire: NiveauScolaire) {
  const n = niveauScolaire;
  if (n.startsWith("PRIMAIRE")) return SUJETS_PALIER.primaire;
  if (["SECONDAIRE_1", "SECONDAIRE_2", "SECONDAIRE_3"].includes(n)) return SUJETS_PALIER.secondaire_bas;
  return SUJETS_PALIER.secondaire_haut;
}

interface Props {
  niveauScolaire: NiveauScolaire;
  prenom: string;
}

export function PreRentreeWidget({ niveauScolaire, prenom }: Props) {
  const sujets = getSujets(niveauScolaire);

  function ouvrirMira() {
    window.dispatchEvent(new CustomEvent("mira:open"));
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
      {/* En-tête */}
      <div className="mb-4">
        <p className="text-base font-bold text-[var(--color-ink)]">
          🚀 Ta nouvelle année t'attend, {prenom} !
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
          Avant les cours, explore ces grandes idées avec Mira — sans pression, juste pour ta curiosité.
        </p>
      </div>

      {/* Grille de sujets */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {sujets.map((sujet) => (
          <button
            key={sujet.label}
            onClick={ouvrirMira}
            className="group text-left rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-3 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl leading-none">{sujet.emoji}</span>
              <span className="text-xs font-bold text-[var(--color-ink)] group-hover:text-emerald-800">
                {sujet.label}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-[var(--color-ink-soft)] group-hover:text-emerald-700 line-clamp-2">
              {sujet.accroche}
            </p>
            <span className="mt-2 inline-block text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Découvrir avec Mira →
            </span>
          </button>
        ))}
      </div>

      {/* CTA principal */}
      <button
        onClick={ouvrirMira}
        className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors active:scale-95"
      >
        ✨ Commencer une mini-découverte
      </button>
    </div>
  );
}
