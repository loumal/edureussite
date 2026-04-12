"use client";

import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const enAttente = exercices.filter((e) => e.statut !== "TERMINE");
  if (enAttente.length === 0) return null;

  return (
    <Card className="p-5 border-[rgba(217,79,43,0.25)] bg-[rgba(217,79,43,0.02)]">
      {/* En-tête — source clairement identifiée */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">👨‍🏫</span>
          <CardLabel>
            {modeDoux ? "💙 De ton professeur" : "De ton professeur"}
          </CardLabel>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[rgba(217,79,43,0.1)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-accent)]">
          🔔 {enAttente.length} à remettre
        </span>
      </div>
      <p className="text-[11px] text-[var(--color-ink-soft)] mb-4">
        Ton enseignant t'a assigné {enAttente.length === 1 ? "cet exercice" : "ces exercices"} — à compléter en priorité.
      </p>

      <div className="space-y-3">
        {enAttente.map((ea, i) => (
          <ExerciceCard key={ea.id} exerciceAssigne={ea} index={i} />
        ))}
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
      <div className="flex items-start gap-3 rounded-xl border border-[rgba(217,79,43,0.15)] bg-white p-4 hover:shadow-[var(--shadow-card)] hover:border-[rgba(217,79,43,0.3)] transition-all group">
        <div className="text-2xl mt-0.5">
          {MATIERE_EMOJI[exercice.matiere] ?? "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)] line-clamp-2 leading-snug">
              {exercice.titre}
            </p>
            {isPrioritaire && (
              <Badge variant="accent" className="flex-shrink-0">
                À faire d'abord
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
        <div className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-accent)] transition-colors mt-0.5">
          →
        </div>
      </div>
    </Link>
  );
}
