"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";

const PING_INTERVAL_MS = 60_000; // mise à jour toutes les 60 secondes

export function SessionTracker() {
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [bonusVisible, setBonusVisible] = useState(false);

  const demarrer = trpc.eleve.demarrerSession.useMutation({
    onSuccess: ({ sessionId, bonusConnexion }) => {
      sessionIdRef.current = sessionId;
      if (bonusConnexion) {
        setBonusVisible(true);
        setTimeout(() => setBonusVisible(false), 4000);
      }
    },
  });

  const mettreAJour = trpc.eleve.mettreAJourSession.useMutation();

  useEffect(() => {
    demarrer.mutate();
    startTimeRef.current = Date.now();

    const sendUpdate = () => {
      if (!sessionIdRef.current) return;
      const duree = Math.floor((Date.now() - startTimeRef.current) / 1000);
      mettreAJour.mutate({ sessionId: sessionIdRef.current, dureeSecondes: duree });
    };

    const interval = setInterval(sendUpdate, PING_INTERVAL_MS);

    // Envoi final quand la page se ferme
    const handleUnload = () => sendUpdate();
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendUpdate();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      sendUpdate();
    };
  }, []); // eslint-disable-line

  if (!bonusVisible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 shadow-xl animate-fade-in"
      aria-live="polite"
    >
      <span className="text-base">⭐</span>
      <span className="text-sm font-bold text-white">+10 XP — Bonus connexion du jour !</span>
    </div>
  );
}
