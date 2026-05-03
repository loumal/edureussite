"use client";
import { useState, useEffect, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const TABLES = [2,3,4,5,6,7,8,9,10,11,12];

function gen() {
  const a = TABLES[Math.floor(Math.random() * TABLES.length)];
  const b = Math.floor(Math.random() * 10) + 1;
  return { a, b, answer: a * b };
}

function choices(ans: number) {
  const s = new Set([ans]);
  const variants = [ans - 1, ans + 1, ans - ans % 10, ans + (10 - ans % 10) % 10, ans * 2, Math.floor(ans / 2)];
  variants.forEach(v => { if (v > 0 && v !== ans && s.size < 4) s.add(v); });
  while (s.size < 4) s.add(ans + Math.floor(Math.random() * 20) - 10);
  return [...s].sort(() => Math.random() - 0.5);
}

export function JeuMultiplication({ onScore }: { onScore?: (s: number) => void }) {
  const [q, setQ] = useState(gen);
  const [opts, setOpts] = useState(() => choices(gen().answer));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState<"ok" | "ko" | null>(null);

  const next = useCallback(() => {
    const nq = gen();
    setQ(nq);
    setOpts(choices(nq.answer));
  }, []);

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { setDone(true); SFX.lose(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  const pick = (c: number) => {
    if (done) return;
    if (c === q.answer) {
      const ns = streak + 1;
      const pts = 15 + ns * 5;
      const ns2 = score + pts;
      setStreak(ns); setScore(ns2); setBest(b => Math.max(b, ns));
      onScore?.(ns2); SFX.correct();
      setFlash("ok"); setTimeout(() => { setFlash(null); next(); }, 250);
    } else {
      setStreak(0); SFX.wrong();
      setFlash("ko"); setTimeout(() => setFlash(null), 350);
    }
  };

  const stars = streak >= 10 ? "⭐⭐⭐" : streak >= 5 ? "⭐⭐" : streak >= 3 ? "⭐" : "";

  if (!started) return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="text-6xl">✖️</div>
      <h2 className="text-2xl font-black text-white">Tables de Multiplication</h2>
      <p className="text-white/60 text-sm text-center max-w-xs">Retrouve le bon résultat le plus vite possible ! Les séries de bonnes réponses donnent plus de points.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-10 py-4 text-white font-black text-lg">
        Commencer ! 🎯
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🏆</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/60 text-sm">Meilleure série : {best} 🔥</p>
      <button onClick={() => { setScore(0); setStreak(0); setBest(0); setTimeLeft(90); setDone(false); next(); }}
        className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex items-center justify-between">
        <span className="text-yellow-400 font-black text-xl">{score} pts</span>
        {stars && <span className="text-base animate-bounce">{stars}</span>}
        <span className="text-white font-black">{timeLeft}s</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-400 transition-all duration-1000" style={{ width: `${(timeLeft / 90) * 100}%` }} />
      </div>

      <div className={`flex flex-col items-center justify-center rounded-3xl py-10 transition-all duration-200 ${
        flash === "ok" ? "bg-green-500/30 scale-105" : flash === "ko" ? "bg-red-500/30 scale-95" : "bg-white/5"
      }`}>
        <p className="text-white/50 text-sm font-bold mb-1">Combien font ?</p>
        <p className="text-5xl font-black text-white">{q.a} × {q.b}</p>
        {streak >= 3 && <p className="text-orange-400 text-xs font-bold mt-2">🔥 Série de {streak} !</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {opts.map((c, i) => (
          <button key={i} onClick={() => pick(c)}
            className="rounded-2xl bg-gradient-to-br from-emerald-600/80 to-teal-600/80 border border-white/10 py-5 text-3xl font-black text-white hover:opacity-90 active:scale-95 transition-all">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
