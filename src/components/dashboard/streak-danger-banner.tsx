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
    // Afficher la bannière si : streak > 0, pas encore fait d'exercice aujourd'hui, et il est >= 17h
    setVisible(streak > 0 && !aFaitExerciceAujourdhui && h >= 17);
  }, [streak, aFaitExerciceAujourdhui]);

  if (!visible) return null;

  const heuresRestantes = 23 - heureActuelle;
  const urgence = heureActuelle >= 21; // Rouge si < 3h restantes

  return (
    <div
      className={`mb-5 rounded-2xl border px-4 py-3 flex items-center gap-3 ${
        urgence
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      {/* Icône animée */}
      <div className={`text-2xl ${urgence ? "animate-bounce" : "animate-pulse"}`}>
        {urgence ? "🚨" : "⚠️"}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${urgence ? "text-red-700" : "text-amber-700"}`}>
          Ta série de {streak} jour{streak > 1 ? "s" : ""} se termine dans ~{heuresRestantes}h !
        </p>
        <p className={`text-xs mt-0.5 ${urgence ? "text-red-600" : "text-amber-600"}`}>
          1 seul exercice suffit pour la maintenir 🔥
        </p>
      </div>

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

      <button
        onClick={() => setVisible(false)}
        className={`flex-shrink-0 text-xs ${urgence ? "text-red-400 hover:text-red-600" : "text-amber-400 hover:text-amber-600"}`}
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>
  );
}
