import { Card, CardLabel } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { NiveauMatiere } from "@/generated/prisma";

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

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Maths",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique",
  ETHIQUE: "Éthique",
};

interface Props {
  niveauxMatieres: NiveauMatiere[];
}

export function ProgressionWidget({ niveauxMatieres }: Props) {
  if (niveauxMatieres.length === 0) {
    return (
      <Card className="p-5">
        <CardLabel className="mb-3">Ma progression</CardLabel>
        <p className="text-xs text-[var(--color-ink-soft)]">
          Ta progression apparaîtra ici après ton premier exercice.
        </p>
      </Card>
    );
  }

  // Trier par score (les plus faibles en premier pour les mettre en avant)
  const sorted = [...niveauxMatieres].sort((a, b) => a.scoreGlobal - b.scoreGlobal);

  return (
    <Card className="p-5">
      <CardLabel className="mb-4">Ma progression</CardLabel>
      <div className="space-y-3">
        {sorted.slice(0, 4).map((nm) => (
          <div key={nm.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[var(--color-ink)] flex items-center gap-1">
                {MATIERE_EMOJI[nm.matiere]} {MATIERE_LABEL[nm.matiere]}
              </span>
              <span className="text-xs font-bold text-[var(--color-ink-soft)]">
                {Math.round(nm.scoreGlobal)}%
              </span>
            </div>
            <Progress
              value={nm.scoreGlobal}
              size="sm"
              color={
                nm.scoreGlobal >= 80
                  ? "success"
                  : nm.scoreGlobal >= 60
                  ? "gold"
                  : "accent"
              }
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
