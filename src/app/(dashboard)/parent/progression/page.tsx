"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

const MATIERES_COULEURS: Record<string, string> = {
  FRANCAIS:          "#5b4fcf",
  MATHEMATIQUES:     "#2a7c6f",
  SCIENCES:          "#1d6fa4",
  UNIVERS_SOCIAL:    "#c97a1b",
  ARTS:              "#a0467e",
  ANGLAIS:           "#3a8a3a",
  EDUCATION_PHYSIQUE:"#c94b4b",
  ETHIQUE:           "#7a7a3a",
};

// ── SVG Line Chart ─────────────────────────────────────────────────────────────

function LigneChart({
  data,
  width = 560,
  height = 220,
}: {
  data: { semaine: string; scoreMoyen: number; nbExercices: number }[];
  width?: number;
  height?: number;
}) {
  const PAD_L = 44;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 40;
  const W = width - PAD_L - PAD_R;
  const H = height - PAD_T - PAD_B;

  if (data.length === 0) return (
    <div className="flex items-center justify-center h-[220px] text-sm text-[var(--color-ink-soft)]">
      Pas encore assez de données
    </div>
  );

  const n = data.length;
  const xStep = n > 1 ? W / (n - 1) : W;

  const toX = (i: number) => PAD_L + i * xStep;
  const toY = (v: number) => PAD_T + H - (v / 100) * H;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.scoreMoyen), d }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Étiquettes X : afficher max 6 semaines
  const xLabels: number[] = [];
  if (n <= 6) {
    for (let i = 0; i < n; i++) xLabels.push(i);
  } else {
    xLabels.push(0);
    const step = Math.floor(n / 5);
    for (let i = step; i < n - 1; i += step) xLabels.push(i);
    xLabels.push(n - 1);
  }

  function semaineLabel(iso: string, isCurrent: boolean) {
    if (isCurrent) return "Cette sem.";
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width }}>
      {/* Grille horizontale */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={PAD_L + W} y2={y}
              stroke={v === 0 ? "#d0ccc4" : "#e8e4dc"} strokeWidth={v === 0 ? 1.5 : 1} />
            <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#999">{v}%</text>
          </g>
        );
      })}

      {/* Zone remplie sous la courbe */}
      <polygon
        points={`${PAD_L},${toY(0)} ${polylinePoints} ${PAD_L + W * (n > 1 ? 1 : 0)},${toY(0)}`}
        fill="rgba(42,124,111,0.07)"
      />

      {/* Ligne principale */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#2a7c6f"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill="#2a7c6f" />
          <circle cx={p.x} cy={p.y} r={3} fill="white" />
          {/* Tooltip au survol simulé avec title */}
          <title>{`${semaineLabel(p.d.semaine, i === n - 1)} : ${p.d.scoreMoyen}% (${p.d.nbExercices} ex.)`}</title>
          <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
        </g>
      ))}

      {/* Score au-dessus du dernier point */}
      {points.length > 0 && (
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 10}
          textAnchor="middle"
          fontSize={11}
          fontWeight="700"
          fill="#2a7c6f"
        >
          {data[data.length - 1].scoreMoyen}%
        </text>
      )}

      {/* Étiquettes X */}
      {xLabels.map((i) => (
        <text key={i} x={toX(i)} y={height - 6} textAnchor="middle" fontSize={10} fill="#999">
          {semaineLabel(data[i].semaine, i === n - 1)}
        </text>
      ))}
    </svg>
  );
}

// ── Barre de progression ───────────────────────────────────────────────────────

