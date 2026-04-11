"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

interface Creneau {
  id: string;
  debut: Date;
  fin: Date;
}

interface Props {
  demandeId: string;
  creneaux: Creneau[];
}

export function ProposerRdvBtn({ demandeId, creneaux }: Props) {
  const [open, setOpen] = useState(false);
  const [creneauId, setCreneauId] = useState(creneaux[0]?.id ?? "");
  const [lienVisio, setLienVisio] = useState("");
  const [confirme, setConfirme] = useState(false);
  const router = useRouter();

  const proposer = trpc.specialiste.proposerRendezVous.useMutation({
    onSuccess: () => {
      setConfirme(true);
      router.refresh();
    },
  });

  if (confirme) {
    return (
      <p className="text-xs font-semibold text-[var(--color-success)]">
        ✓ Rendez-vous confirmé — les deux parties ont été notifiées.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={creneaux.length === 0}
        className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        📅 Proposer un rendez-vous
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4 space-y-3">
      <p className="text-xs font-bold text-[var(--color-ink)]">Proposer un créneau</p>

      <div>
        <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Créneau disponible</label>
        <select
          value={creneauId}
          onChange={(e) => setCreneauId(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-2 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none"
        >
          {creneaux.map((c) => (
            <option key={c.id} value={c.id}>
              {new Date(c.debut).toLocaleDateString("fr-CA", { dateStyle: "medium" })}{" "}
              {new Date(c.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(c.fin).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[var(--color-ink-soft)] mb-1">
          Lien visioconférence (facultatif)
        </label>
        <input
          type="url"
          value={lienVisio}
          onChange={(e) => setLienVisio(e.target.value)}
          placeholder="https://meet.google.com/..."
          className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
        />
      </div>

      {proposer.isError && (
        <p className="text-xs text-[var(--color-accent)]">{proposer.error.message}</p>
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
          onClick={() =>
            proposer.mutate({
              demandeId,
              creneauId,
              lienVisio: lienVisio || undefined,
            })
          }
          disabled={!creneauId || proposer.isPending}
          className="flex-[2] text-xs"
        >
          {proposer.isPending ? "Confirmation…" : "Confirmer le rendez-vous"}
        </Button>
      </div>
    </div>
  );
}
