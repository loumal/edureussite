"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  nom: string;
}

export function SupprimerUserBtn({ userId, nom }: Props) {
  const router = useRouter();
  const [confirmer, setConfirmer] = useState(false);

  const supprimer = trpc.admin.supprimerUtilisateur.useMutation({
    onSuccess: () => {
      setConfirmer(false);
      router.refresh();
    },
  });

  if (!confirmer) {
    return (
      <button
        onClick={() => setConfirmer(true)}
        className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-accent)] hover:bg-[rgba(217,79,43,0.08)] transition-colors"
        title="Supprimer ce compte"
      >
        🗑
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] px-2 py-1">
      <span className="text-xs text-[var(--color-accent)] font-medium">Supprimer {nom} ?</span>
      <button
        onClick={() => supprimer.mutate({ userId })}
        disabled={supprimer.isPending}
        className="rounded px-1.5 py-0.5 text-xs font-bold bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {supprimer.isPending ? "…" : "Oui"}
      </button>
      <button
        onClick={() => setConfirmer(false)}
        className="text-xs text-[var(--color-ink-soft)] hover:underline"
      >
        Non
      </button>
      {supprimer.isError && (
        <span className="text-xs text-[var(--color-accent)]">{supprimer.error.message}</span>
      )}
    </div>
  );
}
