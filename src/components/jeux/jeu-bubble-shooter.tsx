"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, R = 22, COLS = 9;
const COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7","#ec4899"];
const CX = W / 2;

type Bubble = { x: number; y: number; color: string; row: number; col: number } | null;

function gridPos(row: number, col: number) {
  const offset = row % 2 === 0 ? 0 : R;
  return { x: col * R * 2 + R + offset, y: row * (R * 1.75) + R };
}

export function JeuBubbleShooter({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    grid: [] as (string | null)[][], rows: 8, score: 0, alive: true,
    shooterX: CX, angle: -Math.PI / 2,
    bullet: null as { x: number; y: number; vx: number; vy: number; color: string } | null,
    nextColor: COLORS[0], currentColor: COLORS[1],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    frame: 0,
  });
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const animRef = useRef(0);

  const initGrid = () => {
    const s = st.current;
    s.grid = Array.from({ length: s.rows }, (_, r) =>
      Array.from({ length: r % 2 === 0 ? COLS : COLS - 1 }, () => COLORS[Math.floor(Math.random() * COLORS.length)])
    );
  };

  const shoot = (angle: number) => {
    const s = st.current;
    if (s.bullet) return;
    const spd = 12;
    s.bullet = { x: CX, y: H - 60, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, color: s.currentColor };
    s.currentColor = s.nextColor;
    s.nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    SFX.tick();
  };

  const findMatches = (grid: (string | null)[][], row: number, col: number, color: string): [number, number][] => {
    const visited = new Set<string>();
    const matches: [number, number][] = [];
    const stack = [[row, col]];
    while (stack.length) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const maxC = r % 2 === 0 ? COLS : COLS - 1;
      if (r < 0 || r >= grid.length || c < 0 || c >= maxC) continue;
      if (grid[r]?.[c] !== color) continue;
      matches.push([r, c]);
      const neighbors = r % 2 === 0
        ? [[r-1,c-1],[r-1,c],[r,c-1],[r,c+1],[r+1,c-1],[r+1,c]]
        : [[r-1,c],[r-1,c+1],[r,c-1],[r,c+1],[r+1,c],[r+1,c+1]];
      neighbors.forEach(([nr,nc]) => { if (!visited.has(`${nr},${nc}`)) stack.push([nr,nc]); });
    }
    return matches;
  };

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f0c29"); bg.addColorStop(1, "#1a1040");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid bubbles
    s.grid.forEach((row, r) => {
      const maxC = r % 2 === 0 ? COLS : COLS - 1;
      row.forEach((color, c) => {
        if (!color || c >= maxC) return;
        const { x, y } = gridPos(r, c);
        const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, 1, x, y, R);
        g.addColorStop(0, "rgba(255,255,255,0.4)"); g.addColorStop(0.5, color); g.addColorStop(1, color + "cc");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R - 1, 0, Math.PI * 2); ctx.fill();
      });
    });

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 25; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Aim line
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(CX, H - 60);
    ctx.lineTo(CX + Math.cos(s.angle) * 120, H - 60 + Math.sin(s.angle) * 120); ctx.stroke();
    ctx.setLineDash([]);

    // Shooter
    const sg = ctx.createRadialGradient(CX - R * 0.3, H - 60 - R * 0.3, 1, CX, H - 60, R);
    sg.addColorStop(0, "rgba(255,255,255,0.4)"); sg.addColorStop(0.5, s.currentColor); sg.addColorStop(1, s.currentColor);
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(CX, H - 60, R, 0, Math.PI * 2); ctx.fill();

    // Next bubble preview
    ctx.fillStyle = s.nextColor; ctx.beginPath(); ctx.arc(CX + 50, H - 55, R * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.font = "10px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.textAlign = "center"; ctx.fillText("suite", CX + 50, H - 30);

    // Move bullet
    if (s.bullet) {
      s.bullet.x += s.bullet.vx; s.bullet.y += s.bullet.vy;
      if (s.bullet.x < R || s.bullet.x > W - R) s.bullet.vx *= -1;

      // Collision with grid
      let hit = false;
      for (let r = 0; r < s.grid.length && !hit; r++) {
        const maxC = r % 2 === 0 ? COLS : COLS - 1;
        for (let c = 0; c < maxC && !hit; c++) {
          if (!s.grid[r][c]) continue;
          const { x, y } = gridPos(r, c);
          if (s.bullet && Math.hypot(s.bullet.x - x, s.bullet.y - y) < R * 1.8) {
            const bul = s.bullet;
            // Find nearest empty cell
            let bestR = r, bestC = c - 1, bestDist = Infinity;
            for (let dr = -1; dr <= 1; dr++) {
              const maxNC = (r + dr) % 2 === 0 ? COLS : COLS - 1;
              for (let dc = -2; dc <= 2; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nc < 0 || nc >= maxNC) continue;
                if (s.grid[nr]?.[nc] !== null && s.grid[nr]?.[nc] !== undefined) continue;
                const { x: gx, y: gy } = gridPos(nr, nc);
                const d = Math.hypot(bul.x - gx, bul.y - gy);
                if (d < bestDist) { bestDist = d; bestR = nr; bestC = nc; }
              }
            }
            if (s.grid[bestR]) {
              s.grid[bestR][bestC] = bul.color;
              const matches = findMatches(s.grid, bestR, bestC, bul.color);
              if (matches.length >= 3) {
                matches.forEach(([mr, mc]) => {
                  const { x: px, y: py } = gridPos(mr, mc);
                  for (let i = 0; i < 6; i++) s.particles.push({ x: px, y: py, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 25, color: bul.color });
                  s.grid[mr][mc] = null;
                });
                s.score += matches.length * 15; onScore?.(s.score); SFX.hit();
                setScore(s.score);
              } else { SFX.select(); }
            }
            s.bullet = null; hit = true;
            // Check if any bubble hits bottom
            if (s.grid.some((row, r) => r >= 7 && row.some(c => c !== null))) { s.alive = false; setDead(true); return; }
          }
        }
      }
      if (s.bullet && s.bullet.y < R) { s.bullet = null; }

      if (s.bullet) {
        const bg2 = ctx.createRadialGradient(s.bullet.x - R * 0.3, s.bullet.y - R * 0.3, 1, s.bullet.x, s.bullet.y, R);
        bg2.addColorStop(0, "rgba(255,255,255,0.5)"); bg2.addColorStop(1, s.bullet.color);
        ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(s.bullet.x, s.bullet.y, R - 1, 0, Math.PI * 2); ctx.fill();
      }
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, W / 2, 18);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    initGrid();
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      const mx = (cx - rect.left) * (W / rect.width);
      const my = (cy - rect.top) * (H / rect.height);
      const angle = Math.atan2(my - (H - 60), mx - CX);
      st.current.angle = Math.max(-Math.PI + 0.2, Math.min(-0.2, angle));
    };
    const onClick = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? (e as TouchEvent).changedTouches[0].clientX : (e as MouseEvent).clientX;
      const cy = "touches" in e ? (e as TouchEvent).changedTouches[0].clientY : (e as MouseEvent).clientY;
      const mx = (cx - rect.left) * (W / rect.width);
      const my = (cy - rect.top) * (H / rect.height);
      shoot(Math.atan2(my - (H - 60), mx - CX));
    };
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("click", onClick);
    cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    cv.addEventListener("touchend", onClick as EventListener);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); cv.removeEventListener("click", onClick); cv.removeEventListener("touchend", onClick as EventListener); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white/70 text-sm text-center">Vise et tire pour aligner 3 bulles de même couleur</p>
            <button onClick={start} className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 px-8 py-3 text-white font-black">🫧 Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{score} pts</p>
            <button onClick={() => { initGrid(); setScore(0); st.current.score = 0; setDead(false); setStarted(true); animRef.current = requestAnimationFrame(loop); }}
              className="rounded-2xl bg-pink-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
