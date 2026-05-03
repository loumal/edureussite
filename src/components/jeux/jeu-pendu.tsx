"use client";
import { useState, useCallback } from "react";

const WORDS_BY_THEME = {
  animaux: ["ELEPHANT","GIRAFE","CROCODILE","HIPPOPOTAME","CHAMEAU","KANGOUROU","RHINOCEROS","CHIMPANZE","FLAMANT","MANCHOT","PERROQUET","PIEUVRE","DAUPHIN","BALEINE","RENARD","CASTOR","CARIBOU","ORIGNAL","LOUP"],
  sports:  ["HOCKEY","BASKETBALL","VOLLEYBALL","NATATION","ATHLETISME","ESCRIME","EQUITATION","HANDBALL","BADMINTON","PATINAGE","PLONGEON","CYCLISME","AVIRON","LUGE","BIATHLON"],
  nature:  ["MONTAGNE","VOLCAN","GLACIER","ARCHIPEL","PENINSULA","CASCADE","TOURBILLON","STALAGMITE","CREVASSE","MANGROVE","SAVANE","TOUNDRA","TAIGA","PRAIRIE","ESTUAIRE"],
  quebec:  ["MONTREAL","LAVAL","GATINEAU","LONGUEUIL","SHERBROOKE","OUTAOUAIS","SAGUENAY","ABITIBI","LAURENTIDES","LANAUDIERE","BEAUCE","GASPESIE","MAURICIE"],
  science: ["PHOTOSYNTHESE","METAMORPHOSE","MAGNETISME","ELECTRICITE","ATMOSPHERIQUE","VOLCANIQUE","BACTERIE","CHROMOSOME","MOLECULE","PROTON","ELECTRON","NEUTRON","ECOSYSTEME"],
};

const THEMES = Object.keys(WORDS_BY_THEME) as (keyof typeof WORDS_BY_THEME)[];
const MAX_ERRORS = 7;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function pickWord(): { word: string; theme: string } {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const words = WORDS_BY_THEME[theme];
  return { word: words[Math.floor(Math.random() * words.length)], theme };
}

