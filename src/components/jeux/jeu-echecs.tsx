"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

type Piece = { type: string; color: "w" | "b" } | null;
type Board = Piece[][];

const PIECES: Record<string, string> = {
  wK:"♔", wQ:"♕", wR:"♖", wB:"♗", wN:"♘", wP:"♙",
  bK:"♚", bQ:"♛", bR:"♜", bB:"♝", bN:"♞", bP:"♟",
};

function initBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const order = ["R","N","B","Q","K","B","N","R"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: order[c], color: "b" };
    b[1][c] = { type: "P", color: "b" };
    b[6][c] = { type: "P", color: "w" };
    b[7][c] = { type: order[c], color: "w" };
  }
  return b;
}

function copyBoard(b: Board): Board {
  return b.map(row => row.map(cell => cell ? { ...cell } : null));
}

function inBounds(r: number, c: number) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function getMoves(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];
  const { type, color } = piece;
  const opp = color === "w" ? "b" : "w";
  const moves: [number, number][] = [];

  const tryAdd = (nr: number, nc: number, captureOnly = false, moveOnly = false) => {
    if (!inBounds(nr, nc)) return false;
    const target = board[nr][nc];
    if (target && target.color === color) return false;
    if (moveOnly && target) return false;
    if (captureOnly && !target) return false;
    moves.push([nr, nc]);
    return !target; // can continue sliding if empty
  };

  const slide = (dr: number, dc: number) => {
    for (let i = 1; i < 8; i++) {
      if (!tryAdd(r + dr * i, c + dc * i)) break;
    }
  };

  if (type === "P") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    tryAdd(r + dir, c, false, true);
    if (r === startRow && !board[r + dir][c]) tryAdd(r + dir * 2, c, false, true);
    tryAdd(r + dir, c - 1, true);
    tryAdd(r + dir, c + 1, true);
  } else if (type === "N") {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => tryAdd(r+dr, c+dc));
  } else if (type === "B") {
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr,dc));
  } else if (type === "R") {
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc));
  } else if (type === "Q") {
    [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc));
  } else if (type === "K") {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => tryAdd(r+dr,c+dc));
  }
  return moves;
}

function isKingInCheck(board: Board, color: "w" | "b"): boolean {
  let kr = -1, kc = -1;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.color === color && board[r][c]?.type === "K") { kr = r; kc = c; }
  }
  const opp = color === "w" ? "b" : "w";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.color === opp) {
      if (getMoves(board, r, c).some(([mr, mc]) => mr === kr && mc === kc)) return true;
    }
  }
  return false;
}

function getLegalMoves(board: Board, r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];
  return getMoves(board, r, c).filter(([nr, nc]) => {
    const nb = copyBoard(board);
    nb[nr][nc] = nb[r][c];
    nb[r][c] = null;
    return !isKingInCheck(nb, piece.color);
  });
}

// Simple minimax for AI (depth 2)
function evalBoard(board: Board): number {
  const vals: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };
  let s = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p) s += (p.color === "w" ? -1 : 1) * (vals[p.type] ?? 0);
  }
  return s;
}

function aiMove(board: Board): Board | null {
  let bestVal = -Infinity, bestBoard: Board | null = null;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c]?.color !== "b") continue;
    const moves = getLegalMoves(board, r, c);
    for (const [nr, nc] of moves) {
      const nb = copyBoard(board);
      nb[nr][nc] = nb[r][c];
      nb[r][c] = null;
      // Promote pawns
      if (nb[nr][nc]?.type === "P" && (nr === 0 || nr === 7)) nb[nr][nc]!.type = "Q";

      // Look one ply deeper (player's best response)
      let minResponse = Infinity;
      for (let r2 = 0; r2 < 8; r2++) for (let c2 = 0; c2 < 8; c2++) {
        if (nb[r2][c2]?.color !== "w") continue;
        for (const [nr2, nc2] of getLegalMoves(nb, r2, c2)) {
          const nb2 = copyBoard(nb);
          nb2[nr2][nc2] = nb2[r2][c2];
          nb2[r2][c2] = null;
          const v = evalBoard(nb2);
          if (v < minResponse) minResponse = v;
        }
      }
      const val = minResponse === Infinity ? evalBoard(nb) : minResponse;
      if (val > bestVal) { bestVal = val; bestBoard = nb; }
    }
  }
  return bestBoard;
}

