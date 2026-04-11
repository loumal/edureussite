"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { RenduVisuels, type Visuel } from "./rendu-visuel";

interface ChoixQCM {
  id: string;
  texte: string;
}

interface ContenuQCM {
  // Nouveau schéma structuré
  miseEnSituation?: string;
  question?: string;
  choix?: ChoixQCM[];
  // Anciens formats (compatibilité)
  enonce?: string;
  options?: string[];
}

interface Props {
  contenu: Record<string, unknown>;
  onReponse: (r: unknown) => void;
  reponse: unknown;
}

export function RenduQCM({ contenu, onReponse, reponse }: Props) {
  const c = contenu as ContenuQCM;
  const [selected, setSelected] = useState<string | null>(reponse as string | null);

  // Normaliser les choix (l'IA peut générer plusieurs formats)
  const choix: ChoixQCM[] = c.choix
    ? c.choix
    : (c.options ?? []).map((o, i) => ({
        id: String.fromCharCode(65 + i),
        texte: o,
      }));

  const miseEnSituation = c.miseEnSituation ?? "";
  const question = c.question ?? c.enonce ?? "";
  const visuels = (contenu.visuels as Visuel[] | undefined);

  const handleSelect = (id: string) => {
    setSelected(id);
    onReponse(id);
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
        <p className="mb-5 text-base font-semibold text-[var(--color-ink)] leading-relaxed">
          {question}
        </p>
      )}

      {/* Choix */}
      <div className="space-y-3">
        {choix.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.99]",
              selected === c.id
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)] hover:shadow-sm"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                selected === c.id
                  ? "bg-white text-[var(--color-ink)]"
                  : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]"
              )}
            >
              {c.id}
            </span>
            <span className="text-sm leading-relaxed">{c.texte}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
