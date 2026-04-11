"use client";

import { useCallback } from "react";

// Génère des sons de feedback via Web Audio API — aucun fichier requis.
// Silencieux si le navigateur bloque l'AudioContext (politique autoplay).

function createContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function useGameSound() {
  // Son de réussite — accord montant joyeux (Do Mi Sol Do)
  const playSuccess = useCallback(() => {
    const ctx = createContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      playTone(ctx, freq, now + i * 0.1, 0.35, 0.18, "sine");
    });
    // Petite réverbération finale
    playTone(ctx, 1046.5, now + 0.45, 0.6, 0.1, "sine");
  }, []);

  // Son de badge débloqué — fanfare courte
  const playBadge = useCallback(() => {
    const ctx = createContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(ctx, 880, now,        0.15, 0.2, "triangle");
    playTone(ctx, 1108, now + 0.12, 0.15, 0.2, "triangle");
    playTone(ctx, 1318, now + 0.24, 0.4,  0.2, "triangle");
  }, []);

  return { playSuccess, playBadge };
}
