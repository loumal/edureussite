"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface Props {
  webinaireId: string;
  dejaInscrit: boolean;
  nbInscrits: number;
  maxParticipants?: number | null;
}

export function InscriptionWebinaireBtn({ webinaireId, dejaInscrit, nbInscrits, maxParticipants }: Props) {
  const [inscrit, setInscrit] = useState(dejaInscrit);
  const [count, setCount] = useState(nbInscrits);

  const inscrire = trpc.specialiste.sInscrireWebinaire.useMutation({
    onSuccess: () => {
      setInscrit(true);
      setCount((c) => c + 1);
    },
  });

  const desinscrire = trpc.specialiste.seDesinscrireWebinaire.useMutation({
    onSuccess: () => {
      setInscrit(false);
      setCount((c) => Math.max(0, c - 1));
    },
  });

  const complet = !inscrit && maxParticipants !== null && maxParticipants !== undefined && count >= maxParticipants;
  const isLoading = inscrire.isPending || desinscrire.isPending;
  const error = inscrire.error ?? desinscrire.error;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {maxParticipants && (
        <span className="text-[11px] text-[var(--color-ink-soft)]">
          {count}/{maxParticipants} inscrit{count !== 1 ? "s" : ""}
        </span>
      )}

      {error && (
        <span className="text-xs text-[var(--color-accent)]">{error.message}</span>
      )}

      {inscrit ? (
        <button
          onClick={() => desinscrire.mutate({ webinaireId })}
          disabled={isLoading}
          className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-[rgba(217,79,43,0.08)] hover:text-[var(--color-accent)] hover:border-[rgba(217,79,43,0.2)] transition-colors disabled:opacity-40"
        >
          {isLoading ? "…" : "✓ Inscrit — Se désinscrire"}
        </button>
      ) : (
        <button
          onClick={() => inscrire.mutate({ webinaireId })}
          disabled={isLoading || complet}
          className="rounded-xl bg-[var(--color-ink)] px-3 py-1 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {complet ? "Complet" : isLoading ? "…" : "S'inscrire"}
        </button>
      )}
    </div>
  );
}
