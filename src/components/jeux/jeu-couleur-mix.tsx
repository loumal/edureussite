"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

type RGB = [number, number, number];

const COULEURS: { nom: string; rgb: RGB; emoji: string }[] = [
  { nom: "Rouge", rgb: [220, 50, 50], emoji: "🔴" },
  { nom: "Bleu", rgb: [50, 100, 220], emoji: "🔵" },
  { nom: "Jaune", rgb: [240, 200, 20], emoji: "🟡" },
  { nom: "Blanc", rgb: [240, 240, 240], emoji: "⚪" },
  { nom: "Noir", rgb: [30, 30, 30], emoji: "⚫" },
];

const MELANGES: { c1: string; c2: string; resultat: string; explication: string }[] = [
  { c1: "Rouge", c2: "Bleu", resultat: "Violet", explication: "Rouge + Bleu = Violet 🟣" },
  { c1: "Rouge", c2: "Jaune", resultat: "Orange", explication: "Rouge + Jaune = Orange 🟠" },
  { c1: "Bleu", c2: "Jaune", resultat: "Vert", explication: "Bleu + Jaune = Vert 🟢" },
  { c1: "Rouge", c2: "Blanc", resultat: "Rose", explication: "Rouge + Blanc = Rose 🌸" },
  { c1: "Bleu", c2: "Blanc", resultat: "Bleu clair", explication: "Bleu + Blanc = Bleu clair 🩵" },
  { c1: "Jaune", c2: "Blanc", resultat: "Crème", explication: "Jaune + Blanc = Crème 🌕" },
  { c1: "Rouge", c2: "Noir", resultat: "Bordeaux", explication: "Rouge + Noir = Bordeaux 🍷" },
  { c1: "Bleu", c2: "Noir", resultat: "Marine", explication: "Bleu + Noir = Bleu marine 🌊" },
  { c1: "Jaune", c2: "Noir", resultat: "Kaki", explication: "Jaune + Noir = Kaki 🌿" },
  { c1: "Rouge", c2: "Bleu", resultat: "Violet", explication: "Rouge + Bleu = Violet 🟣" },
];

const RESULTATS_CHOICES: Record<string, string[]> = {
  "Violet": ["Violet", "Orange", "Vert", "Marron"],
  "Orange": ["Orange", "Violet", "Rose", "Vert"],
  "Vert": ["Vert", "Violet", "Orange", "Turquoise"],
  "Rose": ["Rose", "Violet", "Orange", "Rouge clair"],
  "Bleu clair": ["Bleu clair", "Cyan", "Turquoise", "Violet clair"],
  "Crème": ["Crème", "Beige", "Rose pâle", "Jaune pâle"],
  "Bordeaux": ["Bordeaux", "Violet foncé", "Brun", "Rouge foncé"],
  "Marine": ["Marine", "Indigo", "Bleu foncé", "Violet foncé"],
  "Kaki": ["Kaki", "Marron", "Olive", "Vert foncé"],
};

const RESULT_COLORS: Record<string, string> = {
  "Violet": "#7c3aed", "Orange": "#ea580c", "Vert": "#16a34a",
  "Rose": "#ec4899", "Bleu clair": "#38bdf8", "Crème": "#fef3c7",
  "Bordeaux": "#881337", "Marine": "#1e3a5f", "Kaki": "#65a30d",
};

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

export function JeuCouleurMix({ onScore }: { onScore?: (s: number) => void }) {
  const [pool] = useState(() => shuffle(MELANGES));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [mixing, setMixing] = useState(false);

  const m = pool[idx % pool.length];
  const c1 = COULEURS.find(c => c.nom === m.c1)!;
  const c2 = COULEURS.find(c => c.nom === m.c2)!;
  const choices = shuffle(RESULTATS_CHOICES[m.resultat] ?? [m.resultat, "Orange", "Vert", "Rose"]);

  const pick = useCallback((choice: string) => {
    if (selected || !started) return;
    setSelected(choice);
    setMixing(true);
    setTotal(t => t + 1);
    if (choice === m.resultat) {
      const pts = 20; const ns = score + pts;
      setScore(ns); setCorrect(c => c + 1); onScore?.(ns); SFX.correct();
    } else {
      SFX.wrong();
    }
    setTimeout(() => {
      setMixing(false);
      if (idx + 1 >= pool.length) { setDone(true); SFX.win(); }
      else { setIdx(i => i + 1); setSelected(null); }
    }, 1400);
  }, [selected, started, m, score, idx, pool.length, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">🎨</div>
      <h2 className="text-2xl font-black text-white">Mélange de Couleurs</h2>
      <p className="text-white/60 text-sm text-center">Apprends la science des couleurs !<br />Trouve le résultat du mélange.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-400 px-10 py-4 text-white font-black text-lg">
        Mélanger ! 🎨
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🎨</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/70">{correct}/{total} bonnes réponses</p>
      <button onClick={() => { setIdx(0); setScore(0); setDone(false); setSelected(null); setTotal(0); setCorrect(0); }}
        className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  const resultColor = RESULT_COLORS[m.resultat] ?? "#888";

  return (
    <div className="flex flex-col gap-5 px-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50">Q {idx + 1}/{pool.length}</span>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      {/* Mixing visual */}
      <div className="flex items-center justify-center gap-4 py-6 rounded-2xl bg-white/5">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center text-3xl"
            style={{ backgroundColor: `rgb(${c1.rgb.join(",")})` }}>{c1.emoji}</div>
          <span className="text-white/70 text-xs font-bold">{c1.nom}</span>
        </div>
        <span className="text-white text-2xl font-black">+</span>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center text-3xl"
            style={{ backgroundColor: `rgb(${c2.rgb.join(",")})` }}>{c2.emoji}</div>
          <span className="text-white/70 text-xs font-bold">{c2.nom}</span>
        </div>
        <span className="text-white text-2xl font-black">=</span>
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-full border-4 border-white/20 transition-all duration-700 ${mixing ? "scale-110" : ""}`}
            style={{ backgroundColor: selected === m.resultat || (selected && selected !== m.resultat) ? resultColor : "rgba(255,255,255,0.1)" }}>
          </div>
          <span className="text-white/40 text-xs font-bold">?</span>
        </div>
      </div>

      {selected && (
        <p className={`text-center text-sm font-bold rounded-xl py-2 ${selected === m.resultat ? "text-green-400 bg-green-500/20" : "text-red-400 bg-red-500/20"}`}>
          {selected === m.resultat ? "✅ " : "❌ "}{m.explication}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {choices.map((c, i) => {
          const col = RESULT_COLORS[c] ?? "#666";
          let cls = "border-white/20 bg-white/8 text-white hover:bg-white/15";
          if (selected) {
            if (c === m.resultat) cls = "border-green-400 bg-green-500/20 text-white";
            else if (c === selected) cls = "border-red-400 bg-red-500/20 text-white/50";
            else cls = "border-white/5 bg-white/5 text-white/30";
          }
          return (
            <button key={i} onClick={() => pick(c)} disabled={!!selected}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all active:scale-95 ${cls}`}>
              <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
              <span className="text-sm font-semibold">{c}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
