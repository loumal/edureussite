"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";

// Déconnexion après 30 min d'inactivité, avertissement à 2 min de la fin
const IDLE_MS = 15 * 60 * 1000;
const WARN_MS = 2 * 60 * 1000;

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

export function IdleTimeout() {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [secsLeft, setSecsLeft] = useState(Math.floor(WARN_MS / 1000));
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const clearAll = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    clearAll();
    setShowWarning(false);
    setSecsLeft(Math.floor(WARN_MS / 1000));

    // Avertissement quand il reste WARN_MS
    warnTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecsLeft(Math.floor(WARN_MS / 1000));
      countdownTimer.current = setInterval(() => {
        setSecsLeft((s) => {
          if (s <= 1) return 0;
          return s - 1;
        });
      }, 1000);
    }, IDLE_MS - WARN_MS);

    // Déconnexion après IDLE_MS
    idleTimer.current = setTimeout(logout, IDLE_MS);
  }, [clearAll, logout]);

  useEffect(() => {
    // Ne rien faire si pas connecté
    if (!session?.user) return;

    resetTimers();
    EVENTS.forEach((e) => window.addEventListener(e, resetTimers, { passive: true }));

    return () => {
      clearAll();
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, [session?.user, resetTimers, clearAll]);

  if (!showWarning) return null;

  const minutes = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl">⏱</span>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            Session sur le point d&apos;expirer
          </h2>
        </div>
        <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
          Tu seras déconnecté automatiquement dans{" "}
          <span className="font-bold text-[var(--color-ink)]">
            {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>{" "}
          en raison d&apos;inactivité.
        </p>
        <div className="flex gap-2">
          <button
            onClick={resetTimers}
            className="flex-1 rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-success)]"
          >
            Je suis là — continuer
          </button>
          <button
            onClick={logout}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-black/20"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
