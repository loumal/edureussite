"use client";
import { useState, useEffect, useRef } from "react";
import { SFX } from "@/lib/jeux/sounds";

interface Question {
  q: string;
  options: [string, string, string, string];
  correct: number;
  categorie: string;
}

interface EtatQD {
  questions: Question[];
  qIndex: number;
  debutQ: number;
  reponses: Record<string, { rep: number; ms: number }>;
  scores: Record<string, number>;
  fini: boolean;
}

interface Props {
  joueurs: { eleveId: string; prenom: string; score: number }[];
  etat: EtatQD;
  monEleveId: string;
  onCoup: (coup: { rep: number }) => void;
  loading: boolean;
}

const CAT_COLORS: Record<string, string> = {
  maths: "#6366f1",
  francais: "#ec4899",
  sciences: "#10b981",
  culture: "#f59e0b",
  quebec: "#3b82f6",
};
const CAT_LABELS: Record<string, string> = {
  maths: "🔢 Maths", francais: "📚 Français", sciences: "🔬 Sciences",
  culture: "🌍 Culture", quebec: "🍁 Québec",
};

const TIMER_S = 15;

export function JeuQuizDuel({ joueurs, etat, monEleveId, onCoup, loading }: Props) {
  const [timeLeft, setTimeLeft] = useState(TIMER_S);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [scoreAnim, setScoreAnim] = useState<Record<string, number>>({});
  const prevQIndex = useRef(etat.qIndex);
  const prevScores = useRef(etat.scores);

  const q = etat.questions[etat.qIndex];
  const allAnswered = joueurs.every(j => etat.reponses[j.eleveId] !== undefined);
  const myReponse = etat.reponses[monEleveId];

  // Timer
  useEffect(() => {
    setMyAnswer(null);
    setRevealed(false);
    const start = etat.debutQ;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, TIMER_S - elapsed);
      setTimeLeft(left);
      if (left <= 3 && left > 0) SFX.tick();
      if (left <= 0) clearInterval(tick);
    }, 200);
    return () => clearInterval(tick);
  }, [etat.qIndex, etat.debutQ]);

  // Reveal answers when all answered or time up
  useEffect(() => {
    if (allAnswered || timeLeft <= 0) {
      setTimeout(() => setRevealed(true), 300);
    }
  }, [allAnswered, timeLeft]);

  // Score pop animation
  useEffect(() => {
    const diffs: Record<string, number> = {};
    for (const j of joueurs) {
      const prev = prevScores.current[j.eleveId] ?? 0;
      const curr = etat.scores[j.eleveId] ?? 0;
      if (curr > prev) diffs[j.eleveId] = curr - prev;
    }
    if (Object.keys(diffs).length) {
      setScoreAnim(diffs);
      setTimeout(() => setScoreAnim({}), 1500);
    }
    prevScores.current = etat.scores;
  }, [etat.scores]);

  // Sound on reveal
  useEffect(() => {
    if (revealed && myReponse) {
      myReponse.rep === q?.correct ? SFX.correct() : SFX.wrong();
    }
  }, [revealed]);

  const handleAnswer = (idx: number) => {
    if (myAnswer !== null || loading || timeLeft <= 0) return;
    setMyAnswer(idx);
    SFX.select();
    onCoup({ rep: idx });
  };

  const pct = (timeLeft / TIMER_S) * 100;
  const radius = 22;
  const circ = 2 * Math.PI * radius;

  if (etat.fini) {
    const sorted = [...joueurs].sort((a, b) => (etat.scores[b.eleveId] ?? 0) - (etat.scores[a.eleveId] ?? 0));
    const winner = sorted[0];
    const iWin = winner.eleveId === monEleveId;
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <div className="text-center">
          <p className="text-7xl mb-3">{iWin ? "🏆" : "🎖️"}</p>
          <h2 className="text-3xl font-black text-white mb-1">{iWin ? "Tu gagnes !" : `${winner.prenom} gagne !`}</h2>
          <p className="text-white/50 text-sm">{etat.questions.length} questions répondues</p>
        </div>
        <div className="w-full max-w-xs space-y-3">
          {sorted.map((j, i) => (
            <div key={j.eleveId} className={`rounded-2xl px-5 py-3 flex items-center justify-between ${i === 0 ? "bg-yellow-500/20 ring-2 ring-yellow-400/50" : "bg-white/5"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{i === 0 ? "🥇" : "🥈"}</span>
                <span className="font-bold text-white">{j.prenom}</span>
                {j.eleveId === monEleveId && <span className="text-xs text-white/40">(toi)</span>}
              </div>
              <span className="font-black text-yellow-300 text-xl">{etat.scores[j.eleveId] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto px-2">
      {/* Scoreboard */}
      <div className="flex gap-3 w-full">
        {joueurs.map(j => (
          <div key={j.eleveId} className="flex-1 rounded-2xl px-3 py-2 text-center bg-white/5 border border-white/10 relative overflow-hidden">
            <p className="text-xs font-bold text-white/60">{j.prenom}{j.eleveId === monEleveId ? " (toi)" : ""}</p>
            <p className="text-2xl font-black text-yellow-300">{etat.scores[j.eleveId] ?? 0}</p>
            {scoreAnim[j.eleveId] && (
              <span className="absolute top-0 right-2 text-green-400 font-black text-sm animate-bounce pointer-events-none">
                +{scoreAnim[j.eleveId]}
              </span>
            )}
            {etat.reponses[j.eleveId] && !revealed && (
              <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Question counter + timer */}
      <div className="flex items-center gap-4 w-full justify-between px-1">
        <span className="text-xs text-white/40 font-semibold">
          Question {etat.qIndex + 1} / {etat.questions.length}
        </span>
        <div className="flex items-center gap-2">
          <svg width={54} height={54} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={27} cy={27} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={4} />
            <circle cx={27} cy={27} r={radius} fill="none"
              stroke={timeLeft < 5 ? "#ef4444" : timeLeft < 10 ? "#f59e0b" : "#22c55e"}
              strokeWidth={4}
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.2s linear, stroke 0.5s" }}
            />
            <text x={27} y={27} textAnchor="middle" dominantBaseline="central"
              style={{ fill: "white", fontSize: 13, fontWeight: 900, transform: "rotate(90deg)", transformOrigin: "27px 27px" }}>
              {Math.ceil(timeLeft)}
            </text>
          </svg>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: CAT_COLORS[q?.categorie] + "33", color: CAT_COLORS[q?.categorie] }}>
            {CAT_LABELS[q?.categorie] ?? q?.categorie}
          </span>
        </div>
      </div>

      {/* Question card */}
      <div className="w-full rounded-2xl p-5 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(30,27,75,0.9), rgba(15,23,42,0.95))",
          border: `1px solid ${CAT_COLORS[q?.categorie] ?? "#6366f1"}44`,
          boxShadow: `0 0 40px ${CAT_COLORS[q?.categorie] ?? "#6366f1"}22`,
        }}>
        <p className="text-lg font-black text-white leading-snug">{q?.q}</p>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {q?.options.map((opt, i) => {
          const chosen = myAnswer === i;
          const isCorrect = revealed && i === q.correct;
          const isWrong = revealed && chosen && i !== q.correct;
          const othersChose = revealed && joueurs.some(j => j.eleveId !== monEleveId && etat.reponses[j.eleveId]?.rep === i);

          return (
            <button key={i} onClick={() => handleAnswer(i)}
              disabled={myAnswer !== null || timeLeft <= 0}
              className="rounded-2xl px-3 py-3 text-sm font-bold text-left transition-all duration-300"
              style={{
                background: isCorrect
                  ? "linear-gradient(135deg, #16a34a, #15803d)"
                  : isWrong
                  ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                  : chosen && !revealed
                  ? "linear-gradient(135deg, #4f46e5, #4338ca)"
                  : "rgba(255,255,255,0.07)",
                border: isCorrect ? "2px solid #4ade80"
                  : isWrong ? "2px solid #f87171"
                  : chosen && !revealed ? "2px solid #818cf8"
                  : "2px solid transparent",
                transform: chosen ? "scale(1.02)" : "scale(1)",
                boxShadow: isCorrect ? "0 0 20px rgba(74,222,128,0.4)"
                  : isWrong ? "0 0 20px rgba(248,113,113,0.4)"
                  : "none",
              }}>
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  {["A","B","C","D"][i]}
                </span>
                {opt}
                {othersChose && <span className="ml-auto text-xs opacity-70">👤</span>}
                {isCorrect && <span className="ml-auto">✓</span>}
              </span>
            </button>
          );
        })}
      </div>

      {myAnswer !== null && !allAnswered && !revealed && (
        <p className="text-white/40 text-xs animate-pulse">⏳ En attente des autres joueurs...</p>
      )}
    </div>
  );
}
