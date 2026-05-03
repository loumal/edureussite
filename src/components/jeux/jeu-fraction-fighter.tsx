"use client";
import { useState, useEffect, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }

function genPair() {
  const d1 = Math.floor(Math.random() * 6) + 2;
  const n1 = Math.floor(Math.random() * (d1 - 1)) + 1;
  let d2 = Math.floor(Math.random() * 6) + 2;
  let n2 = Math.floor(Math.random() * (d2 - 1)) + 1;
  while (n1 * d2 === n2 * d1) { d2 = Math.floor(Math.random() * 6) + 2; n2 = Math.floor(Math.random() * (d2 - 1)) + 1; }
  const leftBigger = n1 * d2 > n2 * d1;
  return { n1, d1, n2, d2, leftBigger };
}

function Fraction({ n, d, highlight }: { n: number; d: number; highlight?: "correct" | "wrong" }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl px-6 py-4 border-2 transition-all ${
      highlight === "correct" ? "bg-green-500/30 border-green-400 scale-110" :
      highlight === "wrong" ? "bg-red-500/30 border-red-400" : "bg-white/10 border-white/20"}`}>
      <span className="text-3xl font-black text-white">{n}</span>
      <div className="w-10 h-0.5 bg-white/60 my-1" />
      <span className="text-3xl font-black text-white">{d}</span>
    </div>
  );
}

export function JeuFractionFighter({ onScore }: { onScore?: (s: number) => void }) {
  const [pair, setPair] = useState(genPair);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<{ left?: "correct" | "wrong"; right?: "correct" | "wrong" } | null>(null);
  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!started || done || feedback) return;
    if (timeLeft <= 0) { handlePick(null); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, done, timeLeft, feedback]);

  const handlePick = useCallback((side: "left" | "right" | null) => {
    if (feedback) return;
    const correct = side === "left" ? pair.leftBigger : side === "right" ? !pair.leftBigger : false;
    if (correct) {
      const pts = 20 + Math.ceil(timeLeft * 2);
      const ns = score + pts; setScore(ns); onScore?.(ns); SFX.correct();
      setFeedback({ [side!]: "correct" });
    } else {
      const nl = lives - 1; setLives(nl); SFX.wrong();
      setFeedback({ left: pair.leftBigger ? "correct" : "wrong", right: !pair.leftBigger ? "correct" : "wrong" });
      if (nl <= 0) { setTimeout(() => { setDone(true); SFX.lose(); }, 800); return; }
    }
    setTimeout(() => { setFeedback(null); setPair(genPair()); setTimeLeft(15); setRound(r => r + 1); }, 900);
  }, [feedback, pair, score, lives, timeLeft, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">⚔️</div>
      <h2 className="text-2xl font-black text-white">Fraction Fighter</h2>
      <p className="text-white/60 text-sm text-center">Clique sur la plus grande fraction !<br />Tu as 3 vies. Sois rapide pour plus de points.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-400 px-10 py-4 text-white font-black text-lg">
        Combattre ! ⚔️
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">💀</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/60">{round - 1} fractions comparées</p>
      <button onClick={() => { setScore(0); setLives(3); setTimeLeft(15); setDone(false); setFeedback(null); setRound(1); setPair(genPair()); }}
        className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 px-2">
      <div className="flex items-center justify-between">
        <span>{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 15) * 100}%`, backgroundColor: timeLeft > 8 ? "#22c55e" : timeLeft > 4 ? "#eab308" : "#ef4444" }} />
          </div>
          <span className="text-white font-black text-sm">{timeLeft}s</span>
        </div>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      <p className="text-center text-white/70 font-bold">Quelle fraction est la plus grande ?</p>

      <div className="flex items-center justify-around gap-4">
        <button onClick={() => handlePick("left")} disabled={!!feedback} className="flex-1 flex justify-center active:scale-95 transition-all">
          <Fraction n={pair.n1} d={pair.d1} highlight={feedback?.left} />
        </button>

        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl text-white/40">VS</span>
          <span className="text-xs text-white/30">Tour {round}</span>
        </div>

        <button onClick={() => handlePick("right")} disabled={!!feedback} className="flex-1 flex justify-center active:scale-95 transition-all">
          <Fraction n={pair.n2} d={pair.d2} highlight={feedback?.right} />
        </button>
      </div>

      <p className="text-center text-white/40 text-xs">Touche la plus grande fraction</p>
    </div>
  );
}
