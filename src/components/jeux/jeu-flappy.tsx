"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const W = 360, H = 480, BIRD_R = 18, GAP = 130, PIPE_W = 55;

export function JeuFlappy({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    y: H / 2, vel: 0, angle: 0,
    pipes: [] as { x: number; top: number }[],
    score: 0, alive: true, frame: 0, started: false,
    spawnTimer: 90,
  });
  const [display, setDisplay] = useState(0);
  const [dead, setDead] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const animRef = useRef(0);
  const [gameKey, setGameKey] = useState(0);

  const flap = useCallback(() => {
    const s = st.current;
    if (!s.alive) return;
    if (!s.started) { s.started = true; }
    s.vel = -7.5;
  }, []);

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;
    // Sky gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#0ea5e9"); grd.addColorStop(1, "#7dd3fc");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = "#84cc16"; ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = "#4d7c0f"; ctx.fillRect(0, H - 60, W, 10);
    // Grass tufts
    for (let i = 0; i < W; i += 15) {
      ctx.fillStyle = "#65a30d";
      ctx.beginPath(); ctx.moveTo(i, H-60); ctx.lineTo(i+4, H-68); ctx.lineTo(i+8, H-60); ctx.fill();
    }

    // Pipes
    ctx.fillStyle = "#16a34a";
    s.pipes.forEach(p => {
      // Top pipe
      ctx.fillRect(p.x, 0, PIPE_W, p.top);
      ctx.fillStyle = "#15803d"; ctx.fillRect(p.x - 3, p.top - 20, PIPE_W + 6, 20); ctx.fillStyle = "#16a34a";
      // Bottom pipe
      const bot = p.top + GAP;
      ctx.fillRect(p.x, bot, PIPE_W, H - 60 - bot);
      ctx.fillStyle = "#15803d"; ctx.fillRect(p.x - 3, bot, PIPE_W + 6, 20); ctx.fillStyle = "#16a34a";
    });

    // Bird
    ctx.save();
    ctx.translate(90, s.y);
    ctx.rotate(Math.max(-0.5, Math.min(1.2, s.vel * 0.08)));
    // Body
    ctx.fillStyle = "#facc15";
    ctx.beginPath(); ctx.ellipse(0, 0, BIRD_R, BIRD_R - 2, 0, 0, Math.PI * 2); ctx.fill();
    // Wing (animated)
    const wingY = Math.sin(s.frame * 0.4) * 5;
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath(); ctx.ellipse(-5, wingY, 10, 6, -0.3, 0, Math.PI * 2); ctx.fill();
    // Eye
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.arc(10, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(11, -7, 1.2, 0, Math.PI * 2); ctx.fill();
    // Beak
    ctx.fillStyle = "#f97316";
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(26, -4); ctx.lineTo(26, 4); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Score
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.font = "bold 38px Arial";
    ctx.fillText(`${s.score}`, W / 2 - 12, 80);
    ctx.fillStyle = "#fff"; ctx.font = "bold 36px Arial";
    ctx.fillText(`${s.score}`, W / 2 - 14, 78);
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.key === "ArrowUp") { flap(); e.preventDefault(); } };
    window.addEventListener("keydown", onKey);
    const loop = () => {
      const s = st.current; if (!s.alive) return;
      s.frame++;
      if (!s.started) { draw(); animRef.current = requestAnimationFrame(loop); return; }

      s.vel += 0.45; s.y += s.vel;
      s.angle = Math.max(-0.5, Math.min(1.2, s.vel * 0.08));

      // Spawn pipes
      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        s.spawnTimer = 85;
        const top = 60 + Math.random() * (H - 60 - GAP - 100);
        s.pipes.push({ x: W + PIPE_W, top });
      }

      // Move pipes & score
      s.pipes.forEach(p => { p.x -= 2.8; });
      const passed = s.pipes.filter(p => p.x + PIPE_W < 90 - 5 && p.x + PIPE_W >= 90 - 5 - 2.8);
      if (passed.length) { s.score += passed.length; setDisplay(s.score); }
      s.pipes = s.pipes.filter(p => p.x > -PIPE_W - 5);

      // Collision
      const hit = s.y - BIRD_R < 0 || s.y + BIRD_R > H - 60
        || s.pipes.some(p => 90 + BIRD_R - 5 > p.x && 90 - BIRD_R + 5 < p.x + PIPE_W
            && (s.y - BIRD_R + 4 < p.top || s.y + BIRD_R - 4 > p.top + GAP));

      if (hit) { s.alive = false; setDead(true); onScore?.(s.score); return; }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    draw();
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [gameStarted, gameKey, flap, draw, onScore]);

  const reset = () => { st.current = { y: H/2, vel: 0, angle: 0, pipes: [], score: 0, alive: true, frame: 0, started: false, spawnTimer: 90 }; setDisplay(0); setDead(false); };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10"
          style={{ maxWidth: "100%", touchAction: "none" }}
          onClick={flap} onTouchStart={(e) => { e.preventDefault(); flap(); }}
        />
        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl gap-4">
            <span className="text-6xl">🐦</span>
            <p className="text-white font-black text-2xl">Flappy Oiseau</p>
            <p className="text-white/70 text-sm text-center">Clic / Espace / Tap pour voler<br/>Évite les tuyaux !</p>
            <button onClick={() => setGameStarted(true)} className="rounded-2xl bg-yellow-400 px-8 py-3 font-black text-slate-900">Jouer !</button>
          </div>
        )}
        {gameStarted && !st.current.started && !dead && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white font-black text-xl bg-black/40 px-4 py-2 rounded-xl">Tape pour décoller !</p>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl gap-3">
            <span className="text-4xl">💀</span>
            <p className="text-white font-black text-2xl">Aïe !</p>
            <p className="text-yellow-400 text-3xl font-black">{display}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-yellow-400 px-6 py-2.5 font-black text-slate-900">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
