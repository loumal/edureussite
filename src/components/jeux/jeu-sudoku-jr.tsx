"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

// 4×4 sudoku puzzles [puzzle, solution]
const PUZZLES_4: [number[][], number[][]][] = [
  [[[1,0,3,0],[0,3,0,1],[3,0,1,0],[0,1,0,3]], [[1,2,3,4],[4,3,2,1],[3,4,1,2],[2,1,4,3]]],
  [[[0,2,0,4],[3,0,1,0],[0,1,0,3],[4,0,3,0]], [[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]]],
  [[[4,0,0,2],[0,2,4,0],[0,4,2,0],[2,0,0,4]], [[4,3,1,2],[1,2,4,3],[3,4,2,1],[2,1,3,4]]],
  [[[0,0,4,0],[4,0,0,2],[2,0,0,4],[0,4,0,0]], [[1,2,4,3],[4,3,1,2],[2,1,3,4],[3,4,2,1]]],
];

// Fix solutions to match actual valid sudoku
const PUZZLES: [number[][], number[][]][] = [
  [[[1,0,3,0],[0,3,0,1],[3,0,1,0],[0,1,0,3]], [[1,2,3,4],[4,3,2,1],[3,4,1,2],[2,1,4,3]]],
  [[[0,2,0,1],[1,0,2,0],[0,1,0,2],[2,0,1,0]], [[4,2,3,1],[1,3,2,4],[3,1,4,2],[2,4,1,3]]],
  [[[3,0,0,4],[0,4,3,0],[0,3,4,0],[4,0,0,3]], [[3,2,1,4],[1,4,3,2],[2,3,4,1],[4,1,2,3]]],
  [[[0,3,0,2],[2,0,3,0],[0,2,0,3],[3,0,2,0]], [[1,3,4,2],[2,4,3,1],[4,2,1,3],[3,1,2,4]]],
];

const COLORS = ["", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];

export function JeuSudokuJr({ onScore }: { onScore?: (s: number) => void }) {
  const [pIdx, setPIdx] = useState(0);
  const [puzzle, solution] = PUZZLES[pIdx % PUZZLES.length];
  const [grid, setGrid] = useState<number[][]>(() => puzzle.map(r => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());

  const isFixed = (r: number, c: number) => puzzle[r][c] !== 0;

  const select = (r: number, c: number) => {
    if (!isFixed(r, c)) setSelected([r, c]);
  };

  const place = useCallback((val: number) => {
    if (!selected) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = val;
    setGrid(ng);

    if (val !== solution[r][c]) {
      setErrors(e => e + 1);
      setWrongCells(w => new Set([...w, `${r},${c}`]));
      SFX.wrong();
      setTimeout(() => setWrongCells(w => { const n = new Set(w); n.delete(`${r},${c}`); return n; }), 800);
    } else {
      setWrongCells(w => { const n = new Set(w); n.delete(`${r},${c}`); return n; });
      SFX.correct();
      // Check win
      const done = ng.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]));
      if (done) {
        const pts = Math.max(10, 100 - errors * 10);
        const ns = score + pts; setScore(ns); onScore?.(ns); SFX.win(); setCompleted(true);
      }
    }
  }, [selected, grid, solution, errors, score, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">🔢</div>
      <h2 className="text-2xl font-black text-white">Sudoku Junior</h2>
      <p className="text-white/60 text-sm text-center">Remplis la grille 4×4 :<br />chaque chiffre 1–4 apparaît une seule fois<br />par ligne, colonne et carré 2×2.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-400 px-10 py-4 text-white font-black text-lg">
        Jouer ! 🔢
      </button>
    </div>
  );

  if (completed) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🎉</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/60">{errors} erreur{errors !== 1 ? "s" : ""}</p>
      <button onClick={() => {
        const ni = pIdx + 1; setPIdx(ni);
        const [np] = PUZZLES[ni % PUZZLES.length];
        setGrid(np.map(r => [...r])); setSelected(null); setErrors(0); setCompleted(false); setWrongCells(new Set());
      }} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-400 px-8 py-3 text-white font-black">
        Prochain puzzle
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 px-2">
      <div className="flex justify-between w-full">
        <span className="text-white/60 text-sm">{errors > 0 ? `${errors} erreur${errors > 1 ? "s" : ""}` : "Parfait !"}</span>
        <span className="text-yellow-400 font-black">{score} pts</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-1 p-2 rounded-2xl bg-white/5 border border-white/10">
        {grid.map((row, r) => row.map((val, c) => {
          const fixed = isFixed(r, c);
          const sel = selected?.[0] === r && selected?.[1] === c;
          const wrong = wrongCells.has(`${r},${c}`);
          const borderR = c === 1 ? "border-r-2 border-r-white/40" : "";
          const borderB = r === 1 ? "border-b-2 border-b-white/40" : "";
          return (
            <button key={`${r},${c}`} onClick={() => select(r, c)}
              className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-black transition-all ${borderR} ${borderB} ${
                wrong ? "bg-red-500/40 animate-pulse" :
                sel ? "bg-blue-500/50 scale-105" :
                fixed ? "bg-white/15" : "bg-white/5 hover:bg-white/10"
              }`}>
              {val !== 0 && <span style={{ color: COLORS[val] }}>{val}</span>}
            </button>
          );
        }))}
      </div>

      {/* Number picker */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map(n => (
          <button key={n} onClick={() => place(n)}
            className="w-14 h-14 rounded-xl text-2xl font-black border-2 border-white/20 active:scale-90 transition-all"
            style={{ backgroundColor: `${COLORS[n]}30`, color: COLORS[n], borderColor: COLORS[n] + "60" }}>
            {n}
          </button>
        ))}
      </div>
      <p className="text-white/30 text-xs">Sélectionne une case puis un chiffre</p>
    </div>
  );
}
