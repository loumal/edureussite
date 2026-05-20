"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { RenduVisuels, type Visuel } from "./rendu-visuel";

interface ChoixQCM {
  id: string;
  texte: string;
}

// Format multi-questions : contenu.questions est un tableau de sous-questions,
// chacune avec son propre enonce et ses propres choix.
interface SousQuestion {
  id: string;
  enonce: string;
  choix?: ChoixQCM[];
  bonneReponse?: string;
  explication?: string;
}

interface ContenuQCM {
  miseEnSituation?: string;
  question?: string;
  // Format simple (une seule question)
  choix?: ChoixQCM[];
  // Format multi-questions
  questions?: SousQuestion[];
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
  const visuels = (contenu.visuels as Visuel[] | undefined);
  const miseEnSituation = c.miseEnSituation ?? "";
  const question = c.question ?? c.enonce ?? "";
  const sousQuestions: SousQuestion[] = Array.isArray(c.questions) && c.questions.length > 0
    ? c.questions
    : [];

  // ── Format multi-questions ──────────────────────────────────────────────────
  const isMulti = sousQuestions.length > 0;

  const [multiReponses, setMultiReponses] = useState<Record<string, string>>(
    isMulti && typeof reponse === "object" && reponse !== null
      ? (reponse as Record<string, string>)
      : {}
  );

  const handleMultiSelect = useCallback(
    (questionId: string, choixId: string) => {
      const updated = { ...multiReponses, [questionId]: choixId };
      setMultiReponses(updated);
      // Soumettre dès qu'au moins une réponse est donnée (le bouton Soumettre
      // reste activé même si toutes les sous-questions ne sont pas répondues)
      onReponse(updated);
    },
    [multiReponses, onReponse]
  );

  // ── Format simple (une seule question) ─────────────────────────────────────
  const [selected, setSelected] = useState<string | null>(
    !isMulti ? (reponse as string | null) : null
  );

  const normalizedChoix: ChoixQCM[] = c.choix
    ? c.choix
    : (c.options ?? []).map((o, i) => ({ id: String.fromCharCode(65 + i), texte: o }));

  const handleSimpleSelect = (id: string) => {
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
          <p className="text-sm text-[var(--color-ink)] leading-relaxed">{miseEnSituation}</p>
        </div>
      )}

      {/* Visuels */}
      <RenduVisuels visuels={visuels} />

      {/* ── Rendu multi-questions ─────────────────────────────────────────── */}
      {isMulti ? (
        <div className="space-y-5">
          {/* Consigne générale */}
          {question && (
            <p className="text-sm font-semibold text-[var(--color-ink)] leading-relaxed">
              {question}
            </p>
          )}

          {sousQuestions.map((sq, idx) => (
            <div key={sq.id} className="rounded-xl border border-[var(--color-rule)] p-4">
              {/* Numéro + énoncé */}
              <p className="mb-3 text-sm font-semibold text-[var(--color-ink)] leading-relaxed">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-bold text-white flex-shrink-0">
                  {idx + 1}
                </span>
                {sq.enonce}
              </p>

              {/* Choix de cette sous-question */}
              {sq.choix && sq.choix.length > 0 && (
                <div className="space-y-2 ml-7">
                  {sq.choix.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleMultiSelect(sq.id, c.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.99]",
                        multiReponses[sq.id] === c.id
                          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                          : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)] hover:shadow-sm"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          multiReponses[sq.id] === c.id
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
              )}
            </div>
          ))}

          {/* Progression des réponses */}
          <p className="text-xs text-[var(--color-ink-soft)] text-right">
            {Object.keys(multiReponses).length}/{sousQuestions.length} question{sousQuestions.length > 1 ? "s" : ""} répondue{sousQuestions.length > 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        /* ── Rendu simple (une seule question) ─────────────────────────── */
        <>
          {question && (
            <p className="mb-5 text-base font-semibold text-[var(--color-ink)] leading-relaxed">
              {question}
            </p>
          )}

          <div className="space-y-3">
            {normalizedChoix.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSimpleSelect(c.id)}
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
        </>
      )}
    </div>
  );
}
