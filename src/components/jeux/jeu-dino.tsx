"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const W = 600, H = 200, GROUND = 160, DINO_W = 50, DINO_H = 55;

export function JeuDino({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    dinoY: GROUND - DINO_H,
    velY: 0,
    score: 0,
    speed: 5,
    obstacles: [] as { x: number; w: number; h: number }[],
    birds: [] as { x: number; y: number }[],
    frame: 0,
    alive: true,
    spawnTimer: 0,
    jumpCount: 0,
    day: true,
  });
  const [display, setDisplay] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const animRef = useRef(0);

  const jump = useCallback(() => {
    const s = st.current;
    if (!s.alive) return;
    if (s.jumpCount < 2) { s.velY = -14; s.jumpCount++; }
  }, []);

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;
    const bg = s.day ? "#f0f9ff" : "#0f172a";
    const fg = s.day ? "#1e293b" : "#e2e8f0";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Ground
    ctx.fillStyle = s.day ? "#94a3b8" : "#475569";
    ctx.fillRect(0, GROUND, W, 2);

    // Clouds
    ctx.fillStyle = s.day ? "rgba(148,163,184,0.5)" : "rgba(255,255,255,0.1)";
    [{ x: (s.frame * 0.3) % (W + 100) - 100, y: 30 }, { x: (s.frame * 0.2 + 300) % (W + 100) - 100, y: 50 }].forEach(c => {
      ctx.beginPath(); ctx.ellipse(c.x, c.y, 40, 16, 0, 0, Math.PI * 2); ctx.fill();
    });

    // Dino
    const leg = Math.floor(s.frame / 5) % 2 === 0;
    ctx.fillStyle = s.alive ? "#16a34a" : "#ef4444";
    // Body
    ctx.beginPath(); ctx.roundRect(10, s.dinoY + 10, DINO_W - 10, DINO_H - 10, 6); ctx.fill();
    // Head
    ctx.fillStyle = "#16a34a";
    ctx.beginPath(); ctx.roundRect(20, s.dinoY, 30, 28, 5); ctx.fill();
    // Eye
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(42, s.dinoY + 10, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(44, s.dinoY + 10, 2.5, 0, Math.PI * 2); ctx.fill();
    // Legs
    if (s.dinoY < GROUND - DINO_H - 2) {
      ctx.fillStyle = "#15803d";
      ctx.fillRect(15, s.dinoY + DINO_H - 2, 8, 16);
      ctx.fillRect(30, s.dinoY + DINO_H - 2, 8, 16);
    } else {
      ctx.fillStyle = "#15803d";
      ctx.fillRect(leg ? 15 : 25, s.dinoY + DINO_H - 2, 8, 16);
      ctx.fillRect(leg ? 30 : 18, s.dinoY + DINO_H - 2, 8, 16);
    }
    // Tail
    ctx.fillStyle = "#16a34a";
    ctx.beginPath(); ctx.moveTo(10, s.dinoY + 20); ctx.lineTo(-10, s.dinoY + 35); ctx.lineTo(10, s.dinoY + 40); ctx.closePath(); ctx.fill();

    // Obstacles (cactus)
    ctx.fillStyle = "#15803d";
    s.obstacles.forEach(o => {
      ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
      // Arms
      ctx.fillRect(o.x - 8, GROUND - o.h + 15, 8, 10);
      ctx.fillRect(o.x + o.w, GROUND - o.h + 20, 8, 10);
      ctx.fillRect(o.x - 8, GROUND - o.h + 5, 4, 10);
      ctx.fillRect(o.x + o.w + 4, GROUND - o.h + 10, 4, 10);
    });

    // Birds
    ctx.fillStyle = "#7c3aed";
    s.birds.forEach(b => {
      const wing = Math.sin(s.frame * 0.3) * 8;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x + 12, b.y - wing, b.x + 24, b.y);
      ctx.quadraticCurveTo(b.x + 36, b.y + wing, b.x + 48, b.y);
      ctx.lineWidth = 3; ctx.strokeStyle = "#7c3aed"; ctx.stroke();
    });

    // Score
    ctx.fillStyle = fg; ctx.font = "bold 18px monospace";
    ctx.fillText(`${String(s.score).padStart(6, "0")}`, W - 110, 30);
  }, []);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") { jump(); e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    const loop = () => {
      const s = st.current; if (!s.alive) return;
      s.frame++;
      s.score = Math.floor(s.frame / 6);
      setDisplay(s.score);
      s.speed = 5 + s.score / 200;
      s.day = Math.floor(s.score / 300) % 2 === 0;

      // Physics
      s.velY += 0.8;
      s.dinoY += s.velY;
      if (s.dinoY >= GROUND - DINO_H) { s.dinoY = GROUND - DINO_H; s.velY = 0; s.jumpCount = 0; }

      // Spawn
      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        s.spawnTimer = 60 + Math.floor(Math.random() * 80) - Math.min(s.score / 30, 30);
        if (Math.random() < 0.3 && s.score > 150) {
          s.birds.push({ x: W + 10, y: GROUND - 70 - Math.random() * 40 });
        } else {
          const h = 40 + Math.random() * 40;
          s.obstacles.push({ x: W + 10, w: 20 + Math.random() * 15, h });
        }
      }

      // Move obstacles
      s.obstacles.forEach(o => { o.x -= s.speed; });
      s.birds.forEach(b => { b.x -= s.speed + 1; });
      s.obstacles = s.obstacles.filter(o => o.x > -60);
      s.birds = s.birds.filter(b => b.x > -60);

      // Collision
      const dx = 10, bx = 22, by = s.dinoY + 10;
      const hit = s.obstacles.some(o => bx + DINO_W - 14 > o.x + 2 && bx + 2 < o.x + o.w - 2 && by + DINO_H - 14 > GROUND - o.h && by + 2 < GROUND)
        || s.birds.some(b => bx + DINO_W - 14 > b.x + 4 && bx + 4 < b.x + 44 && by + 10 > b.y - 10 && by < b.y + 20);

      if (hit) { s.alive = false; setDead(true); onScore?.(s.score); return; }
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    draw();
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [started, gameKey, jump, draw, onScore]);

  const reset = () => {
    st.current = { dinoY: GROUND - DINO_H, velY: 0, score: 0, speed: 5, obstacles: [], birds: [], frame: 0, alive: true, spawnTimer: 80, jumpCount: 0, day: true };
    setDisplay(0); setDead(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ maxWidth: "100%", overflow: "hidden" }}>
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10"
          style={{ maxWidth: "100%", touchAction: "none" }}
          onClick={jump}
          onTouchStart={(e) => { e.preventDefault(); jump(); }}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl gap-4">
            <span className="text-6xl">🦕</span>
            <p className="text-white font-black text-2xl">Dino Saut</p>
            <p className="text-white/60 text-sm">Espace / Clic / Tap pour sauter<br/>Double saut disponible !</p>
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-green-500 px-8 py-3 font-black text-white">Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl gap-3">
            <span className="text-4xl">💀</span>
            <p className="text-white font-black text-xl">Game Over !</p>
            <p className="text-green-400 text-3xl font-black">{display}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-green-500 px-6 py-2.5 font-black text-white">Rejouer</button>
          </div>
        )}
      </div>
      {started && !dead && <p className="text-white/50 text-xs">Espace ou Clic pour sauter · Double saut possible</p>}
    </div>
  );
}
