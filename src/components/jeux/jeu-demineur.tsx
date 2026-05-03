"use client";
import { useState, useCallback, useRef } from "react";
import { SFX } from "@/lib/jeux/sounds";

type Difficulty = "facile" | "moyen" | "difficile";
const CONFIG = {
  facile:    { rows: 9,  cols: 9,  mines: 10 },
  moyen:     { rows: 12, cols: 12, mines: 25 },
  difficile: { rows: 16, cols: 16, mines: 55 },
};

type Cell = { mine: boolean; revealed: boolean; flagged: boolean; adj: number };

function makeBoard(rows: number, cols: number, mines: number, firstR: number, firstC: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
  );
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows), c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine && !(Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1)) {
      board[r][c].mine = true; placed++;
    }
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (board[r][c].mine) continue;
    let adj = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (board[r + dr]?.[c + dc]?.mine) adj++;
    }
    board[r][c].adj = adj;
  }
  return board;
}

function reveal(board: Cell[][], r: number, c: number): Cell[][] {
  const nb = board.map(row => row.map(c => ({ ...c })));
  const queue = [[r, c]];
  while (queue.length) {
    const [cr, cc] = queue.pop()!;
    if (cr < 0 || cr >= nb.length || cc < 0 || cc >= nb[0].length) continue;
    const cell = nb[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adj === 0 && !cell.mine) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) queue.push([cr + dr, cc + dc]);
    }
  }
  return nb;
}

const ADJ_COLORS = ["", "#3b82f6", "#22c55e", "#ef4444", "#7c3aed", "#dc2626", "#0891b2", "#374151", "#94a3b8"];

