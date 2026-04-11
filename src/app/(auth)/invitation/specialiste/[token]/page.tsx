"use client";

import { use, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ActivationSpecialistePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmer, setConfirmer] = useState("");
  const [erreur, setErreur] = useState("");

  const { data: validation, isLoading } = trpc.specialiste.validerTokenInvitation.useQuery({ token });

  const activer = trpc.specialiste.activerCompte.useMutation({
    onSuccess: async (data) => {
      // Connexion automatique après activation
      const result = await signIn("credentials", {
        email: data.email,
        password: motDePasse,
        otp: "000000",
        redirect: false,
      });
      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/specialiste");
      }
    },
    onError: (err) => setErreur(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    if (motDePasse !== confirmer) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    activer.mutate({ token, motDePasse });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-[var(--color-ink)] mb-2">✦ ÉduRéussite QC</div>
          <p className="text-sm text-[var(--color-ink-soft)]">Activation de votre compte spécialiste</p>
        </div>

        <Card className="p-8">
          {isLoading ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-sm text-[var(--color-ink-soft)]">Vérification du lien…</p>
            </div>
          ) : !validation?.valide ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🔗</div>
              <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">Lien invalide</h2>
              <p className="text-sm text-[var(--color-ink-soft)]">
                {validation?.raison ?? "Ce lien d'activation est invalide."}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">👩‍⚕️</div>
                <h2 className="text-xl font-bold text-[var(--color-ink)]">
                  Bienvenue, {validation.prenom} !
                </h2>
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                  Définissez votre mot de passe pour activer votre compte.
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-1 font-mono bg-[var(--color-paper-warm)] rounded-lg px-3 py-1 inline-block">
                  {validation.email}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Mot de passe"
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  minLength={8}
                  required
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirmer}
                  onChange={(e) => setConfirmer(e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  required
                />

                {erreur && (
                  <div className="rounded-lg bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] p-3">
                    <p className="text-sm text-[var(--color-accent)]">{erreur}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  loading={activer.isPending}
                  disabled={!motDePasse || !confirmer}
                  size="lg"
                  className="w-full"
                >
                  Activer mon compte
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
