"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";
import type { EtatEmotionnel } from "@/generated/prisma";

const ETATS: {
  value: EtatEmotionnel;
  emoji: string;
  label: string;
  labelJeune: string;
  couleur: string;
  couleurJeune: string;
}[] = [
  { value: "TRES_BIEN", emoji: "🤩", label: "Super bien !", labelJeune: "Super !", couleur: "border-green-400 bg-green-50", couleurJeune: "border-green-400 bg-green-50 hover:bg-green-100" },
  { value: "BIEN",      emoji: "😊", label: "Bien",         labelJeune: "Bien !",   couleur: "border-[var(--color-success)] bg-[rgba(42,124,111,0.06)]", couleurJeune: "border-[var(--color-success)] bg-[rgba(42,124,111,0.06)] hover:bg-[rgba(42,124,111,0.12)]" },
  { value: "CORRECT",   emoji: "😐", label: "Correct",      labelJeune: "Moyen",    couleur: "border-[var(--color-gold)] bg-[rgba(201,149,42,0.06)]", couleurJeune: "border-[var(--color-gold)] bg-[rgba(201,149,42,0.06)] hover:bg-[rgba(201,149,42,0.12)]" },
  { value: "FATIGUE",   emoji: "😴", label: "Fatigué(e)",   labelJeune: "Fatigué",  couleur: "border-blue-300 bg-blue-50", couleurJeune: "border-blue-300 bg-blue-50 hover:bg-blue-100" },
  { value: "STRESSE",   emoji: "😰", label: "Stressé(e)",   labelJeune: "Inquiet",  couleur: "border-orange-300 bg-orange-50", couleurJeune: "border-orange-300 bg-orange-50 hover:bg-orange-100" },
  { value: "TRISTE",    emoji: "😔", label: "Triste",       labelJeune: "Triste",   couleur: "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)]", couleurJeune: "border-[var(--color-purple)] bg-[rgba(91,79,207,0.06)] hover:bg-[rgba(91,79,207,0.12)]" },
];

interface Props {
  niveauScolaire?: string;
}

export function CheckInEmotionnelWidget({ niveauScolaire }: Props) {
  const [selected, setSelected] = useState<EtatEmotionnel | null>(null);
  const [done, setDone] = useState(false);
  const jeune = estJeuneEleve(niveauScolaire ?? "");

  const checkin = trpc.eleve.checkinEmotionnel.useMutation({
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <Card className="border-[var(--color-success)] bg-[rgba(42,124,111,0.04)] p-5 text-center">
        <p className={`font-bold text-[var(--color-success)] ${jeune ? "text-xl" : "text-sm"}`}>
          {jeune ? "✅ Merci ! On s'occupe de toi 😊" : "✓ Merci ! Tes exercices du jour sont adaptés à comment tu te sens."}
        </p>
      </Card>
    );
  }

  /* ── Mode jeune élève (PRIMAIRE_1 / PRIMAIRE_2) ── */
  if (jeune) {
    return (
      <Card className="p-5">
        <p className="mb-5 text-center text-lg font-black text-[var(--color-ink)]">
          Comment tu te sens aujourd'hui ? 😊
        </p>
        <div className="grid grid-cols-3 gap-3">
          {ETATS.map((e) => (
            <button
              key={e.value}
              onClick={() => {
                setSelected(e.value);
                checkin.mutate({ etat: e.value });
              }}
              disabled={checkin.isPending}
              aria-label={e.labelJeune}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-95 ${
                selected === e.value
                  ? e.couleurJeune + " scale-105 shadow-md"
                  : "border-[var(--color-rule)] bg-white " + e.couleurJeune
              }`}
            >
              <span className="text-5xl leading-none">{e.emoji}</span>
              <span className="text-sm font-bold text-[var(--color-ink)] leading-tight text-center">
                {e.labelJeune}
              </span>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  /* ── Mode standard ── */
  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-semibold text-[var(--color-ink)]">
        Comment tu te sens aujourd'hui ?
      </p>
      <div className="flex flex-wrap gap-2">
        {ETATS.map((e) => (
          <button
            key={e.value}
            onClick={() => {
              setSelected(e.value);
              checkin.mutate({ etat: e.value });
            }}
            disabled={checkin.isPending}
            className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-all ${
              selected === e.value
                ? e.couleur + " scale-105"
                : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
            }`}
          >
            {e.emoji} {e.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
