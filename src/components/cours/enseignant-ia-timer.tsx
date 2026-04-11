"use client";

import { useState, useEffect, useCallback } from "react";

// ── Hook timer session Mira ──────────────────────────────────────────────────
// secsAlreadyUsed : secondes déjà consommées cette semaine (depuis la DB)
// secsMax         : quota total en secondes (30 min + bonus super admin)

export function useSessionTimer(secsAlreadyUsed: number, secsMax: number) {
  const [secsAddedThisSession, setSecsAddedThisSession] = useState(0);
  const [active, setActive] = useState(false);

  // Incrémenter chaque seconde quand la session est active
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setSecsAddedThisSession((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const secsUsedTotal = secsAlreadyUsed + secsAddedThisSession;
  const secsLeft = Math.max(0, secsMax - secsUsedTotal);
  const isExpired = secsLeft === 0;

  const startTimer = useCallback(() => setActive(true), []);
  const stopTimer = useCallback(() => setActive(false), []);

  return {
    secsLeft,
    secsAddedThisSession, // à sauvegarder en DB à la fin de session
    maxSecs: secsMax,
    isExpired,
    startTimer,
    stopTimer,
  };
}

// ── Composant badge timer ──────────────────────────────────────────────────────

interface Props {
  secsLeft: number;
  maxSecs: number;
}

export function SessionTimerBadge({ secsLeft, maxSecs }: Props) {
  const minutes = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const pct = maxSecs > 0 ? secsLeft / maxSecs : 0;

  const isWarning = pct <= 0.1 && pct > 0.02;
  const isCritical = pct <= 0.02;

  const colorClass = isCritical
    ? "text-red-400 bg-red-400/10"
    : isWarning
    ? "text-amber-400 bg-amber-400/10"
    : "text-white/60 bg-white/10";

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono transition-all duration-500 ${colorClass}`}
    >
      <span>⏱</span>
      <span>
        {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
