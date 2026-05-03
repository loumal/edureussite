"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const CELL = 36, COLS = 13, ROWS = 9, W = COLS * CELL, H = ROWS * CELL;

type Cell = { top: boolean; right: boolean; bottom: boolean; left: boolean; visited: boolean };

function generateMaze(cols: number, rows: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ top: true, right: true, bottom: true, left: true, visited: false }))
  );
  const stack: [number, number][] = [];
  let [cr, cc] = [0, 0];
  grid[cr][cc].visited = true;
  stack.push([cr, cc]);
  while (stack.length) {
    const neighbors: [number, number, string][] = [];
    const dirs: [number, number, string][] = [[-1,0,"top"],[0,1,"right"],[1,0,"bottom"],[0,-1,"left"]];
    dirs.forEach(([dr, dc, dir]) => {
      const nr = cr + dr, nc = cc + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].visited)
        neighbors.push([nr, nc, dir]);
    });
    if (neighbors.length) {
      const [nr, nc, dir] = neighbors[Math.floor(Math.random() * neighbors.length)];
      const opp: Record<string, string> = { top: "bottom", right: "left", bottom: "top", left: "right" };
      grid[cr][cc][dir as keyof Cell] = false as never;
      grid[nr][nc][opp[dir] as keyof Cell] = false as never;
      grid[nr][nc].visited = true;
      stack.push([cr, cc]);
      [cr, cc] = [nr, nc];
    } else {
      [cr, cc] = stack.pop()!;
    }
  }
  return grid;
}

export function JeuLabyrinthe({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    maze: [] as Cell[][], px: 0, py: 0, score: 0, moves: 0, level: 1, alive: true, frame: 0,
  });
  const [info, setInfo] = useState({ score: 0, level: 1 });
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);

  const init = (_level: number) => {
    st.current.maze = generateMaze(COLS, ROWS);
    st.current.px = 0; st.current.py = 0; st.current.moves = 0;
  };

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0c1445"); bg.addColorStop(1, "#1a1040");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Draw maze
    ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 2;
    s.maze.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = c * CELL, y = r * CELL;
        if (cell.top) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); ctx.stroke(); }
        if (cell.right) { ctx.beginPath(); ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (cell.bottom) { ctx.beginPath(); ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); ctx.stroke(); }
        if (cell.left) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); ctx.stroke(); }
      });
    });

    // Exit
    const ex = (COLS - 1) * CELL + 4, ey = (ROWS - 1) * CELL + 4;
    ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.roundRect(ex, ey, CELL - 8, CELL - 8, 4); ctx.fill();
    ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.fillText("🏆", ex + (CELL - 8) / 2, ey + 20);

    // Player
    const px = s.px * CELL + CELL / 2, py = s.py * CELL + CELL / 2;
    const pg = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, 14);
    pg.addColorStop(0, "#c4b5fd"); pg.addColorStop(1, "#7c3aed");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
    ctx.font = "16px serif"; ctx.fillText("🧑", px, py + 5);

    animRef.current = requestAnimationFrame(loop);
  }, []);

  const move = useCallback((dr: number, dc: number) => {
    const s = st.current;
    const cell = s.maze[s.py][s.px];
    const dirMap: [number, number, keyof Cell][] = [[-1,0,"top"],[0,1,"right"],[1,0,"bottom"],[0,-1,"left"]];
    const dir = dirMap.find(([r, c]) => r === dr && c === dc);
    if (!dir || cell[dir[2]]) return;
    const nr = s.py + dr, nc = s.px + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    s.px = nc; s.py = nr; s.moves++;
    SFX.tick();
    if (s.px === COLS - 1 && s.py === ROWS - 1) {
      const pts = Math.max(50, 300 - s.moves * 2);
      const ns = s.score + pts; s.score = ns;
      onScore?.(ns); setInfo(i => ({ ...i, score: ns, level: i.level + 1 }));
      SFX.win(); setDone(true);
    }
  }, [onScore]);

  useEffect(() => {
    init(1);
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1], w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
      if (map[e.key]) { e.preventDefault(); move(...map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [move]);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-4 text-xs font-bold text-white/70">
        <span>Niveau {info.level}</span>
        <span>Score: <span className="text-yellow-400">{info.score}</span></span>
      </div>
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/75 rounded-xl">
            <span className="text-4xl">🌀</span>
            <p className="text-white font-black text-xl">Labyrinthe</p>
            <div className="text-white/60 text-xs text-center space-y-1">
              <p>⌨️ Touches ↑ ↓ ← → ou W A S D</p>
              <p>📱 Boutons directionnel sur mobile</p>
              <p>Atteins le 🏆 en bas à droite !</p>
            </div>
            <button onClick={start} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 px-8 py-3 text-white font-black shadow-lg">🌀 Entrer !</button>
          </div>
        )}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-xl">
            <p className="text-2xl font-black text-white">🏆 Sortie trouvée !</p>
            <p className="text-yellow-400 font-black text-xl">{info.score} pts</p>
            <button onClick={() => { init(st.current.level); setDone(false); }} className="rounded-xl bg-indigo-600 px-6 py-2 text-white font-black">Prochain niveau</button>
          </div>
        )}
      </div>
      {/* D-pad for mobile */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div /><button onClick={() => move(-1, 0)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black flex items-center justify-center hover:bg-white/20">↑</button><div />
        <button onClick={() => move(0, -1)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black flex items-center justify-center hover:bg-white/20">←</button>
        <button onClick={() => move(1, 0)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black flex items-center justify-center hover:bg-white/20">↓</button>
        <button onClick={() => move(0, 1)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black flex items-center justify-center hover:bg-white/20">→</button>
      </div>
    </div>
  );
}
