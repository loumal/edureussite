"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ETHIQUE: "Éthique",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éducation physique",
};

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "📖",
  MATHEMATIQUES: "🔢",
  SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍",
  ARTS: "🎨",
  ETHIQUE: "🤝",
  ANGLAIS: "🇨🇦",
  EDUCATION_PHYSIQUE: "⚽",
};

const TYPE_LABELS: Record<string, string> = {
  QCM: "Choix multiple",
  TEXTE_TROUS: "Texte à trous",
  QUESTION_OUVERTE: "Question ouverte",
  PROBLEME_MATHEMATIQUE: "Problème",
  MINI_DEFI: "Mini défi",
  LECTURE_COMPREHENSION: "Lecture",
  MISE_EN_SITUATION: "Mise en situation",
  EPREUVE_COMPLETE: "Épreuve complète",
};

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  NON_COMMENCE: { label: "À faire", color: "text-[var(--color-ink-soft)]" },
  EN_COURS: { label: "En cours", color: "text-[var(--color-gold)]" },
  TERMINE: { label: "Terminé", color: "text-[var(--color-success)]" },
};

export default function HistoriqueExercicesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.exercice.getHistorique.useQuery({ page });

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/eleve"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              ← Tableau de bord
            </Link>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">
              Mes exercices
            </h1>
            {data && (
              <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                {data.total} exercice{data.total > 1 ? "s" : ""} au total
              </p>
            )}
          </div>
          <Link href="/eleve/exercices/nouveau">
            <Button size="sm">+ Nouvel exercice</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-[var(--color-rule)]"
              />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-5xl mb-4">✏️</div>
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">
              Aucun exercice encore
            </h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6">
              Lance ton premier exercice pour commencer à progresser !
            </p>
            <Link href="/eleve/exercices/nouveau">
              <Button>Générer un exercice ✨</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {data.items.map((item) => {
                const statut = STATUT_CONFIG[item.statut] ?? {
                  label: item.statut,
                  color: "",
                };
                const score = item.score ?? null;

                const href = item.exercice.type === "EPREUVE_COMPLETE"
                  ? `/eleve/exercices/epreuve/${item.id}`
                  : `/eleve/exercices/${item.id}`;

                return (
                  <Link key={item.id} href={href}>
                    <Card className="p-4 hover:shadow-[var(--shadow-elevated)] transition-shadow cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-paper-warm)] text-2xl">
                          {MATIERES_EMOJI[item.exercice.matiere] ?? "📚"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--color-ink-soft)]">
                              {MATIERES_LABELS[item.exercice.matiere] ?? item.exercice.matiere}
                            </span>
                            <span className="text-[var(--color-rule)]">·</span>
                            <span className="text-xs text-[var(--color-ink-soft)]">
                              {TYPE_LABELS[item.exercice.type] ?? item.exercice.type}
                            </span>
                            <span className={`ml-auto text-xs font-semibold ${statut.color}`}>
                              {statut.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[var(--color-ink)] truncate mt-0.5">
                            {item.exercice.titre}
                          </p>
                          {score !== null && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 max-w-[120px]">
                                <Progress
                                  value={score}
                                  color={score >= 80 ? "success" : score >= 60 ? "gold" : "accent"}
                                  size="sm"
                                />
                              </div>
                              <span className="text-xs font-bold text-[var(--color-ink)]">
                                {Math.round(score)}/100
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Précédent
                </Button>
                <span className="text-sm text-[var(--color-ink-soft)]">
                  Page {page} / {data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Suivant →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
