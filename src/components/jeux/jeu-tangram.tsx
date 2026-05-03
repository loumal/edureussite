"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

// Shape matching game - identify the correct shadow shape
const SHAPES = [
  { name: "Maison", emoji: "🏠", desc: "Un carré avec un triangle dessus", options: ["🏠","🌟","🎭","🔷"], answer: "🏠" },
  { name: "Étoile", emoji: "⭐", desc: "5 pointes rayonnantes autour du centre", options: ["🔷","⭐","🔸","🔺"], answer: "⭐" },
  { name: "Flèche", emoji: "➡️", desc: "Un rectangle avec une pointe à droite", options: ["➡️","⬆️","↪️","↗️"], answer: "➡️" },
  { name: "Cœur", emoji: "❤️", desc: "Deux demi-cercles sur un triangle inversé", options: ["🔴","❤️","💗","🫀"], answer: "❤️" },
  { name: "Losange", emoji: "🔷", desc: "Un carré incliné à 45°", options: ["🔷","🟦","🔹","🔵"], answer: "🔷" },
  { name: "Lune", emoji: "🌙", desc: "Un croissant, partie d'un cercle", options: ["🌙","☀️","🌟","🌑"], answer: "🌙" },
  { name: "Tortue", emoji: "🐢", desc: "Une carapace ronde avec 4 pattes", options: ["🐢","🐊","🦎","🐸"], answer: "🐢" },
  { name: "Arbre", emoji: "🌲", desc: "Un triangle posé sur un rectangle", options: ["🌲","🌴","🍁","🌵"], answer: "🌲" },
  { name: "Bateau", emoji: "⛵", desc: "Un triangle (voile) sur un demi-cercle", options: ["⛵","🚢","🛥️","⚓"], answer: "⛵" },
  { name: "Papillon", emoji: "🦋", desc: "Deux triangles symétriques touchant un point", options: ["🦋","🐝","🐛","🦗"], answer: "🦋" },
];

function shuffle<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5); }

export function JeuTangram({ onScore }: { onScore?: (s: number) => void }) {
  const [pool] = useState(() => shuffle(SHAPES));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);

  const q = pool[idx % pool.length];

  const pick = useCallback((opt: string) => {
    if (flash !== null) return;
    if (opt === q.answer) {
      const pts = 25; const ns = score + pts;
      setScore(ns); setCorrect(c => c + 1); onScore?.(ns); SFX.correct();
      setFlash("correct");
    } else {
      const nl = lives - 1; setLives(nl); SFX.wrong();
      setFlash("wrong");
      if (nl <= 0) { setTimeout(() => { setDone(true); SFX.lose(); }, 800); return; }
    }
    setTimeout(() => {
      setFlash(null);
      if (idx + 1 >= pool.length) { setDone(true); SFX.win(); }
      else setIdx(i => i + 1);
    }, 800);
  }, [flash, q, score, lives, idx, pool.length, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">🔺</div>
      <h2 className="text-2xl font-black text-white">Tangram Formes</h2>
      <p className="text-white/60 text-sm text-center">Identifie la forme décrite !<br />Développe ta pensée géométrique.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-10 py-4 text-white font-black text-lg">
        Jouer ! 🔺
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🎉</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/70">{correct} bonnes réponses</p>
      <button onClick={() => { setIdx(0); setScore(0); setLives(3); setDone(false); setFlash(null); setCorrect(0); }}
        className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 px-2">
      <div className="flex justify-between items-center">
        <span>{"❤️".repeat(lives)}{"🖤".repeat(3-lives)}</span>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      {/* Shape shadow display */}
      <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl py-8 transition-all ${
        flash === "correct" ? "bg-green-500/20" : flash === "wrong" ? "bg-red-500/20" : "bg-white/5"
      }`}>
        <div className="text-8xl">{q.emoji}</div>
        <p className="text-white font-bold text-center px-4">{q.desc}</p>
        <p className="text-white/40 text-xs">Quelle forme est-ce ?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => pick(opt)} disabled={flash !== null}
            className={`flex items-center justify-center gap-3 rounded-2xl border py-4 text-3xl transition-all active:scale-95 ${
              flash === "correct" && opt === q.answer ? "border-green-400 bg-green-500/30" :
              flash === "wrong" && opt === q.answer ? "border-green-400 bg-green-500/20" :
              flash === "wrong" && opt !== q.answer ? "border-white/5 opacity-30" :
              "border-white/20 bg-white/8 hover:bg-white/15"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
