"use client";
import { useEffect, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const CELL = 44;
const LEVELS = [
  { grid: ["#####","#@$ #","#.  #","#   #","#####"], w: 5, h: 5 },
  { grid: ["######","#    #","# $. #","#@   #","# $. #","######"], w: 6, h: 6 },
  { grid: ["#######","#  @  #","# $ $ #","#.   .#","#     #","#######"], w: 7, h: 6 },
  { grid: ["########","#  @   #","# $$ . #","#  .   #","# . $  #","########"], w: 8, h: 6 },
];

type Pos = { r: number; c: number };

function parseLevel(level: typeof LEVELS[0]) {
  const walls = new Set<string>(), boxes: Pos[] = [], goals: Pos[] = [];
  let player: Pos = { r: 0, c: 0 };
  level.grid.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === "#") walls.add(`${r},${c}`);
      if (ch === "@" || ch === "+") player = { r, c };
      if (ch === "$" || ch === "*") boxes.push({ r, c });
      if (ch === "." || ch === "+" || ch === "*") goals.push({ r, c });
    });
  });
  return { walls, boxes, goals, player };
}

export function JeuSokoban({ onScore }: { onScore?: (s: number) => void }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [player, setPlayer] = useState<Pos>({ r: 0, c: 0 });
  const [boxes, setBoxes] = useState<Pos[]>([]);
  const [goals, setGoals] = useState<Pos[]>([]);
  const [walls, setWalls] = useState(new Set<string>());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);

  const loadLevel = useCallback((idx: number) => {
    const { walls: w, boxes: b, goals: g, player: p } = parseLevel(LEVELS[idx]);
    setWalls(w); setBoxes(b); setGoals(g); setPlayer(p); setMoves(0); setWon(false);
  }, []);

  useEffect(() => { loadLevel(0); }, [loadLevel]);

  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    const nr = player.r + dr, nc = player.c + dc;
    if (walls.has(`${nr},${nc}`)) return;
    const boxIdx = boxes.findIndex(b => b.r === nr && b.c === nc);
    if (boxIdx >= 0) {
      const br = nr + dr, bc = nc + dc;
      if (walls.has(`${br},${bc}`) || boxes.some(b => b.r === br && b.c === bc)) return;
      const newBoxes = boxes.map((b, i) => i === boxIdx ? { r: br, c: bc } : b);
      setBoxes(newBoxes);
      const complete = goals.every(g => newBoxes.some(b => b.r === g.r && b.c === g.c));
      if (complete) {
        const pts = score + Math.max(10, 100 - moves); setScore(pts); onScore?.(pts); setWon(true); SFX.win();
      } else SFX.select();
    } else SFX.tick();
    setPlayer({ r: nr, c: nc }); setMoves(m => m + 1);
  }, [player, boxes, walls, goals, won, score, moves, onScore]);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1], w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
      if (map[e.key]) { e.preventDefault(); move(...map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, move]);

  const lv = LEVELS[levelIdx];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score}</span><span>Niveau {levelIdx + 1}/{LEVELS.length}</span><span>Dépl: {moves}</span>
      </div>
      {!started ? (
        <div className="flex flex-col items-center gap-3 p-6">
          <p className="text-white font-bold text-center">Pousse les caisses 📦 sur les cibles ●<br />Utilise ↑↓←→ ou WASD</p>
          <button onClick={() => setStarted(true)} className="rounded-2xl bg-purple-600 px-8 py-3 text-white font-black">📦 Jouer !</button>
        </div>
      ) : (
        <div style={{ background: "#1e1b4b", borderRadius: 12, padding: 8 }}>
          {Array.from({ length: lv.h }, (_, r) => (
            <div key={r} style={{ display: "flex" }}>
              {Array.from({ length: lv.w }, (_, c) => {
                const isWall = walls.has(`${r},${c}`);
                const isPlayer = player.r === r && player.c === c;
                const isBox = boxes.some(b => b.r === r && b.c === c);
                const isGoal = goals.some(g => g.r === r && g.c === c);
                const isBoxOnGoal = isBox && isGoal;
                return (
                  <div key={c} style={{ width: CELL, height: CELL, display: "flex", alignItems: "center", justifyContent: "center",
                    background: isWall ? "#4338ca" : isGoal && !isBox ? "#312e81" : "#1e1b4b",
                    border: isWall ? "2px solid #6366f1" : "1px solid #312e81",
                    borderRadius: 4, fontSize: 24 }}>
                    {isWall ? null : isPlayer ? "🧑" : isBoxOnGoal ? "✅" : isBox ? "📦" : isGoal ? "🎯" : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      {won && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-green-400 font-black text-xl">🎉 Niveau complété!</p>
          {levelIdx < LEVELS.length - 1
            ? <button onClick={() => { setLevelIdx(l => l + 1); loadLevel(levelIdx + 1); }} className="rounded-xl bg-purple-600 px-6 py-2 text-white font-black">Niveau suivant →</button>
            : <button onClick={() => { setLevelIdx(0); loadLevel(0); setScore(0); }} className="rounded-xl bg-purple-600 px-6 py-2 text-white font-black">Rejouer depuis le début</button>
          }
        </div>
      )}
      {started && !won && (
        <div className="grid grid-cols-3 gap-1 mt-1">
          <div /><button onClick={() => move(-1, 0)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">↑</button><div />
          <button onClick={() => move(0, -1)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">←</button>
          <button onClick={() => move(1, 0)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">↓</button>
          <button onClick={() => move(0, 1)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">→</button>
        </div>
      )}
    </div>
  );
}