export function JeuPendu({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [{ word, theme }, setWordData] = useState(pickWord);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  const won = word.split("").every(l => guessed.has(l));
  const lost = errors >= MAX_ERRORS;

  const guess = useCallback((letter: string) => {
    if (won || lost || guessed.has(letter)) return;
    const ng = new Set(guessed); ng.add(letter);
    setGuessed(ng);
    if (!word.includes(letter)) {
      setErrors(e => e + 1);
    } else if (word.split("").every(l => ng.has(l))) {
      const pts = (MAX_ERRORS - errors) * 50;
      const ns = score + pts; setScore(ns); onScore?.(ns);
    }
  }, [won, lost, guessed, word, errors, score, onScore]);

  const next = () => { setWordData(pickWord()); setGuessed(new Set()); setErrors(0); setRound(r => r + 1); };
  const reset = () => { setWordData(pickWord()); setGuessed(new Set()); setErrors(0); setScore(0); setRound(1); setStarted(false); };

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <div className="text-5xl">🎯</div>
      <div className="text-center">
        <p className="text-white font-black text-xl">Le Pendu</p>
        <p className="text-white/60 text-sm mt-1">Devine le mot lettre par lettre avant qu&apos;il soit trop tard !</p>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm text-white/70 w-full max-w-xs">
        <p className="font-bold text-white/90 mb-1">Comment jouer :</p>
        <div className="flex items-start gap-2"><span>1️⃣</span><span>Un mot secret est choisi avec son thème</span></div>
        <div className="flex items-start gap-2"><span>2️⃣</span><span>Clique sur une lettre pour la proposer</span></div>
        <div className="flex items-start gap-2"><span>✅</span><span>Bonne lettre → elle apparaît dans le mot</span></div>
        <div className="flex items-start gap-2"><span>❌</span><span>Mauvaise lettre → une partie du bonhomme se dessine</span></div>
        <div className="flex items-start gap-2"><span>💀</span><span>7 erreurs maximum avant la pendaison !</span></div>
      </div>
      <div className="text-white/40 text-xs text-center">
        Thèmes : animaux, sports, nature, Québec, sciences
      </div>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black shadow-lg hover:bg-indigo-500">
        🎯 Jouer !
      </button>
    </div>
  );

  // Hangman SVG
  const parts = [
    <circle key="head" cx="150" cy="70" r="20" stroke="white" strokeWidth="3" fill="none"/>,
    <line key="body"   x1="150" y1="90"  x2="150" y2="160" stroke="white" strokeWidth="3"/>,
    <line key="larm"   x1="150" y1="110" x2="120" y2="140" stroke="white" strokeWidth="3"/>,
    <line key="rarm"   x1="150" y1="110" x2="180" y2="140" stroke="white" strokeWidth="3"/>,
    <line key="lleg"   x1="150" y1="160" x2="120" y2="200" stroke="white" strokeWidth="3"/>,
    <line key="rleg"   x1="150" y1="160" x2="180" y2="200" stroke="white" strokeWidth="3"/>,
    <circle key="face" cx="144" cy="66" r="3" fill="white"/>,
  ];

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex gap-6 text-sm">
        <div className="text-center"><p className="text-white/50 text-xs">Score</p><p className="text-xl font-black text-white">{score}</p></div>
        <div className="text-center"><p className="text-white/50 text-xs">Manche</p><p className="text-xl font-black text-white">{round}</p></div>
        <div className="text-center"><p className="text-white/50 text-xs">Erreurs</p><p className="text-xl font-black text-red-400">{errors}/{MAX_ERRORS}</p></div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Gallows SVG */}
        <svg width="200" height="220" className="flex-shrink-0">
          {/* Structure */}
          <line x1="20" y1="210" x2="180" y2="210" stroke="#94a3b8" strokeWidth="3"/>
          <line x1="60" y1="210" x2="60" y2="20" stroke="#94a3b8" strokeWidth="3"/>
          <line x1="60" y1="20" x2="150" y2="20" stroke="#94a3b8" strokeWidth="3"/>
          <line x1="150" y1="20" x2="150" y2="50" stroke="#94a3b8" strokeWidth="2"/>
          {/* Body parts */}
          {parts.slice(0, errors)}
        </svg>

        <div className="flex flex-col gap-3">
          <p className="text-white/50 text-xs uppercase tracking-wide">Thème : {theme}</p>
          {/* Word display */}
          <div className="flex gap-2 flex-wrap">
            {word.split("").map((l, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className={`text-2xl font-black ${guessed.has(l) ? "text-white" : "text-transparent"}`}>{l}</span>
                <div className="w-6 h-0.5 bg-white/40 mt-1"/>
              </div>
            ))}
          </div>

          {/* Wrong guesses */}
          {errors > 0 && (
            <div className="flex flex-wrap gap-1">
              {ALPHABET.filter(l => guessed.has(l) && !word.includes(l)).map(l => (
                <span key={l} className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400 font-bold">{l}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard */}
      {!won && !lost && (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(9, 1fr)", maxWidth: 340 }}>
          {ALPHABET.map(l => {
            const used = guessed.has(l);
            const wrong = used && !word.includes(l);
            return (
              <button key={l} onClick={() => guess(l)} disabled={used}
                className={`w-9 h-9 rounded-lg text-sm font-black transition-all
                  ${wrong ? "bg-red-500/20 text-red-400 opacity-40" : used ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {l}
              </button>
            );
          })}
        </div>
      )}

      {won && (
        <div className="text-center space-y-2">
          <p className="text-green-400 font-black text-2xl">🎉 Bravo !</p>
          <p className="text-white font-bold">{word}</p>
          <p className="text-yellow-400">+{(MAX_ERRORS - errors) * 50} pts</p>
          <button onClick={next} className="rounded-xl bg-green-500 text-white px-6 py-2 font-black">Mot suivant →</button>
        </div>
      )}
      {lost && (
        <div className="text-center space-y-2">
          <p className="text-red-400 font-black text-xl">Le mot était : <span className="text-white">{word}</span></p>
          <button onClick={reset} className="rounded-xl bg-red-500 text-white px-6 py-2 font-black">Rejouer</button>
        </div>
      )}
    </div>
  );
}
