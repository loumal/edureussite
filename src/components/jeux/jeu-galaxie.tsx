"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, PLAYER_W = 36, PLAYER_H = 28;

export function JeuGalaxie({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    px: W / 2, hp: 3, score: 0, frame: 0, alive: true,
    enemies: [] as { x: number; y: number; vx: number; vy: number; hp: number; type: number }[],
    bullets: [] as { x: number; y: number }[],
    enemyBullets: [] as { x: number; y: number; vx: number; vy: number }[],
    stars: [] as { x: number; y: number; speed: number; size: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    shootTimer: 0, spawnTimer: 0, wave: 1,
  });
  const [info, setInfo] = useState({ score: 0, hp: 3, wave: 1 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const targetX = useRef(W / 2);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    ctx.fillStyle = "#030712"; ctx.fillRect(0, 0, W, H);

    // Stars
    if (s.stars.length < 60) {
      for (let i = 0; i < 60; i++) s.stars.push({ x: Math.random() * W, y: Math.random() * H, speed: 0.5 + Math.random() * 1.5, size: Math.random() * 2 });
    }
    s.stars.forEach(star => {
      star.y += star.speed; if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
      ctx.globalAlpha = 0.6 + Math.sin(s.frame * 0.05 + star.x) * 0.4;
      ctx.fillStyle = "#fff"; ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    ctx.globalAlpha = 1;

    // Player movement
    s.px += (targetX.current - s.px) * 0.1;
    s.px = Math.max(PLAYER_W / 2, Math.min(W - PLAYER_W / 2, s.px));

    // Auto-shoot
    s.shootTimer++;
    if (s.shootTimer >= 8) {
      s.shootTimer = 0;
      s.bullets.push({ x: s.px, y: H - 60 });
      if (s.wave >= 3) s.bullets.push({ x: s.px - 15, y: H - 65 }, { x: s.px + 15, y: H - 65 });
    }

    // Spawn enemies
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(30, 80 - s.wave * 5)) {
      s.spawnTimer = 0;
      const type = Math.floor(Math.random() * Math.min(3, s.wave));
      const x = 30 + Math.random() * (W - 60);
      s.enemies.push({ x, y: -30, vx: (Math.random() - 0.5) * 2, vy: 1 + s.wave * 0.3, hp: type + 1, type });
    }
    if (s.frame % 300 === 0) { s.wave++; setInfo(i => ({ ...i, wave: s.wave })); }

    // Bullets
    s.bullets = s.bullets.filter(b => b.y > -10);
    s.bullets.forEach(b => {
      b.y -= 10;
      ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.roundRect(b.x - 2, b.y, 4, 14, 2); ctx.fill();
      ctx.fillStyle = "rgba(56,189,248,0.4)"; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill();
    });

    // Enemies
    const SHAPES = ["🛸","👾","🌀"];
    s.enemies.forEach(e => {
      e.x += e.vx + Math.sin(s.frame * 0.03 + e.x) * 0.5;
      e.y += e.vy;
      if (e.x < 20 || e.x > W - 20) e.vx *= -1;
      // Random shoot
      if (Math.random() < 0.005 * s.wave) {
        const angle = Math.atan2(H - 60 - e.y, s.px - e.x);
        s.enemyBullets.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3 + 1 });
      }
      ctx.font = `${24 + e.hp * 4}px serif`; ctx.textAlign = "center"; ctx.fillText(SHAPES[e.type], e.x, e.y + 12);
      if (e.hp > 1) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(e.x - 14, e.y - 18, 28, 5);
        ctx.fillStyle = "#ef4444"; ctx.fillRect(e.x - 14, e.y - 18, 28 * (e.hp / (e.type + 1)), 5);
      }
      if (e.y > H + 30 && !dead) { s.hp--; setInfo(i => ({ ...i, hp: s.hp })); if (s.hp <= 0) { setDead(true); } e.y = H + 50; }
    });
    s.enemies = s.enemies.filter(e => e.y < H + 40);

    // Enemy bullets
    s.enemyBullets = s.enemyBullets.filter(b => b.y < H + 10);
    s.enemyBullets.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
      if (Math.abs(b.x - s.px) < 18 && Math.abs(b.y - (H - 60)) < 18) {
        b.y = H + 50; s.hp--; setInfo(i => ({ ...i, hp: Math.max(0, s.hp) }));
        if (s.hp <= 0) { s.alive = false; setDead(true); } SFX.wrong();
      }
    });

    // Collision player bullets vs enemies
    const bToRemove = new Set<number>(), eToRemove = new Set<number>();
    s.bullets.forEach((b, bi) => {
      s.enemies.forEach((e, ei) => {
        if (bToRemove.has(bi) || eToRemove.has(ei)) return;
        if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
          bToRemove.add(bi); e.hp--;
          if (e.hp <= 0) {
            eToRemove.add(ei); s.score += 10 + e.type * 10; onScore?.(s.score); setInfo(i => ({ ...i, score: s.score }));
            for (let i = 0; i < 8; i++) s.particles.push({ x: e.x, y: e.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 20, color: ["#f97316","#a855f7","#38bdf8"][e.type] });
            SFX.correct();
          }
        }
      });
    });
    s.bullets = s.bullets.filter((_, i) => !bToRemove.has(i));
    s.enemies = s.enemies.filter((_, i) => !eToRemove.has(i));

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Player ship
    ctx.save(); ctx.translate(s.px, H - 60);
    const shipGrad = ctx.createLinearGradient(-PLAYER_W/2, 0, PLAYER_W/2, 0);
    shipGrad.addColorStop(0, "#1d4ed8"); shipGrad.addColorStop(1, "#7c3aed");
    ctx.fillStyle = shipGrad;
    ctx.beginPath(); ctx.moveTo(0, -PLAYER_H); ctx.lineTo(-PLAYER_W/2, PLAYER_H/2); ctx.lineTo(PLAYER_W/2, PLAYER_H/2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    if (s.frame % 3 < 2) { ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.moveTo(-8, PLAYER_H/2); ctx.lineTo(8, PLAYER_H/2); ctx.lineTo(0, PLAYER_H/2 + 12); ctx.fill(); }
    ctx.restore();

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "center"; ctx.fillStyle = "#38bdf8";
    ctx.fillText(`🌊 Vague ${s.wave}`, W / 2, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#ef4444";
    ctx.fillText("❤️".repeat(Math.max(0, s.hp)), W - 8, 20);

    if (s.alive) animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      targetX.current = (cx - rect.left) * (W / rect.width);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") targetX.current = Math.max(PLAYER_W/2, targetX.current - 20);
      if (e.key === "ArrowRight") targetX.current = Math.min(W - PLAYER_W/2, targetX.current + 20);
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-2xl">
            <p className="text-white font-bold text-center">Défends la galaxie contre les envahisseurs !<br />Déplace la souris pour viser 🚀</p>
            <button onClick={start} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">🚀 Décoller !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.px=W/2; s.hp=3; s.score=0; s.frame=0; s.alive=true; s.enemies=[]; s.bullets=[]; s.enemyBullets=[]; s.particles=[]; s.wave=1; s.spawnTimer=0;
              targetX.current=W/2; setInfo({score:0,hp:3,wave:1}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
