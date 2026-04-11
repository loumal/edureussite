"use client";

import { useState } from "react";
import { RenduVisuels, type Visuel } from "./rendu-visuel";

interface Props {
  contenu: Record<string, unknown>;
  onReponse: (r: unknown) => void;
}

export function RenduQuestionOuverte({ contenu, onReponse }: Props) {
  const [texte, setTexte] = useState("");

  // Nouveau schéma : miseEnSituation + question + pointsGuidage
  const miseEnSituation = (contenu.miseEnSituation ?? contenu.contexte ?? "") as string;
  const question = (contenu.question ?? contenu.enonce ?? contenu.situation ?? "") as string;
  const pointsGuidage = contenu.pointsGuidage as string[] | undefined;
  const minMots = (contenu.minMots as number) ?? 0;
  const visuels = contenu.visuels as Visuel[] | undefined;

  const nbMots = texte.trim().split(/\s+/).filter(Boolean).length;
  const suffisant = minMots === 0 || nbMots >= minMots;

  const handleChange = (val: string) => {
    setTexte(val);
    if (val.trim().length > 0) {
      onReponse({ texte: val, nbMots: val.trim().split(/\s+/).filter(Boolean).length });
    }
  };

  return (
    <div>
      {/* Mise en situation */}
      {miseEnSituation && (
        <div className="mb-5 rounded-xl bg-[rgba(91,79,207,0.06)] border border-[rgba(91,79,207,0.15)] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-purple)]">
            📖 Mise en situation
          </p>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed">
            {miseEnSituation}
          </p>
        </div>
      )}

      {/* Visuels */}
      <RenduVisuels visuels={visuels} />

      {/* Question */}
      {question && (
        <p className="mb-4 text-base font-semibold text-[var(--color-ink)] leading-relaxed">
          {question}
        </p>
      )}

      {/* Pistes de guidage */}
      {pointsGuidage && pointsGuidage.length > 0 && (
        <div className="mb-4 rounded-xl bg-[rgba(217,175,43,0.06)] border border-[rgba(217,175,43,0.2)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[rgba(160,120,0,0.9)]">
            💡 Pistes de réflexion
          </p>
          <ul className="space-y-1">
            {pointsGuidage.map((piste, i) => (
              <li key={i} className="text-sm text-[var(--color-ink-soft)] flex items-start gap-2">
                <span className="flex-shrink-0 text-[rgba(160,120,0,0.7)]">•</span>
                {piste}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Zone de réponse */}
      <div className="relative">
        <textarea
          value={texte}
          onChange={(e) => handleChange(e.target.value)}
          rows={5}
          placeholder="Écris ta réponse ici…"
          className="w-full rounded-xl border-2 border-[var(--color-rule)] bg-white p-4 text-sm text-[var(--color-ink)] outline-none resize-none leading-relaxed placeholder:text-[var(--color-ink-soft)]/50 focus:border-[var(--color-ink-soft)] focus:ring-2 focus:ring-[rgba(15,22,35,0.06)] transition-all"
        />
        <div className="absolute bottom-3 right-3 text-xs text-[var(--color-ink-soft)]">
          {nbMots} mot{nbMots > 1 ? "s" : ""}
          {minMots > 0 && (
            <span className={suffisant ? " text-[var(--color-success)]" : ""}>
              {" "}/ {minMots} min.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
