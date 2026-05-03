"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, BALL_R = 10, PAD_W = 80, PAD_H = 10;

export function JeuBilleRebond({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    bx: W / 2, by: H / 2, vx: 3, vy: -4,
    padX: W / 2 - PAD_W / 2, score: 0, lives: 3, frame: 0, alive: true,
    bricks: [] as { x: number; y: number; hp: number; color: string }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    level: 1,
  });
  const [info, setInfo] = useState({ score: 0, lives: 3, level: 1 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const padTarget = useRef(W / 2 - PAD_W / 2);

  const buildLevel = (level: number) => {
    const s = st.current;
    const cols = 8, rows = 3 + Math.min(level, 4);
    const bw = (W - 20) / cols, bh = 20;
    s.bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const hp = r < 2 ? 1 : (level > 3 ? 2 : 1);
      const hue = (r * 30 + level * 20) % 360;
      s.bricks.push({ x: 10 + c * bw, y: 40 + r * (bh + 3), hp, color: `hsl(${hue},70%,55%)` });
    }
  };

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f0c29"); bg.addColorStop(1, "#1a1040");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Paddle movement
    s.padX += (padTarget.current - s.padX) * 0.2;
    s.padX = Math.max(0, Math.min(W - PAD_W, s.padX));

    // Bricks
    const bw = (W - 20) / 8, bh = 20;
    s.bricks.forEach(b => {
      ctx.fillStyle = b.hp > 1 ? "#f59e0b" : b.color;
      ctx.beginPath(); ctx.roundRect(b.x + 1, b.y + 1, bw - 4, bh - 2, 4); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.roundRect(b.x + 1, b.y + 1, bw - 4, 6, [4, 4, 0, 0]); ctx.fill();
      if (b.hp > 1) { ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText("⚡", b.x + bw/2, b.y + bh - 4); }
    });

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Ball
    s.bx += s.vx; s.by += s.vy;
    if (s.bx < BALL_R || s.bx > W - BALL_R) { s.vx *= -1; s.bx = s.bx < BALL_R ? BALL_R : W - BALL_R; SFX.tick(); }
    if (s.by < BALL_R) { s.vy = Math.abs(s.vy); SFX.tick(); }

    // Paddle collision
    if (s.by + BALL_R > H - 60 && s.by + BALL_R < H - 55 && s.bx > s.padX && s.bx < s.padX + PAD_W) {
      const rel = (s.bx - (s.padX + PAD_W / 2)) / (PAD_W / 2);
      s.vx = rel * 6; s.vy = -Math.abs(s.vy) - 0.2; SFX.select();
    }

    // Fall
    if (s.by > H) {
      s.lives--; setInfo(i => ({ ...i, lives: s.lives }));
      if (s.lives <= 0) { s.alive = false; setDead(true); return; }
      s.bx = W / 2; s.by = H / 2; s.vx = 3; s.vy = -4; SFX.lose();
    }

    // Brick collision
    s.bricks = s.bricks.filter(b => {
      const bRight = b.x + bw - 4, bBottom = b.y + bh - 2;
      if (s.bx + BALL_R > b.x + 1 && s.bx - BALL_R < bRight && s.by + BALL_R > b.y + 1 && s.by - BALL_R < bBottom) {
        b.hp--;
        const cx = (b.x + bRight) / 2, cy = (b.y + bBottom) / 2;
        const overlapH = Math.min(s.bx + BALL_R - (b.x + 1), bRight - (s.bx - BALL_R));
        const overlapV = Math.min(s.by + BALL_R - (b.y + 1), bBottom - (s.by - BALL_R));
        if (overlapH < overlapV) s.vx *= -1; else s.vy *= -1;
        for (let i = 0; i < 6; i++) s.particles.push({ x: cx, y: cy, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 20, color: b.color });
        if (b.hp <= 0) { s.score += 10; onScore?.(s.score); setInfo(i => ({ ...i, score: s.score })); SFX.correct(); }
        else SFX.tick();
        return b.hp > 0;
      }
      return true;
    });

    // Level up
    if (s.bricks.length === 0) {
      s.level++; setInfo(i => ({ ...i, level: s.level })); SFX.win();
      buildLevel(s.level); s.bx = W/2; s.by = H/2; s.vx = 3 + s.level * 0.3; s.vy = -(4 + s.level * 0.3);
    }

    // Ball
    const bg2 = ctx.createRadialGradient(s.bx - 3, s.by - 3, 1, s.bx, s.by, BALL_R);
    bg2.addColorStop(0, "#e0f2fe"); bg2.addColorStop(1, "#38bdf8");
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2); ctx.fill();

    // Paddle
    const pg = ctx.createLinearGradient(s.padX, 0, s.padX + PAD_W, 0);
    pg.addColorStop(0, "#6366f1"); pg.addColorStop(1, "#8b5cf6");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(s.padX, H - 60, PAD_W, PAD_H, 5); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.roundRect(s.padX, H - 60, PAD_W, 4, [5, 5, 0, 0]); ctx.fill();

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "center"; ctx.fillStyle = "#ef4444";
    ctx.fillText("❤️".repeat(s.lives), W / 2, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#a5f3fc";
    ctx.fillText(`Niv.${s.level}`, W - 8, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    buildLevel(1);
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      padTarget.current = (cx - rect.left) * (W / rect.width) - PAD_W / 2;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") padTarget.current = Math.max(0, padTarget.current - 20);
      if (e.key === "ArrowRight") padTarget.current = Math.min(W - PAD_W, padTarget.current + 20);
    };
    cv.addEventListener("mousemove", onMove); cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white font-bold text-center">Déplace ta raquette pour faire rebondir la bille !<br />Détruis toutes les briques 💥</p>
            <button onClick={start} className="rounded-2xl bg-violet-600 px-8 py-3 text-white font-black">🔮 Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.bx=W/2; s.by=H/2; s.vx=3; s.vy=-4; s.padX=W/2-PAD_W/2; s.score=0; s.lives=3; s.frame=0; s.alive=true; s.level=1; s.particles=[];
              buildLevel(1); padTarget.current=W/2-PAD_W/2; setInfo({score:0,lives:3,level:1}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-violet-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