function BarreMatiere({ label, score, couleur }: { label: string; score: number; couleur: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--color-ink-soft)] w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--color-rule)]">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: couleur }}
        />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color: couleur }}>{score}%</span>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ProgressionPage() {
  const { data: dashboard } = trpc.parent.getDashboard.useQuery();
  const enfants = dashboard?.eleves ?? [];
  const [eleveId, setEleveId] = useState<string | null>(null);

  const activeId = eleveId ?? enfants[0]?.id ?? null;

  const { data, isLoading } = trpc.parent.getProgressionDetaille.useQuery(
    { eleveId: activeId! },
    { enabled: !!activeId }
  );

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">

        {/* En-tête */}
        <div>
          <Link href="/parent" className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] mb-3 inline-flex items-center gap-1">
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">Courbe de progression</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Suivi semaine par semaine</p>
        </div>

        {/* Sélecteur d'enfant */}
        {enfants.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {enfants.map((e) => (
              <button
                key={e.id}
                onClick={() => setEleveId(e.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  (eleveId ?? enfants[0].id) === e.id
                    ? "bg-[var(--color-ink)] text-white"
                    : "border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)]"
                }`}
              >
                {e.prenom}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-[var(--color-rule)]" />
            ))}
          </div>
        )}

        {data && (
          <>
            {/* Résumé narratif */}
            <Card className="p-5 border-l-4 border-l-[var(--color-success)]">
              <p className="text-sm leading-relaxed text-[var(--color-ink)]">{data.narratif}</p>
              <div className="mt-3 flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-[var(--color-ink-soft)]">Exercices cette semaine</p>
                  <p className="text-lg font-black text-[var(--color-ink)]">{data.semaineCourante.exercices}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-ink-soft)]">Temps de pratique</p>
                  <p className="text-lg font-black text-[var(--color-ink)]">
                    {Math.floor(data.semaineCourante.tempsMinutes / 60) > 0
                      ? `${Math.floor(data.semaineCourante.tempsMinutes / 60)}h${String(data.semaineCourante.tempsMinutes % 60).padStart(2, "0")}`
                      : `${data.semaineCourante.tempsMinutes} min`}
                  </p>
                </div>
                {data.semaineCourante.scoreMoyen !== null && (
                  <div>
                    <p className="text-xs text-[var(--color-ink-soft)]">Score moyen</p>
                    <p className="text-lg font-black text-[var(--color-ink)]">{data.semaineCourante.scoreMoyen}%</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Graphique ligne */}
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
                📈 Taux de réussite — semaine par semaine
              </p>
              {data.semainesData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-[var(--color-ink-soft)]">
                  Complète quelques exercices pour voir la courbe apparaître ✨
                </div>
              ) : (
                <LigneChart data={data.semainesData} />
              )}
            </Card>

            {/* Comparaison avant / après */}
            {data.comparaison && (
              <Card className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
                  ⚖️ Avant / Après
                </p>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center rounded-xl bg-[var(--color-paper-warm)] p-4">
                    <p className="text-xs text-[var(--color-ink-soft)]">Début</p>
                    <p className="text-2xl font-black text-[var(--color-ink)]">{data.comparaison.avant}%</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-black ${data.comparaison.delta >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                      {data.comparaison.delta >= 0 ? "+" : ""}{data.comparaison.delta}%
                    </p>
                    <p className="text-xs text-[var(--color-ink-soft)]">progression</p>
                  </div>
                  <div className="text-center rounded-xl bg-[rgba(42,124,111,0.08)] p-4">
                    <p className="text-xs text-[var(--color-success)]">Maintenant</p>
                    <p className="text-2xl font-black text-[var(--color-success)]">{data.comparaison.apres}%</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-ink-soft)] text-center mt-3">
                  Sur {data.totalExercices} exercice{data.totalExercices !== 1 ? "s" : ""} complété{data.totalExercices !== 1 ? "s" : ""} au total
                </p>
              </Card>
            )}

            {/* Top 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Maîtrisées */}
              <Card className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-4">
                  ✅ Top 3 maîtrisées
                </p>
                {data.top3Maitrisees.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-soft)]">Données insuffisantes</p>
                ) : (
                  <div className="space-y-3">
                    {data.top3Maitrisees.map((m) => (
                      <BarreMatiere
                        key={m.matiere}
                        label={m.label}
                        score={m.scoreMoyen}
                        couleur={MATIERES_COULEURS[m.matiere] ?? "#2a7c6f"}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {/* À travailler */}
              <Card className="p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] mb-4">
                  🎯 Top 3 à renforcer
                </p>
                {data.top3ATravail.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-soft)]">Données insuffisantes</p>
                ) : (
                  <div className="space-y-3">
                    {data.top3ATravail.map((m) => (
                      <BarreMatiere
                        key={m.matiere}
                        label={m.label}
                        score={m.scoreMoyen}
                        couleur={m.scoreMoyen < 60 ? "#d94f2b" : "#e89c00"}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Lien rapports détaillés */}
            <div className="text-center pt-2">
              <Link
                href="/parent/rapports"
                className="text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline"
              >
                Voir le rapport complet →
              </Link>
            </div>
          </>
        )}

        {!isLoading && !data && !activeId && (
          <Card className="p-10 text-center">
            <p className="text-lg font-bold text-[var(--color-ink)] mb-2">Aucun enfant lié</p>
            <p className="text-sm text-[var(--color-ink-soft)]">Ajoutez un enfant à votre compte pour voir la progression.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
