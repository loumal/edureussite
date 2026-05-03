"use client";
import { useState, useCallback, useMemo } from "react";
import { SFX } from "@/lib/jeux/sounds";

const GRIDS: { grid: string[][]; words: string[]; found?: string[] }[] = [
  {
    grid: [
      ["C","H","A","T","P","O","I","S","S","O"],
      ["H","I","V","E","R","A","T","E","A","N"],
      ["I","L","I","V","R","E","O","L","E","U"],
      ["E","A","U","R","O","U","G","E","I","A"],
      ["N","M","A","I","S","O","N","E","L","G"],
      ["L","U","N","E","R","B","O","I","S","E"],
      ["E","T","O","I","L","E","A","T","O","U"],
      ["S","O","L","E","I","L","U","E","N","V"],
      ["P","O","M","M","E","C","I","E","L","E"],
      ["R","E","V","E","R","D","V","E","N","T"],
    ],
    words: ["CHAT", "CHIEN", "LIVRE", "EAU", "ROUGE", "MAISON", "LUNE", "ETOILE", "SOLEIL", "POMME", "VENT", "CIEL"],
  },
];

type Cell = { r: number; c: number };

export function JeuMotsMeles({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [selecting, setSelecting] = useState<Cell[]>([]);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);

  const g = GRIDS[0];

  const selectedStr = useMemo(() => selecting.map(c => g.grid[c.r][c.c]).join(""), [selecting, g.grid]);
  const selectedCells = useMemo(() => new Set(selecting.map(c => `${c.r},${c.c}`)), [selecting]);

  const foundCells = useMemo(() => {
    const set = new Set<string>();
    // Mark found word cells (simplified: just highlight based on found words visually)
    return set;
  }, [found]);

  const isInLine = (cells: Cell[]): boolean => {
    if (cells.length < 2) return true;
    const dr = Math.sign(cells[1].r - cells[0].r);
    const dc = Math.sign(cells[1].c - cells[0].c);
    for (let i = 1; i < cells.length; i++) {
      if (cells[i].r - cells[i-1].r !== dr || cells[i].c - cells[i-1].c !== dc) return false;
    }
    return true;
  };

  const startSelect = (r: number, c: number) => {
    if (!started) return;
    setSelecting([{ r, c }]);
  };

  const continueSelect = (r: number, c: number) => {
    if (!selecting.length) return;
    const newSel = [...selecting];
    const last = newSel[newSel.length - 1];
    if (last.r === r && last.c === c) return;
    // Check if it would still be a line
    const candidate = [...newSel, { r, c }];
    if (isInLine(candidate)) {
      setSelecting(candidate);
    }
  };

  const endSelect = useCallback(() => {
    if (!selecting.length) return;
    const word = selectedStr;
    const rev = [...word].reverse().join("");
    const match = g.words.find(w => w === word || w === rev);
    if (match && !found.includes(match)) {
      const ns = score + 30; setScore(ns); onScore?.(ns);
      setFound(f => { const nf = [...f, match]; if (nf.length === g.words.length) { setDone(true); SFX.win(); } return nf; });
      SFX.correct();
    } else if (selecting.length > 1) {
      setWrong(true); SFX.wrong();
      setTimeout(() => setWrong(false), 400);
    }
    setSelecting([]);
  }, [selecting, selectedStr, found, score, g.words, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl">🔤</div>
      <h2 className="text-2xl font-black text-white">Mots Mêlés</h2>
      <p className="text-white/60 text-sm text-center">Trouve tous les mots cachés dans la grille !<br />Horizontalement, verticalement ou en diagonale.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-teal-500 to-green-400 px-10 py-4 text-white font-black text-lg">
        Chercher ! 🔍
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🏆</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <p className="text-white/70">Tous les {g.words.length} mots trouvés !</p>
      <button onClick={() => { setFound([]); setScore(0); setSelecting([]); setDone(false); }}
        className="rounded-2xl bg-gradient-to-r from-teal-500 to-green-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 px-1">
      <div className="flex justify-between items-center">
        <span className="text-white/60 text-xs">{found.length}/{g.words.length} mots</span>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      {/* Grid */}
      <div
        className={`grid gap-0.5 select-none touch-none rounded-xl overflow-hidden transition-all ${wrong ? "opacity-60" : ""}`}
        style={{ gridTemplateColumns: `repeat(${g.grid[0].length}, 1fr)` }}
        onMouseLeave={endSelect}
        onTouchEnd={endSelect}
      >
        {g.grid.map((row, r) => row.map((ch, c) => {
          const inSel = selectedCells.has(`${r},${c}`);
          return (
            <div key={`${r},${c}`}
              className={`w-8 h-8 flex items-center justify-center text-xs font-black cursor-pointer transition-colors rounded-sm ${
                inSel ? "bg-teal-500 text-white" : "bg-white/8 text-white/80 hover:bg-white/15"
              }`}
              onMouseDown={() => startSelect(r, c)}
              onMouseEnter={() => continueSelect(r, c)}
              onMouseUp={endSelect}
              onTouchStart={() => startSelect(r, c)}
            >
              {ch}
            </div>
          );
        }))}
      </div>

      {/* Word list */}
      <div className="flex flex-wrap gap-1.5">
        {g.words.map(w => (
          <span key={w} className={`text-xs font-bold rounded-full px-2 py-0.5 ${
            found.includes(w) ? "bg-teal-500/30 text-teal-300 line-through opacity-60" : "bg-white/10 text-white"
          }`}>{w}</span>
        ))}
      </div>
    </div>
  );
}
