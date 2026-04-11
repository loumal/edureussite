"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreerSuperAdminBtn() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const creer = trpc.admin.creerSuperAdmin.useMutation({
    onSuccess: () => {
      setOpen(false);
      setPrenom(""); setNom(""); setEmail(""); setMotDePasse("");
      router.refresh();
    },
  });

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        + Nouveau Super Admin
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4">
        <h2 className="text-lg font-black text-[var(--color-ink)]">Créer un Super Admin</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Prénom *</label>
            <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Nom *</label>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Courriel *</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-ink-soft)] mb-1">Mot de passe *</label>
          <Input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="Minimum 8 caractères" required />
        </div>

        {creer.isError && (
          <p className="text-xs text-[var(--color-accent)]">{creer.error.message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">Annuler</Button>
          <Button
            onClick={() => creer.mutate({ prenom, nom, email, motDePasse })}
            disabled={!prenom || !nom || !email || motDePasse.length < 8 || creer.isPending}
            className="flex-[2]"
          >
            {creer.isPending ? "Création…" : "Créer le compte"}
          </Button>
        </div>
      </div>
    </div>
  );
}
