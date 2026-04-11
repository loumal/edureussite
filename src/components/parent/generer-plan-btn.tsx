"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  eleveId: string;
  dejaGenere: boolean;
  genereLeAt: Date | null;
  variant?: "primary" | "secondary";
}

const ETAPES = [
  { label: "Lecture du profil complet…", duree: 1200 },
  { label: "Analyse orthopédagogique…", duree: 1800 },
  { label: "Évaluation psychoneurologique…", duree: 1800 },
  { label: "Élaboration des stratégies…", duree: 2000 },
  { label: "Rédaction du plan personnalisé…", duree: 1500 },
];

export function GenererPlanBtn({ eleveId, dejaGenere, genereLeAt, variant = "secondary" }: Props) {
  const router = useRouter();
  const [generation, setGeneration] = useState(false);
  const [etapeIndex, setEtapeIndex] = useState(0);

  const generer = trpc.parent.genererPlanAccompagnement.useMutation({
    onSuccess: () => {
      router.refresh();
      setGeneration(false);
    },
    onError: () => {
      setGeneration(false);
    },
  });

  const handleGenerer = () => {
    setGeneration(true);
    setEtapeIndex(0);

    // Animation des étapes
    let elapsed = 0;
    ETAPES.forEach((e, i) => {
      setTimeout(() => setEtapeIndex(i), elapsed);
      elapsed += e.duree;
    });

    generer.mutate({ eleveId });
  };

  if (generation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-elevated)] animate-scale-in">
          <div className="text-5xl mb-4 animate-celebrate">🔬</div>
          <h3 className="text-lg font-black text-[var(--color-ink)] mb-1">
            Analyse en cours…
          </h3>
          <p className="text-xs text-[var(--color-ink-soft)] mb-6">
            Notre équipe d'experts analyse le profil de votre enfant
          </p>
          <div className="space-y-2 text-left">
            {ETAPES.map((e, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  i < etapeIndex ? "opacity-40" : i === etapeIndex ? "opacity-100" : "opacity-20"
                }`}
              >
                <span className="text-sm">
                  {i < etapeIndex ? "✓" : i === etapeIndex ? "⟳" : "○"}
                </span>
                <span className={`text-sm ${i === etapeIndex ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
                  {e.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={variant === "primary" ? "primary" : "secondary"}
        size={variant === "primary" ? "lg" : "sm"}
        onClick={handleGenerer}
        disabled={generer.isPending}
      >
        {dejaGenere ? "🔄 Régénérer l'analyse" : "✨ Générer le plan"}
      </Button>
      {dejaGenere && genereLeAt && (
        <span className="text-xs text-[var(--color-ink-soft)]">
          Généré le {new Date(genereLeAt).toLocaleDateString("fr-CA")}
        </span>
      )}
    </div>
  );
}
