"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

export default function ChangerPasswordPage() {
  const router = useRouter();
  const [mdp, setMdp] = useState("");
  const [confirm, setConfirm] = useState("");
  const [erreur, setErreur] = useState("");

  const changer = trpc.auth.changerMotDePasse.useMutation({
    onSuccess: () => router.push("/"),
    onError: (e) => setErreur(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (mdp.length < 8) { setErreur("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (mdp !== confirm) { setErreur("Les mots de passe ne correspondent pas."); return; }
    changer.mutate({ nouveauMotDePasse: mdp });
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center p-4">
      <div style={{ fontFamily: "Georgia, serif", maxWidth: 420, width: "100%" }}>
        <div className="text-center mb-8">
          <h1 className="text-xl font-black text-[var(--color-ink)] mb-1">✦ ÉduRéussite QC</h1>
        </div>

        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="text-base font-black text-[var(--color-ink)]">Nouveau mot de passe requis</h2>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              Pour des raisons de sécurité, vous devez définir un nouveau mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-ink)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink)] mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Répéter le mot de passe"
                required
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-ink)]"
              />
            </div>

            {erreur && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={changer.isPending}
              className="w-full rounded-xl bg-[var(--color-ink)] text-white py-2.5 text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {changer.isPending ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