export function JeuDemineur({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [diff, setDiff] = useState<Difficulty>("moyen");
  const [board, setBoard] = useState<Cell[][] | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [flags, setFlags] = useState(0);
  const [time, setTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { rows, cols, mines } = CONFIG[diff];

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleClick = useCallback((r: number, c: number) => {
    if (state === "won" || state === "lost") return;
    setBoard(prev => {
      let b = prev;
      if (!b) {
        b = makeBoard(rows, cols, mines, r, c);
        setState("playing"); startTimer();
      }
      const cell = b[r][c];
      if (cell.revealed || cell.flagged) return b;
      if (cell.mine) {
        const nb = b.map(row => row.map(c => c.mine ? { ...c, revealed: true } : c));
        setState("lost"); stopTimer(); onScore?.(0); SFX.lose();
        return nb;
      }
      const nb = reveal(b, r, c);
      SFX.tick();
      const allRevealed = nb.flat().filter(c => !c.mine).every(c => c.revealed);
      if (allRevealed) {
        setState("won"); stopTimer();
        const score = Math.max(0, mines * 100 - time * 2);
        onScore?.(score); SFX.win();
      }
      return nb;
    });
  }, [state, rows, cols, mines, time, onScore]);

  const handleFlag = useCallback((e: React.MouseEvent | null, r: number, c: number) => {
    e?.preventDefault();
    if (state !== "playing" || !board) return;
    const cell = board[r][c];
    if (cell.revealed) return;
    setBoard(prev => {
      if (!prev) return prev;
      const nb = prev.map(row => row.map(c => ({ ...c })));
      nb[r][c].flagged = !nb[r][c].flagged;
      return nb;
    });
    setFlags(f => board[r][c].flagged ? f - 1 : f + 1);
    SFX.select();
  }, [state, board]);

  // Long press for mobile flagging
  const handleTouchStart = useCallback((r: number, c: number) => {
    longPressRef.current = setTimeout(() => {
      handleFlag(null, r, c);
      longPressRef.current = null;
    }, 500);
  }, [handleFlag]);

  const handleTouchEnd = useCallback((r: number, c: number) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
      handleClick(r, c);
    }
  }, [handleClick]);

  const reset = () => {
    setBoard(null); setState("idle"); setFlags(0); setTime(0); stopTimer();
  };

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <div className="text-5xl">💣</div>
      <div className="text-center space-y-1">
        <p className="text-white font-black text-xl">Démineur</p>
        <p className="text-white/60 text-sm">Révèle toutes les cases sans toucher une mine !</p>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm text-white/70 w-full max-w-xs">
        <p className="font-bold text-white/90 mb-1">Comment jouer :</p>
        <div className="flex items-start gap-2"><span>🖱️</span><span>Clic gauche pour révéler une case</span></div>
        <div className="flex items-start gap-2"><span>🚩</span><span>Clic droit (ou appui long) pour placer un drapeau</span></div>
        <div className="flex items-start gap-2"><span>🔢</span><span>Les chiffres indiquent le nombre de mines adjacentes</span></div>
        <div className="flex items-start gap-2"><span>💡</span><span>La 1ère case révèle toujours une zone libre</span></div>
      </div>

      <div>
        <p className="text-white/50 text-xs text-center mb-2">Choisis ta difficulté :</p>
        <div className="flex gap-2">
          {(Object.keys(CONFIG) as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition-all ${diff === d ? "bg-white text-slate-900 shadow-lg" : "bg-white/10 text-white hover:bg-white/20"}`}>
              {d === "facile" ? "😊" : d === "moyen" ? "😐" : "😈"} {d}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setStarted(true)} className="rounded-2xl bg-red-600 px-8 py-3 text-white font-black shadow-lg hover:bg-red-500">
        💣 Déminer !
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="flex gap-6 text-sm items-center">
        <span className="text-red-400 font-bold">💣 {mines - flags}</span>
        <span className="text-white/70 font-bold">⏱ {time}s</span>
        <button onClick={reset} className="text-white/50 hover:text-white text-xs rounded-lg px-2 py-1 bg-white/5 hover:bg-white/10">↺ Quitter</button>
      </div>

      {state === "idle" && (
        <p className="text-white/40 text-xs">Clique sur une case pour commencer !</p>
      )}

      <div className="rounded-xl overflow-hidden border border-white/10" style={{ touchAction: "none" }}>
        {(board ?? Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
        )).map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <button
                key={c}
                onClick={() => { if (!longPressRef.current) handleClick(r, c); }}
                onContextMenu={(e) => handleFlag(e, r, c)}
                onTouchStart={() => handleTouchStart(r, c)}
                onTouchEnd={() => handleTouchEnd(r, c)}
                className={`w-7 h-7 flex items-center justify-center text-xs font-black border border-white/5 transition-colors
                  ${cell.revealed ? (cell.mine ? "bg-red-600" : "bg-slate-700") : "bg-slate-600 hover:bg-slate-500 active:bg-slate-400"}`}
                style={{ fontSize: 11 }}
              >
                {cell.revealed
                  ? cell.mine ? "💣"
                  : cell.adj > 0 ? <span style={{ color: ADJ_COLORS[cell.adj] }}>{cell.adj}</span>
                  : ""
                  : cell.flagged ? "🚩" : ""}
              </button>
            ))}
          </div>
        ))}
      </div>

      <p className="text-white/30 text-xs">
        {state === "idle" ? "Clic gauche = Révéler · Clic droit / appui long = Drapeau" :
         state === "playing" ? `${mines - flags} mines restantes` : ""}
      </p>

      {state === "won" && (
        <div className="text-center space-y-2">
          <p className="text-green-400 font-black text-2xl">🎉 Bravo ! Toutes les mines évitées !</p>
          <p className="text-yellow-400 font-black text-xl">{Math.max(0, mines * 100 - time * 2)} pts</p>
          <button onClick={reset} className="rounded-xl bg-green-500 text-white px-6 py-2 font-bold">Rejouer</button>
        </div>
      )}
      {state === "lost" && (
        <div className="text-center space-y-2">
          <p className="text-red-400 font-black text-2xl">💥 Boom ! Tu as touché une mine !</p>
          <button onClick={reset} className="rounded-xl bg-red-500 text-white px-6 py-2 font-bold">Rejouer</button>
        </div>
      )}
    </div>
  );
}
