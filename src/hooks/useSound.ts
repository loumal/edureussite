"use client";

import { useCallback, useRef } from "react";

// Sons générés par synthèse Web Audio — aucun fichier externe requis
type SoundType = "correct" | "perfect" | "levelup" | "badge" | "milestone" | "bouclier" | "mission";

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.3,
  startTime = 0
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
}

const SOUND_PLAYERS: Record<SoundType, (ctx: AudioContext) => void> = {
  correct: (ctx) => {
    playTone(ctx, 523, 0.12, "sine", 0.25, 0);
    playTone(ctx, 659, 0.15, "sine", 0.25, 0.1);
  },
  perfect: (ctx) => {
    playTone(ctx, 523, 0.1, "sine", 0.3, 0);
    playTone(ctx, 659, 0.1, "sine", 0.3, 0.1);
    playTone(ctx, 784, 0.1, "sine", 0.3, 0.2);
    playTone(ctx, 1047, 0.25, "sine", 0.35, 0.3);
  },
  levelup: (ctx) => {
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((freq, i) => {
      playTone(ctx, freq, 0.15, "sine", 0.28, i * 0.07);
    });
  },
  badge: (ctx) => {
    playTone(ctx, 880, 0.1, "sine", 0.3, 0);
    playTone(ctx, 1109, 0.1, "sine", 0.3, 0.12);
    playTone(ctx, 1319, 0.2, "sine", 0.35, 0.24);
  },
  milestone: (ctx) => {
    playTone(ctx, 392, 0.1, "triangle", 0.3, 0);
    playTone(ctx, 523, 0.1, "triangle", 0.3, 0.1);
    playTone(ctx, 659, 0.1, "triangle", 0.3, 0.2);
    playTone(ctx, 784, 0.3, "triangle", 0.35, 0.3);
  },
  bouclier: (ctx) => {
    playTone(ctx, 440, 0.08, "square", 0.15, 0);
    playTone(ctx, 554, 0.15, "sine", 0.25, 0.1);
  },
  mission: (ctx) => {
    playTone(ctx, 659, 0.1, "sine", 0.28, 0);
    playTone(ctx, 784, 0.1, "sine", 0.28, 0.12);
    playTone(ctx, 988, 0.1, "sine", 0.28, 0.24);
    playTone(ctx, 1319, 0.25, "sine", 0.32, 0.36);
  },
};

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((type: SoundType) => {
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().then(() => SOUND_PLAYERS[type]?.(ctx)).catch(() => {});
      } else {
        SOUND_PLAYERS[type]?.(ctx);
      }
    } catch {
      // Web Audio non supporté — silencieux
    }
  }, []);

  return { play };
}
