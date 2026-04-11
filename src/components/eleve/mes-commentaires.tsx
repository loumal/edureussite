"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";

const TYPE_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  DIFFICULTE:       { emoji: "😓", label: "Difficulté",        color: "text-[var(--color-accent)]"   },
  OBJECTIF_MAITRISE:{ emoji: "🎯", label: "Objectif à maîtriser", color: "text-[var(--color-purple)]" },
  QUESTION:         { emoji: "🤔", label: "Question",           color: "text-[var(--color-gold)]"    },
  AUTRE:            { emoji: "💬", label: "Note",               color: "text-[var(--color-ink-soft)]"},
};

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Maths", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais", ARTS: "Arts",
  EDUCATION_PHYSIQUE: "Éd. physique", ETHIQUE: "Éthique",
};

export function MesCommentaires() {
  const { data: commentaires, isLoading } = trpc.eleve.listerCommentairesEleve.useQuery();
  const [confirmSuppId, setConfirmSuppId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const supprimer = trpc.eleve.supprimerCommentaireEleve.useMutation({
    onSuccess: () => {
      utils.eleve.listerCommentairesEleve.invalidate();
      setConfirmSuppId(null);
    },
  });

  if (isLoading) return <p className="text-xs text-[var(--color-ink-soft)] py-2">Chargement…</p>;
  if (!commentaires || commentaires.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
        Mes messages précédents
      </p>
      {commentaires.map((c) => {
        const cfg = TYPE_CONFIG[c.type] ?? TYPE_CONFIG.AUTRE;
        return (
          <div
            key={c.id}
            className="rounded-xl border border-[var(--color-rule)] bg-white px-4 py-3"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{cfg.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                  {(c.matieres as string[]).length > 0 && (
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      · {(c.matieres as string[]).map((m) => MATIERE_LABEL[m] ?? m).join(", ")}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-[var(--color-ink-soft)] flex-shrink-0">
                    {new Date(c.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-ink)] leading-relaxed line-clamp-2">
                  {c.contenu}
                </p>
              </div>
            </div>

            {confirmSuppId === c.id ? (
              <div className="flex items-center gap-2 mt-2">
                <p className="text-xs text-[var(--color-ink-soft)] flex-1">Supprimer ce message ?</p>
                <button
                  className="text-xs text-[var(--color-accent)] font-medium"
                  onClick={() => supprimer.mutate({ commentaireId: c.id })}
                >
                  Oui, supprimer
                </button>
                <button
                  className="text-xs text-[var(--color-ink-soft)]"
                  onClick={() => setConfirmSuppId(null)}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                className="mt-1.5 text-[10px] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] underline underline-offset-2"
                onClick={() => setConfirmSuppId(c.id)}
              >
                Supprimer
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
