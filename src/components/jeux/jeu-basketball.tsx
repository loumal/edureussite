"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 400;
const BALL_R = 16, HOOP_X = 280, HOOP_Y = 130, HOOP_W = 50;

export function JeuBasketball({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    bx: 60, by: H - 60, vx: 0, vy: 0, inFlight: false,
    score: 0, shots: 15, streak: 0, frame: 0,
    charging: false, power: 0, angle: -60,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    scored: false, miss: false, flashTimer: 0,
  });
  const [info, setInfo] = useState({ score: 0, shots: 15 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const mousePos = useRef({ x: W / 2, y: H / 2 });

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Court
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1e3a5f"); bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c2410c"; ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = "#ea580c"; ctx.fillRect(0, H - 30, W, 4);

    // Backboard
    ctx.fillStyle = "#e2e8f0"; ctx.fillRect(HOOP_X + HOOP_W + 5, HOOP_Y - 30, 8, 70);
    ctx.fillStyle = "#334155"; ctx.fillRect(HOOP_X + HOOP_W + 13, HOOP_Y - 40, 25, 90);
    // Net
    ctx.strokeStyle = "#f1f5f9"; ctx.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(HOOP_X + i * (HOOP_W / 4), HOOP_Y);
      ctx.lineTo(HOOP_X + HOOP_W / 2 - 5 + i * 4, HOOP_Y + 35);
      ctx.stroke();
    }
    // Hoop
    ctx.strokeStyle = "#f97316"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(HOOP_X, HOOP_Y); ctx.lineTo(HOOP_X + HOOP_W, HOOP_Y); ctx.stroke();

    // Flash on score/miss
    if (s.flashTimer > 0) {
      ctx.fillStyle = s.scored ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)";
      ctx.fillRect(0, 0, W, H);
      s.flashTimer--;
    }

    // Power arc preview
    if (s.charging && !s.inFlight) {
      const mx = mousePos.current.x, my = mousePos.current.y;
      s.angle = Math.atan2(my - (H - 60), mx - 60);
      const spd = 8 + s.power * 0.1;
      ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(60, H - 60);
      let px = 60, py = H - 60, pvx = Math.cos(s.angle) * spd, pvy = Math.sin(s.angle) * spd;
      for (let i = 0; i < 30; i++) {
        pvx += 0; pvy += 0.4;
        px += pvx; py += pvy;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }

    // Ball physics
    if (s.inFlight) {
      s.vx += 0; s.vy += 0.45;
      s.bx += s.vx; s.by += s.vy;

      // Check hoop collision
      if (s.by > HOOP_Y - 5 && s.by < HOOP_Y + 20 && s.bx > HOOP_X + 5 && s.bx < HOOP_X + HOOP_W - 5 && !s.scored) {
        s.scored = true; s.score += 2 + s.streak; s.streak++;
        onScore?.(s.score); setInfo(i => ({ ...i, score: s.score }));
        for (let i = 0; i < 12; i++) s.particles.push({ x: s.bx, y: s.by, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 25 });
        SFX.win(); s.flashTimer = 15;
      }

      // Floor bounce / out of play
      if (s.by > H - BALL_R) {
        if (!s.scored) { s.streak = 0; s.miss = true; s.flashTimer = 15; SFX.wrong(); }
        s.inFlight = false; s.bx = 60; s.by = H - 60; s.scored = false; s.miss = false;
        if (s.shots <= 0) { setDead(true); return; }
      }
      if (s.bx > W + BALL_R || s.bx < -BALL_R) {
        if (!s.scored) { s.streak = 0; s.flashTimer = 15; SFX.wrong(); }
        s.inFlight = false; s.bx = 60; s.by = H - 60; s.scored = false;
        if (s.shots <= 0) { setDead(true); return; }
      }
    }

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 25; ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Ball
    const ballGrad = ctx.createRadialGradient(s.bx - 5, s.by - 5, 2, s.bx, s.by, BALL_R);
    ballGrad.addColorStop(0, "#fb923c"); ballGrad.addColorStop(1, "#c2410c");
    ctx.fillStyle = ballGrad; ctx.beginPath(); ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#7c2d12"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s.bx - BALL_R, s.by); ctx.lineTo(s.bx + BALL_R, s.by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.bx, s.by - BALL_R); ctx.lineTo(s.bx, s.by + BALL_R); ctx.stroke();

    // Charging bar
    if (s.charging) {
      s.power = Math.min(100, s.power + 1.5);
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(20, H - 15, 120, 10);
      ctx.fillStyle = `hsl(${120 - s.power * 1.2}, 90%, 50%)`; ctx.fillRect(20, H - 15, s.power * 1.2, 10);
    }

    // Streak
    if (s.streak >= 2) {
      ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fbbf24";
      ctx.fillText(`🔥 ×${s.streak} en série!`, W / 2, 55);
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 30);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`🏀 ×${s.shots}`, W - 8, 20);

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
    const onDown = () => { if (!st.current.inFlight) { st.current.charging = true; st.current.power = 0; } };
    const onUp = () => {
      const s = st.current;
      if (s.charging && !s.inFlight && s.shots > 0) {
        const spd = 8 + s.power * 0.1;
        s.vx = Math.cos(s.angle) * spd; s.vy = Math.sin(s.angle) * spd;
        s.inFlight = true; s.shots--; setInfo(i => ({ ...i, shots: s.shots }));
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 rounded-2xl">
            <p className="text-white font-bold text-center">Vise le panier et relâche pour lancer !<br />Fais des séries pour plus de points 🏀</p>
            <button onClick={start} className="rounded-2xl bg-orange-600 px-8 py-3 text-white font-black">🏀 Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.bx=60; s.by=H-60; s.vx=0; s.vy=0; s.inFlight=false; s.score=0; s.shots=15; s.streak=0; s.frame=0; s.particles=[]; s.scored=false; s.charging=false; s.power=0;
              setInfo({score:0,shots:15}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-orange-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Maintiens pour charger la force · Relâche pour tirer</p>
    </div>
  );
}
