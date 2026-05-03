"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const COLS = 10, ROWS = 20, CELL = 28;
const W = COLS * CELL, H = ROWS * CELL;

const PIECES = [
  { shape: [[1,1,1,1]], color: "#06b6d4" },
  { shape: [[1,1],[1,1]], color: "#eab308" },
  { shape: [[0,1,0],[1,1,1]], color: "#a855f7" },
  { shape: [[1,0,0],[1,1,1]], color: "#f97316" },
  { shape: [[0,0,1],[1,1,1]], color: "#3b82f6" },
  { shape: [[1,1,0],[0,1,1]], color: "#22c55e" },
  { shape: [[0,1,1],[1,1,0]], color: "#ef4444" },
];

type Board = (string | null)[][];
type Piece = { shape: number[][]; color: string; x: number; y: number };

function emptyBoard(): Board { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function randPiece(): Piece {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { ...p, x: Math.floor(COLS / 2) - Math.floor(p.shape[0].length / 2), y: 0 };
}
function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map((r) => r[i]).reverse());
}
function collides(board: Board, piece: Piece, ox = 0, oy = 0, shape = piece.shape): boolean {
  return shape.some((row, y) =>
    row.some((cell, x) => {
      if (!cell) return false;
      const nx = piece.x + x + ox, ny = piece.y + y + oy;
      return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx]);
    })
  );
}

export function JeuTetris({ blitz, onScore }: { blitz?: boolean; onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({ board: emptyBoard(), piece: randPiece(), next: randPiece(), score: 0, level: 1, lines: 0, alive: true, lastDrop: 0 });
  const [display, setDisplay] = useState({ score: 0, level: 1, lines: 0 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const animRef = useRef(0);

  const drawBoard = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const { board, piece } = st.current;
    ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 0.5;
    for (let c = 0; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c*CELL,0); ctx.lineTo(c*CELL,H); ctx.stroke(); }
    for (let r = 0; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0,r*CELL); ctx.lineTo(W,r*CELL); ctx.stroke(); }
    // Board cells
    board.forEach((row, y) => row.forEach((color, x) => {
      if (!color) return;
      ctx.fillStyle = color; ctx.fillRect(x*CELL+1, y*CELL+1, CELL-2, CELL-2);
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(x*CELL+1, y*CELL+1, CELL-2, 4);
    }));
    // Ghost
    let ghostY = 0;
    while (!collides(board, piece, 0, ghostY + 1)) ghostY++;
    piece.shape.forEach((row, y) => row.forEach((c, x) => {
      if (!c) return;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect((piece.x+x)*CELL+1, (piece.y+y+ghostY)*CELL+1, CELL-2, CELL-2);
    }));
    // Active piece
    piece.shape.forEach((row, y) => row.forEach((c, x) => {
      if (!c) return;
      const py = piece.y + y; if (py < 0) return;
      ctx.fillStyle = piece.color; ctx.fillRect((piece.x+x)*CELL+1, py*CELL+1, CELL-2, CELL-2);
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect((piece.x+x)*CELL+1, py*CELL+1, CELL-2, 4);
    }));
  }, []);

  const lock = useCallback(() => {
    const s = st.current;
    s.piece.shape.forEach((row, y) => row.forEach((c, x) => {
      if (!c) return;
      const gy = s.piece.y + y;
      if (gy < 0) { s.alive = false; return; }
      s.board[gy][s.piece.x + x] = s.piece.color;
    }));
    if (!s.alive) { setDead(true); onScore?.(s.score); return; }
    // Clear lines
    let cleared = 0;
    s.board = s.board.filter((row) => { if (row.every((c) => c)) { cleared++; return false; } return true; });
    while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(null));
    const pts = [0, 100, 300, 500, 800][cleared] ?? 800;
    s.score += pts * s.level; s.lines += cleared;
    s.level = Math.floor(s.lines / 10) + 1;
    setDisplay({ score: s.score, level: s.level, lines: s.lines });
    s.piece = s.next; s.next = randPiece();
    if (collides(s.board, s.piece)) { s.alive = false; setDead(true); onScore?.(s.score); }
  }, [onScore]);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const s = st.current; if (!s.alive) return;
      if (e.key === "ArrowLeft"  && !collides(s.board, s.piece, -1)) { s.piece.x--; drawBoard(); }
      if (e.key === "ArrowRight" && !collides(s.board, s.piece,  1)) { s.piece.x++; drawBoard(); }
      if (e.key === "ArrowDown") {
        if (!collides(s.board, s.piece, 0, 1)) { s.piece.y++; drawBoard(); } else lock();
        e.preventDefault();
      }
      if (e.key === "ArrowUp") {
        const rot = rotate(s.piece.shape);
        if (!collides(s.board, s.piece, 0, 0, rot)) { s.piece.shape = rot; drawBoard(); }
        e.preventDefault();
      }
      if (e.key === " ") {
        while (!collides(s.board, s.piece, 0, 1)) s.piece.y++;
        lock(); drawBoard(); e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    const speed = () => blitz ? 80 : Math.max(80, 700 - (st.current.level - 1) * 60);
    const loop = (t: number) => {
      const s = st.current; if (!s.alive) return;
      if (t - s.lastDrop > speed()) {
        s.lastDrop = t;
        if (!collides(s.board, s.piece, 0, 1)) { s.piece.y++; } else { lock(); }
        drawBoard();
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    drawBoard();
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [started, gameKey, drawBoard, lock, blitz]);

  const reset = () => { st.current = { board: emptyBoard(), piece: randPiece(), next: randPiece(), score: 0, level: 1, lines: 0, alive: true, lastDrop: 0 }; setDisplay({ score: 0, level: 1, lines: 0 }); setDead(false); };
  const swipe = useRef<{x:number;y:number}|null>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 text-sm">
        {[["Score", display.score], ["Niveau", display.level], ["Lignes", display.lines]].map(([l, v]) => (
          <div key={l as string} className="text-center">
            <p className="text-white/50 text-xs">{l}</p>
            <p className="text-white font-black text-xl">{v}</p>
          </div>
        ))}
      </div>
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10"
          style={{ maxWidth: "100%", touchAction: "none" }}
          onTouchStart={(e) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={(e) => {
            if (!swipe.current) return; const s = st.current; if (!s.alive) return;
            const dx = e.changedTouches[0].clientX - swipe.current.x;
            const dy = e.changedTouches[0].clientY - swipe.current.y;
            if (Math.abs(dy) > Math.abs(dx)) {
              if (dy > 30) { while (!collides(s.board, s.piece, 0, 1)) s.piece.y++; lock(); drawBoard(); }
              else if (dy < -30) { const rot = rotate(s.piece.shape); if (!collides(s.board, s.piece, 0, 0, rot)) { s.piece.shape = rot; drawBoard(); } }
            } else {
              if (dx > 20 && !collides(s.board, s.piece, 1)) { s.piece.x++; drawBoard(); }
              if (dx < -20 && !collides(s.board, s.piece, -1)) { s.piece.x--; drawBoard(); }
            }
            swipe.current = null;
          }}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl gap-4">
            <span className="text-6xl">🟥</span>
            <p className="text-white font-black text-xl">{blitz ? "Tetris Blitz ⚡" : "Tétris"}</p>
            <p className="text-white/60 text-sm text-center px-6">← → Déplacer · ↑ Tourner<br/>↓ Descendre · Espace = Drop</p>
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-purple-500 px-8 py-3 font-black text-white">Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-3">
            <span className="text-4xl">Game Over !</span>
            <p className="text-purple-400 text-3xl font-black">{display.score}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-purple-500 px-6 py-2.5 font-black text-white">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
