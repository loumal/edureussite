"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SurpriseCard() {
  const { data: surprise, isLoading } = trpc.surprise.surpriseEnAttente.useQuery();
  const utils = trpc.useUtils();
  const [etape, setEtape] = useState<"decouverte" | "confirmation" | "souvenir">("decouverte");
  const [message, setMessage] = useState("");

  const confirmer = trpc.surprise.confirmerReception.useMutation({
    onSuccess: () => {
      setEtape("souvenir");
      utils.surprise.surpriseEnAttente.invalidate();
    },
  });

  if (isLoading || !surprise) return null;

  // Étape 1 : découverte de la surprise (le parent a accordé)
  if (etape === "decouverte") {
    return (
      <div className="mb-6">
        <Card className="overflow-hidden border-2 border-[var(--color-gold)] animate-fade-in">
          <div className="bg-gradient-to-br from-[rgba(201,149,42,0.15)] to-[rgba(201,149,42,0.03)] px-6 py-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎁</div>
            <h2 className="text-2xl font-black text-[var(--color-ink)] mb-2">
              Tes parents ont une surprise pour toi !
            </h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 max-w-xs mx-auto">
              Tu as travaillé très fort et tes parents veulent te récompenser.
            </p>
            <Button onClick={() => setEtape("confirmation")} className="text-base px-8 py-3">
              Découvrir ma surprise ✨
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Étape 2 : révélation + confirmation
  if (etape === "confirmation") {
    return (
      <div className="mb-6">
        <Card className="overflow-hidden border-2 border-[var(--color-gold)]">
          <div className="bg-gradient-to-br from-[rgba(201,149,42,0.1)] to-white px-6 py-6 text-center">
            <div className="text-5xl mb-3">🌟</div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold)] mb-2">
              Ta surprise
            </p>
            <p className="text-xl font-black text-[var(--color-ink)] mb-4">
              {surprise.privilegeChoisi}
            </p>
            <p className="text-sm text-[var(--color-ink-soft)] mb-1">
              Pourquoi tu le mérites :
            </p>
            <p className="text-sm font-semibold text-[var(--color-ink)] mb-6">
              {surprise.declencheur}
            </p>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-ink)] mb-2">
                Écris comment tu te sens en une phrase 🖊️
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Je suis content·e parce que…"
                maxLength={500}
                rows={2}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2.5 text-sm text-[var(--color-ink)] resize-none focus:outline-none focus:border-[var(--color-purple)]"
              />
            </div>

            {confirmer.isError && (
              <p className="text-xs text-[var(--color-accent)]">Une erreur s'est produite. Réessaie.</p>
            )}

            <Button
              onClick={() => confirmer.mutate({ surpriseId: surprise.id, messageEnfant: message })}
              disabled={confirmer.isPending || message.trim().length < 2}
              className="w-full"
            >
              {confirmer.isPending ? "Enregistrement…" : "Confirmer ma réception ✓"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Étape 3 : souvenir enregistré
  return (
    <div className="mb-6">
      <Card className="p-6 text-center border-2 border-[var(--color-success)]">
        <div className="text-5xl mb-3">🥳</div>
        <p className="text-lg font-black text-[var(--color-ink)] mb-1">Souvenir enregistré !</p>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Ce moment est maintenant dans ton Cahier de réussites pour toujours.
        </p>
      </Card>
    </div>
  );
}
