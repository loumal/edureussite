"use client";

import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  OBSERVATION_PARENT: { emoji: "👨‍👩‍👧", label: "Observation", color: "var(--color-ink-soft)" },
  COMMENTAIRE_ENSEIGNANT: { emoji: "🍎", label: "Note enseignant", color: "var(--color-success)" },
  PLAN_INTERVENTION: { emoji: "📋", label: "PIE", color: "var(--color-purple)" },
  RAPPORT_BILAN: { emoji: "📊", label: "Rapport", color: "var(--color-gold)" },
  AUTRE: { emoji: "📝", label: "Note", color: "var(--color-ink-soft)" },
};

interface Props {
  eleveId: string;
}

export function CommentairesList({ eleveId }: Props) {
  const { data: commentaires, isLoading } = trpc.parent.listerCommentaires.useQuery({ eleveId });
  const utils = trpc.useUtils();
  const supprimer = trpc.parent.supprimerCommentaire.useMutation({
    onSuccess: () => utils.parent.listerCommentaires.invalidate({ eleveId }),
  });

  if (isLoading) {
    return <p className="text-sm text-[var(--color-ink-soft)]">Chargement…</p>;
  }

  if (!commentaires || commentaires.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-soft)] italic">
        Aucune note pour le moment. Vos notes aideront l'IA à mieux personnaliser le plan.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {commentaires.map((c) => {
        const cfg = TYPE_CONFIG[c.type] ?? TYPE_CONFIG.AUTRE;
        return (
          <Card key={c.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    {new Date(c.createdAt).toLocaleDateString("fr-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap leading-relaxed">
                  {c.contenu}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm("Supprimer cette note ?")) {
                    supprimer.mutate({ commentaireId: c.id });
                  }
                }}
                className="flex-shrink-0 text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] text-xs"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
