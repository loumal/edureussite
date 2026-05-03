"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const MOTS = [
  "chat","chien","maison","école","soleil","lune","étoile","livre","crayon","arbre",
  "voiture","bateau","avion","fusée","pizza","gâteau","pomme","banane","rouge","bleu",
  "grand","petit","vite","lent","chaud","froid","beau","bon","ami","famille",
  "musique","danse","sport","jeux","mathématiques","science","histoire","géographie",
  "printemps","automne","hiver","été","pluie","neige","vent","nuage","arc-en-ciel",
  "dragon","licorne","robot","planète","aventure","trésor","magie","château","forêt",
];

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

export function JeuTypingSpeed({ onScore }: { onScore?: (s: number) => void }) {
  const [words] = useState(() => shuffle(MOTS));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [typed, setTyped] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = words[idx % words.length];

  useEffect(() => {
    if (!started || done) return;
    const t = setInterval(() => setTimeLeft(p => { if (p <= 1) { setDone(true); SFX.lose(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [started, done]);

  useEffect(() => { if (started && !done) inputRef.current?.focus(); }, [started, done]);

  const handleInput = (val: string) => {
    setInput(val);
    if (val.endsWith(" ") || val === current) {
      const typed_word = val.trim();
      if (typed_word === current) {
        const pts = 10 + Math.ceil(timeLeft / 10);
        const ns = score + pts; setScore(ns); onScore?.(ns); SFX.correct();
      } else {
        setErrors(e => e + 1); SFX.wrong();
      }
      setTyped(t => t + 1);
      setIdx(i => i + 1);
      setInput("");
    }
  };

  // Highlight typed chars
  const renderWord = () => {
    return current.split("").map((ch, i) => {
      const typed_ch = input[i];
      const cls = typed_ch == null ? "text-white" : typed_ch === ch ? "text-green-400" : "text-red-400 underline";
      return <span key={i} className={cls}>{ch}</span>;
    });
  };

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">⌨️</div>
      <h2 className="text-2xl font-black text-white">Vitesse de frappe</h2>
      <p className="text-white/60 text-sm text-center">Tape les mots le plus vite possible !<br />Appuie sur Espace après chaque mot.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-400 px-10 py-4 text-white font-black text-lg">
        Go ! ⌨️
      </button>
    </div>
  );

  if (done) {
    const wpm = Math.round(typed / 60 * 60);
    return (
      <div className="flex flex-col items-center gap-5 py-10">
        <div className="text-5xl">⌨️</div>
        <p className="text-3xl font-black text-yellow-400">{typed} mots</p>
        <p className="text-white/70">{wpm} mots/min · {errors} erreur{errors !== 1 ? "s" : ""}</p>
        <p className="text-white/50 text-xs">{wpm < 30 ? "Continue à pratiquer !" : wpm < 60 ? "Bon résultat !" : "Excellent !"}</p>
        <button onClick={() => { setIdx(0); setScore(0); setErrors(0); setTimeLeft(60); setDone(false); setTyped(0); setInput(""); }}
          className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-400 px-8 py-3 text-white font-black">Rejouer</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-2">
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">{typed} mots</span>
        <div className="h-2 w-32 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-violet-400 transition-all duration-1000" style={{ width: `${(timeLeft / 60) * 100}%` }} />
        </div>
        <span className="text-white font-black tabular-nums">{timeLeft}s</span>
      </div>

      {/* Upcoming words */}
      <div className="flex flex-wrap gap-2 px-2 min-h-[40px]">
        {words.slice(idx + 1, idx + 6).map((w, i) => (
          <span key={i} className="text-white/30 text-sm">{w}</span>
        ))}
      </div>

      {/* Current word */}
      <div className="rounded-2xl bg-white/8 border border-white/15 py-6 flex items-center justify-center">
        <p className="text-4xl font-black tracking-wider">{renderWord()}</p>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        value={input}
        onChange={e => handleInput(e.target.value)}
        placeholder="Tape ici..."
        className="rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-violet-400 text-center"
        autoComplete="off" autoCorrect="off" spellCheck={false}
      />

      <div className="flex justify-between text-xs text-white/40">
        <span>{errors} erreur{errors !== 1 ? "s" : ""}</span>
        <span>Score: {score}</span>
      </div>
    </div>
  );
}
