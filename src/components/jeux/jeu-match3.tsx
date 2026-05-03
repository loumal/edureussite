"use client";
import { useState, useCallback, useEffect } from "react";

const COLS = 7, ROWS = 8;
const GEMS = ["💎", "🔴", "🟡", "🟢", "🔵", "🟣", "🟠"];
type Cell = { gem: number; id: number; selected?: boolean; matched?: boolean };
type Grid = (Cell | null)[][];

let nextId = 0;
function newCell(gem?: number): Cell { return { gem: gem ?? Math.floor(Math.random() * GEMS.length), id: nextId++ }; }

function makeGrid(): Grid {
  const g: Grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => newCell())
  );
  // Prevent initial matches
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    while (
      (r >= 2 && g[r-1][c]?.gem === g[r][c]?.gem && g[r-2][c]?.gem === g[r][c]?.gem) ||
      (c >= 2 && g[r][c-1]?.gem === g[r][c]?.gem && g[r][c-2]?.gem === g[r][c]?.gem)
    ) { g[r][c] = newCell(); }
  }
  return g;
}

function findMatches(g: Grid): [number, number][] {
  const matched = new Set<string>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const v = g[r][c]?.gem;
      if (v !== undefined && g[r][c+1]?.gem === v && g[r][c+2]?.gem === v) {
        let k = c;
        while (k < COLS && g[r][k]?.gem === v) { matched.add(`${r},${k}`); k++; }
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 2; r++) {
      const v = g[r][c]?.gem;
      if (v !== undefined && g[r+1][c]?.gem === v && g[r+2][c]?.gem === v) {
        let k = r;
        while (k < ROWS && g[k][c]?.gem === v) { matched.add(`${k},${c}`); k++; }
      }
    }
  }
  return [...matched].map(s => s.split(",").map(Number) as [number, number]);
}

function applyGravity(g: Grid): Grid {
  const ng = g.map(r => [...r]);
  for (let c = 0; c < COLS; c++) {
    const col = ng.map(r => r[c]).filter(Boolean) as Cell[];
    while (col.length < ROWS) col.unshift(newCell());
    for (let r = 0; r < ROWS; r++) ng[r][c] = col[r];
  }
  return ng;
}

function swapCells(g: Grid, r1: number, c1: number, r2: number, c2: number): Grid {
  const ng = g.map(r => [...r]);
  [ng[r1][c1], ng[r2][c2]] = [ng[r2][c2], ng[r1][c1]];
  return ng;
}

const GEM_COLORS = ["#60a5fa","#ef4444","#facc15","#4ade80","#3b82f6","#a855f7","#f97316"];

export function JeuMatch3({ onScore }: { onScore?: (s: number) => void }) {
  const [grid, setGrid] = useState<Grid>(makeGrid);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [over, setOver] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [combo, setCombo] = useState(0);

  const processMatches = useCallback((g: Grid, bonus = 1): Promise<{ grid: Grid; pts: number }> => {
    return new Promise((resolve) => {
      const matches = findMatches(g);
      if (!matches.length) { resolve({ grid: g, pts: 0 }); return; }

      const pts = matches.length * 10 * bonus;
      const ng = g.map(r => [...r]);
      matches.forEach(([r, c]) => { ng[r][c] = null; });

      setTimeout(() => {
        const fallen = applyGravity(ng);
        setTimeout(() => {
          processMatches(fallen, bonus + 1).then(({ grid: fg, pts: fp }) => {
            resolve({ grid: fg, pts: pts + fp });
          });
        }, 200);
      }, 300);
    });
  }, []);

  const handleCell = useCallback((r: number, c: number) => {
    if (animating || over) return;
    if (!selected) { setSelected([r, c]); return; }
    const [sr, sc] = selected;
    if (sr === r && sc === c) { setSelected(null); return; }
    const adjacent = (Math.abs(sr - r) + Math.abs(sc - c)) === 1;
    if (!adjacent) { setSelected([r, c]); return; }

    setSelected(null);
    const swapped = swapCells(grid, sr, sc, r, c);
    const matches = findMatches(swapped);
    if (!matches.length) { setGrid(g => swapCells(g, sr, sc, r, c)); return; }

    setAnimating(true);
    setMoves(m => m - 1);
    processMatches(swapped).then(({ grid: ng, pts }) => {
      setGrid(ng);
      setScore(s => { const ns = s + pts; onScore?.(ns); return ns; });
      setCombo(pts > 30 ? Math.floor(pts / 30) : 0);
      setAnimating(false);
      setMoves(m => { if (m <= 0) setOver(true); return m; });
    });
  }, [animating, over, grid, selected, processMatches, onScore]);

  const reset = () => { setGrid(makeGrid()); setScore(0); setMoves(30); setOver(false); setCombo(0); setSelected(null); };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="flex gap-6">
        <div className="text-center"><p className="text-xs text-white/50">Score</p><p className="text-2xl font-black text-white">{score}</p></div>
        <div className="text-center"><p className="text-xs text-white/50">Mouvements</p><p className="text-2xl font-black text-white">{moves}</p></div>
        {combo > 1 && <div className="text-center animate-bounce"><p className="text-xs text-yellow-400">COMBO</p><p className="text-2xl font-black text-yellow-400">x{combo}</p></div>}
      </div>

      <div className="rounded-2xl p-2" style={{ background: "#1e1b4b" }}>
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isSel = selected?.[0] === r && selected?.[1] === c;
              return (
                <button
                  key={cell?.id ?? `${r}-${c}`}
                  onClick={() => handleCell(r, c)}
                  className={`w-10 h-10 m-0.5 rounded-xl flex items-center justify-center text-xl transition-all duration-150
                    ${isSel ? "scale-110 ring-2 ring-white" : "hover:scale-105"}
                    ${animating ? "pointer-events-none" : ""}
                  `}
                  style={{ background: cell ? GEM_COLORS[cell.gem] + "33" : "#ffffff11", border: `1px solid ${cell ? GEM_COLORS[cell.gem] + "66" : "transparent"}` }}
                >
                  {cell ? GEMS[cell.gem] : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {over && (
        <div className="text-center space-y-2">
          <p className="text-white font-black text-xl">Fin de partie !</p>
          <p className="text-yellow-400 text-2xl font-black">{score} pts</p>
          <button onClick={reset} className="rounded-xl bg-purple-500 text-white px-6 py-2 font-black">Rejouer</button>
        </div>
      )}
      <p className="text-white/40 text-xs">Clique 2 gemmes adjacentes pour les échanger</p>
    </div>
  );
}
