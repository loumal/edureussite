"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const W = 380, H = 480;
const FRUITS = [
  { emoji: "🍉", color: "#ef4444", pts: 10 },
  { emoji: "🍊", color: "#f97316", pts: 10 },
  { emoji: "🍋", color: "#facc15", pts: 15 },
  { emoji: "🍇", color: "#a855f7", pts: 15 },
  { emoji: "🍓", color: "#ec4899", pts: 20 },
  { emoji: "🥝", color: "#22c55e", pts: 20 },
  { emoji: "🍑", color: "#fb923c", pts: 25 },
  { emoji: "🍒", color: "#dc2626", pts: 25 },
];
type Fruit = { x: number; y: number; vx: number; vy: number; r: number; fruit: typeof FRUITS[0]; id: number; sliced: boolean; age: number };
type SliceTrail = { x: number; y: number; age: number };
type Splash = { x: number; y: number; color: string; pts: number; age: number };
let fId = 0;

function spawn(level: number): Fruit {
  const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const x = 40 + Math.random() * (W - 80);
  const spd = 8 + level * 0.5 + Math.random() * 3;
  return { x, y: H + 30, vx: (Math.random() - 0.5) * 3, vy: -spd, r: 26, fruit: f, id: fId++, sliced: false, age: 0 };
}

