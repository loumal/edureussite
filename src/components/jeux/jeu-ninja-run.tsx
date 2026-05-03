"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 480, H = 220, GROUND = 170, PH = 50, PW = 30;

export function JeuNinjaRun({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    py: GROUND - PH, vy: 0, onGround: true, sliding: false, slideTimer: 0,
    speed: 5, score: 0, frame: 0, alive: true,
    obstacles: [] as { x: number; w: number; h: number; type: "low" | "high" | "hover" }[],
    spawnTimer: 0, spawnInterval: 90, coins: [] as { x: number; y: number; collected: boolean }[],
    bgX: 0, bgX2: W,
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);

  const jump = useCallback(() => {
    const s = st.current;
    if (!s.alive) return;
    if (s.onGround) { s.vy = -14; s.onGround = false; SFX.select(); }
    s.sliding = false;
  }, []);

  const slide = useCallback(() => {
    const s = st.current;
    if (!s.onGround || !s.alive) return;
    s.sliding = true; s.slideTimer = 30; SFX.tick();
  }, []);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // BG scrolling
    s.bgX -= s.speed * 0.5; s.bgX2 -= s.speed * 0.5;
    if (s.bgX < -W) s.bgX = s.bgX2 + W;
    if (s.bgX2 < -W) s.bgX2 = s.bgX + W;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0f172a"); sky.addColorStop(1, "#1e3a5f");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Moving background elements
    [s.bgX, s.bgX2].forEach(bx => {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      [40,120,200,300,380].forEach(x => { ctx.fillRect(bx + x, 20, 60, 15); });
      ctx.fillStyle = "#1e4d2b";
      [0,100,200,300,400].forEach(x => { ctx.fillRect(bx + x, GROUND, 80, 50); });
    });

    // Ground
    ctx.fillStyle = "#14532d"; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = "#166534"; ctx.fillRect(0, GROUND, W, 4);

    // Score counter
    s.score = Math.floor(s.frame / 5);
    if (s.frame % 30 === 0) { onScore?.(s.score); setScore(s.score); }

    // Spawn
    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      s.spawnInterval = Math.max(45, 90 - s.frame / 200);
      const type = Math.random() < 0.5 ? "low" : Math.random() < 0.5 ? "high" : "hover";
      if (type === "low") s.obstacles.push({ x: W + 20, w: 25, h: 45, type });
      else if (type === "high") s.obstacles.push({ x: W + 20, w: 20, h: 70, type });
      else s.obstacles.push({ x: W + 20, w: 30, h: 25, type: "hover" });
      if (Math.random() < 0.4) s.coins.push({ x: W + 60, y: GROUND - 80, collected: false });
    }

    // Update player
    if (!s.onGround) { s.vy += 0.7; s.py += s.vy; }
    if (s.py >= GROUND - PH) { s.py = GROUND - PH; s.vy = 0; s.onGround = true; }
    if (s.sliding) { s.slideTimer--; if (s.slideTimer <= 0) s.sliding = false; }
    s.speed = 5 + s.frame / 500;

    // Obstacles
    s.obstacles.forEach(o => {
      o.x -= s.speed;
      const oy = o.type === "hover" ? GROUND - 80 : GROUND - o.h;
      ctx.fillStyle = o.type === "high" ? "#7c3aed" : o.type === "hover" ? "#dc2626" : "#b45309";
      ctx.beginPath(); ctx.roundRect(o.x, oy, o.w, o.h, 4); ctx.fill();
      ctx.font = "20px serif"; ctx.textAlign = "center";
      ctx.fillText(o.type === "hover" ? "⚡" : "🌵", o.x + o.w/2, oy + o.h/2 + 6);

      // Collision
      const ph = s.sliding ? PH / 2 : PH, py = s.sliding ? GROUND - ph : s.py;
      if (o.x < 60 + PW && o.x + o.w > 30 && oy < py + ph && oy + o.h > py) {
        s.alive = false; SFX.lose(); setDead(true);
      }
    });
    s.obstacles = s.obstacles.filter(o => o.x > -50);

    // Coins
    s.coins.forEach(c => {
      c.x -= s.speed;
      if (!c.collected) {
        const ph = s.sliding ? PH / 2 : PH, py = s.sliding ? GROUND - ph : s.py;
        if (Math.abs(c.x - 45) < 25 && Math.abs(c.y - py) < ph) {
          c.collected = true; s.score += 20; SFX.correct(); setScore(s.score);
        }
        ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
      }
    });
    s.coins = s.coins.filter(c => c.x > -20 && !c.collected);

    // Player
    const ph = s.sliding ? PH * 0.5 : PH;
    const py = s.sliding ? GROUND - ph : s.py;
    const flip = Math.floor(s.frame / 4) % 2;
    ctx.fillStyle = "#1e1b4b"; ctx.beginPath(); ctx.roundRect(30, py, PW, ph, 6); ctx.fill();
    ctx.fillStyle = "#818cf8"; ctx.fillRect(30, py, PW, ph * 0.4);
    ctx.font = `${s.sliding ? 24 : 30}px serif`;
    ctx.fillText("🥷", 30 + PW/2, py + ph * 0.6 + 10);

    // HUD
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`⭐ ${s.score}`, 10, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === " " || e.key === "w") jump();
      if (e.key === "ArrowDown" || e.key === "s") slide();
      e.preventDefault();
    };
    const onTouch = (e: TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const ty = e.touches[0].clientY - rect.top;
      if (ty < H / 2) jump(); else slide();
    };
    cv.addEventListener("click", jump);
    cv.addEventListener("touchstart", onTouch);
    window.addEventListener("keydown", onKey);
    return () => { cv.removeEventListener("click", jump); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [jump, slide]);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white/70 text-sm text-center">Clic / ↑ pour sauter · ↓ pour glisser<br />Évite les obstacles !</p>
            <button onClick={start} className="rounded-2xl bg-gradient-to-r from-gray-800 to-slate-700 px-8 py-3 text-white font-black">🥷 Courir !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{score} pts</p>
            <button onClick={() => {
              const s = st.current; s.py=GROUND-PH; s.vy=0; s.onGround=true; s.sliding=false; s.speed=5;
              s.score=0; s.frame=0; s.alive=true; s.obstacles=[]; s.coins=[]; s.spawnTimer=0; s.spawnInterval=90;
              setScore(0); setDead(false); setStarted(true); animRef.current = requestAnimationFrame(loop);
            }} className="rounded-2xl bg-slate-700 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Clic/Espace pour sauter · Bas pour glisser</p>
    </div>
  );
}
