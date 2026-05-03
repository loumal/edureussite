"use client";
import { useState, useEffect, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

type Op = "+" | "-" | "×" | "÷";

function genQuestion(level: number): { a: number; b: number; op: Op; answer: number } {
  const ops: Op[] = level < 3 ? ["+", "-"] : level < 5 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === "+") { a = Math.floor(Math.random() * (10 * level)) + 1; b = Math.floor(Math.random() * (10 * level)) + 1; answer = a + b; }
  else if (op === "-") { a = Math.floor(Math.random() * (10 * level)) + 1; b = Math.floor(Math.random() * a) + 1; answer = a - b; }
  else if (op === "×") { a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 10) + 2; answer = a * b; }
  else { b = Math.floor(Math.random() * 9) + 2; answer = Math.floor(Math.random() * 9) + 2; a = b * answer; }
  return { a: a!, b: b!, op, answer: answer! };
}

function genChoices(answer: number): number[] {
  const set = new Set([answer]);
  while (set.size < 4) set.add(answer + Math.floor(Math.random() * 10) - 5);
  return [...set].sort(() => Math.random() - 0.5);
}

export function JeuCalculMental({ onScore }: { onScore?: (s: number) => void }) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [question, setQuestion] = useState(() => genQuestion(1));
  const [choices, setChoices] = useState(() => genChoices(genQuestion(1).answer));
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [level, setLevel] = useState(1);

  const nextQ = useCallback((lvl: number) => {
    const q = genQuestion(lvl);
    setQuestion(q);
    setChoices(genChoices(q.answer));
  }, []);

  useEffect(() => {
    if (!started || finished) return;
    const t = setInterval(() => setTimeLeft(prev => {
      if (prev <= 1) { setFinished(true); SFX.lose(); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started, finished]);

  const answer = (choice: number) => {
    if (finished) return;
    if (choice === question.answer) {
      const newCombo = combo + 1;
      const points = 10 + newCombo * 2;
      const newScore = score + points;
      const newLevel = Math.min(7, Math.floor(newScore / 100) + 1);
      setCombo(newCombo);
      setScore(newScore);
      setLevel(newLevel);
      onScore?.(newScore);
      setFlash("correct");
      SFX.correct();
      setTimeout(() => { setFlash(null); nextQ(newLevel); }, 300);
    } else {
      setCombo(0);
      setFlash("wrong");
      SFX.wrong();
      setTimeout(() => setFlash(null), 400);
    }
  };

  const timerPct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 30 ? "#22c55e" : timeLeft > 10 ? "#eab308" : "#ef4444";

  if (!started) return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="text-6xl">🧮</div>
      <h2 className="text-2xl font-black text-white">Calcul Mental</h2>
      <p className="text-white/60 text-sm text-center">Réponds le plus vite possible !<br />Les combos multiplient les points.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-10 py-4 text-white font-black text-lg shadow-lg hover:opacity-90">
        C'est parti ! 🚀
      </button>
    </div>
  );

  if (finished) return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="text-6xl">🏆</div>
      <h2 className="text-2xl font-black text-white">Temps écoulé !</h2>
      <div className="rounded-2xl bg-white/10 px-10 py-6 text-center">
        <p className="text-5xl font-black text-yellow-400">{score}</p>
        <p className="text-white/60 text-sm mt-1">points</p>
      </div>
      <button onClick={() => { setScore(0); setCombo(0); setTimeLeft(60); setLevel(1); setFinished(false); nextQ(1); }} className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-8 py-3 text-white font-black">
        Rejouer
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black text-xl">{score}</span>
          {combo >= 3 && <span className="text-xs font-black text-orange-400 animate-bounce">🔥 ×{combo}</span>}
        </div>
        <span className="text-white/60 text-sm font-bold">Niv. {level}</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-black tabular-nums">{timeLeft}s</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, backgroundColor: timerColor }} />
      </div>

      {/* Question */}
      <div className={`flex items-center justify-center rounded-3xl py-10 transition-all duration-200 ${
        flash === "correct" ? "bg-green-500/30 scale-105" : flash === "wrong" ? "bg-red-500/30 scale-95" : "bg-white/5"
      }`}>
        <p className="text-5xl font-black text-white tabular-nums">
          {question.a} {question.op} {question.b} = ?
        </p>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c, i) => (
          <button key={i} onClick={() => answer(c)}
            className="rounded-2xl bg-gradient-to-br from-blue-600/80 to-purple-600/80 border border-white/10 py-5 text-2xl font-black text-white hover:from-blue-500 hover:to-purple-500 active:scale-95 transition-all">
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
