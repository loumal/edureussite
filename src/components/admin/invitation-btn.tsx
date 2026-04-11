"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

interface Props {
  specialisteId: string;
  compteActif: boolean;
}

export function InvitationBtn({ specialisteId, compteActif }: Props) {
  const router = useRouter();
  const [lienCopie, setLienCopie] = useState(false);
  const [lien, setLien] = useState<string | null>(null);

  const envoyer = trpc.specialiste.envoyerInvitation.useMutation({
    onSuccess: (data) => {
      setLien(data.lienActivation);
      router.refresh();
    },
  });

  if (compteActif) {
    return (
      <span className="text-xs font-semibold text-[var(--color-success)]">✓ Compte activé</span>
    );
  }

  if (lien) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-success)] font-medium">Invitation envoyée</span>
        <button
          onClick={() => { navigator.clipboard.writeText(lien); setLienCopie(true); setTimeout(() => setLienCopie(false), 2000); }}
          className="rounded px-2 py-0.5 text-xs bg-[var(--color-paper-warm)] border border-[var(--color-rule)] hover:bg-[var(--color-rule)] transition-colors"
        >
          {lienCopie ? "✓ Copié !" : "Copier le lien"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => envoyer.mutate({ specialisteId })}
      disabled={envoyer.isPending}
      className="rounded-lg px-3 py-1 text-xs font-semibold bg-[var(--color-ink)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {envoyer.isPending ? "Envoi…" : "✉️ Envoyer l'invitation"}
    </button>
  );
}
