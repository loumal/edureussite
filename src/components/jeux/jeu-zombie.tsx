"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480;

export function JeuZombie({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    px: W / 2, py: H / 2, hp: 100, score: 0, frame: 0, alive: true,
    zombies: [] as { x: number; y: number; hp: number; speed: number; size: number; id: number }[],
    bullets: [] as { x: number; y: number; vx: number; vy: number }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    wave: 1, spawnTimer: 0, shootTimer: 0, nextId: 0,
  });
  const [info, setInfo] = useState({ score: 0, hp: 100, wave: 1 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const mousePos = useRef({ x: W / 2, y: H / 2 });
  const keys = useRef({ up: false, down: false, left: false, right: false });

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Dark arena background
    const bg = ctx.createRadialGradient(W/2, H/2, 50, W/2, H/2, W);
    bg.addColorStop(0, "#1a1a1a"); bg.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Grid floor
    ctx.strokeStyle = "rgba(50,50,50,0.8)"; ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Player movement
    const spd = 3;
    if (keys.current.up) s.py = Math.max(20, s.py - spd);
    if (keys.current.down) s.py = Math.min(H - 20, s.py + spd);
    if (keys.current.left) s.px = Math.max(20, s.px - spd);
    if (keys.current.right) s.px = Math.min(W - 20, s.px + spd);

    // Auto-shoot toward mouse
    s.shootTimer++;
    if (s.shootTimer >= 12) {
      s.shootTimer = 0;
      const dx = mousePos.current.x - s.px, dy = mousePos.current.y - s.py;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        const spd = 10;
        s.bullets.push({ x: s.px, y: s.py, vx: dx / d * spd, vy: dy / d * spd });
        SFX.tick();
      }
    }

    // Spawn zombies
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(20, 80 - s.wave * 8)) {
      s.spawnTimer = 0;
      const edge = Math.floor(Math.random() * 4);
      let zx = 0, zy = 0;
      if (edge === 0) { zx = Math.random() * W; zy = -30; }
      else if (edge === 1) { zx = W + 30; zy = Math.random() * H; }
      else if (edge === 2) { zx = Math.random() * W; zy = H + 30; }
      else { zx = -30; zy = Math.random() * H; }
      const size = 12 + Math.random() * 8;
      s.zombies.push({ x: zx, y: zy, hp: s.wave, speed: 0.8 + Math.random() * 0.5, size, id: s.nextId++ });
    }

    // Wave advancement
    if (s.frame % 600 === 0) { s.wave++; setInfo(i => ({ ...i, wave: s.wave })); }

    // Move zombies
    s.zombies.forEach(z => {
      const dx = s.px - z.x, dy = s.py - z.y;
      const d = Math.hypot(dx, dy);
      z.x += dx / d * z.speed; z.y += dy / d * z.speed;
      // Damage player
      if (d < 20) { s.hp -= 0.2; setInfo(i => ({ ...i, hp: Math.max(0, Math.round(s.hp)) })); }
      if (s.hp <= 0) { s.alive = false; SFX.lose(); setDead(true); return; }
      // Draw zombie
      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(z.x, z.y, z.size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#15803d"; ctx.beginPath(); ctx.arc(z.x, z.y, z.size * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.font = `${z.size * 1.2}px serif`; ctx.textAlign = "center"; ctx.fillText("🧟", z.x, z.y + z.size * 0.5);
      // HP bar
      ctx.fillStyle = "#dc2626"; ctx.fillRect(z.x - 12, z.y - z.size - 6, 24, 3);
      ctx.fillStyle = "#22c55e"; ctx.fillRect(z.x - 12, z.y - z.size - 6, 24 * (z.hp / (s.wave || 1)), 3);
    });

    // Bullets
    s.bullets = s.bullets.filter(b => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);
    s.bullets.forEach(b => {
      b.x += b.vx; b.y += b.vy;
      ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(251,191,36,0.3)"; ctx.beginPath(); ctx.arc(b.x - b.vx * 0.5, b.y - b.vy * 0.5, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Bullet-zombie collision
    const bulletsToRemove = new Set<number>();
    const zombiesToRemove = new Set<number>();
    s.bullets.forEach((b, bi) => {
      s.zombies.forEach((z, zi) => {
        if (bulletsToRemove.has(bi)) return;
        if (Math.hypot(b.x - z.x, b.y - z.y) < z.size + 4) {
          z.hp--; bulletsToRemove.add(bi);
          if (z.hp <= 0) {
            zombiesToRemove.add(zi);
            s.score += 10 + s.wave; onScore?.(s.score); setInfo(i => ({ ...i, score: s.score }));
            for (let i = 0; i < 8; i++) s.particles.push({ x: z.x, y: z.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 20, color: "#22c55e" });
            SFX.correct();
          } else SFX.select();
        }
      });
    });
    s.bullets = s.bullets.filter((_, i) => !bulletsToRemove.has(i));
    s.zombies = s.zombies.filter((_, i) => !zombiesToRemove.has(i));

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Player
    const angle = Math.atan2(mousePos.current.y - s.py, mousePos.current.x - s.px);
    ctx.save(); ctx.translate(s.px, s.py);
    ctx.fillStyle = "#1e40af"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#93c5fd"; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.fillText("🧑", 0, 6);
    // Gun
    ctx.rotate(angle); ctx.fillStyle = "#374151"; ctx.fillRect(10, -3, 16, 6); ctx.restore();

    // HP bar
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(10, H - 20, W - 20, 10);
    const hpGrad = ctx.createLinearGradient(10, 0, W - 20, 0);
    hpGrad.addColorStop(0, "#ef4444"); hpGrad.addColorStop(0.5, "#f59e0b"); hpGrad.addColorStop(1, "#22c55e");
    ctx.fillStyle = hpGrad; ctx.fillRect(10, H - 20, (W - 20) * s.hp / 100, 10);

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "center"; ctx.fillStyle = "#22c55e";
    ctx.fillText(`🌊 Vague ${s.wave}`, W / 2, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#ef4444";
    ctx.fillText(`❤️ ${Math.max(0, Math.round(s.hp))}%`, W - 8, 20);

    if (s.alive) animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      mousePos.current = { x: (cx - rect.left) * (W / rect.width), y: (cy - rect.top) * (H / rect.height) };
    };
    const onKey = (e: KeyboardEvent) => {
      const k = keys.current;
      if (e.key === "ArrowUp" || e.key === "w") k.up = e.type === "keydown";
      if (e.key === "ArrowDown" || e.key === "s") k.down = e.type === "keydown";
      if (e.key === "ArrowLeft" || e.key === "a") k.left = e.type === "keydown";
      if (e.key === "ArrowRight" || e.key === "d") k.right = e.type === "keydown";
    };
    cv.addEventListener("mousemove", onMove); cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 rounded-2xl">
            <p className="text-white font-bold text-center">WASD / ↑↓←→ pour bouger<br />Vise avec la souris, tir automatique 🧟</p>
            <button onClick={start} className="rounded-2xl bg-green-700 px-8 py-3 text-white font-black">🧟 Survivre !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <p className="text-white/70">Vague {info.wave} atteinte</p>
            <button onClick={() => {
              const s = st.current; s.px=W/2; s.py=H/2; s.hp=100; s.score=0; s.frame=0; s.alive=true; s.zombies=[]; s.bullets=[]; s.particles=[]; s.wave=1; s.spawnTimer=0;
              setInfo({score:0,hp:100,wave:1}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-green-700 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
