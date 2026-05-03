"use client";
import { useState, useCallback, useEffect, useRef } from "react";

const COLORS = [
  { id: 0, bg: "#22c55e", active: "#86efac", label: "Vert",  key: "1" },
  { id: 1, bg: "#ef4444", active: "#fca5a5", label: "Rouge", key: "2" },
  { id: 2, bg: "#facc15", active: "#fef08a", label: "Jaune", key: "3" },
  { id: 3, bg: "#3b82f6", active: "#93c5fd", label: "Bleu",  key: "4" },
];

const FREQ = [261.63, 329.63, 392.00, 523.25];

export function JeuSimon({ onScore }: { onScore?: (s: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "showing" | "player" | "win" | "lose">("idle");
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(700);
  const audioCtx = useRef<AudioContext | null>(null);

  const playBeep = useCallback((id: number) => {
    if (!audioCtx.current) audioCtx.current = new AudioContext();
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = FREQ[id]; osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  }, []);

  const showSequence = useCallback((seq: number[], spd: number) => {
    setPhase("showing");
    seq.forEach((id, i) => {
      setTimeout(() => {
        setActive(id); playBeep(id);
        setTimeout(() => setActive(null), spd * 0.6);
        if (i === seq.length - 1) setTimeout(() => setPhase("player"), spd * 0.8 + 100);
      }, i * spd);
    });
  }, [playBeep]);

  const startRound = useCallback((seq: number[], spd: number) => {
    const newSeq = [...seq, Math.floor(Math.random() * 4)];
    setSequence(newSeq); setPlayerSeq([]);
    setTimeout(() => showSequence(newSeq, spd), 600);
  }, [showSequence]);

  const handlePress = useCallback((id: number) => {
    if (phase !== "player") return;
    playBeep(id); setActive(id); setTimeout(() => setActive(null), 200);
    const newPlayer = [...playerSeq, id];
    const idx = newPlayer.length - 1;

    if (newPlayer[idx] !== sequence[idx]) {
      setPhase("lose"); onScore?.(score);
      return;
    }
    setPlayerSeq(newPlayer);
    if (newPlayer.length === sequence.length) {
      const ns = score + sequence.length * 10;
      setScore(ns); onScore?.(ns);
      const newSpeed = Math.max(300, speed - 30);
      setSpeed(newSpeed);
      setPhase("win");
      setTimeout(() => startRound(sequence, newSpeed), 1000);
    }
  }, [phase, playerSeq, sequence, score, speed, playBeep, onScore, startRound]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = COLORS.find(c => c.key === e.key);
      if (c) handlePress(c.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePress]);

  const reset = () => { setSequence([]); setPlayerSeq([]); setPhase("idle"); setScore(0); setSpeed(700); setActive(null); };

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <div className="flex items-center gap-6">
        <div className="text-center"><p className="text-xs text-white/50">Score</p><p className="text-2xl font-black text-white">{score}</p></div>
        <div className="text-center"><p className="text-xs text-white/50">Séquence</p><p className="text-2xl font-black text-white">{sequence.length}</p></div>
      </div>

      {/* Simon board */}
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full bg-slate-800 border-4 border-slate-700" />
        {/* 4 quadrants */}
        {COLORS.map((c, i) => {
          const positions = [
            "top-2 left-2 rounded-tl-[100px] rounded-br-none",
            "top-2 right-2 rounded-tr-[100px] rounded-bl-none",
            "bottom-2 left-2 rounded-bl-[100px] rounded-tr-none",
            "bottom-2 right-2 rounded-br-[100px] rounded-tl-none",
          ];
          const isActive = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handlePress(c.id)}
              className={`absolute w-[118px] h-[118px] transition-all duration-100 ${positions[i]}`}
              style={{
                background: isActive ? c.active : c.bg,
                filter: isActive ? `brightness(1.5) drop-shadow(0 0 12px ${c.active})` : "brightness(0.8)",
                transform: isActive ? "scale(1.03)" : "scale(1)",
              }}
            />
          );
        })}
        {/* Center button */}
        <div className="absolute inset-[30%] rounded-full bg-slate-900 border-4 border-slate-700 flex items-center justify-center z-10">
          {phase === "idle" || phase === "lose" ? (
            <button onClick={() => phase === "idle" ? startRound([], speed) : (reset(), setTimeout(() => startRound([], 700), 100))}
              className="w-full h-full rounded-full flex items-center justify-center font-black text-white text-xs">
              {phase === "lose" ? "↺" : "▶"}
            </button>
          ) : (
            <div className="text-white/50 text-xs font-bold text-center">
              {phase === "showing" ? "👀" : phase === "player" ? "🎯" : "✓"}
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-sm font-semibold">
        {phase === "idle" && (
          <div className="space-y-2">
            <p className="text-white font-black">Simon dit…</p>
            <div className="text-white/50 text-xs space-y-0.5">
              <p>👀 Regarde la séquence de couleurs</p>
              <p>🎯 Répète-la dans le même ordre</p>
              <p>⬆️ La séquence s&apos;allonge à chaque tour</p>
            </div>
          </div>
        )}
        {phase === "showing" && <p className="text-white font-bold">👀 Mémorise la séquence…</p>}
        {phase === "player" && <p className="text-green-400 font-bold">🎯 À toi ! Répète la séquence ({playerSeq.length}/{sequence.length})</p>}
        {phase === "win" && <p className="text-yellow-400 font-bold">✓ Parfait ! Niveau suivant…</p>}
        {phase === "lose" && (
          <div className="space-y-1">
            <p className="text-red-400 font-black text-lg">Erreur ! 😅</p>
            <p className="text-white/60 text-xs">Séquence: {sequence.length} · Score: {score}</p>
            <button onClick={() => { reset(); setTimeout(() => startRound([], 700), 100); }}
              className="mt-2 rounded-xl bg-slate-600 text-white px-4 py-1.5 text-sm font-bold">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Touches 1 2 3 4 sur clavier · ou clique les couleurs</p>
    </div>
  );
}
