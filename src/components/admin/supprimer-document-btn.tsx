"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

interface Props {
  documentId: string;
  titre: string;
}

export function SupprimerDocumentBtn({ documentId, titre }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const supprimer = trpc.admin.supprimerDocument.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-accent)] font-medium">Confirmer ?</span>
        <button
          onClick={() => supprimer.mutate({ id: documentId })}
          disabled={supprimer.isPending}
          className="rounded-lg bg-[var(--color-accent)] px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {supprimer.isPending ? "…" : "Oui, supprimer"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Supprimer "${titre}"`}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[rgba(217,79,43,0.08)] hover:text-[var(--color-accent)] transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  );
}
