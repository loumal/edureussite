"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface QuestionLC {
  id: string;
  type: "QCM" | "OUVERTE";
  enonce: string;
  choix?: { id: string; texte: string }[];
}

interface ContenuLC {
  texte?: string;
  questions?: QuestionLC[];
}

interface Props {
  contenu: Record<string, unknown>;
  onReponse: (r: unknown) => void;
}

export function RenduLectureComprehension({ contenu, onReponse }: Props) {
  const c = contenu as ContenuLC;
  const texte = c.texte ?? "";
  const questions = c.questions ?? [];

  const [reponses, setReponses] = useState<Record<string, string>>({});

  const handleReponse = useCallback(
    (id: string, valeur: string) => {
      const newReponses = { ...reponses, [id]: valeur };
      setReponses(newReponses);
      // Soumettre dès qu'au moins une réponse existe
      if (Object.values(newReponses).some((v) => v.trim())) {
        onReponse(newReponses);
      }
    },
    [reponses, onReponse]
  );

  return (
    <div>
      {/* Texte à lire */}
      {texte && (
        <div className="mb-6 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
            📄 Texte
          </p>
          <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-line">
            {texte}
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
            Questions de compréhension
          </p>
          {questions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-[var(--color-rule)] p-4">
              <p className="mb-3 text-sm font-semibold text-[var(--color-ink)] leading-relaxed">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-bold text-white">
                  {qi + 1}
                </span>
                {q.enonce}
              </p>

              {q.type === "QCM" && q.choix && (
                <div className="space-y-2 ml-7">
                  {q.choix.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleReponse(q.id, c.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150",
                        reponses[q.id] === c.id
                          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                          : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          reponses[q.id] === c.id
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

              {q.type === "OUVERTE" && (
                <div className="ml-7">
                  <textarea
                    value={reponses[q.id] ?? ""}
                    onChange={(e) => handleReponse(q.id, e.target.value)}
                    rows={3}
                    placeholder="Ta réponse…"
                    className="w-full rounded-xl border-2 border-[var(--color-rule)] bg-white p-3 text-sm outline-none resize-none focus:border-[var(--color-ink-soft)] transition-all"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
