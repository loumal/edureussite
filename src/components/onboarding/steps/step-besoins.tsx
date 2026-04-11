"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OnboardingData } from "../onboarding-flow";

interface Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

const BESOINS = [
  {
    key: "tdah" as const,
    emoji: "⚡",
    titre: "TDAH / Attention",
    description: "J'ai de la difficulté à rester concentré(e) longtemps",
  },
  {
    key: "dyslexie" as const,
    emoji: "📝",
    titre: "Dyslexie / Lecture",
    description: "Lire et écrire me demande beaucoup d'efforts",
  },
  {
    key: "anxieteScolaire" as const,
    emoji: "😰",
    titre: "Anxiété scolaire",
    description: "Les évaluations ou l'école me stressent beaucoup",
  },
];

export function StepBesoins({ data, onNext, onBack }: Props) {
  const [tdah, setTdah] = useState(data.tdah);
  const [dyslexie, setDyslexie] = useState(data.dyslexie);
  const [anxieteScolaire, setAnxieteScolaire] = useState(data.anxieteScolaire);

  const togglers: Record<"tdah" | "dyslexie" | "anxieteScolaire", () => void> = {
    tdah: () => setTdah((v) => !v),
    dyslexie: () => setDyslexie((v) => !v),
    anxieteScolaire: () => setAnxieteScolaire((v) => !v),
  };

  const values: Record<"tdah" | "dyslexie" | "anxieteScolaire", boolean> = {
    tdah,
    dyslexie,
    anxieteScolaire,
  };

  return (
    <Card className="p-8">
      <div className="mb-6">
        <div className="text-2xl font-bold text-[var(--color-ink)] mb-1">
          💙 As-tu des besoins particuliers ?
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Cette info est confidentielle — elle aide l'IA à mieux t'accompagner.
          Tu n'es pas obligé(e) de répondre.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {BESOINS.map((b) => (
          <button
            key={b.key}
            onClick={togglers[b.key]}
            className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              values[b.key]
                ? "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)]"
                : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)]"
            }`}
          >
            <div className="mt-0.5 text-2xl">{b.emoji}</div>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${values[b.key] ? "text-[var(--color-purple)]" : "text-[var(--color-ink)]"}`}>
                {b.titre}
              </div>
              <div className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                {b.description}
              </div>
            </div>
            <div
              className={`mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${
                values[b.key]
                  ? "border-[var(--color-purple)] bg-[var(--color-purple)]"
                  : "border-[var(--color-rule)]"
              }`}
            >
              {values[b.key] && (
                <svg viewBox="0 0 20 20" fill="white" className="h-full w-full p-0.5">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}

        <div className="rounded-xl bg-[var(--color-paper-warm)] p-4">
          <p className="text-xs text-[var(--color-ink-soft)]">
            🔒 Ces informations sont uniquement utilisées pour adapter les exercices.
            Elles ne sont jamais partagées sans ton consentement.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          ← Retour
        </Button>
        <Button
          onClick={() => onNext({ tdah, dyslexie, anxieteScolaire })}
          className="flex-[2]"
        >
          Continuer →
        </Button>
      </div>
    </Card>
  );
}
