"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 400;

export function JeuTirArc({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    angle: -45, power: 0, charging: false, score: 0, arrows: 10, frame: 0,
    targets: [] as { x: number; y: number; r: number; hit: boolean; vx: number }[],
    projectile: null as { x: number; y: number; vx: number; vy: number } | null,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    wind: 0, spawnTimer: 0,
  });
  const [info, setInfo] = useState({ score: 0, arrows: 10 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Sky background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#7dd3fc"); bg.addColorStop(0.6, "#bae6fd"); bg.addColorStop(1, "#86efac");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = "#16a34a"; ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = "#15803d"; ctx.fillRect(0, H - 40, W, 6);

    // Wind indicator
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(10, 10, 100, 18);
    ctx.fillStyle = s.wind > 0 ? "#ef4444" : "#3b82f6";
    ctx.fillRect(55, 13, s.wind * 2, 12);
    ctx.fillStyle = "#fff"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`Vent: ${s.wind > 0 ? "→" : "←"} ${Math.abs(s.wind).toFixed(1)}`, 60, 23);

    // Change wind
    if (s.frame % 200 === 0) s.wind = (Math.random() - 0.5) * 4;

    // Spawn targets
    s.spawnTimer++;
    if (s.spawnTimer >= 80 && s.targets.filter(t => !t.hit).length < 4) {
      s.spawnTimer = 0;
      s.targets.push({ x: W - 30, y: 80 + Math.random() * (H - 150), r: 20 + Math.random() * 15, hit: false, vx: -(0.5 + Math.random()) });
    }
    s.targets = s.targets.filter(t => t.x > -50);

    // Draw targets
    s.targets.forEach(t => {
      if (!t.hit) t.x += t.vx;
      if (t.hit) return;
      // Bullseye
      [t.r, t.r * 0.7, t.r * 0.4].forEach((r, i) => {
        ctx.fillStyle = ["#ef4444", "#fff", "#ef4444"][i];
        ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = "#7f1d1d"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.stroke();
    });

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Archer
    ctx.save(); ctx.translate(40, H - 60);
    ctx.fillStyle = "#1e40af"; ctx.beginPath(); ctx.roundRect(-15, -40, 30, 50, 6); ctx.fill();
    ctx.fillStyle = "#93c5fd"; ctx.beginPath(); ctx.arc(0, -48, 12, 0, Math.PI * 2); ctx.fill();
    // Bow
    const mx = mousePos.current.x, my = mousePos.current.y;
    s.angle = Math.atan2(my - (H - 60), mx - 40);
    ctx.strokeStyle = "#854d0e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -20, 25, s.angle - 1, s.angle + 1); ctx.stroke();
    // Arrow aim line
    if (s.charging && !s.projectile) {
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(0, -20);
      ctx.lineTo(Math.cos(s.angle) * 80, -20 + Math.sin(s.angle) * 80);
      ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();

    // Power bar
    if (s.charging) {
      s.power = Math.min(100, s.power + 2);
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(10, H - 20, 100, 10);
      const pc = `hsl(${120 - s.power * 1.2}, 90%, 50%)`;
      ctx.fillStyle = pc; ctx.fillRect(10, H - 20, s.power, 10);
    }

    // Projectile
    if (s.projectile) {
      s.projectile.x += s.projectile.vx + s.wind * 0.05;
      s.projectile.y += s.projectile.vy;
      s.projectile.vy += 0.3;

      let hit = false;
      for (const t of s.targets) {
        if (t.hit) continue;
        if (Math.hypot(s.projectile.x - t.x, s.projectile.y - t.y) < t.r + 5) {
          t.hit = true; hit = true;
          const pts = Math.round((1 - Math.hypot(s.projectile.x - t.x, s.projectile.y - t.y) / t.r) * 50) + 10;
          s.score += pts; onScore?.(s.score); setInfo(i => ({ ...i, score: s.score }));
          for (let i = 0; i < 10; i++) s.particles.push({ x: t.x, y: t.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 20, color: "#ef4444" });
          SFX.win();
        }
      }
      if (hit || s.projectile.x > W || s.projectile.y > H) s.projectile = null;

      if (s.projectile) {
        ctx.save(); ctx.translate(s.projectile.x, s.projectile.y);
        ctx.rotate(Math.atan2(s.projectile.vy, s.projectile.vx));
        ctx.fillStyle = "#854d0e"; ctx.fillRect(-12, -1.5, 24, 3);
        ctx.fillStyle = "#6b7280"; ctx.fillRect(10, -4, 6, 8);
        ctx.restore();
      }
    }

    if (s.arrows <= 0 && !s.projectile && !s.charging) {
      setDead(true); return;
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, W, 30);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 120, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`🏹 ×${s.arrows}`, W - 8, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      mousePos.current = { x: (cx - rect.left) * (W / rect.width), y: (cy - rect.top) * (H / rect.height) };
    };
    const onDown = () => { st.current.charging = true; st.current.power = 0; };
    const onUp = () => {
      const s = st.current;
      if (s.charging && s.arrows > 0 && !s.projectile) {
        const spd = 5 + s.power * 0.15;
        s.projectile = { x: 40 + Math.cos(s.angle) * 25, y: H - 60 - 20 + Math.sin(s.angle) * 25, vx: Math.cos(s.angle) * spd, vy: Math.sin(s.angle) * spd };
        s.arrows--; setInfo(i => ({ ...i, arrows: s.arrows }));
        SFX.tick();
      }
      s.charging = false; s.power = 0;
    };
    cv.addEventListener("mousemove", onMove); cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    cv.addEventListener("mousedown", onDown); cv.addEventListener("mouseup", onUp);
    cv.addEventListener("touchstart", onDown, { passive: true }); cv.addEventListener("touchend", onUp);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); cv.removeEventListener("mousedown", onDown); cv.removeEventListener("mouseup", onUp); cv.removeEventListener("touchstart", onDown); cv.removeEventListener("touchend", onUp); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm rounded-2xl">
            <p className="text-white font-bold text-center">Maintiens pour charger, relâche pour tirer !<br />Vise les cibles en mouvement 🎯</p>
            <button onClick={start} className="rounded-2xl bg-amber-700 px-8 py-3 text-white font-black">🏹 Tirer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.score=0; s.arrows=10; s.frame=0; s.targets=[]; s.projectile=null; s.particles=[]; s.power=0; s.charging=false; s.wind=0;
              setInfo({score:0,arrows:10}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-amber-700 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Maintiens clic → charge · Relâche → tire</p>
    </div>
  );
}
