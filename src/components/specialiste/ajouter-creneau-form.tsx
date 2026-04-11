"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function AjouterCreneauForm() {
  const [open, setOpen] = useState(false);
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const router = useRouter();

  const ajouter = trpc.specialiste.ajouterCreneau.useMutation({
    onSuccess: () => {
      setOpen(false);
      setDebut("");
      setFin("");
      router.refresh();
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        + Ajouter un créneau
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4 space-y-3">
      <p className="text-sm font-bold text-[var(--color-ink)]">Nouveau créneau disponible</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Début</label>
          <input
            type="datetime-local"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Fin</label>
          <input
            type="datetime-local"
            value={fin}
            onChange={(e) => setFin(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
          />
        </div>
      </div>

      {ajouter.isError && (
        <p className="text-xs text-[var(--color-accent)]">{ajouter.error.message}</p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
          className="flex-1 text-xs"
        >
          Annuler
        </Button>
        <Button
          onClick={() => {
            if (!debut || !fin) return;
            ajouter.mutate({ debut: new Date(debut).toISOString(), fin: new Date(fin).toISOString() });
          }}
          disabled={!debut || !fin || ajouter.isPending}
          className="flex-[2] text-xs"
        >
          {ajouter.isPending ? "Enregistrement…" : "Ajouter le créneau"}
        </Button>
      </div>
    </div>
  );
}
