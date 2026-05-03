"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const W = 480, H = 480;
type Vec = { x: number; y: number };
type Ship = { x: number; y: number; vx: number; vy: number; angle: number; alive: boolean; invincible: number };
type Asteroid = { x: number; y: number; vx: number; vy: number; r: number; points: Vec[]; id: number };
type Bullet = { x: number; y: number; vx: number; vy: number; life: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number };

let aId = 0;
function randAsteroid(size = 40): Asteroid {
  const angle = Math.random() * Math.PI * 2;
  const side = Math.floor(Math.random() * 4);
  const x = side === 0 ? -50 : side === 1 ? W + 50 : Math.random() * W;
  const y = side === 2 ? -50 : side === 3 ? H + 50 : Math.random() * H;
  const spd = 0.5 + Math.random() * 1;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const r2 = size * (0.7 + Math.random() * 0.3);
    return { x: Math.cos(a) * r2, y: Math.sin(a) * r2 };
  });
  return { x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, r: size, points: pts, id: aId++ };
}

export function JeuAsteroides({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    ship: { x: W/2, y: H/2, vx: 0, vy: 0, angle: -Math.PI/2, alive: true, invincible: 0 } as Ship,
    asteroids: [randAsteroid(), randAsteroid(), randAsteroid(), randAsteroid()] as Asteroid[],
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    score: 0, lives: 3, level: 1,
    keys: { left: false, right: false, up: false, space: false },
    lastShot: 0, frame: 0, alive: true,
  });
  const [display, setDisplay] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const animRef = useRef(0);

  const explode = (x: number, y: number, n = 8) => {
    for (let i = 0; i < n; i++) st.current.particles.push({
      x, y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 30 + Math.random() * 20,
    });
  };

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 80; i++) {
      ctx.beginPath(); ctx.arc((i * 97 + 13) % W, (i * 53 + 7) % H, 0.8, 0, Math.PI*2); ctx.fill();
    }

    // Asteroids
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
    s.asteroids.forEach(a => {
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.beginPath(); ctx.moveTo(a.points[0].x, a.points[0].y);
      a.points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.stroke();
      ctx.restore();
    });

    // Bullets
    ctx.fillStyle = "#60a5fa"; ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 6;
    s.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 2.5, 0, Math.PI*2); ctx.fill(); });
    ctx.shadowBlur = 0;

    // Particles
    s.particles.forEach(p => {
      ctx.globalAlpha = p.life / 50;
      ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Ship
    if (s.ship.alive && (s.ship.invincible === 0 || Math.floor(s.frame / 5) % 2 === 0)) {
      ctx.save(); ctx.translate(s.ship.x, s.ship.y); ctx.rotate(s.ship.angle);
      ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-12, -10); ctx.lineTo(-8, 0); ctx.lineTo(-12, 10); ctx.closePath(); ctx.stroke();
      if (s.keys.up) {
        ctx.strokeStyle = `rgba(251,146,60,${0.5 + Math.sin(s.frame * 0.5) * 0.5})`;
        ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-18, 0); ctx.lineTo(-8, 5); ctx.stroke();
      }
      ctx.restore();
    }

    // HUD
    ctx.fillStyle = "#94a3b8"; ctx.font = "14px monospace";
    ctx.fillText(`${s.score}`, 10, 20);
    ctx.fillText(`❤️ ${s.lives}`, W - 60, 20);
    ctx.fillText(`Niv.${s.level}`, W/2 - 15, 20);
  }, []);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const k = st.current.keys;
      const d = e.type === "keydown";
      if (e.key === "ArrowLeft")  { k.left  = d; e.preventDefault(); }
      if (e.key === "ArrowRight") { k.right = d; e.preventDefault(); }
      if (e.key === "ArrowUp")    { k.up    = d; e.preventDefault(); }
      if (e.code === "Space")     { k.space = d; e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);

    const loop = () => {
      const s = st.current; if (!s.alive) return;
      s.frame++;

      // Ship
      const sh = s.ship;
      if (s.keys.left)  sh.angle -= 0.07;
      if (s.keys.right) sh.angle += 0.07;
      if (s.keys.up) { sh.vx += Math.cos(sh.angle) * 0.3; sh.vy += Math.sin(sh.angle) * 0.3; }
      sh.vx *= 0.985; sh.vy *= 0.985;
      sh.x = (sh.x + sh.vx + W) % W; sh.y = (sh.y + sh.vy + H) % H;
      if (sh.invincible > 0) sh.invincible--;

      // Shoot
      if (s.keys.space && s.frame - s.lastShot > 12) {
        s.bullets.push({ x: sh.x + Math.cos(sh.angle)*18, y: sh.y + Math.sin(sh.angle)*18,
          vx: Math.cos(sh.angle)*10 + sh.vx, vy: Math.sin(sh.angle)*10 + sh.vy, life: 45 });
        s.lastShot = s.frame;
      }
      s.bullets.forEach(b => { b.x = (b.x + b.vx + W) % W; b.y = (b.y + b.vy + H) % H; b.life--; });
      s.bullets = s.bullets.filter(b => b.life > 0);

      // Asteroids
      s.asteroids.forEach(a => { a.x = (a.x + a.vx + W) % W; a.y = (a.y + a.vy + H) % H; });

      // Bullet-asteroid
      s.bullets.forEach(b => {
        s.asteroids.forEach((a, ai) => {
          const d = Math.hypot(b.x - a.x, b.y - a.y);
          if (d < a.r) {
            b.life = 0; explode(a.x, a.y, 10);
            const pts = a.r > 30 ? 20 : a.r > 15 ? 50 : 100;
            s.score += pts * s.level; setDisplay(prev => ({ ...prev, score: s.score }));
            if (a.r > 20) {
              for (let k = 0; k < 2; k++) {
                const na = randAsteroid(a.r * 0.55);
                na.x = a.x; na.y = a.y; s.asteroids.push(na);
              }
            }
            s.asteroids.splice(ai, 1);
          }
        });
      });

      // Ship-asteroid collision
      if (sh.alive && sh.invincible === 0) {
        s.asteroids.forEach(a => {
          if (Math.hypot(sh.x - a.x, sh.y - a.y) < a.r + 12) {
            s.lives--; explode(sh.x, sh.y, 15); setDisplay({ score: s.score, lives: s.lives });
            if (s.lives <= 0) { s.alive = false; setDead(true); onScore?.(s.score); return; }
            sh.x = W/2; sh.y = H/2; sh.vx = 0; sh.vy = 0; sh.invincible = 90;
          }
        });
      }

      if (!s.asteroids.length) {
        s.level++; for (let i = 0; i < 3 + s.level; i++) s.asteroids.push(randAsteroid());
      }

      s.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
      s.particles = s.particles.filter(p => p.life > 0);
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    draw();
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); cancelAnimationFrame(animRef.current); };
  }, [started, gameKey, draw, onScore]);

  const reset = () => {
    const s = st.current;
    Object.assign(s, { ship: { x: W/2, y: H/2, vx:0, vy:0, angle:-Math.PI/2, alive:true, invincible:0 },
      asteroids: [randAsteroid(),randAsteroid(),randAsteroid(),randAsteroid()],
      bullets:[], particles:[], score:0, lives:3, level:1, alive:true, frame:0, lastShot:0,
      keys:{left:false,right:false,up:false,space:false} });
    setDisplay({ score:0, lives:3 }); setDead(false);
  };

  // Touch
  const touch = useRef<{cx:number;cy:number}|null>(null);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.touches[0].clientX - touch.current.cx;
    const dy = e.touches[0].clientY - touch.current.cy;
    st.current.ship.angle = Math.atan2(dy, dx);
    st.current.keys.up = Math.hypot(dx, dy) > 20;
    if (st.current.frame - st.current.lastShot > 18) {
      const sh = st.current.ship;
      st.current.bullets.push({ x: sh.x + Math.cos(sh.angle)*18, y: sh.y + Math.sin(sh.angle)*18, vx: Math.cos(sh.angle)*10, vy: Math.sin(sh.angle)*10, life: 45 });
      st.current.lastShot = st.current.frame;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10" style={{ maxWidth: "100%", touchAction: "none" }}
          onTouchStart={e => { touch.current = { cx: e.touches[0].clientX, cy: e.touches[0].clientY }; }}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => { st.current.keys.up = false; touch.current = null; }}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl gap-4">
            <span className="text-6xl">🚀</span>
            <p className="text-white font-black text-2xl">Astéroïdes</p>
            <p className="text-white/60 text-sm text-center">← → Tourner · ↑ Propulser<br/>Espace = Tirer</p>
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-blue-500 px-8 py-3 font-black text-white">Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-3">
            <p className="text-white font-black text-2xl">Détruit !</p>
            <p className="text-blue-400 text-3xl font-black">{display.score}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-blue-500 px-6 py-2.5 font-black text-white">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