export function JeuEchecs({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [board, setBoard] = useState<Board>(initBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<[number, number][]>([]);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [status, setStatus] = useState<"playing" | "check" | "checkmate" | "stalemate">("playing");
  const [score, setScore] = useState(0);
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);

  const handleClick = useCallback((r: number, c: number) => {
    if (turn !== "w" || status === "checkmate" || status === "stalemate") return;

    if (selected) {
      const isLegal = legalMoves.some(([lr, lc]) => lr === r && lc === c);
      if (isLegal) {
        const nb = copyBoard(board);
        const captured = nb[r][c];
        nb[r][c] = nb[selected[0]][selected[1]];
        nb[selected[0]][selected[1]] = null;
        // Pawn promotion
        if (nb[r][c]?.type === "P" && r === 0) nb[r][c]!.type = "Q";

        SFX.drop();
        if (captured) {
          setCapturedW(prev => [...prev, captured.type]);
          const capPts = { P: 10, N: 30, B: 30, R: 50, Q: 90, K: 0 }[captured.type] ?? 0;
          const pts = score + capPts;
          setScore(pts); onScore?.(pts);
          SFX.correct();
        }

        setBoard(nb);
        setSelected(null); setLegalMoves([]);

        // AI moves
        setTimeout(() => {
          const aiBoard = aiMove(nb);
          if (!aiBoard) { setStatus("stalemate"); return; }
          SFX.tick();
          setBoard(aiBoard);
          setTurn("w");

          // Check for player in check/mate
          const wInCheck = isKingInCheck(aiBoard, "w");
          let hasAnyMove = false;
          for (let rr = 0; rr < 8 && !hasAnyMove; rr++) for (let cc = 0; cc < 8; cc++) {
            if (aiBoard[rr][cc]?.color === "w" && getLegalMoves(aiBoard, rr, cc).length > 0) { hasAnyMove = true; break; }
          }
          if (!hasAnyMove) {
            setStatus(wInCheck ? "checkmate" : "stalemate");
            if (wInCheck) SFX.lose();
          } else if (wInCheck) {
            setStatus("check"); SFX.wrong();
          } else {
            setStatus("playing");
          }
        }, 300);
        return;
      }
      // Deselect or select new piece
      if (board[r][c]?.color === "w") {
        setSelected([r, c]);
        setLegalMoves(getLegalMoves(board, r, c));
      } else {
        setSelected(null); setLegalMoves([]);
      }
    } else {
      if (board[r][c]?.color === "w") {
        setSelected([r, c]);
        setLegalMoves(getLegalMoves(board, r, c));
        SFX.select();
      }
    }
  }, [turn, status, selected, legalMoves, board, score, onScore]);

  const reset = () => {
    setBoard(initBoard()); setSelected(null); setLegalMoves([]);
    setTurn("w"); setStatus("playing");
    setCapturedW([]); setCapturedB([]);
  };

  if (!started) return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-5xl">♟️</div>
      <p className="text-white font-bold text-center">Partie d&apos;échecs contre l&apos;IA !<br />Tu joues les blancs ♙. Mat en combien ?</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-slate-600 px-8 py-3 text-white font-black">♟️ Jouer !</button>
    </div>
  );

  const CELL = 38;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score}</span>
        <span>{status === "checkmate" ? "☠️ Échec et mat !" : status === "stalemate" ? "🤝 Pat !" : status === "check" ? "⚠️ Échec !" : turn === "w" ? "♙ Ton tour" : "🤖 IA réfléchit..."}</span>
      </div>

      {/* Captured pieces */}
      <div className="text-white/50 text-xs">Pris: {capturedW.map(t => `♟${t}`).join(" ") || "—"}</div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(8, ${CELL}px)`, border: "3px solid #854d0e", borderRadius: 4, overflow: "hidden" }}>
        {board.map((row, r) => row.map((cell, c) => {
          const isLight = (r + c) % 2 === 0;
          const isSel = selected?.[0] === r && selected?.[1] === c;
          const isLegal = legalMoves.some(([lr, lc]) => lr === r && lc === c);
          const pKey = cell ? `${cell.color}${cell.type}` : "";
          return (
            <div key={`${r}${c}`}
              onClick={() => handleClick(r, c)}
              style={{
                width: CELL, height: CELL,
                background: isSel ? "#fbbf24" : isLegal ? (cell ? "#ef4444" : "#86efac") : isLight ? "#f0d9b5" : "#b58863",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 24, userSelect: "none",
                transition: "background 0.1s",
                position: "relative",
              }}>
              {isLegal && !cell && <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(0,0,0,0.2)", position: "absolute" }} />}
              {cell && <span style={{ color: cell.color === "w" ? "#fff" : "#111", textShadow: cell.color === "w" ? "0 1px 2px #000, 0 0 3px #000" : "0 1px 2px #fff" }}>{PIECES[pKey] ?? ""}</span>}
            </div>
          );
        }))}
      </div>

      {(status === "checkmate" || status === "stalemate") && (
        <button onClick={reset} className="rounded-2xl bg-slate-600 px-6 py-2 text-white font-black text-sm">Rejouer</button>
      )}
      <p className="text-white/30 text-xs">Clique une pièce blanche puis une case verte</p>
    </div>
  );
}
