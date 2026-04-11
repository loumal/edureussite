"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OnboardingData } from "../onboarding-flow";
import type { StyleApprentissage } from "@/generated/prisma";

const STYLES: {
  value: StyleApprentissage;
  emoji: string;
  titre: string;
  description: string;
}[] = [
  {
    value: "VISUEL",
    emoji: "👁️",
    titre: "Je vois pour comprendre",
    description:
      "Les images, les couleurs et les schémas m'aident beaucoup à retenir.",
  },
  {
    value: "AUDITIF",
    emoji: "👂",
    titre: "J'entends pour apprendre",
    description:
      "J'aime écouter des explications, je me souviens bien de ce qu'on me dit.",
  },
  {
    value: "KINESTHESIQUE",
    emoji: "✋",
    titre: "Je fais pour apprendre",
    description:
      "J'apprends en faisant des exercices pratiques et en manipulant.",
  },
  {
    value: "LECTURE_ECRITURE",
    emoji: "✍️",
    titre: "Je lis et j'écris pour apprendre",
    description:
      "Les textes et les notes m'aident à bien comprendre et mémoriser.",
  },
];

interface Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export function StepStyleApprentissage({ data, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<StyleApprentissage | "">(
    data.styleApprentissage
  );

  return (
    <Card className="p-8">
      <div className="mb-6">
        <div className="text-2xl font-bold text-[var(--color-ink)] mb-1">
          🧠 Comment tu apprends le mieux ?
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Choisis ce qui te ressemble le plus (tu pourras changer plus tard)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {STYLES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSelected(s.value)}
            className={`rounded-xl border-2 p-4 text-left transition-all duration-200 ${
              selected === s.value
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-rule)] bg-white hover:border-[var(--color-ink-soft)] hover:shadow-sm"
            }`}
          >
            <div className="mb-2 text-2xl">{s.emoji}</div>
            <div className={`mb-1 text-sm font-semibold ${selected === s.value ? "text-white" : "text-[var(--color-ink)]"}`}>
              {s.titre}
            </div>
            <div className={`text-xs leading-relaxed ${selected === s.value ? "text-white/80" : "text-[var(--color-ink-soft)]"}`}>
              {s.description}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          ← Retour
        </Button>
        <Button
          onClick={() =>
            onNext({ styleApprentissage: selected || undefined })
          }
          className="flex-[2]"
        >
          {selected ? "Continuer →" : "Passer cette étape →"}
        </Button>
      </div>
    </Card>
  );
}
