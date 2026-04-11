"use client";

import Link from "next/link";

export interface RecommandationBannerData {
  recommande: boolean;
  urgence: "faible" | "moderee" | "haute";
  specialites: string[];
  raisonnement: string;
  declencheurs: string[];
  messageParent: string;
}

interface Props {
  initialData?: RecommandationBannerData | null;
  prenomEnfant?: string;
}

const URGENCE_STYLES = {
  faible: {
    bg: "bg-[rgba(42,124,111,0.08)]",
    border: "border-[rgba(42,124,111,0.25)]",
    badge: "bg-[rgba(42,124,111,0.15)] text-[var(--color-success)]",
    label: "Recommandation douce",
  },
  moderee: {
    bg: "bg-[rgba(245,158,11,0.08)]",
    border: "border-[rgba(245,158,11,0.25)]",
    badge: "bg-[rgba(245,158,11,0.15)] text-amber-700",
    label: "Recommandation modérée",
  },
  haute: {
    bg: "bg-[rgba(217,79,43,0.08)]",
    border: "border-[rgba(217,79,43,0.2)]",
    badge: "bg-[rgba(217,79,43,0.12)] text-[var(--color-accent)]",
    label: "Recommandation urgente",
  },
};

const SPECIALITE_LABEL: Record<string, string> = {
  ORTHOPEDAGOGUE: "Orthopédagogue",
  PSYCHONEUROLOGUE: "Psychoneurologue",
  PSYCHOEDUCATEUR: "Psychoéducateur",
  ORTHOPHONISTE: "Orthophoniste",
  TRAVAILLEUR_SOCIAL: "Travailleur social",
  PSYCHOLOGUE: "Psychologue",
  AUTRE: "Autre spécialité",
};

export function RecommandationBanner({ initialData, prenomEnfant }: Props) {
  if (!initialData?.recommande) return null;

  const styles = URGENCE_STYLES[initialData.urgence] ?? URGENCE_STYLES.faible;

  return (
    <div className={`rounded-2xl border p-5 ${styles.bg} ${styles.border} mb-6`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🩺</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
              {styles.label}
            </span>
            {initialData.specialites.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {initialData.specialites.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white/70 border border-[var(--color-rule)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-soft)]"
                  >
                    {SPECIALITE_LABEL[s] ?? s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-[var(--color-ink)] mb-3">
            {initialData.messageParent}
          </p>

          {initialData.declencheurs.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                Indicateurs observés{prenomEnfant ? ` chez ${prenomEnfant}` : ""} :
              </p>
              <ul className="space-y-0.5">
                {initialData.declencheurs.map((d, i) => (
                  <li key={i} className="text-xs text-[var(--color-ink-soft)] flex items-start gap-1.5">
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/parent/specialistes"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Consulter nos spécialistes →
          </Link>
        </div>
      </div>
    </div>
  );
}
