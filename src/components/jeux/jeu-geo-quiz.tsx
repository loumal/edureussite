"use client";
import { useState, useEffect, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const QUESTIONS = [
  { q: "Quelle est la capitale du Québec ?", a: "Québec", choices: ["Montréal", "Québec", "Laval", "Gatineau"] },
  { q: "Quel est le plus grand pays du monde ?", a: "Russie", choices: ["Canada", "États-Unis", "Russie", "Chine"] },
  { q: "Quel fleuve traverse Paris ?", a: "La Seine", choices: ["La Loire", "Le Rhône", "La Seine", "La Garonne"] },
  { q: "Sur quel continent se trouve l'Égypte ?", a: "Afrique", choices: ["Asie", "Europe", "Afrique", "Amériques"] },
  { q: "Combien de provinces le Canada compte-t-il ?", a: "10", choices: ["8", "10", "12", "13"] },
  { q: "Quelle est la capitale du Canada ?", a: "Ottawa", choices: ["Toronto", "Ottawa", "Montréal", "Vancouver"] },
  { q: "Quel est le plus long fleuve du monde ?", a: "Le Nil", choices: ["L'Amazone", "Le Nil", "Le Mississippi", "Le Yangtsé"] },
  { q: "Dans quel océan se trouve le Japon ?", a: "Pacifique", choices: ["Atlantique", "Indien", "Pacifique", "Arctique"] },
  { q: "Quelle montagne est la plus haute du monde ?", a: "L'Everest", choices: ["Les Andes", "Le Mont Blanc", "L'Everest", "Le Kilimandjaro"] },
  { q: "Quel pays est connu comme le pays du soleil levant ?", a: "Japon", choices: ["Chine", "Corée", "Thaïlande", "Japon"] },
  { q: "Quelle est la capitale de l'Australie ?", a: "Canberra", choices: ["Sydney", "Melbourne", "Canberra", "Brisbane"] },
  { q: "Sur quelle île se trouve Madagascar ?", a: "Madagascar est une île", choices: ["Afrique", "Asie", "Madagascar est une île", "Océanie"] },
  { q: "Quelle mer borde le nord du Canada ?", a: "Mer de Beaufort", choices: ["Mer du Nord", "Mer de Beaufort", "Mer d'Arabie", "Mer des Caraïbes"] },
  { q: "Quelle ville est la plus peuplée du monde ?", a: "Tokyo", choices: ["New York", "Pékin", "Tokyo", "Mumbai"] },
  { q: "Le Saint-Laurent est un…", a: "Fleuve", choices: ["Lac", "Fleuve", "Montagne", "Désert"] },
  { q: "Quelle province canadienne est la plus grande ?", a: "Nunavut", choices: ["Québec", "Ontario", "Colombie-Britannique", "Nunavut"] },
  { q: "Dans quel pays se trouve la Tour de Pise ?", a: "Italie", choices: ["Espagne", "France", "Italie", "Portugal"] },
  { q: "Quel est le désert le plus grand du monde ?", a: "Sahara", choices: ["Gobi", "Sahara", "Atacama", "Kalahari"] },
  { q: "Combien de continents y a-t-il ?", a: "7", choices: ["5", "6", "7", "8"] },
  { q: "Quelle langue parle-t-on au Brésil ?", a: "Portugais", choices: ["Espagnol", "Portugais", "Français", "Anglais"] },
  { q: "Quel pays partage la plus longue frontière avec le Canada ?", a: "États-Unis", choices: ["Mexique", "Russie", "États-Unis", "Groenland"] },
  { q: "Dans quel océan se trouve Cuba ?", a: "Atlantique", choices: ["Pacifique", "Atlantique", "Indien", "Arctique"] },
  { q: "Quelle rivière sépare Montréal ?", a: "Saint-Laurent", choices: ["Ottawa", "Richelieu", "Saint-Laurent", "Saguenay"] },
  { q: "Quelle est la capitale de l'Espagne ?", a: "Madrid", choices: ["Barcelone", "Séville", "Madrid", "Valencia"] },
];

export function JeuGeoQuiz({ onScore }: { onScore?: (s: number) => void }) {
  const [pool] = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);

  const q = pool[idx % pool.length];

  useEffect(() => {
    if (!started || done || selected !== null) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, done, timeLeft, selected]);

  const handleAnswer = useCallback((choice: string | null) => {
    if (selected !== null) return;
    setSelected(choice ?? "");
    setTotal(p => p + 1);
    if (choice === q.a) {
      const pts = 20 + streak * 5 + Math.ceil(timeLeft / 2);
      const ns = score + pts;
      setScore(ns); setStreak(s => s + 1); setCorrect(c => c + 1);
      onScore?.(ns); SFX.correct();
    } else {
      setStreak(0); SFX.wrong();
    }
    setTimeout(() => {
      if (idx + 1 >= pool.length) { setDone(true); SFX.win(); }
      else { setIdx(i => i + 1); setSelected(null); setTimeLeft(20); }
    }, 1200);
  }, [selected, q.a, score, streak, timeLeft, idx, pool.length, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">🌍</div>
      <h2 className="text-2xl font-black text-white">Quiz Géographie</h2>
      <p className="text-white/60 text-sm text-center">{QUESTIONS.length} questions sur le monde et le Canada.<br />Réponds avant la fin du temps !</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 px-10 py-4 text-white font-black text-lg">
        Commencer ! 🗺️
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">{correct === total ? "🏆" : correct > total * 0.7 ? "🌟" : "📚"}</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/70">{correct}/{total} bonnes réponses</p>
      <div className="w-full max-w-xs bg-white/10 rounded-full h-3">
        <div className="h-3 rounded-full bg-green-400" style={{ width: `${(correct / total) * 100}%` }} />
      </div>
      <button onClick={() => { setIdx(0); setScore(0); setStreak(0); setTimeLeft(20); setDone(false); setSelected(null); setTotal(0); setCorrect(0); }}
        className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">Q {idx + 1}/{pool.length}</span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 20) * 100}%`, backgroundColor: timeLeft > 10 ? "#22c55e" : timeLeft > 5 ? "#eab308" : "#ef4444" }} />
          </div>
          <span className="text-white font-black text-sm tabular-nums">{timeLeft}s</span>
        </div>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      <div className="rounded-2xl bg-white/8 border border-white/10 p-5 min-h-[80px] flex items-center justify-center">
        <p className="text-white font-bold text-center text-base leading-snug">{q.q}</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {q.choices.map((c, i) => {
          let style = "bg-white/8 border-white/10 text-white hover:bg-white/15";
          if (selected !== null) {
            if (c === q.a) style = "bg-green-500/40 border-green-400 text-white";
            else if (c === selected) style = "bg-red-500/40 border-red-400 text-white";
            else style = "bg-white/5 border-white/5 text-white/30";
          }
          return (
            <button key={i} onClick={() => handleAnswer(c)} disabled={selected !== null}
              className={`rounded-xl border px-4 py-3.5 text-sm font-semibold text-left transition-all active:scale-98 ${style}`}>
              <span className="text-white/40 mr-2 font-bold">{["A","B","C","D"][i]}</span> {c}
            </button>
          );
        })}
      </div>
      {streak >= 3 && <p className="text-center text-orange-400 text-xs font-bold animate-pulse">🔥 Série de {streak} !</p>}
    </div>
  );
}
