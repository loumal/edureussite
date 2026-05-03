"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const SIZE = 11;

type Cell = null | "black" | "white";

function checkWin(board: Cell[][], r: number, c: number, player: Cell): boolean {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (let d = 1; d < 5; d++) {
      const nr = r + dr * d, nc = c + dc * d;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== player) break;
      count++;
    }
    for (let d = 1; d < 5; d++) {
      const nr = r - dr * d, nc = c - dc * d;
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE || board[nr][nc] !== player) break;
      count++;
    }
    if (count >= 5) return true;
  }
  return false;
}

function aiMove(board: Cell[][]): [number, number] {
  // Try to win or block
  for (const player of ["white", "black"] as Cell[]) {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) continue;
      const test = board.map(row => [...row]); test[r][c] = player;
      if (checkWin(test, r, c, player)) return [r, c];
    }
  }
  // Heuristic: play near existing pieces
  let best = [-1, -1], bestScore = -1;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (board[r][c]) continue;
    let score = 0;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc]) score += 3 - Math.max(Math.abs(dr), Math.abs(dc));
    }
    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  if (best[0] >= 0) return best as [number, number];
  return [Math.floor(SIZE / 2), Math.floor(SIZE / 2)];
}

export function JeuGomoku({ onScore }: { onScore?: (s: number) => void }) {
  const [board, setBoard] = useState<Cell[][]>(() => Array.from({ length: SIZE }, () => Array(SIZE).fill(null)));
  const [turn, setTurn] = useState<"black" | "white">("black");
  const [winner, setWinner] = useState<Cell | "draw">(null);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const CELL = 30;
  const PAD = 20;

  const play = useCallback((r: number, c: number) => {
    if (board[r][c] || winner || turn !== "black") return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = "black";
    SFX.select();
    if (checkWin(newBoard, r, c, "black")) {
      const pts = score + 100; setScore(pts); onScore?.(pts); setWinner("black"); SFX.win(); setBoard(newBoard); return;
    }
    if (newBoard.every(row => row.every(c => c !== null))) { setWinner("draw"); setBoard(newBoard); return; }

    setBoard(newBoard); setTurn("white");
    setTimeout(() => {
      const [ar, ac] = aiMove(newBoard);
      const aiBoard = newBoard.map(row => [...row]); aiBoard[ar][ac] = "white";
      SFX.tick();
      if (checkWin(aiBoard, ar, ac, "white")) { setWinner("white"); setBoard(aiBoard); SFX.lose(); return; }
      setBoard(aiBoard); setTurn("black");
    }, 300);
  }, [board, winner, turn, score, onScore]);

  const reset = () => {
    setBoard(Array.from({ length: SIZE }, () => Array(SIZE).fill(null)));
    setTurn("black"); setWinner(null);
  };

  const W = SIZE * CELL + PAD * 2, H = SIZE * CELL + PAD * 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 text-sm font-bold text-white/80">
        <span>⭐ {score} pts</span>
        <span>{winner ? (winner === "black" ? "🎉 Tu gagnes!" : winner === "white" ? "🤖 IA gagne" : "Match nul") : (turn === "black" ? "⚫ Ton tour" : "🤖 IA réfléchit...")}</span>
      </div>
      {!started ? (
        <div className="flex flex-col items-center gap-3 p-8">
          <p className="text-white font-bold text-center">Aligne 5 pions pour gagner !<br />Tu joues les ⚫ noirs</p>
          <button onClick={() => setStarted(true)} className="rounded-2xl bg-slate-700 px-8 py-3 text-white font-black">⚫ Jouer !</button>
        </div>
      ) : (
        <div style={{ position: "relative", width: W, height: H, background: "#b5890a", borderRadius: 12, cursor: "pointer" }}>
          <svg width={W} height={H} style={{ position: "absolute", top: 0, left: 0 }}>
            {Array.from({ length: SIZE }, (_, i) => (
              <g key={i}>
                <line x1={PAD} y1={PAD + i * CELL} x2={PAD + (SIZE-1) * CELL} y2={PAD + i * CELL} stroke="#7c4a0a" strokeWidth={1} />
                <line x1={PAD + i * CELL} y1={PAD} x2={PAD + i * CELL} y2={PAD + (SIZE-1) * CELL} stroke="#7c4a0a" strokeWidth={1} />
              </g>
            ))}
            {[2,2,2,SIZE-3,SIZE-3,2,SIZE-3,SIZE-3,Math.floor(SIZE/2),Math.floor(SIZE/2)].reduce<[number,number][]>((acc, v, i) => { if(i%2===0) acc.push([v,0]); else acc[acc.length-1][1]=v; return acc; }, []).map(([r,c],i) => (
              <circle key={i} cx={PAD + c * CELL} cy={PAD + r * CELL} r={4} fill="#7c4a0a" />
            ))}
            {board.map((row, r) => row.map((cell, c) => cell ? (
              <g key={`${r}-${c}`}>
                <circle cx={PAD + c * CELL} cy={PAD + r * CELL} r={12} fill={cell === "black" ? "#1e293b" : "#f1f5f9"} stroke={cell === "black" ? "#475569" : "#cbd5e1"} strokeWidth={1.5} />
              </g>
            ) : (
              <rect key={`${r}-${c}`} x={PAD + c * CELL - 13} y={PAD + r * CELL - 13} width={26} height={26} fill="transparent" style={{ cursor: "pointer" }} onClick={() => play(r, c)} />
            )))}
          </svg>
        </div>
      )}
      {winner && (
        <button onClick={reset} className="rounded-xl bg-amber-700 px-6 py-2 text-white font-black">Rejouer</button>
      )}
      <p className="text-white/30 text-xs">Aligne 5 pions · Tu = ⚫ · IA = ⚪</p>
    </div>
  );
}
