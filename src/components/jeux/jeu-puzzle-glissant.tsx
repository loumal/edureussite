"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const N = 3; // 3x3 (8-puzzle)
const EMOJIS = ["🎯","🌟","🔥","💎","🎮","🚀","🌈","🏆",""];

function isSolved(tiles: number[]): boolean {
  return tiles.every((v, i) => v === i);
}

function canMove(tiles: number[], idx: number): boolean {
  const blank = tiles.indexOf(N * N - 1);
  const [r, c] = [Math.floor(idx / N), idx % N];
  const [br, bc] = [Math.floor(blank / N), blank % N];
  return (Math.abs(r - br) + Math.abs(c - bc)) === 1;
}

function shuffle(tiles: number[]): number[] {
  let t = [...tiles];
  for (let i = 0; i < 1000; i++) {
    const blank = t.indexOf(N * N - 1);
    const moves = [];
    if (blank % N > 0) moves.push(blank - 1);
    if (blank % N < N - 1) moves.push(blank + 1);
    if (blank >= N) moves.push(blank - N);
    if (blank < N * (N - 1)) moves.push(blank + N);
    const next = moves[Math.floor(Math.random() * moves.length)];
    [t[blank], t[next]] = [t[next], t[blank]];
  }
  return t;
}

export function JeuPuzzleGlissant({ onScore }: { onScore?: (s: number) => void }) {
  const [tiles, setTiles] = useState<number[]>(() => shuffle(Array.from({ length: N*N }, (_, i) => i)));
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);

  const move = useCallback((idx: number) => {
    if (!started || solved) return;
    setTiles(prev => {
      if (!canMove(prev, idx)) return prev;
      const next = [...prev];
      const blank = prev.indexOf(N * N - 1);
      [next[blank], next[idx]] = [next[idx], next[blank]];
      SFX.tick();
      const nm = moves + 1;
      setMoves(nm);
      if (isSolved(next)) {
        const pts = Math.max(10, 500 - nm * 5);
        const ns = score + pts;
        setScore(ns); onScore?.(ns); SFX.win();
        setSolved(true);
      }
      return next;
    });
  }, [started, solved, moves, score, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">🧩</div>
      <h2 className="text-2xl font-black text-white">Puzzle Glissant</h2>
      <p className="text-white/60 text-sm text-center">Remets les pièces dans l'ordre !<br />La case vide te permet de bouger les autres.</p>
      <div className="grid grid-cols-3 gap-1 opacity-50">
        {EMOJIS.map((e, i) => <div key={i} className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl">{e}</div>)}
      </div>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-400 px-10 py-4 text-white font-black text-lg">
        Résoudre ! 🧩
      </button>
    </div>
  );

  if (solved) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🎉</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/70">{moves} coups</p>
      <p className="text-white/50 text-sm">{moves < 20 ? "Excellent ! Presque parfait !" : moves < 40 ? "Bien joué !" : "Tu y es arrivé !"}</p>
      <button onClick={() => { setTiles(shuffle(Array.from({length:N*N},(_,i)=>i))); setMoves(0); setSolved(false); }}
        className="rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-400 px-8 py-3 text-white font-black">Nouveau puzzle</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 px-2">
      <div className="flex justify-between w-full">
        <span className="text-white/60 text-sm">{moves} coups</span>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      <div className="grid gap-2 p-3 rounded-2xl bg-white/5" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {tiles.map((v, i) => (
          <button key={i} onClick={() => move(i)}
            className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl font-black transition-all active:scale-90 ${
              v === N*N-1 ? "bg-transparent" : canMove(tiles, i) ? "bg-gradient-to-br from-teal-500/80 to-cyan-500/80 cursor-pointer hover:scale-105 hover:shadow-lg" : "bg-white/10"
            }`}>
            {v !== N*N-1 && EMOJIS[v]}
          </button>
        ))}
      </div>

      <p className="text-white/30 text-xs">Touche une pièce adjacente au vide pour la bouger</p>
    </div>
  );
}
