"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import type { Matiere } from "@/generated/prisma";

const MATIERES: { value: Matiere; label: string }[] = [
  { value: "FRANCAIS", label: "Français" },
  { value: "MATHEMATIQUES", label: "Mathématiques" },
  { value: "SCIENCES", label: "Sciences" },
  { value: "UNIVERS_SOCIAL", label: "Univers social" },
  { value: "ARTS", label: "Arts" },
  { value: "ANGLAIS", label: "Anglais" },
];

export function CommentaireForm({ eleveId }: { eleveId: string }) {
  const [contenu, setContenu] = useState("");
  const [matiere, setMatiere] = useState<Matiere | "">("");
  const [envoye, setEnvoye] = useState(false);

  const ajouter = trpc.enseignant.ajouterCommentaire.useMutation({
    onSuccess: () => {
      setContenu("");
      setMatiere("");
      setEnvoye(true);
      setTimeout(() => setEnvoye(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contenu.trim().length < 10) return;
    ajouter.mutate({
      eleveId,
      contenu: contenu.trim(),
      matiere: matiere || undefined,
      visible: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
          Matière concernée (optionnel)
        </label>
        <select
          value={matiere}
          onChange={(e) => setMatiere(e.target.value as Matiere | "")}
          className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none"
        >
          <option value="">Toutes les matières</option>
          {MATIERES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">
          Commentaire pédagogique
        </label>
        <textarea
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
          placeholder="Observations, encouragements, points à travailler…"
          rows={4}
          className="w-full rounded-xl border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:border-[var(--color-ink)] focus:outline-none resize-none"
        />
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
          {contenu.length}/500 caractères
        </p>
      </div>

      {ajouter.isError && (
        <p className="text-xs text-[var(--color-accent)]">
          Une erreur s'est produite. Réessaie.
        </p>
      )}

      {envoye && (
        <p className="text-xs text-[var(--color-success)] animate-fade-in">
          ✓ Commentaire enregistré
        </p>
      )}

      <Button
        type="submit"
        disabled={contenu.trim().length < 10 || ajouter.isPending}
        className="w-full"
      >
        {ajouter.isPending ? "Enregistrement…" : "Enregistrer le commentaire"}
      </Button>
    </form>
  );
}
