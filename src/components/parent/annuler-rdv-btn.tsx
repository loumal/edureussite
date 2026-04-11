"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

interface Props {
  rdvId: string;
}

export function AnnulerRdvBtn({ rdvId }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [annule, setAnnule] = useState(false);
  const router = useRouter();

  const annuler = trpc.specialiste.annulerRendezVousParent.useMutation({
    onSuccess: () => {
      setAnnule(true);
      setConfirming(false);
      router.refresh();
    },
  });

  if (annule) {
    return <span className="text-xs text-[var(--color-ink-soft)]">Annulé</span>;
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-[var(--color-accent)] hover:underline font-medium"
      >
        Annuler
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-[var(--color-ink-soft)]">Confirmer l'annulation ?</p>
      <button
        onClick={() => annuler.mutate({ rdvId })}
        disabled={annuler.isPending}
        className="text-xs font-semibold text-[var(--color-accent)] hover:underline disabled:opacity-40"
      >
        {annuler.isPending ? "…" : "Oui"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs text-[var(--color-ink-soft)] hover:underline"
      >
        Non
      </button>
      {annuler.isError && (
        <p className="text-xs text-[var(--color-accent)]">{annuler.error.message}</p>
      )}
    </div>
  );
}
