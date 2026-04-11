"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

interface Enfant {
  id: string;
  prenom: string;
}

interface Props {
  specialisteId: string;
  specialisteNom: string;
  enfants: Enfant[];
  eleveId?: string;
}

export function DemandeRencontreBtn({ specialisteId, specialisteNom, enfants, eleveId }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedEnfant, setSelectedEnfant] = useState<Enfant | null>(enfants[0] ?? null);
  const [prenomEnfant, setPrenomEnfant] = useState(enfants[0]?.prenom ?? "");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);

  const demander = trpc.specialiste.demanderRencontre.useMutation({
    onSuccess: () => { setEnvoye(true); },
  });

  if (envoye) {
    return (
      <p className="text-xs font-semibold text-[var(--color-success)]">
        ✓ Demande envoyée — {specialisteNom} vous contactera bientôt.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-rule)] transition-colors"
      >
        📅 Demander une rencontre
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-4 space-y-3">
      <p className="text-xs font-bold text-[var(--color-ink)]">Demande de rencontre avec {specialisteNom}</p>

      {enfants.length > 0 && (
        <div>
          <label className="block text-xs text-[var(--color-ink-soft)] mb-1">Enfant concerné</label>
          <select
            value={selectedEnfant?.id ?? ""}
            onChange={(e) => {
              const enfant = enfants.find((en) => en.id === e.target.value) ?? null;
              setSelectedEnfant(enfant);
              setPrenomEnfant(enfant?.prenom ?? "");
            }}
            className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-2 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none"
          >
            {enfants.map((e) => (
              <option key={e.id} value={e.id}>{e.prenom}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-[var(--color-ink-soft)] mb-1">
          Votre message <span className="text-[var(--color-accent)]">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez brièvement la situation de votre enfant et vos disponibilités pour une rencontre…"
          rows={3}
          className="w-full rounded-lg border border-[var(--color-rule)] bg-white px-3 py-2 text-xs text-[var(--color-ink)] resize-none focus:outline-none focus:border-[var(--color-ink)]"
        />
      </div>

      {demander.isError && (
        <p className="text-xs text-[var(--color-accent)]">{demander.error.message}</p>
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
            demander.mutate({
              specialisteId,
              eleveId: eleveId ?? selectedEnfant?.id,
              prenomEnfant: prenomEnfant || undefined,
              message,
            })
          }
          disabled={message.length < 10 || demander.isPending}
          className="flex-[2] text-xs"
        >
          {demander.isPending ? "Envoi…" : "Envoyer la demande"}
        </Button>
      </div>
    </div>
  );
}
