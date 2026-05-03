"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 480, H = 320;
const PATH: { x: number; y: number }[] = [
  {x:0,y:80},{x:80,y:80},{x:80,y:200},{x:200,y:200},{x:200,y:100},{x:320,y:100},{x:320,y:240},{x:W,y:240}
];
type Tower={x:number;y:number;range:number;dmg:number;cooldown:number;timer:number;type:number};
type Enemy={x:number;y:number;hp:number;maxHp:number;speed:number;pathIdx:number;reward:number};
type Bullet={x:number;y:number;tx:number;ty:number;dmg:number};

export function JeuTowerDefense({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    towers: [] as Tower[], enemies: [] as Enemy[], bullets: [] as Bullet[],
    gold: 100, lives: 10, score: 0, wave: 0, waveTimer: 120, spawned: 0, toSpawn: 0,
    spawnTimer: 0, phase: "prep" as "prep"|"wave"|"waveDone", frame: 0, alive: true,
  });
  const [info, setInfo] = useState({ gold: 100, lives: 10, score: 0, wave: 0, phase: "prep" as string });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const [placing, setPlacing] = useState(0); // tower type: 1=basic, 2=fast, 3=heavy
  const animRef = useRef(0);

  const TOWER_TYPES = [
    { type: 1, emoji: "🏹", name: "Arc", cost: 30, range: 80, dmg: 10, cooldown: 40, color: "#22c55e" },
    { type: 2, emoji: "⚡", name: "Rapide", cost: 50, range: 60, dmg: 5, cooldown: 15, color: "#3b82f6" },
    { type: 3, emoji: "💣", name: "Lourd", cost: 80, range: 100, dmg: 30, cooldown: 80, color: "#ef4444" },
  ];

  const isOnPath = (x: number, y: number): boolean => {
    for (let i = 0; i < PATH.length - 1; i++) {
      const dx = PATH[i+1].x - PATH[i].x, dy = PATH[i+1].y - PATH[i].y;
      const len = Math.sqrt(dx*dx+dy*dy);
      const nx = dy/len, ny = -dx/len;
      const px = x - PATH[i].x, py = y - PATH[i].y;
      const t = (px*dx+py*dy)/(len*len);
      if (t >= 0 && t <= 1 && Math.abs(px*nx+py*ny) < 25) return true;
    }
    return false;
  };

  const startWave = () => {
    const s = st.current;
    s.wave++; s.toSpawn = 5 + s.wave * 3; s.spawned = 0; s.spawnTimer = 0; s.phase = "wave";
    setInfo(i => ({...i, wave: s.wave, phase: "wave"}));
  };

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // BG
    ctx.fillStyle = "#1a2e1a"; ctx.fillRect(0,0,W,H);
    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // Draw path
    ctx.strokeStyle = "#8B7355"; ctx.lineWidth = 40; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    PATH.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    ctx.strokeStyle = "#A0946E"; ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    PATH.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();

    // Spawn enemies
    if (s.phase === "wave") {
      s.spawnTimer++;
      if (s.spawnTimer >= 40 && s.spawned < s.toSpawn) {
        s.spawnTimer = 0; s.spawned++;
        const hp = (20 + s.wave * 15) * (1 + s.spawned * 0.1);
        s.enemies.push({ x: PATH[0].x, y: PATH[0].y, hp, maxHp: hp, speed: 1.2 + s.wave * 0.1, pathIdx: 0, reward: 10 + s.wave * 2 });
      }
      if (s.spawned >= s.toSpawn && s.enemies.length === 0) { s.phase = "waveDone"; setInfo(i => ({...i, phase:"waveDone"})); SFX.win(); }
    }

    // Move enemies
    s.enemies = s.enemies.filter(e => {
      if (e.pathIdx >= PATH.length - 1) { s.lives--; setInfo(i => ({...i, lives: s.lives})); SFX.lose(); if(s.lives<=0){setDead(true);} return false; }
      const target = PATH[e.pathIdx + 1];
      const dx = target.x - e.x, dy = target.y - e.y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < e.speed) { e.pathIdx++; } else { e.x += (dx/dist)*e.speed; e.y += (dy/dist)*e.speed; }
      return e.hp > 0;
    });

    // Tower shooting
    s.towers.forEach(t => {
      t.timer++;
      if (t.timer < t.cooldown) return;
      const target = s.enemies.find(e => Math.hypot(e.x-t.x,e.y-t.y) < t.range);
      if (target) { t.timer = 0; s.bullets.push({ x: t.x, y: t.y, tx: target.x, ty: target.y, dmg: t.dmg }); SFX.tick(); }
    });

    // Move bullets
    s.bullets = s.bullets.filter(b => {
      const dx = b.tx - b.x, dy = b.ty - b.y, dist = Math.hypot(dx,dy);
      if (dist < 8) {
        const hit = s.enemies.find(e => Math.hypot(e.x-b.tx,e.y-b.ty) < 20);
        if (hit) { hit.hp -= b.dmg; if(hit.hp<=0){ s.gold+=hit.reward; s.score+=hit.reward*2; onScore?.(s.score); setInfo(i=>({...i,gold:s.gold,score:s.score})); } }
        return false;
      }
      b.x += (dx/dist)*8; b.y += (dy/dist)*8; return true;
    });

    // Draw towers
    s.towers.forEach(t => {
      const tt = TOWER_TYPES[t.type-1];
      ctx.fillStyle = tt.color+"40"; ctx.strokeStyle = tt.color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.arc(t.x, t.y, 16, 0, Math.PI*2); ctx.fill();
      ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.fillText(tt.emoji, t.x, t.y+6);
    });

    // Draw enemies
    s.enemies.forEach(e => {
      const pct = e.hp / e.maxHp;
      ctx.fillStyle = pct > 0.6 ? "#22c55e" : pct > 0.3 ? "#eab308" : "#ef4444";
      ctx.beginPath(); ctx.arc(e.x, e.y, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(e.x-12, e.y-20, 24, 5);
      ctx.fillStyle = "#22c55e"; ctx.fillRect(e.x-12, e.y-20, 24*pct, 5);
      ctx.font = "14px serif"; ctx.textAlign = "center"; ctx.fillText("👾", e.x, e.y+5);
    });

    // Draw bullets
    ctx.fillStyle = "#fbbf24";
    s.bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill(); });

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const click = (e: MouseEvent) => {
      if (placing === 0) return;
      const rect = cv.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (isOnPath(x, y)) return;
      const tt = TOWER_TYPES[placing - 1];
      if (st.current.gold < tt.cost) { SFX.wrong(); return; }
      st.current.towers.push({ x, y, range: tt.range, dmg: tt.dmg, cooldown: tt.cooldown, timer: 0, type: placing });
      st.current.gold -= tt.cost;
      setInfo(i => ({ ...i, gold: st.current.gold }));
      SFX.select(); setPlacing(0);
    };
    cv.addEventListener("click", click);
    return () => { cv.removeEventListener("click", click); cancelAnimationFrame(animRef.current); };
  }, [placing]);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center px-2 text-xs font-bold">
        <span className="text-yellow-400">💰 {info.gold}</span>
        <span className="text-white">Vague {info.wave}</span>
        <span className="text-red-400">❤️ {info.lives}</span>
      </div>
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{maxWidth:"100%",cursor:placing>0?"crosshair":"default"}}/>
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white font-bold">Place des tours pour défendre le chemin !</p>
            <button onClick={start} className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 px-8 py-3 text-white font-black">🏰 Défendre !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.towers=[]; s.enemies=[]; s.bullets=[]; s.gold=100; s.lives=10; s.score=0; s.wave=0; s.phase="prep"; s.spawned=0; s.toSpawn=0;
              setInfo({gold:100,lives:10,score:0,wave:0,phase:"prep"}); setDead(false); setStarted(true);
              animRef.current = requestAnimationFrame(loop);
            }} className="rounded-2xl bg-green-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-wrap px-2">
        {TOWER_TYPES.map(tt => (
          <button key={tt.type} onClick={() => setPlacing(p => p === tt.type ? 0 : tt.type)}
            disabled={info.gold < tt.cost}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              placing === tt.type ? "bg-yellow-400/30 border-yellow-400 border" : "bg-white/10 border border-white/20"
            } disabled:opacity-40`}>
            {tt.emoji} {tt.name} <span className="text-yellow-300">{tt.cost}💰</span>
          </button>
        ))}
        {info.phase === "waveDone" || info.phase === "prep" ? (
          <button onClick={startWave} className="ml-auto rounded-xl bg-red-600 hover:bg-red-500 px-3 py-2 text-xs font-black text-white">
            ▶ Vague {info.wave + 1}
          </button>
        ) : null}
      </div>
      {placing > 0 && <p className="text-center text-yellow-400/80 text-xs animate-pulse">Clique sur le terrain pour placer la tour (pas sur le chemin)</p>}
    </div>
  );
}
