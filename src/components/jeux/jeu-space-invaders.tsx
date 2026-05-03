"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const W = 400, H = 500, PLAYER_W = 40, PLAYER_H = 24, BULLET_R = 3;
const ALIEN_COLS = 8, ALIEN_ROWS = 4, ALIEN_W = 32, ALIEN_H = 24;

type Bullet = { x: number; y: number; vel: number };
type Alien  = { x: number; y: number; alive: boolean; type: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };

export function JeuSpaceInvaders({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    px: W / 2, bullets: [] as Bullet[], alienBullets: [] as Bullet[],
    aliens: [] as Alien[], alienDir: 1, alienStep: 0, alienTimer: 0,
    particles: [] as Particle[],
    score: 0, lives: 3, level: 1, alive: true, frame: 0,
    keys: { left: false, right: false, space: false },
    lastShot: 0, alienShootTimer: 60,
  });
  const [display, setDisplay] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const animRef = useRef(0);

  const initAliens = (level: number) => {
    const aliens: Alien[] = [];
    for (let r = 0; r < ALIEN_ROWS; r++) for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({ x: 30 + c * 44, y: 50 + r * 38, alive: true, type: r < 1 ? 2 : r < 3 ? 1 : 0 });
    }
    return aliens;
  };

  const explode = (x: number, y: number, color: string) => {
    const p = st.current.particles;
    for (let i = 0; i < 8; i++) {
      p.push({ x, y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 20, color });
    }
  };

  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;
    ctx.fillStyle = "#000814"; ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 73 + s.frame * 0.1) % W), sy = (i * 47 + (s.frame * (i % 3 === 0 ? 0.2 : 0.1))) % H;
      ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // Aliens
    s.aliens.forEach(a => {
      if (!a.alive) return;
      const wobble = Math.sin(s.frame * 0.1 + a.x) * 1.5;
      ctx.save(); ctx.translate(a.x, a.y + wobble);
      if (a.type === 2) {
        ctx.fillStyle = "#a855f7";
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#7c3aed";
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(Math.cos(i*Math.PI/3)*14, Math.sin(i*Math.PI/3)*14, 4, 0, Math.PI*2); ctx.fill(); }
      } else if (a.type === 1) {
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(-12, -8, 24, 16);
        ctx.fillStyle = "#0891b2";
        ctx.fillRect(-16, -4, 6, 8); ctx.fillRect(10, -4, 6, 8);
        ctx.fillRect(-6, -14, 12, 6);
      } else {
        ctx.fillStyle = "#4ade80";
        ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(0, -10); ctx.lineTo(12, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#166534";
        ctx.fillRect(-8, 0, 6, 8); ctx.fillRect(2, 0, 6, 8);
        ctx.beginPath(); ctx.arc(0, -2, 5, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    // Player bullets
    s.bullets.forEach(b => {
      ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 8;
      ctx.fillStyle = "#60a5fa"; ctx.beginPath(); ctx.rect(b.x - 2, b.y - 8, 4, 12); ctx.fill();
    });

    // Alien bullets
    s.alienBullets.forEach(b => {
      ctx.shadowColor = "#f87171"; ctx.shadowBlur = 6;
      ctx.fillStyle = "#f87171"; ctx.beginPath(); ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI*2); ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Particles
    s.particles.forEach(p => {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    const px = s.px;
    ctx.fillStyle = s.alive ? "#3b82f6" : "#ef4444";
    ctx.beginPath(); ctx.moveTo(px, H - 50); ctx.lineTo(px - PLAYER_W/2, H - 30); ctx.lineTo(px + PLAYER_W/2, H - 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(px - PLAYER_W/2, H - 30, PLAYER_W, PLAYER_H);
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath(); ctx.arc(px, H - 22, 8, 0, Math.PI*2); ctx.fill();
    // Thruster
    if (s.keys.left || s.keys.right) {
      ctx.fillStyle = `rgba(251,146,60,${0.5 + Math.sin(s.frame*0.5)*0.3})`;
      ctx.beginPath(); ctx.moveTo(px-8, H-8); ctx.lineTo(px, H+10); ctx.lineTo(px+8, H-8); ctx.closePath(); ctx.fill();
    }

    // HUD
    ctx.fillStyle = "#94a3b8"; ctx.font = "14px monospace";
    ctx.fillText(`Score: ${s.score}`, 10, 20);
    ctx.fillText(`Vies: ${"❤️".repeat(s.lives)}`, W - 90, 20);
    ctx.fillText(`Niveau: ${s.level}`, W/2 - 30, 20);
  }, []);

  useEffect(() => {
    if (!started) return;
    const s = st.current;
    s.aliens = initAliens(s.level);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  s.keys.left  = e.type === "keydown";
      if (e.key === "ArrowRight") s.keys.right = e.type === "keydown";
      if (e.code === "Space") { s.keys.space = e.type === "keydown"; e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", onKey);

    const loop = () => {
      if (!s.alive) return;
      s.frame++;

      // Move player
      if (s.keys.left  && s.px > PLAYER_W/2)    s.px -= 3.5;
      if (s.keys.right && s.px < W - PLAYER_W/2) s.px += 3.5;

      // Shoot
      if (s.keys.space && s.frame - s.lastShot > 18) {
        s.bullets.push({ x: s.px, y: H - 50, vel: -10 });
        s.lastShot = s.frame;
      }

      // Move player bullets
      s.bullets.forEach(b => { b.y += b.vel; });
      s.bullets = s.bullets.filter(b => b.y > 0);

      // Alien movement
      s.alienTimer++;
      const speed = Math.max(4, 24 - s.level * 2 - Math.floor((ALIEN_COLS * ALIEN_ROWS - s.aliens.filter(a => a.alive).length) / 4));
      if (s.alienTimer >= speed) {
        s.alienTimer = 0;
        s.alienStep++;
        const liveAliens = s.aliens.filter(a => a.alive);
        const minX = Math.min(...liveAliens.map(a => a.x));
        const maxX = Math.max(...liveAliens.map(a => a.x));
        let drop = false;
        if ((s.alienDir === 1 && maxX > W - 20) || (s.alienDir === -1 && minX < 20)) {
          s.alienDir *= -1; drop = true;
        }
        s.aliens.forEach(a => {
          if (!a.alive) return;
          a.x += s.alienDir * 8;
          if (drop) a.y += 16;
        });
      }

      // Alien shoot
      s.alienShootTimer--;
      if (s.alienShootTimer <= 0) {
        s.alienShootTimer = Math.max(20, 50 - s.level * 5);
        const live = s.aliens.filter(a => a.alive);
        if (live.length) {
          const shooter = live[Math.floor(Math.random() * live.length)];
          s.alienBullets.push({ x: shooter.x, y: shooter.y, vel: 3 + s.level * 0.5 });
        }
      }
      s.alienBullets.forEach(b => { b.y += b.vel; });
      s.alienBullets = s.alienBullets.filter(b => b.y < H);

      // Bullet-alien collisions
      s.bullets.forEach(b => {
        s.aliens.forEach(a => {
          if (!a.alive) return;
          if (Math.abs(b.x - a.x) < 18 && Math.abs(b.y - a.y) < 16) {
            a.alive = false; b.y = -100;
            const pts = (a.type + 1) * 10 * s.level;
            s.score += pts; setDisplay({ score: s.score, lives: s.lives });
            explode(a.x, a.y, a.type === 2 ? "#a855f7" : a.type === 1 ? "#22d3ee" : "#4ade80");
          }
        });
      });

      // Alien bullet-player collision
      s.alienBullets.forEach(b => {
        if (Math.abs(b.x - s.px) < PLAYER_W/2 && b.y > H - 50 && b.y < H - 10) {
          b.y = H + 100; s.lives--;
          explode(s.px, H - 30, "#3b82f6");
          setDisplay({ score: s.score, lives: s.lives });
          if (s.lives <= 0) { s.alive = false; setDead(true); onScore?.(s.score); return; }
        }
      });

      // Alien reaches bottom
      if (s.aliens.some(a => a.alive && a.y > H - 80)) {
        s.alive = false; setDead(true); onScore?.(s.score); return;
      }

      // Level clear
      if (!s.aliens.some(a => a.alive)) {
        s.level++; s.aliens = initAliens(s.level); s.alienStep = 0;
      }

      // Particles
      s.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
      s.particles = s.particles.filter(p => p.life > 0);

      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    draw();
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); cancelAnimationFrame(animRef.current); };
  }, [started, gameKey, draw, onScore]);

  const reset = () => { const s = st.current; s.px = W/2; s.bullets = []; s.alienBullets = []; s.aliens = initAliens(1); s.alienDir = 1; s.score = 0; s.lives = 3; s.level = 1; s.alive = true; s.frame = 0; s.particles = []; s.lastShot = 0; s.alienTimer = 0; s.alienStep = 0; s.alienShootTimer = 60; setDisplay({ score: 0, lives: 3 }); setDead(false); };

  // Touch move
  const handleTouch = (e: React.TouchEvent) => {
    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return;
    st.current.px = e.touches[0].clientX - rect.left;
    if (st.current.frame - st.current.lastShot > 18) {
      st.current.bullets.push({ x: st.current.px, y: H - 50, vel: -10 });
      st.current.lastShot = st.current.frame;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-xl border border-white/10"
          style={{ maxWidth: "100%", touchAction: "none" }}
          onTouchMove={handleTouch}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl gap-4">
            <span className="text-6xl">👾</span>
            <p className="text-white font-black text-2xl">Space Invaders</p>
            <p className="text-white/60 text-sm text-center">← → Déplacer · Espace Tirer<br/>Glisse sur mobile pour viser</p>
            <button onClick={() => setStarted(true)} className="rounded-2xl bg-purple-500 px-8 py-3 font-black text-white">Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-xl gap-3">
            <p className="text-white font-black text-2xl">Game Over !</p>
            <p className="text-purple-400 text-3xl font-black">{display.score}</p>
            <button onClick={() => { reset(); setGameKey(k => k + 1); }} className="rounded-2xl bg-purple-500 px-6 py-2.5 font-black text-white">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
