"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 480, H = 300, PLAYER_W = 28, PLAYER_H = 34, GRAVITY = 0.55, JUMP = -12;

type Platform = { x: number; y: number; w: number; h: number; color: string };
type Coin = { x: number; y: number; collected: boolean };
type Enemy = { x: number; y: number; vx: number; w: number; h: number };

function makePlatforms(level: number): Platform[] {
  const colors = ["#22c55e", "#16a34a", "#15803d"];
  const plats: Platform[] = [{ x: 0, y: H - 30, w: W, h: 30, color: "#15803d" }];
  const count = 4 + level;
  for (let i = 0; i < count; i++) {
    const x = 60 + Math.random() * (W - 150);
    const y = 80 + i * ((H - 100) / count);
    plats.push({ x, y, w: 80 + Math.random() * 60, h: 15, color: colors[i % 3] });
  }
  return plats;
}

export function JeuPlatformer({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    px: 50, py: H - 80, pvx: 0, pvy: 0, onGround: false,
    score: 0, lives: 3, level: 1, alive: true, frame: 0,
    platforms: [] as Platform[], coins: [] as Coin[], enemies: [] as Enemy[],
    cameraX: 0, worldX: 0,
  });
  const [info, setInfo] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const keys = useRef<Set<string>>(new Set());

  const init = (level: number) => {
    const s = st.current;
    s.px = 50; s.py = H - 80; s.pvx = 0; s.pvy = 0;
    s.platforms = makePlatforms(level);
    s.coins = s.platforms.slice(1).map(p => ({ x: p.x + p.w / 2, y: p.y - 20, collected: false }));
    s.enemies = level > 1 ? s.platforms.slice(1, level).map(p => ({ x: p.x + 10, y: p.y - 24, vx: 1.5, w: 24, h: 24 })) : [];
  };

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // BG sky gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1e3a5f"); bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 30; i++) { const sx = (i * 97 + s.frame * 0.1) % W; const sy = (i * 73) % (H * 0.7); ctx.fillRect(sx, sy, 1.5, 1.5); }

    // Input
    if (keys.current.has("ArrowLeft") || keys.current.has("a")) s.pvx = -4;
    else if (keys.current.has("ArrowRight") || keys.current.has("d")) s.pvx = 4;
    else s.pvx *= 0.7;
    if ((keys.current.has("ArrowUp") || keys.current.has("w") || keys.current.has(" ")) && s.onGround) {
      s.pvy = JUMP; s.onGround = false; SFX.select();
    }

    // Physics
    s.pvy += GRAVITY; s.px += s.pvx; s.py += s.pvy;
    s.onGround = false;

    // Platform collision
    for (const p of s.platforms) {
      if (s.px + PLAYER_W > p.x && s.px < p.x + p.w && s.py + PLAYER_H > p.y && s.py + PLAYER_H < p.y + p.h + 10 && s.pvy > 0) {
        s.py = p.y - PLAYER_H; s.pvy = 0; s.onGround = true;
      }
    }

    // Boundaries
    s.px = Math.max(0, Math.min(W - PLAYER_W, s.px));
    if (s.py > H) { s.lives--; setInfo({ score: s.score, lives: s.lives }); SFX.wrong(); if (s.lives <= 0) { setDead(true); return; } s.py = H - 80; s.pvy = 0; }

    // Enemies
    s.enemies.forEach(e => {
      e.x += e.vx;
      const ep = s.platforms.find(p => e.y + e.h >= p.y && e.y + e.h <= p.y + p.h + 5);
      if (ep && (e.x < ep.x || e.x + e.w > ep.x + ep.w)) e.vx *= -1;
      const dx = s.px - e.x, dy = s.py - e.y;
      if (Math.abs(dx) < PLAYER_W + e.w - 8 && Math.abs(dy) < PLAYER_H + e.h - 8) {
        if (s.pvy > 0 && dy < 0) { s.pvy = -8; s.score += 20; onScore?.(s.score); SFX.hit(); e.x = -100; }
        else { s.lives--; setInfo({ score: s.score, lives: s.lives }); SFX.wrong(); if (s.lives <= 0) { setDead(true); } s.py = H - 80; }
      }
    });

    // Coins
    s.coins.forEach(c => {
      if (c.collected) return;
      if (Math.abs(s.px - c.x) < 20 && Math.abs(s.py - c.y) < 20) {
        c.collected = true; s.score += 10; onScore?.(s.score); SFX.correct();
        setInfo({ score: s.score, lives: s.lives });
      }
    });

    // Level up if all coins
    if (s.coins.length > 0 && s.coins.every(c => c.collected)) {
      s.level++; init(s.level); SFX.win();
    }

    // Draw platforms
    s.platforms.forEach(p => {
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 4); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(p.x + 4, p.y, p.w - 8, 3);
    });

    // Draw coins
    s.coins.forEach((c, i) => {
      if (c.collected) return;
      const bob = Math.sin(s.frame * 0.08 + i) * 3;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath(); ctx.arc(c.x, c.y + bob, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fef08a"; ctx.beginPath(); ctx.arc(c.x - 2, c.y + bob - 2, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Draw enemies
    s.enemies.forEach(e => {
      if (e.x < -50) return;
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.roundRect(e.x, e.y, e.w, e.h, 6); ctx.fill();
      ctx.font = "18px serif"; ctx.fillText("👾", e.x + 2, e.y + e.h - 2);
    });

    // Draw player
    const runFrame = Math.floor(s.frame / 6) % 2;
    ctx.fillStyle = "#818cf8";
    ctx.beginPath(); ctx.roundRect(s.px, s.py, PLAYER_W, PLAYER_H, 8); ctx.fill();
    ctx.fillStyle = "#e0e7ff"; ctx.fillRect(s.px + 4, s.py + 4, 8, 8); ctx.fillRect(s.px + PLAYER_W - 12, s.py + 4, 8, 8);
    if (!s.onGround) { ctx.fillStyle = "#6366f1"; ctx.fillRect(s.px + 2, s.py + PLAYER_H - 4, 8, 4); ctx.fillRect(s.px + PLAYER_W - 10, s.py + PLAYER_H - 4, 8, 4); }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24"; ctx.fillText(`⭐ ${s.score}`, 10, 18);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText(`Niveau ${s.level}`, W / 2, 18);
    ctx.textAlign = "right"; ctx.fillStyle = "#f87171"; ctx.fillText("❤️".repeat(s.lives), W - 8, 18);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    init(1);
    const down = (e: KeyboardEvent) => { keys.current.add(e.key); e.preventDefault(); };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    const cv = canvas.current;
    const touch = (e: TouchEvent) => {
      const rect = cv!.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      if (x < W / 3) { keys.current.add("ArrowLeft"); keys.current.delete("ArrowRight"); }
      else if (x > W * 2 / 3) { keys.current.add("ArrowRight"); keys.current.delete("ArrowLeft"); }
      else { keys.current.add(" "); }
    };
    const touchEnd = () => { keys.current.delete("ArrowLeft"); keys.current.delete("ArrowRight"); keys.current.delete(" "); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    cv?.addEventListener("touchstart", touch); cv?.addEventListener("touchend", touchEnd);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white/70 text-sm text-center">← → pour courir · ↑ ou Espace pour sauter<br />Touche les pièces 🪙, écrase les ennemis 👾</p>
            <button onClick={start} className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-white font-black">🦊 Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => { const s = st.current; s.score = 0; s.lives = 3; s.level = 1; s.alive = true; init(1); setInfo({ score: 0, lives: 3 }); setDead(false); setStarted(true); animRef.current = requestAnimationFrame(loop); }}
              className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">← → Courir · ↑ Sauter · Collecte les pièces dorées</p>
    </div>
  );
}
