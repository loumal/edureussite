"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 400, WATER_Y = 100;
const FISH = [
  { emoji: "🐟", pts: 10, size: 20, speed: 2, depth: 30 },
  { emoji: "🐠", pts: 20, size: 18, speed: 3, depth: 80 },
  { emoji: "🦈", pts: 50, size: 30, speed: 4, depth: 130 },
  { emoji: "🐡", pts: 30, size: 22, speed: 1.5, depth: 60 },
  { emoji: "🦑", pts: 40, size: 25, speed: 2.5, depth: 110 },
  { emoji: "🐙", pts: 60, size: 28, speed: 1, depth: 150 },
];

type Fish = { x: number; y: number; vx: number; type: number; id: number };
type Catch = { x: number; y: number; emoji: string; pts: number; life: number };

export function JeuFishing({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    lineY: WATER_Y, lineTarget: WATER_Y, reeling: false, hasHook: false,
    hookY: WATER_Y, fx: 0, fish: [] as Fish[], score: 0, timeLeft: 60,
    frame: 0, alive: true, catches: [] as Catch[], nextId: 0,
    caught: null as Fish | null, pull: 0, maxPull: 0,
  });
  const [info, setInfo] = useState({ score: 0, time: 60 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const throwLine = (y: number) => {
    const s = st.current;
    if (s.caught) return;
    s.hookY = WATER_Y; s.lineTarget = Math.min(H - 20, Math.max(WATER_Y, y));
    s.reeling = false; s.hasHook = true;
  };

  const reel = useCallback(() => {
    const s = st.current;
    if (!s.hasHook) return;
    s.reeling = true;
    if (s.caught) SFX.win();
    else SFX.tick();
  }, []);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, WATER_Y);
    sky.addColorStop(0, "#7dd3fc"); sky.addColorStop(1, "#38bdf8");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, WATER_Y);
    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    [[60,20,40],[180,30,35],[280,15,45]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.ellipse(x, y, r, r*0.5, 0, 0, Math.PI*2); ctx.fill(); });

    // Water
    const water = ctx.createLinearGradient(0, WATER_Y, 0, H);
    water.addColorStop(0, "#0369a1"); water.addColorStop(1, "#075985");
    ctx.fillStyle = water; ctx.fillRect(0, WATER_Y, W, H - WATER_Y);
    // Water shimmer
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const wx = (i * 60 + s.frame * 0.5) % (W + 40) - 20;
      ctx.beginPath(); ctx.moveTo(wx, WATER_Y + 10); ctx.bezierCurveTo(wx+15, WATER_Y+5, wx+25, WATER_Y+15, wx+40, WATER_Y+10); ctx.stroke();
    }

    // Pier
    ctx.fillStyle = "#854d0e"; ctx.fillRect(0, WATER_Y - 15, 60, 15); ctx.fillRect(20, WATER_Y - 40, 10, 30);

    // Spawn fish
    if (s.frame % 50 === 0) {
      const ft = FISH[Math.floor(Math.random() * FISH.length)];
      s.fish.push({ x: Math.random() < 0.5 ? -40 : W + 40, y: WATER_Y + ft.depth + Math.random() * 30, vx: Math.random() < 0.5 ? ft.speed : -ft.speed, type: FISH.indexOf(ft), id: s.nextId++ });
    }

    // Move fish
    s.fish = s.fish.filter(f => f.x > -60 && f.x < W + 60);
    s.fish.forEach(f => {
      f.x += f.vx + Math.sin(s.frame * 0.05 + f.id) * 0.5;
      f.y += Math.sin(s.frame * 0.03 + f.id * 2) * 0.4;
      const ft = FISH[f.type];
      ctx.font = `${ft.size}px serif`;
      ctx.save(); if (f.vx < 0) { ctx.translate(f.x * 2, 0); ctx.scale(-1, 1); }
      ctx.fillText(ft.emoji, f.x - ft.size / 2, f.y + ft.size / 2);
      ctx.restore();
    });

    // Hook
    if (s.hasHook) {
      if (s.reeling) {
        s.hookY -= 6;
        if (s.caught) s.caught.y = s.hookY;
        if (s.hookY < WATER_Y - 10) {
          if (s.caught) {
            const ft = FISH[s.caught.type];
            s.score += ft.pts; onScore?.(s.score); SFX.win();
            s.catches.push({ x: s.caught.x, y: WATER_Y - 20, emoji: ft.emoji, pts: ft.pts, life: 60 });
            setInfo(i => ({ ...i, score: s.score }));
            s.fish = s.fish.filter(f => f.id !== s.caught!.id);
            s.caught = null;
          }
          s.hasHook = false; s.reeling = false;
        }
      } else {
        if (s.hookY < s.lineTarget) s.hookY += 4;
        else s.hookY = s.lineTarget;
        // Check catch
        if (!s.caught) {
          for (const f of s.fish) {
            const ft = FISH[f.type];
            if (Math.hypot(s.hookY - f.y, W * 0.12 - f.x) < ft.size) {
              s.caught = f; s.pull = 0; s.maxPull = ft.pts * 2; SFX.select(); break;
            }
          }
        }
      }

      // Draw line
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(25, WATER_Y - 30); ctx.lineTo(25, s.hookY); ctx.stroke();
      // Hook
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(25, s.hookY, 6, 0, Math.PI); ctx.stroke();
      if (s.caught) {
        const ft = FISH[s.caught.type];
        ctx.font = `${ft.size}px serif`; ctx.fillText(ft.emoji, 18, s.hookY + 5);
      }
    }

    // Float animations
    s.catches = s.catches.filter(c => { c.life--; return c.life > 0; });
    s.catches.forEach(c => {
      c.y -= 1.5; ctx.globalAlpha = c.life / 60;
      ctx.font = "20px serif"; ctx.fillText(c.emoji, c.x - 10, c.y);
      ctx.font = "bold 14px sans-serif"; ctx.fillStyle = "#fbbf24";
      ctx.textAlign = "center"; ctx.fillText(`+${c.pts}`, c.x + 10, c.y - 5);
    });
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, W, 30);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`⏱ ${s.timeLeft}s`, W - 8, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onClick = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cy = "touches" in e ? (e as TouchEvent).changedTouches[0].clientY : (e as MouseEvent).clientY;
      const y = (cy - rect.top) * (H / rect.height);
      if (!st.current.hasHook) throwLine(y);
      else reel();
    };
    cv.addEventListener("click", onClick);
    cv.addEventListener("touchend", onClick as EventListener);
    return () => { cv.removeEventListener("click", onClick); cancelAnimationFrame(animRef.current); clearInterval(timerRef.current); };
  }, [reel]);

  const start = () => {
    setStarted(true);
    animRef.current = requestAnimationFrame(loop);
    timerRef.current = setInterval(() => {
      setInfo(i => {
        const t = i.time - 1;
        if (t <= 0) { st.current.alive = false; setDead(true); clearInterval(timerRef.current); return { ...i, time: 0 }; }
        st.current.timeLeft = t; return { ...i, time: t };
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm rounded-2xl">
            <p className="text-white font-bold text-center">Clique dans l'eau pour lancer<br />Reclique pour remonter quand un poisson est accroché !</p>
            <button onClick={start} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">🎣 Pêcher !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.fish=[]; s.score=0; s.timeLeft=60; s.frame=0; s.alive=true; s.hasHook=false; s.caught=null; s.catches=[];
              setInfo({score:0,time:60}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
              timerRef.current = setInterval(() => { setInfo(i => { const t = i.time-1; if(t<=0){setDead(true);clearInterval(timerRef.current);} st.current.timeLeft=t; return {...i,time:t}; }); }, 1000);
            }} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">1er clic = lancer la ligne · 2e clic = remonter</p>
    </div>
  );
}
