"use client";

import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Exercice, ExerciceAssigne } from "@/generated/prisma";

type ExerciceAvecDetails = ExerciceAssigne & { exercice: Exercice };

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "📖",
  MATHEMATIQUES: "🔢",
  SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍",
  ARTS: "🎨",
  ANGLAIS: "🇨🇦",
  EDUCATION_PHYSIQUE: "⚽",
  ETHIQUE: "💭",
};

const DIFFICULTE_LABEL: Record<string, string> = {
  REMEDIATION: "Révision",
  BASE: "Facile",
  ATTENDU: "Niveau attendu",
  AVANCE: "Avancé",
  EXCELLENCE: "Excellence",
};

interface Props {
  exercices: ExerciceAvecDetails[];
  modeDoux: boolean;
}

export function ExercicesDuJourWidget({ exercices, modeDoux }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <CardLabel>
          {modeDoux ? "💙 Exercices doux du jour" : "⚡ Exercices du jour"}
        </CardLabel>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {exercices.length} à faire
        </span>
      </div>

      {exercices.length === 0 ? (
        <div className="rounded-xl bg-[var(--color-paper-warm)] p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Tous tes exercices sont complétés !
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            Reviens demain ou génère un nouvel exercice.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercices.map((ea, i) => (
            <ExerciceCard key={ea.id} exerciceAssigne={ea} index={i} />
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[var(--color-rule)]">
        <Link href="/eleve/exercices/nouveau">
          <Button variant="secondary" size="sm" className="w-full">
            + Générer un nouvel exercice
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function ExerciceCard({
  exerciceAssigne,
  index,
}: {
  exerciceAssigne: ExerciceAvecDetails;
  index: number;
}) {
  const { exercice, statut } = exerciceAssigne;
  const isPrioritaire = index === 0;

  return (
    <Link href={`/eleve/exercices/${exerciceAssigne.id}`}>
      <div className="flex items-start gap-3 rounded-xl bg-[var(--color-paper-warm)] p-4 hover:bg-white hover:shadow-[var(--shadow-card)] transition-all group">
        <div className="text-2xl mt-0.5">
          {MATIERE_EMOJI[exercice.matiere] ?? "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)] line-clamp-1">
              {exercice.titre}
            </p>
            {isPrioritaire && (
              <Badge variant="accent" className="flex-shrink-0">
                Prioritaire
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-[var(--color-ink-soft)]">
              ~{exercice.dureeMinutes} min
            </span>
            <span className="text-[var(--color-rule)]">·</span>
            <span className="text-xs text-[var(--color-ink-soft)]">
              {DIFFICULTE_LABEL[exercice.difficulte]}
            </span>
            {statut === "EN_COURS" && (
              <>
                <span className="text-[var(--color-rule)]">·</span>
                <Badge variant="gold">En cours</Badge>
              </>
            )}
          </div>
        </div>
        <div className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] transition-colors">
          →
        </div>
      </div>
    </Link>
  );
}
