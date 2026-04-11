"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";

interface Props {
  userId: string;
  nom: string;
}

export function ReinitialiserMdpBtn({ userId, nom }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = trpc.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setPassword("");
      setConfirm("");
      setTimeout(() => { setOpen(false); setSuccess(false); router.refresh(); }, 1500);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    reset.mutate({ userId, newPassword: password });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
        title="Réinitialiser le mot de passe"
      >
        🔑
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-paper)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-[var(--color-ink)] mb-1">Réinitialiser le mot de passe</h2>
        <p className="text-xs text-[var(--color-ink-soft)] mb-4">{nom}</p>

        {success ? (
          <p className="text-sm text-[var(--color-success)] font-medium text-center py-2">✓ Mot de passe mis à jour</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-ink-soft)] block mb-1">Nouveau mot de passe</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                placeholder="Au moins 8 caractères"
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ink)] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-ink-soft)] block mb-1">Confirmer</label>
              <PasswordInput
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-sm outline-none focus:border-[var(--color-ink)] transition-colors"
              />
            </div>
            {error && <p className="text-xs text-[var(--color-accent)]">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={reset.isPending}
                className="flex-1 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {reset.isPending ? "…" : "Réinitialiser"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setPassword(""); setConfirm(""); setError(""); }}
                className="rounded-xl border border-[var(--color-rule)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