export function JeuFruitNinja({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    fruits: [] as Fruit[], bombs: [] as Fruit[],
    trail: [] as SliceTrail[], splashes: [] as Splash[],
    score: 0, lives: 3, level: 1,
    frame: 0, spawnTimer: 40, alive: true,
    mouse: { x: 0, y: 0, px: 0, py: 0, down: false },
  });
  const [display, setDisplay] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const animRef = useRef(0);

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;

    // Background
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#1c1917"); grd.addColorStop(1, "#292524");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // Slice trail
    if (s.trail.length > 1) {
      ctx.save(); ctx.lineCap = "round";
      for (let i = 1; i < s.trail.length; i++) {
        const alpha = (s.trail[i].age / 15);
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.8})`;
        ctx.lineWidth = (1 - alpha) * 8 + 1;
        ctx.beginPath(); ctx.moveTo(s.trail[i-1].x, s.trail[i-1].y); ctx.lineTo(s.trail[i].x, s.trail[i].y); ctx.stroke();
      }
      ctx.restore();
    }

    // Fruits
    s.fruits.forEach(f => {
      if (f.sliced) return;
      ctx.save(); ctx.translate(f.x, f.y);
      ctx.font = `${f.r * 1.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(f.fruit.emoji, 0, 0);
      ctx.restore();
    });

    // Bombs
    s.bombs.forEach(b => {
      if (b.sliced) return;
      ctx.save(); ctx.translate(b.x, b.y);
      ctx.font = `${b.r * 1.6}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("💣", 0, 0); ctx.restore();
    });

    // Splashes
    s.splashes.forEach(sp => {
      const alpha = 1 - sp.age / 30;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sp.color; ctx.font = "bold 20px Arial"; ctx.textAlign = "center";
      ctx.fillText(sp.pts > 0 ? `+${sp.pts}` : "💥", sp.x, sp.y - sp.age * 1.5);
      ctx.globalAlpha = 1;
    });

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 45);
    ctx.fillStyle = "#fff"; ctx.font = "bold 18px Arial";
    ctx.fillText(`${s.score}`, W/2 - 20, 28);
    ctx.fillText(`❤️`.repeat(s.lives), W - 80, 28);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "12px Arial";
    ctx.fillText(`Niv. ${s.level}`, 10, 28);
  }, []);

  useEffect(() => {
    if (!started) return;
    const rect = () => canvas.current!.getBoundingClientRect();

    const onMove = (e: MouseEvent) => {
      const r = rect(); const s = st.current;
      s.mouse.px = s.mouse.x; s.mouse.py = s.mouse.y;
      s.mouse.x = e.clientX - r.left; s.mouse.y = e.clientY - r.top;
      s.mouse.down = !!(e.buttons & 1);
      if (s.mouse.down) s.trail.push({ x: s.mouse.x, y: s.mouse.y, age: 0 });
    };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault(); const r = rect(); const s = st.current;
      const t = e.touches[0];
      s.mouse.px = s.mouse.x; s.mouse.py = s.mouse.y;
      s.mouse.x = t.clientX - r.left; s.mouse.y = t.clientY - r.top;
      s.mouse.down = true;
      s.trail.push({ x: s.mouse.x, y: s.mouse.y, age: 0 });
    };
    const cv = canvas.current;
    if (!cv) return;
    const onTouchEnd = () => { st.current.mouse.down = false; };
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("touchmove", onTouch, { passive: false });
    cv.addEventListener("touchstart", onTouch, { passive: false });
    cv.addEventListener("touchend", onTouchEnd);

    const loop = () => {
      const s = st.current; if (!s.alive) return;
      s.frame++;
      s.level = Math.floor(s.score / 100) + 1;

      // Spawn
      s.spawnTimer--;
      if (s.spawnTimer <= 0) {
        s.spawnTimer = Math.max(20, 45 - s.level * 3);
        if (Math.random() < 0.15) {
          const bx = 40 + Math.random() * (W - 80);
          s.bombs.push({ x: bx, y: H + 30, vx: (Math.random()-0.5)*2, vy: -(7 + Math.random()*3), r: 26, fruit: FRUITS[0], id: fId++, sliced: false, age: 0 });
        } else { s.fruits.push(spawn(s.level)); }
      }

      // Physics
      [...s.fruits, ...s.bombs].forEach(f => { f.vy += 0.2; f.x += f.vx; f.y += f.vy; f.age++; });
      // Miss detection
      const missed = s.fruits.filter(f => !f.sliced && f.y > H + 50);
      if (missed.length) {
        s.lives -= missed.length; setDisplay(prev => ({ ...prev, lives: s.lives }));
        if (s.lives <= 0) { s.alive = false; setDead(true); onScore?.(s.score); return; }
      }
      s.fruits = s.fruits.filter(f => f.y < H + 50);
      s.bombs = s.bombs.filter(b => b.y < H + 50);

      // Slice detection
      if (s.mouse.down) {
        const mx = s.mouse.x, my = s.mouse.y;
        s.fruits.forEach(f => {
          if (f.sliced) return;
          if (Math.hypot(f.x - mx, f.y - my) < f.r + 10) {
            f.sliced = true;
            s.score += f.fruit.pts * s.level; setDisplay(prev => ({ ...prev, score: s.score }));
            s.splashes.push({ x: f.x, y: f.y, color: f.fruit.color, pts: f.fruit.pts * s.level, age: 0 });
            onScore?.(s.score);
          }
        });
        s.bombs.forEach(b => {
          if (b.sliced) return;
          if (Math.hypot(b.x - mx, b.y - my) < b.r + 10) {
            b.sliced = true; s.lives--; setDisplay(prev => ({ ...prev, lives: s.lives }));
            s.splashes.push({ x: b.x, y: b.y, color: "#ef4444", pts: 0, age: 0 });
            if (s.lives <= 0) { s.alive = false; setDead(true); onScore?.(s.score); return; }
          }
        });
      }

      // Trail age
      s.trail.forEach(t => t.age++);
      s.trail = s.trail.filter(t => t.age < 15).slice(-20);
      s.splashes.forEach(sp => sp.age++);
      s.splashes = s.splashes.filter(sp => sp.age < 30);

      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      cv.removeEventListener("mousemove", onMove);
      cv.removeEventListener("touchmove", onTouch);
      cv.removeEventListener("touchstart", onTouch);
      cv.removeEventListener("touchend", onTouchEnd);
    };
  }, [started, gameKey, draw, onScore]);

  const reset = () => {
    const s = st.current;
    Object.assign(s, { fruits:[], bombs:[], trail:[], splashes:[], score:0, lives:3, level:1, frame:0, spawnTimer:40, alive:true, mouse:{x:0,y:0,px:0,py:0,down:false} });
    setDisplay({ score:0, lives:3 }); setDead(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ cursor: "crosshair" }}>
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10"
          style={{ maxWidth: "100%", touchAction: "none" }}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-xl gap-4">
            <span className="text-6xl">🍉</span>
            <p className="text-white font-black text-2xl">Fruit Ninja</p>
            <p className="text-white/60 text-sm text-center">Glisse pour trancher les fruits !<br/>Évite les 💣 bombes !</p>
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-red-500 px-8 py-3 font-black text-white">Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl gap-3">
            <p className="text-white font-black text-2xl">💥 Boom !</p>
            <p className="text-orange-400 text-3xl font-black">{display.score}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-red-500 px-6 py-2.5 font-black text-white">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
