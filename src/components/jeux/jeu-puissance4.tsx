"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const COLS = 7, ROWS = 6;
type Board = (null | "r" | "y")[][];

function makeBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function drop(board: Board, col: number, player: "r" | "y"): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      const nb = board.map(row => [...row]);
      nb[r][col] = player;
      return nb;
    }
  }
  return null;
}

function checkWin(board: Board, player: "r" | "y"): [number, number][] | null {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (board[r][c] !== player) continue;
    for (const [dr, dc] of dirs) {
      const cells: [number,number][] = [[r,c]];
      for (let i = 1; i < 4; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) break;
        cells.push([nr, nc]);
      }
      if (cells.length === 4) return cells;
    }
  }
  return null;
}

function score4(board: Board, player: "r" | "y"): number {
  let s = 0;
  const opp = player === "r" ? "y" : "r";
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    for (const [dr, dc] of dirs) {
      let mine = 0, empty = 0;
      for (let i = 0; i < 4; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { mine = -99; break; }
        if (board[nr][nc] === player) mine++;
        else if (board[nr][nc] === null) empty++;
        else { mine = -99; break; }
      }
      if (mine >= 0) s += mine === 3 ? 100 : mine === 2 ? 10 : mine === 1 ? 1 : 0;
    }
  }
  return s;
}

function aiPick(board: Board): number {
  // Win immediately
  for (let c = 0; c < COLS; c++) {
    const nb = drop(board, c, "y"); if (!nb) continue;
    if (checkWin(nb, "y")) return c;
  }
  // Block player win
  for (let c = 0; c < COLS; c++) {
    const nb = drop(board, c, "r"); if (!nb) continue;
    if (checkWin(nb, "r")) return c;
  }
  // Best score
  let best = -Infinity, bestCol = 3;
  for (let c = 0; c < COLS; c++) {
    const nb = drop(board, c, "y"); if (!nb) continue;
    const s = score4(nb, "y") - score4(nb, "r") * 1.2 + (c === 3 ? 5 : 0);
    if (s > best) { best = s; bestCol = c; }
  }
  return bestCol;
}

export function JeuPuissance4({ onScore }: { onScore?: (s: number) => void }) {
  const [board, setBoard] = useState<Board>(makeBoard);
  const [turn, setTurn] = useState<"r" | "y">("r");
  const [winner, setWinner] = useState<"r" | "y" | "draw" | null>(null);
  const [winCells, setWinCells] = useState<[number,number][] | null>(null);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const play = useCallback((col: number) => {
    if (winner || turn !== "r") return;
    const nb = drop(board, col, "r"); if (!nb) return;
    SFX.drop();
    const wc = checkWin(nb, "r");
    if (wc) {
      setBoard(nb); setWinner("r"); setWinCells(wc);
      const pts = score + 100; setScore(pts); onScore?.(pts); SFX.win(); return;
    }
    if (nb.every(row => row.every(c => c !== null))) {
      setBoard(nb); setWinner("draw"); return;
    }
    setBoard(nb); setTurn("y");
    setTimeout(() => {
      const aiCol = aiPick(nb);
      const nb2 = drop(nb, aiCol, "y")!;
      SFX.tick();
      const wc2 = checkWin(nb2, "y");
      if (wc2) { setBoard(nb2); setWinner("y"); setWinCells(wc2); SFX.lose(); return; }
      if (nb2.every(row => row.every(c => c !== null))) { setBoard(nb2); setWinner("draw"); return; }
      setBoard(nb2); setTurn("r");
    }, 400);
  }, [board, turn, winner, score, onScore]);

  const reset = () => { setBoard(makeBoard()); setTurn("r"); setWinner(null); setWinCells(null); };

  if (!started) return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-5xl">🔴🟡</div>
      <p className="text-white font-bold text-center">Aligne 4 jetons de ta couleur !<br />Tu joues les 🔴 rouges contre l'IA 🟡</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-red-600 px-8 py-3 text-white font-black">🔴 Jouer !</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score}</span>
        <span>{winner ? (winner === "r" ? "🎉 Tu gagnes!" : winner === "y" ? "🤖 IA gagne" : "Égalité!") : (turn === "r" ? "🔴 Ton tour" : "🟡 IA réfléchit...")}</span>
      </div>

      {/* Column click zones */}
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: COLS }, (_, c) => (
          <div key={c} style={{ cursor: turn === "r" && !winner ? "pointer" : "default" }}
            onClick={() => play(c)} onMouseEnter={() => setHover(c)} onMouseLeave={() => setHover(null)}>
            {/* Drop indicator */}
            <div style={{ width: 44, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {hover === c && turn === "r" && !winner && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ef4444", opacity: 0.8 }} />}
            </div>
            {/* Column cells */}
            {Array.from({ length: ROWS }, (_, r) => {
              const cell = board[r][c];
              const isWin = winCells?.some(([wr, wc]) => wr === r && wc === c);
              return (
                <div key={r} style={{ width: 44, height: 44, margin: 2, borderRadius: "50%",
                  background: cell === "r" ? (isWin ? "#fbbf24" : "#ef4444") : cell === "y" ? (isWin ? "#fbbf24" : "#eab308") : "#1e293b",
                  border: isWin ? "3px solid #fbbf24" : "2px solid #334155",
                  boxShadow: isWin ? "0 0 12px #fbbf24" : cell ? "inset 0 -4px 0 rgba(0,0,0,0.3)" : "none",
                  transition: "background 0.1s" }} />
              );
            })}
          </div>
        ))}
      </div>

      {winner && <button onClick={reset} className="rounded-2xl bg-red-600 px-8 py-3 text-white font-black">Rejouer</button>}
      <p className="text-white/30 text-xs">Clique sur une colonne pour lâcher ton jeton</p>
    </div>
  );
}
