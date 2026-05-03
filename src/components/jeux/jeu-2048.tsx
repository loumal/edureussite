"use client";
import { useState, useCallback, useEffect } from "react";

type Grid = (number | null)[][];
const SIZE = 4;
const COLORS: Record<number, { bg: string; text: string }> = {
  2:    { bg: "#eee4da", text: "#776e65" },
  4:    { bg: "#ede0c8", text: "#776e65" },
  8:    { bg: "#f2b179", text: "#f9f6f2" },
  16:   { bg: "#f59563", text: "#f9f6f2" },
  32:   { bg: "#f67c5f", text: "#f9f6f2" },
  64:   { bg: "#f65e3b", text: "#f9f6f2" },
  128:  { bg: "#edcf72", text: "#f9f6f2" },
  256:  { bg: "#edcc61", text: "#f9f6f2" },
  512:  { bg: "#edc850", text: "#f9f6f2" },
  1024: { bg: "#edc53f", text: "#f9f6f2" },
  2048: { bg: "#edc22e", text: "#f9f6f2" },
};

function emptyGrid(): Grid { return Array.from({ length: SIZE }, () => Array(SIZE).fill(null)); }
function addRandom(g: Grid): Grid {
  const empty: [number, number][] = [];
  g.forEach((r, y) => r.forEach((v, x) => { if (!v) empty.push([y, x]); }));
  if (!empty.length) return g;
  const [y, x] = empty[Math.floor(Math.random() * empty.length)];
  const ng = g.map(r => [...r]);
  ng[y][x] = Math.random() < 0.9 ? 2 : 4;
  return ng;
}
function slideRow(row: (number|null)[]): { row: (number|null)[]; score: number } {
  const nums = row.filter(Boolean) as number[];
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i+1]) {
      const val = nums[i] * 2; merged.push(val); score += val; i += 2;
    } else { merged.push(nums[i]); i++; }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged.map(v => v || null), score };
}
function move(grid: Grid, dir: string): { grid: Grid; score: number; moved: boolean } {
  let score = 0; let moved = false;
  let g = grid.map(r => [...r]);
  const rotate = (gr: Grid) => gr[0].map((_, i) => gr.map(r => r[i]).reverse());
  const rotations: Record<string, number> = { LEFT: 0, RIGHT: 2, UP: 3, DOWN: 1 };
  const rots = rotations[dir] ?? 0;
  for (let i = 0; i < rots; i++) g = rotate(g);
  g = g.map(row => {
    const { row: nr, score: s } = slideRow(row);
    score += s;
    if (nr.some((v, i) => v !== row[i])) moved = true;
    return nr;
  });
  const backRots = (4 - rots) % 4;
  for (let i = 0; i < backRots; i++) g = rotate(g);
  return { grid: g, score, moved };
}

export function Jeu2048({ onScore }: { onScore?: (s: number) => void }) {
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const swipe = useRef<{x:number;y:number}|null>(null);
  const swipeRef = swipe;

  const doMove = useCallback((dir: string) => {
    setGrid(prev => {
      const { grid: ng, score: s, moved } = move(prev, dir);
      if (!moved) return prev;
      const newGrid = addRandom(ng);
      setScore(sc => {
        const ns = sc + s;
        setBest(b => Math.max(b, ns));
        onScore?.(ns);
        return ns;
      });
      if (newGrid.flat().some(v => v === 2048)) setWon(true);
      // Check game over
      const canMove = ["LEFT","RIGHT","UP","DOWN"].some(d => move(newGrid, d).moved);
      if (!canMove) setOver(true);
      return newGrid;
    });
  }, [onScore]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowLeft: "LEFT", ArrowRight: "RIGHT", ArrowUp: "UP", ArrowDown: "DOWN" };
      const d = map[e.key];
      if (d) { doMove(d); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  const reset = () => { setGrid(addRandom(addRandom(emptyGrid()))); setScore(0); setWon(false); setOver(false); };

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-xs text-white/50 font-bold uppercase">Score</p>
          <p className="text-2xl font-black text-white">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/50 font-bold uppercase">Meilleur</p>
          <p className="text-2xl font-black text-[#edcf72]">{best}</p>
        </div>
        <button onClick={reset} className="rounded-xl bg-[#8f7a66] text-white px-4 py-2 text-sm font-bold hover:bg-[#7a6858]">
          Nouveau
        </button>
      </div>

      <div
        className="relative rounded-xl p-2 touch-none"
        style={{ background: "#bbada0", width: 320, height: 320 }}
        onTouchStart={e => { swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={e => {
          if (!swipeRef.current) return;
          const dx = e.changedTouches[0].clientX - swipeRef.current.x;
          const dy = e.changedTouches[0].clientY - swipeRef.current.y;
          if (Math.abs(dx) > Math.abs(dy)) { doMove(dx > 20 ? "RIGHT" : "LEFT"); }
          else { doMove(dy > 20 ? "DOWN" : "UP"); }
          swipeRef.current = null;
        }}
      >
        {/* Background cells */}
        <div className="grid grid-cols-4 gap-2 h-full">
          {Array.from({ length: SIZE * SIZE }).map((_, i) => (
            <div key={i} className="rounded-lg" style={{ background: "#cdc1b4" }} />
          ))}
        </div>
        {/* Tiles */}
        <div className="absolute inset-2 grid grid-cols-4 gap-2">
          {grid.flat().map((val, i) => {
            const c = val ? COLORS[val] ?? { bg: "#3c3a32", text: "#f9f6f2" } : null;
            return (
              <div key={i} className="rounded-lg flex items-center justify-center font-black transition-all"
                style={{
                  background: c?.bg ?? "transparent",
                  color: c?.text ?? "transparent",
                  fontSize: (val ?? 0) >= 1000 ? 18 : (val ?? 0) >= 100 ? 22 : 28,
                }}>
                {val}
              </div>
            );
          })}
        </div>

        {(won || over) && (
          <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-black/70 gap-3">
            <p className="text-white font-black text-2xl">{won ? "🎉 2048 !" : "Game Over !"}</p>
            <p className="text-yellow-400 text-xl font-bold">{score} pts</p>
            <button onClick={reset} className="rounded-xl bg-[#f65e3b] text-white px-6 py-2 font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/40 text-xs">Flèches du clavier · Glisse sur mobile</p>
    </div>
  );
}

// add missing useRef import
import { useRef } from "react";
