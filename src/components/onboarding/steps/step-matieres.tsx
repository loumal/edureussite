"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OnboardingData } from "../onboarding-flow";
import type { Matiere } from "@/generated/prisma";
import { getMatieresParRegion } from "@/lib/education/region-education";

interface Props {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  province?: string;
}

export function StepMatieres({ data, onNext, onBack, province = "QC" }: Props) {
  const MATIERES = getMatieresParRegion(province);
  const [preferees, setPreferees] = useState<Matiere[]>(data.matieresPreferees);
  const [redoutees, setRedoutees] = useState<Matiere[]>(data.matieresRedoutees);

  const togglePreferee = (m: Matiere) => {
    setPreferees((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
    // Retirer des redoutées si sélectionné comme préféré
    setRedoutees((prev) => prev.filter((x) => x !== m));
  };

  const toggleRedoutee = (m: Matiere) => {
    setRedoutees((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
    // Retirer des préférées si sélectionné comme redouté
    setPreferees((prev) => prev.filter((x) => x !== m));
  };

  return (
    <Card className="p-8">
      <div className="mb-6">
        <div className="text-2xl font-bold text-[var(--color-ink)] mb-1">
          📚 Tes matières préférées… et celles que tu trouves dures !
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Pas de jugement — on s'adapte à toi !
        </p>
      </div>

      {/* Matières préférées */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-semibold text-[var(--color-success)]">
          ❤️ J'aime beaucoup…
        </p>
        <div className="flex flex-wrap gap-2">
          {MATIERES.map((m) => (
            <button
              key={m.value}
              onClick={() => togglePreferee(m.value as Matiere)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                preferees.includes(m.value as Matiere)
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matières difficiles */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-semibold text-[var(--color-accent)]">
          💪 Je trouve ça difficile…
        </p>
        <div className="flex flex-wrap gap-2">
          {MATIERES.map((m) => (
            <button
              key={m.value}
              onClick={() => toggleRedoutee(m.value as Matiere)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                redoutees.includes(m.value as Matiere)
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)] hover:bg-white"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          ← Retour
        </Button>
        <Button
          onClick={() => onNext({ matieresPreferees: preferees, matieresRedoutees: redoutees })}
          className="flex-[2]"
        >
          Continuer →
        </Button>
      </div>
    </Card>
  );
}
