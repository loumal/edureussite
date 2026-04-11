import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import type { CoursStructure } from "@/lib/ai/cours";

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "✏️", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ETHIQUE: "🤝",
  ANGLAIS: "🗣️", EDUCATION_PHYSIQUE: "🏃",
};

const STATUT_CONFIG = {
  NON_LU:   { label: "Nouveau !",  bg: "bg-[var(--color-accent)]",          text: "text-white",                   dot: "bg-white"                    },
  EN_COURS: { label: "En cours",   bg: "bg-[rgba(201,149,42,0.15)]",         text: "text-[var(--color-gold)]",     dot: "bg-[var(--color-gold)]"      },
  TERMINE:  { label: "Terminé",    bg: "bg-[rgba(42,124,111,0.12)]",         text: "text-[var(--color-success)]",  dot: "bg-[var(--color-success)]"   },
};

interface CoursBrief {
  id: string;
  matieres: string[];
  contenu: unknown;
  statut: string;
  createdAt: Date;
}

interface Props {
  cours: CoursBrief[];
}

export function CoursWidget({ cours }: Props) {
  const nonLus = cours.filter((c) => c.statut === "NON_LU");
  const enCours = cours.filter((c) => c.statut === "EN_COURS");
  // Dashboard : montrer d'abord non-lus + en-cours, max 2
  const prioritaires = [...nonLus, ...enCours].slice(0, 2);

  if (prioritaires.length === 0) return null;

  return (
    <Card className={`p-5 ${nonLus.length > 0 ? "border-[rgba(217,79,43,0.3)] bg-[rgba(217,79,43,0.02)]" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <CardLabel>📚 Cours personnalisés</CardLabel>
        {nonLus.length > 0 && (
          <span className="rounded-full bg-[var(--color-accent)] text-white text-xs font-bold px-2.5 py-0.5 animate-pulse">
            {nonLus.length} nouveau{nonLus.length > 1 ? "x" : ""} !
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {prioritaires.map((c) => {
          const contenu = c.contenu as CoursStructure;
          const cfg = STATUT_CONFIG[c.statut as keyof typeof STATUT_CONFIG] ?? STATUT_CONFIG.TERMINE;
          const matieres = (c.matieres ?? []) as string[];
          const matiereLabels = matieres.map((m) => MATIERES_LABELS[m] ?? m).join(", ");
          const emoji = matieres.length > 0 ? (MATIERES_EMOJI[matieres[0]] ?? "📘") : "📘";

          return (
            <Link key={c.id} href={`/eleve/cours/${c.id}`}>
              <div className={`flex items-center gap-3 rounded-xl border p-3 hover:shadow-sm transition-all cursor-pointer ${
                c.statut === "NON_LU"
                  ? "border-[rgba(217,79,43,0.3)] bg-white"
                  : "border-[var(--color-rule)] bg-white hover:bg-[var(--color-paper-warm)]"
              }`}>
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-ink)] leading-snug truncate">
                    {contenu.titre ?? "Cours personnalisé"}
                  </p>
                  <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                    {matiereLabels} · ⏱ ~{contenu.dureeEstimeeMinutes ?? 20} min
                  </p>
                </div>
                <span className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA vers la page complète */}
      <Link
        href="/eleve/cours"
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-white hover:text-[var(--color-ink)] transition-colors"
      >
        Voir tous mes cours →
      </Link>
    </Card>
  );
}
