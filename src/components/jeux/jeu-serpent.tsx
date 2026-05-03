"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const CELL = 22;
const COLS = 20;
const ROWS = 18;
const W = CELL * COLS;
const H = CELL * ROWS;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Pt = { x: number; y: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

const SNAKE_COLORS = [
  { head: "#00f5d4", body: "#0891b2" },
  { head: "#a855f7", body: "#7c3aed" },
  { head: "#f97316", body: "#dc2626" },
  { head: "#22c55e", body: "#16a34a" },
];
const FOOD_COLORS = ["#ef4444", "#f97316", "#eab308", "#ec4899", "#8b5cf6"];

function rand(max: number) { return Math.floor(Math.random() * max); }

export function JeuSerpent({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const colorIdx = useRef(0);
  const particles = useRef<Particle[]>([]);
  const foodColor = useRef(FOOD_COLORS[0]);
  const foodPulse = useRef(0);

  const state = useRef({
    snake: [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }] as Pt[],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    food: { x: 15, y: 9 } as Pt,
    score: 0,
    alive: true,
    speed: 140,
    lastTime: 0,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [scoreAnim, setScoreAnim] = useState(false);
  const animRef = useRef<number>(0);
  const [gameKey, setGameKey] = useState(0);

  const placeFood = useCallback((snake: Pt[]) => {
    let pos: Pt;
    do { pos = { x: rand(COLS), y: rand(ROWS) }; }
    while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    foodColor.current = FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)];
    return pos;
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      particles.current.push({
        x: x * CELL + CELL / 2,
        y: y * CELL + CELL / 2,
        vx: Math.cos(angle) * (2 + Math.random() * 3),
        vy: Math.sin(angle) * (2 + Math.random() * 3),
        life: 1,
        color,
      });
    }
  }, []);

  const reset = useCallback(() => {
    const s = state.current;
    colorIdx.current = (colorIdx.current + 1) % SNAKE_COLORS.length;
    s.snake = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }];
    s.dir = "RIGHT"; s.nextDir = "RIGHT";
    s.food = { x: 15, y: 9 };
    foodColor.current = FOOD_COLORS[0];
    s.score = 0; s.alive = true; s.speed = 140; s.lastTime = 0;
    particles.current = [];
    setDisplayScore(0); setDead(false);
  }, []);

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const s = state.current;
    const { head: headColor, body: bodyColor } = SNAKE_COLORS[colorIdx.current];

    // Background with gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0f1e");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.025)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

    // Border glow
    ctx.shadowColor = headColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = headColor + "30";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, H);
    ctx.shadowBlur = 0;

    // Particles
    particles.current = particles.current.filter(p => p.life > 0);
    for (const p of particles.current) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.06;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // Food with pulsing glow
    foodPulse.current = (foodPulse.current + 0.08) % (Math.PI * 2);
    const pulse = 8 + Math.sin(foodPulse.current) * 4;
    const fx = s.food.x * CELL + CELL / 2;
    const fy = s.food.y * CELL + CELL / 2;
    ctx.shadowColor = foodColor.current; ctx.shadowBlur = pulse;
    ctx.fillStyle = foodColor.current;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Snake body with gradient
    s.snake.forEach((seg, i) => {
      const ratio = 1 - i / Math.max(s.snake.length, 1);
      const r1 = parseInt(headColor.slice(1, 3), 16);
      const g1 = parseInt(headColor.slice(3, 5), 16);
      const b1 = parseInt(headColor.slice(5, 7), 16);
      const r2 = parseInt(bodyColor.slice(1, 3), 16);
      const g2 = parseInt(bodyColor.slice(3, 5), 16);
      const b2 = parseInt(bodyColor.slice(5, 7), 16);
      const r = Math.round(r2 + (r1 - r2) * ratio);
      const g = Math.round(g2 + (g1 - g2) * ratio);
      const b = Math.round(b2 + (b1 - b2) * ratio);
      const color = `rgb(${r},${g},${b})`;

      if (i === 0) {
        ctx.shadowColor = headColor; ctx.shadowBlur = 12;
      }
      ctx.fillStyle = color;
      const radius = i === 0 ? 7 : 4;
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, radius);
      ctx.fill();
      if (i === 0) ctx.shadowBlur = 0;

      // Highlight on body
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, 4, [radius, radius, 0, 0]);
      ctx.fill();
    });

    // Eyes on head
    const head = s.snake[0];
    const ex1 = head.x * CELL + (s.dir === "LEFT" ? 4 : s.dir === "RIGHT" ? CELL - 7 : CELL / 2 - 4);
    const ey1 = head.y * CELL + (s.dir === "UP" ? 4 : s.dir === "DOWN" ? CELL - 7 : CELL / 2 - 4);
    const ex2 = head.x * CELL + (s.dir === "LEFT" ? 4 : s.dir === "RIGHT" ? CELL - 7 : CELL / 2 + 1);
    const ey2 = head.y * CELL + (s.dir === "UP" ? 4 : s.dir === "DOWN" ? CELL - 7 : CELL / 2 + 1);

    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(ex1 - 0.5, ey1 - 0.5, 1, 0, Math.PI * 2); ctx.fill();

    if (s.dir === "UP" || s.dir === "DOWN") {
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ex2 - 0.5, ey2 - 0.5, 1, 0, Math.PI * 2); ctx.fill();
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const s = state.current;
      if (e.key === "ArrowUp"    && s.dir !== "DOWN")  s.nextDir = "UP";
      if (e.key === "ArrowDown"  && s.dir !== "UP")    s.nextDir = "DOWN";
      if (e.key === "ArrowLeft"  && s.dir !== "RIGHT") s.nextDir = "LEFT";
      if (e.key === "ArrowRight" && s.dir !== "LEFT")  s.nextDir = "RIGHT";
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);

    const loop = (time: number) => {
      const s = state.current;
      if (!s.alive) return;

      // Always redraw for particles/pulse
      draw();

      if (time - s.lastTime >= s.speed) {
        s.lastTime = time;
        s.dir = s.nextDir;
        const head = s.snake[0];
        const next = {
          x: (head.x + (s.dir === "RIGHT" ? 1 : s.dir === "LEFT" ? -1 : 0) + COLS) % COLS,
          y: (head.y + (s.dir === "DOWN"  ? 1 : s.dir === "UP"   ? -1 : 0) + ROWS) % ROWS,
        };
        if (s.snake.some((seg) => seg.x === next.x && seg.y === next.y)) {
          s.alive = false;
          spawnParticles(head.x, head.y, "#ef4444");
          setDead(true);
          setHighScore(prev => Math.max(prev, s.score));
          onScore?.(s.score);
          return;
        }
        s.snake.unshift(next);
        if (next.x === s.food.x && next.y === s.food.y) {
          s.score += 10;
          spawnParticles(next.x, next.y, foodColor.current);
          setDisplayScore(s.score);
          setScoreAnim(true); setTimeout(() => setScoreAnim(false), 300);
          s.food = placeFood(s.snake);
          if (s.speed > 60) s.speed -= 2;
        } else {
          s.snake.pop();
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [started, gameKey, draw, placeFood, spawnParticles, onScore]);

  const swipe = useRef<Pt | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swipe.current) return;
    const dx = e.changedTouches[0].clientX - swipe.current.x;
    const dy = e.changedTouches[0].clientY - swipe.current.y;
    const s = state.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && s.dir !== "LEFT")  s.nextDir = "RIGHT";
      if (dx < -20 && s.dir !== "RIGHT") s.nextDir = "LEFT";
    } else {
      if (dy > 20 && s.dir !== "UP")   s.nextDir = "DOWN";
      if (dy < -20 && s.dir !== "DOWN") s.nextDir = "UP";
    }
    swipe.current = null;
  };

  const { head: headColor } = SNAKE_COLORS[colorIdx.current];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Score bar */}
      <div className="flex items-center justify-between w-full max-w-[440px] px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">Score</span>
          <span className={`text-2xl font-black transition-all duration-150 ${scoreAnim ? "scale-125" : "scale-100"}`}
            style={{ color: headColor }}>
            {displayScore}
          </span>
        </div>
        {highScore > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-yellow-400/60">⭐ Record</span>
            <span className="text-sm font-black text-yellow-400/80">{highScore}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <canvas
          ref={canvas} width={W} height={H}
          className="rounded-2xl"
          style={{ maxWidth: "100%", touchAction: "none", boxShadow: `0 0 40px ${headColor}25, 0 8px 32px rgba(0,0,0,0.6)` }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        />

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl gap-4"
            style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(10,15,30,0.95) 100%)" }}>
            <div className="text-center space-y-1">
              <span className="text-7xl block">🐍</span>
              <p className="text-white font-black text-2xl">Serpent</p>
              <p className="text-white/50 text-xs">Mange • Grossis • Survie</p>
            </div>
            <div className="text-white/30 text-xs text-center space-y-0.5">
              <p>↑ ↓ ← → pour diriger</p>
              <p>Glisse sur mobile</p>
            </div>
            <button
              onClick={() => { draw(); setStarted(true); }}
              className="rounded-2xl px-10 py-3 text-base font-black text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${headColor}, ${headColor}aa)`, boxShadow: `0 8px 24px ${headColor}50` }}
            >
              Jouer !
            </button>
          </div>
        )}

        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl gap-4"
            style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(15,10,30,0.95) 100%)" }}>
            <span className="text-5xl">💀</span>
            <div className="text-center">
              <p className="text-white font-black text-xl">Game Over !</p>
              <p className="font-black text-3xl mt-1" style={{ color: headColor }}>{displayScore} pts</p>
              {displayScore >= highScore && displayScore > 0 && (
                <p className="text-yellow-400 text-sm font-bold animate-pulse mt-1">🏆 Nouveau record !</p>
              )}
            </div>
            <button
              onClick={() => { reset(); draw(); setGameKey(k => k + 1); }}
              className="rounded-2xl px-8 py-3 font-black text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${headColor}, ${headColor}aa)`, boxShadow: `0 8px 24px ${headColor}50` }}
            >
              Rejouer
            </button>
          </div>
        )}
      </div>

      {started && !dead && (
        <div className="grid grid-cols-3 gap-1.5 md:hidden w-full max-w-[180px]">
          {[
            [null, "UP", null],
            ["LEFT", "DOWN", "RIGHT"],
          ].map((row, ri) => (
            <div key={ri} className="contents">
              {row.map((dir, bi) => dir ? (
                <button key={bi}
                  className="rounded-xl bg-white/10 active:bg-white/25 flex items-center justify-center h-12 text-lg transition-colors"
                  onTouchStart={() => {
                    const s = state.current;
                    if (dir === "UP"    && s.dir !== "DOWN")  s.nextDir = "UP";
                    if (dir === "DOWN"  && s.dir !== "UP")    s.nextDir = "DOWN";
                    if (dir === "LEFT"  && s.dir !== "RIGHT") s.nextDir = "LEFT";
                    if (dir === "RIGHT" && s.dir !== "LEFT")  s.nextDir = "RIGHT";
                  }}>
                  {dir === "UP" ? "⬆️" : dir === "DOWN" ? "⬇️" : dir === "LEFT" ? "⬅️" : "➡️"}
                </button>
              ) : <div key={bi} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
