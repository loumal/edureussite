"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480;

export function JeuJetpack({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    py: H / 2, vy: 0, frame: 0, score: 0, alive: true,
    thrusting: false, obstacles: [] as { x: number; gapY: number; gapH: number; passed?: boolean }[],
    coins: [] as { x: number; y: number; collected: boolean }[],
    spawnTimer: 0, speed: 3, particles: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const thrustRef = useRef(false);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f172a"); bg.addColorStop(0.5, "#1e1b4b"); bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 173 + s.frame * 0.5) % W);
      const sy = ((i * 97) % H);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Physics
    s.thrusting = thrustRef.current;
    if (s.thrusting) { s.vy -= 0.6; }
    s.vy += 0.35;
    s.vy = Math.max(-8, Math.min(8, s.vy));
    s.py += s.vy;

    if (s.py < 20 || s.py > H - 20) { s.alive = false; SFX.lose(); setDead(true); return; }

    // Jetpack particles
    if (s.thrusting) {
      for (let i = 0; i < 3; i++) {
        s.particles.push({ x: 20, y: s.py + 10 + Math.random() * 10, vx: -(1 + Math.random() * 2), vy: (Math.random() - 0.5) * 2, life: 15 });
      }
    }
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
    s.particles.forEach(p => {
      ctx.globalAlpha = p.life / 15;
      ctx.fillStyle = p.life > 8 ? "#f97316" : "#fbbf24";
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Spawn obstacles
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(80, 120 - s.frame / 100)) {
      s.spawnTimer = 0;
      const gapH = Math.max(100, 160 - s.frame / 80);
      const gapY = 40 + Math.random() * (H - gapH - 80);
      s.obstacles.push({ x: W + 20, gapY, gapH });
      if (Math.random() < 0.5) s.coins.push({ x: W + 80, y: gapY + gapH / 2, collected: false });
    }
    s.speed = 3 + s.frame / 600;

    // Obstacles
    s.obstacles = s.obstacles.filter(o => o.x > -40);
    s.obstacles.forEach(o => {
      o.x -= s.speed;
      // Top wall
      const wallGrad = ctx.createLinearGradient(o.x, 0, o.x + 30, 0);
      wallGrad.addColorStop(0, "#6366f1"); wallGrad.addColorStop(1, "#4338ca");
      ctx.fillStyle = wallGrad;
      ctx.beginPath(); ctx.roundRect(o.x - 15, 0, 30, o.gapY, [0, 0, 8, 8]); ctx.fill();
      ctx.beginPath(); ctx.roundRect(o.x - 15, o.gapY + o.gapH, 30, H - o.gapY - o.gapH, [8, 8, 0, 0]); ctx.fill();
      // Glow
      ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 2;
      ctx.strokeRect(o.x - 15, 0, 30, o.gapY);
      ctx.strokeRect(o.x - 15, o.gapY + o.gapH, 30, H - o.gapY - o.gapH);

      // Collision
      if (Math.abs(o.x - 30) < 28) {
        if (s.py - 15 < o.gapY || s.py + 15 > o.gapY + o.gapH) {
          s.alive = false; SFX.lose(); setDead(true); return;
        } else if (!o.passed) {
          o.passed = true; s.score += 10; onScore?.(s.score); setScore(s.score); SFX.correct();
        }
      }
    });

    // Coins
    s.coins = s.coins.filter(c => c.x > -20 && !c.collected);
    s.coins.forEach(c => {
      c.x -= s.speed;
      if (!c.collected) {
        if (Math.hypot(c.x - 30, c.y - s.py) < 22) {
          c.collected = true; s.score += 5; setScore(s.score); SFX.tick();
        } else {
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#f59e0b"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("$", c.x, c.y + 4);
        }
      }
    });

    // Player (jetpack hero)
    ctx.save(); ctx.translate(30, s.py);
    const lean = -s.vy * 3;
    ctx.rotate(lean * Math.PI / 180);
    ctx.fillStyle = "#1e40af"; ctx.beginPath(); ctx.roundRect(-12, -14, 24, 28, 6); ctx.fill();
    ctx.fillStyle = "#93c5fd"; ctx.beginPath(); ctx.arc(0, -10, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.roundRect(-18, -8, 8, 16, 4); ctx.fill();
    ctx.restore();

    // Score frame
    s.score = Math.floor(s.frame / 6) + (s.score % 100 > 0 ? s.score % 100 : 0);
    if (s.frame % 30 === 0) { onScore?.(s.score); setScore(s.score); }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 10, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#93c5fd";
    ctx.fillText(s.thrusting ? "🚀 BOOST!" : "🪂", W - 10, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const down = () => { thrustRef.current = true; };
    const up = () => { thrustRef.current = false; };
    cv.addEventListener("mousedown", down); cv.addEventListener("mouseup", up);
    cv.addEventListener("touchstart", down, { passive: true }); cv.addEventListener("touchend", up);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") { thrustRef.current = e.type === "keydown"; e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);
    return () => { cv.removeEventListener("mousedown", down); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white font-bold text-center">Maintiens le clic pour monter !<br />Passe entre les obstacles 🚀</p>
            <button onClick={start} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">🚀 Décoller !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{score} pts</p>
            <button onClick={() => {
              const s = st.current; s.py=H/2; s.vy=0; s.frame=0; s.score=0; s.alive=true; s.obstacles=[]; s.coins=[]; s.particles=[]; s.spawnTimer=0;
              thrustRef.current=false; setScore(0); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Maintiens clic/espace pour propulser</p>
    </div>
  );
}
