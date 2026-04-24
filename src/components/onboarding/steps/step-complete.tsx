"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const ETAPES_GENERATION = [
  { label: "Analyse de ton profil…", emoji: "🔍", duree: 1200 },
  { label: "Consultation du programme PFEQ…", emoji: "📚", duree: 1500 },
  { label: "Création de tes objectifs personnalisés…", emoji: "🎯", duree: 1500 },
  { label: "Ton plan est prêt !", emoji: "✅", duree: 800 },
];

export function StepComplete({ prenom }: { prenom: string }) {
  const router = useRouter();
  const [etapeIndex, setEtapeIndex] = useState(0);
  const [planPret, setPlanPret] = useState(false);

  const genererPlan = trpc.eleve.genererPlan.useMutation({
    onSuccess: () => {
      setPlanPret(true);
      setTimeout(() => router.push("/eleve"), 1500);
    },
    onError: () => {
      // En cas d'erreur IA, on redirige quand même
      setTimeout(() => router.push("/eleve"), 2000);
    },
  });

  // Animation des étapes de génération
  useEffect(() => {
    let elapsed = 0;
    const timers: NodeJS.Timeout[] = [];

    ETAPES_GENERATION.forEach((e, i) => {
      const t = setTimeout(() => setEtapeIndex(i), elapsed);
      timers.push(t);
      elapsed += e.duree;
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Lancer la génération du plan
  useEffect(() => {
    const t = setTimeout(() => genererPlan.mutate(), 500);
    return () => clearTimeout(t);
  }, []);

  const etapeCourante = ETAPES_GENERATION[etapeIndex];

  return (
    <div className="flex flex-col items-center justify-center text-center py-8 animate-scale-in">
      <div className="text-7xl mb-6 animate-celebrate">🎉</div>

      <h2 className="text-3xl font-black text-[var(--color-ink)] mb-2">
        Ton profil est prêt, {prenom} !
      </h2>
      <p className="text-[var(--color-ink-soft)] mb-8 max-w-sm">
        Nous construisons ton plan d'apprentissage personnalisé…
      </p>

      {/* Progression de la génération */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[var(--color-rule)] p-5 mb-6">
        {ETAPES_GENERATION.map((e, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 py-2 transition-all duration-300 ${
              i < etapeIndex
                ? "opacity-40"
                : i === etapeIndex
                ? "opacity-100"
                : "opacity-20"
            }`}
          >
            <span className="text-xl">{i < etapeIndex ? "✓" : e.emoji}</span>
            <span
              className={`text-sm font-medium ${
                i === etapeIndex
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)]"
              }`}
            >
              {e.label}
            </span>
            {i === etapeIndex && !planPret && (
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]"
                    style={{
                      animation: "bounce 0.8s infinite",
                      animationDelay: `${j * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {planPret && (
        <p className="text-sm font-medium text-[var(--color-success)] animate-fade-in">
          ✓ Redirection vers ton tableau de bord…
        </p>
      )}
    </div>
  );
}
