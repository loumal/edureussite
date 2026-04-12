"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  streak: number;
  aFaitExerciceAujourdhui: boolean;
}

export function StreakDangerBanner({ streak, aFaitExerciceAujourdhui }: Props) {
  const [visible, setVisible] = useState(false);
  const [heureActuelle, setHeureActuelle] = useState(0);

  useEffect(() => {
    const h = new Date().getHours();
    setHeureActuelle(h);
    // Visible dès qu'il y a une streak active et aucun exercice fait aujourd'hui
    setVisible(streak > 0 && !aFaitExerciceAujourdhui);
  }, [streak, aFaitExerciceAujourdhui]);

  if (!visible) return null;

  // Urgence si moins de 3h restantes (après 21h)
  const urgence = heureActuelle >= 21;
  // Calcul heures restantes jusqu'à minuit
  const heuresRestantes = 23 - heureActuelle;
  const label = urgence
    ? `dans ~${heuresRestantes}h !`
    : heureActuelle >= 17
    ? `dans ~${heuresRestantes}h !`
    : "aujourd'hui encore !";

  return (
    <div className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
      urgence
        ? "bg-red-50 border-red-200"
        : "bg-[var(--color-paper-warm)] border-[var(--color-rule)]"
    }`}>
      {/* Icône */}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl ${
        urgence ? "bg-red-100" : "bg-amber-100"
      }`}>
        {urgence ? "🚨" : "🔔"}
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${urgence ? "text-red-700" : "text-[var(--color-ink)]"}`}>
          Ta série de {streak} jour{streak > 1 ? "s" : ""} se termine {label}
        </p>
        <p className={`text-xs mt-0.5 ${urgence ? "text-red-600" : "text-[var(--color-ink-soft)]"}`}>
          1 seul exercice suffit pour la maintenir 🔥
        </p>
      </div>

      {/* Bouton CTA */}
      <Link
        href="/eleve/exercices/nouveau"
        className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors ${
          urgence
            ? "bg-red-500 hover:bg-red-600"
            : "bg-amber-500 hover:bg-amber-600"
        }`}
      >
        Faire 1 exercice →
      </Link>

      {/* Fermer */}
      <button
        onClick={() => setVisible(false)}
        className={`flex-shrink-0 text-sm ${urgence ? "text-red-300 hover:text-red-500" : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"}`}
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}
