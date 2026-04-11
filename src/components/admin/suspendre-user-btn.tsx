"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  nom: string;
  suspended: boolean;
}

export function SuspendreUserBtn({ userId, nom, suspended }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raison, setRaison] = useState("");

  const suspendre = trpc.admin.suspendreCompte.useMutation({
    onSuccess: () => {
      setOpen(false);
      setRaison("");
      router.refresh();
    },
  });

  // Les comptes déjà suspendus sont gérés par ComptesSuspendus
  if (suspended) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
        title="Suspendre ce compte"
      >
        🔒
      </button>
    );
  }

  return (
    <div className="flex items-start gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-amber-800">Suspendre {nom} ?</span>
        <input
          type="text"
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          placeholder="Motif (optionnel)"
          maxLength={200}
          className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-amber-400 w-44 bg-white"
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => suspendre.mutate({ userId, raison: raison || undefined })}
            disabled={suspendre.isPending}
            className="rounded-lg px-2.5 py-1 text-xs font-bold bg-amber-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {suspendre.isPending ? "…" : "Suspendre"}
          </button>
          <button
            onClick={() => { setOpen(false); setRaison(""); }}
            className="text-xs text-[var(--color-ink-soft)] hover:underline"
          >
            Annuler
          </button>
        </div>
        {suspendre.isError && (
          <span className="text-xs text-[var(--color-accent)]">{suspendre.error.message}</span>
        )}
      </div>
    </div>
  );
}
