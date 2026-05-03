"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const CELL = 24, COLS = 19, ROWS = 17, W = CELL * COLS, H = CELL * ROWS;

// 0=empty, 1=wall, 2=dot, 3=power
const MAP_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,1,0,1,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,0,0,0,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

type Pt = { x: number; y: number };
const GHOST_COLORS = ["#ef4444","#f97316","#ec4899","#22d3ee"];
function initMap() { return MAP_TEMPLATE.map(r => [...r]); }
function countDots(map: number[][]) { return map.flat().filter(v => v === 2 || v === 3).length; }

export function JeuPacDot({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    map: initMap(),
    pac: { x: 9, y: 13, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouthAngle: 0, mouthDir: 1 },
    ghosts: GHOST_COLORS.map((c, i) => ({ x: 9 + (i%2)*1, y: 8 + Math.floor(i/2), vx: i%2===0?1:-1, vy:0, color: c, scared: 0 })),
    score: 0, lives: 3, dotsLeft: countDots(MAP_TEMPLATE), powerTimer: 0, frame: 0, alive: true, level: 1,
  });
  const [disp, setDisp] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const animRef = useRef(0);

  const canMove = (map: number[][], x: number, y: number) => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
    return map[y]?.[x] !== 1;
  };

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

    // Map
    s.map.forEach((row, y) => row.forEach((cell, x) => {
      const px = x * CELL, py = y * CELL;
      if (cell === 1) { ctx.fillStyle = "#1e40af"; ctx.fillRect(px, py, CELL, CELL); ctx.strokeStyle = "#3b82f6"; ctx.strokeRect(px+1, py+1, CELL-2, CELL-2); }
      else if (cell === 2) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(px+CELL/2, py+CELL/2, 3, 0, Math.PI*2); ctx.fill(); }
      else if (cell === 3) { ctx.fillStyle = "#facc15"; ctx.shadowColor="#facc15"; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(px+CELL/2, py+CELL/2, 7, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0; }
    }));

    // Pac-man
    const p = s.pac;
    const angle = Math.max(0.05, p.mouthAngle);
    const dir = Math.atan2(p.dir.y, p.dir.x) || 0;
    ctx.fillStyle = "#facc15"; ctx.shadowColor="#facc15"; ctx.shadowBlur=6;
    ctx.beginPath();
    ctx.moveTo(p.x*CELL+CELL/2, p.y*CELL+CELL/2);
    ctx.arc(p.x*CELL+CELL/2, p.y*CELL+CELL/2, CELL/2-2, dir+angle, dir + Math.PI*2 - angle);
    ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;

    // Ghosts
    s.ghosts.forEach(g => {
      const gx = g.x*CELL+2, gy = g.y*CELL+2, gw = CELL-4;
      ctx.fillStyle = g.scared > 0 ? (g.scared < 60 && Math.floor(s.frame/10)%2===0 ? "#fff" : "#1e40af") : g.color;
      ctx.beginPath(); ctx.arc(gx+gw/2, gy+gw/2, gw/2, Math.PI, 0);
      ctx.lineTo(gx+gw, gy+gw); ctx.lineTo(gx+gw*5/6, gy+gw-5); ctx.lineTo(gx+gw*4/6, gy+gw);
      ctx.lineTo(gx+gw*3/6, gy+gw-5); ctx.lineTo(gx+gw*2/6, gy+gw); ctx.lineTo(gx+gw/6, gy+gw-5); ctx.lineTo(gx, gy+gw);
      ctx.closePath(); ctx.fill();
      if (g.scared === 0) {
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(gx+gw*0.35, gy+gw*0.35, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx+gw*0.65, gy+gw*0.35, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle="#00f"; ctx.beginPath(); ctx.arc(gx+gw*0.38, gy+gw*0.38, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx+gw*0.68, gy+gw*0.38, 2, 0, Math.PI*2); ctx.fill();
      }
    });

    ctx.fillStyle="#fff"; ctx.font="14px monospace";
    ctx.fillText(`${s.score}`, 8, 16);
    ctx.fillText(`❤️`.repeat(s.lives), W-70, 16);
  }, []);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const d = st.current.pac.nextDir;
      if (e.key==="ArrowLeft")  { d.x=-1; d.y=0; e.preventDefault(); }
      if (e.key==="ArrowRight") { d.x=1;  d.y=0; e.preventDefault(); }
      if (e.key==="ArrowUp")    { d.x=0;  d.y=-1; e.preventDefault(); }
      if (e.key==="ArrowDown")  { d.x=0;  d.y=1; e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);

    let tick = 0;
    const loop = () => {
      if (!st.current.alive) return;
      const s = st.current; s.frame++;
      // Mouth
      s.pac.mouthAngle += 0.15 * s.pac.mouthDir;
      if (s.pac.mouthAngle > 0.4 || s.pac.mouthAngle < 0.02) s.pac.mouthDir *= -1;

      tick++;
      if (tick % 5 === 0) {
        const p = s.pac;
        const nd = p.nextDir;
        const nx = p.x + nd.x, ny = p.y + nd.y;
        if (canMove(s.map, nx, ny)) { p.dir = { ...nd }; }
        const mx = (p.x + p.dir.x + COLS) % COLS, my = (p.y + p.dir.y + ROWS) % ROWS;
        if (canMove(s.map, mx, my)) { p.x = mx; p.y = my; }

        const cell = s.map[p.y]?.[p.x];
        if (cell === 2) { s.map[p.y][p.x] = 0; s.score += 10; s.dotsLeft--; setDisp(prev => ({ ...prev, score: s.score })); onScore?.(s.score); }
        if (cell === 3) { s.map[p.y][p.x] = 0; s.score += 50; s.powerTimer = 300; s.ghosts.forEach(g => g.scared = 300); s.dotsLeft--; setDisp(prev => ({ ...prev, score: s.score })); onScore?.(s.score); }

        if (s.powerTimer > 0) s.powerTimer--;
        s.ghosts.forEach(g => { if (g.scared > 0) g.scared--; });

        // Move ghosts
        s.ghosts.forEach(g => {
          const nx = (g.x + g.vx + COLS) % COLS, ny = (g.y + g.vy + ROWS) % ROWS;
          if (canMove(s.map, nx, g.y)) g.x = nx;
          else if (canMove(s.map, g.x, ny)) g.y = ny;
          else { g.vx = Math.round(Math.random()*2-1); g.vy = Math.round(Math.random()*2-1); }
          if (Math.random() < 0.05) { g.vx = Math.round(Math.random()*2-1); g.vy = g.vx===0 ? (Math.random()<0.5?1:-1) : 0; }

          // Ghost-pac collision
          if (g.x === p.x && g.y === p.y) {
            if (g.scared > 0) { g.scared = 0; g.x = 9; g.y = 8; s.score += 200; setDisp(prev => ({ ...prev, score: s.score })); }
            else {
              s.lives--; setDisp({ score: s.score, lives: s.lives });
              if (s.lives <= 0) { s.alive = false; setDead(true); onScore?.(s.score); return; }
              p.x = 9; p.y = 13;
            }
          }
        });

        if (s.dotsLeft === 0) {
          s.level++; s.map = initMap(); s.dotsLeft = countDots(MAP_TEMPLATE); p.x = 9; p.y = 13;
        }
      }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    draw();
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [started, gameKey, draw, canMove, onScore]);

  const reset = () => {
    const s = st.current;
    s.map = initMap(); s.score = 0; s.lives = 3; s.dotsLeft = countDots(MAP_TEMPLATE); s.alive = true; s.frame = 0; s.level = 1; s.powerTimer = 0;
    s.pac = { x:9, y:13, dir:{x:0,y:0}, nextDir:{x:0,y:0}, mouthAngle:0, mouthDir:1 };
    s.ghosts = GHOST_COLORS.map((c,i) => ({ x:9+(i%2), y:8+Math.floor(i/2), vx:i%2===0?1:-1, vy:0, color:c, scared:0 }));
    setDisp({ score:0, lives:3 }); setDead(false);
  };

  const swipe = useRef<Pt|null>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10"
          style={{ maxWidth: "100%", touchAction: "none" }}
          onTouchStart={e => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
          onTouchEnd={e => {
            if (!swipe.current) return;
            const dx = e.changedTouches[0].clientX - swipe.current.x;
            const dy = e.changedTouches[0].clientY - swipe.current.y;
            const p = st.current.pac.nextDir;
            if (Math.abs(dx) > Math.abs(dy)) { p.x = dx > 0 ? 1 : -1; p.y = 0; }
            else { p.x = 0; p.y = dy > 0 ? 1 : -1; }
            swipe.current = null;
          }}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl gap-4">
            <span className="text-6xl">🟡</span>
            <p className="text-white font-black text-2xl">Pac-Dot</p>
            <p className="text-white/60 text-sm text-center">Flèches pour diriger · Mange les points<br/>Évite les fantômes !</p>
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-yellow-400 px-8 py-3 font-black text-slate-900">Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-3">
            <p className="text-white font-black text-2xl">Gobé ! 👻</p>
            <p className="text-yellow-400 text-3xl font-black">{disp.score}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-yellow-400 px-6 py-2.5 font-black text-slate-900">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
