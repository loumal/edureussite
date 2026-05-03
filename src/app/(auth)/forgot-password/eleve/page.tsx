"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export default function ForgotPasswordElevePage() {
  const [codeAcces, setCodeAcces] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const requestReset = trpc.auth.requestChildPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-[var(--color-ink)] mb-2">✦ Édu-Réussite QC</div>
          <p className="text-sm text-[var(--color-ink-soft)]">Mot de passe oublié — Élève</p>
        </div>

        <Card className="p-8">
          {!submitted ? (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎒</div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">Mot de passe oublié ?</h1>
                <p className="text-sm text-[var(--color-ink-soft)] mt-2">
                  Entre ton code d'accès. Ton parent recevra un courriel pour t'aider à réinitialiser ton mot de passe.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  requestReset.mutate({ codeAcces });
                }}
                className="space-y-4"
              >
                <Input
                  label="Mon code d'accès"
                  value={codeAcces}
                  onChange={(e) => setCodeAcces(e.target.value)}
                  placeholder="ex: Emma-4821"
                  autoComplete="username"
                  required
                />
                {error && (
                  <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3">
                    <p className="text-sm text-[var(--color-accent)]">{error}</p>
                  </div>
                )}
                <Button type="submit" loading={requestReset.isPending} size="lg" className="w-full">
                  Envoyer la demande
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Demande envoyée !</h1>
              <p className="text-sm text-[var(--color-ink-soft)] mb-6">
                Un courriel a été envoyé à ton parent pour qu'il puisse réinitialiser ton mot de passe depuis son espace.
              </p>
              <Link
                href="/login"
                className="inline-block w-full rounded-xl bg-[var(--color-ink)] px-6 py-3 text-center text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Retour à la connexion
              </Link>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-soft)]">
          <Link href="/login" className="hover:underline">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}
