"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, LANES = 3, LANE_W = W / LANES;
const PLAYER_LANE = 1;

export function JeuCourseInfinie({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    lane: PLAYER_LANE, targetLane: PLAYER_LANE, laneX: LANE_W * PLAYER_LANE + LANE_W / 2,
    py: H - 120, score: 0, frame: 0, alive: true, speed: 6,
    obstacles: [] as { lane: number; y: number; type: number }[],
    coins: [] as { lane: number; y: number }[],
    spawnTimer: 0, bgY: 0, bgY2: -H, streak: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const swipeStart = useRef(0);

  const changeLane = useCallback((dir: -1 | 1) => {
    const s = st.current;
    const nl = Math.max(0, Math.min(LANES - 1, s.targetLane + dir));
    s.targetLane = nl;
    SFX.tick();
  }, []);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Scrolling road
    s.bgY = (s.bgY + s.speed) % H;
    s.bgY2 = s.bgY - H;

    [s.bgY, s.bgY2].forEach(by => {
      ctx.fillStyle = "#374151"; ctx.fillRect(0, by, W, H);
      // Lane markers
      for (let i = 1; i < LANES; i++) {
        ctx.strokeStyle = "#f9fafb"; ctx.lineWidth = 2; ctx.setLineDash([40, 30]);
        ctx.beginPath(); ctx.moveTo(LANE_W * i, by); ctx.lineTo(LANE_W * i, by + H); ctx.stroke();
        ctx.setLineDash([]);
      }
      // Road sides
      ctx.fillStyle = "#16a34a"; ctx.fillRect(-20, by, 20, H); ctx.fillRect(W, by, 20, H);
    });

    // Player lane transition
    const targetX = LANE_W * s.targetLane + LANE_W / 2;
    s.laneX += (targetX - s.laneX) * 0.2;

    // Spawn
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(25, 60 - s.frame / 200)) {
      s.spawnTimer = 0;
      const lane = Math.floor(Math.random() * LANES);
      const type = Math.random() < 0.3 ? 1 : Math.random() < 0.15 ? 2 : 0;
      s.obstacles.push({ lane, y: -60, type });
      if (Math.random() < 0.4) {
        const coinLane = Math.floor(Math.random() * LANES);
        s.coins.push({ lane: coinLane, y: -40 });
      }
    }
    s.speed = 6 + s.frame / 400;
    s.score = Math.floor(s.frame / 6);
    if (s.frame % 30 === 0) { onScore?.(s.score); setScore(s.score); }

    // Obstacles
    const VEHICLES = ["🚗","🚕","🚙","🚌","🚛"];
    const SPECIALS = ["🛑","⚠️","🚧"];
    s.obstacles.forEach(o => {
      o.y += s.speed;
      const x = LANE_W * o.lane + LANE_W / 2;
      ctx.font = `${32 + o.type * 10}px serif`; ctx.textAlign = "center";
      ctx.fillText(o.type === 0 ? VEHICLES[Math.floor(o.lane * 1.7) % 5] : SPECIALS[o.type - 1], x, o.y);
      if (o.y > H - 140 && o.y < H - 90 && Math.abs(x - s.laneX) < LANE_W * 0.45) {
        s.alive = false; SFX.lose(); setDead(true);
      }
    });
    s.obstacles = s.obstacles.filter(o => o.y < H + 70);

    // Coins
    s.coins.forEach(c => {
      c.y += s.speed;
      const x = LANE_W * c.lane + LANE_W / 2;
      if (c.y > H - 150 && c.y < H - 80 && Math.abs(x - s.laneX) < LANE_W * 0.4) {
        c.y = H + 50; s.score += 15; setScore(s.score); SFX.correct();
        for (let i = 0; i < 6; i++) s.particles.push({ x, y: H - 110, vx: (Math.random()-0.5)*4, vy: -2-Math.random()*3, life: 20, color: "#fbbf24" });
      } else if (c.y < H) {
        ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(x, c.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.font = "bold 11px sans-serif"; ctx.fillStyle = "#92400e"; ctx.textAlign = "center"; ctx.fillText("$", x, c.y + 4);
      }
    });
    s.coins = s.coins.filter(c => c.y < H + 30);

    // Particles
    s.particles = s.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; return p.life > 0; });
    s.particles.forEach(p => { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Player
    const tilt = (targetX - s.laneX) * 0.05;
    ctx.save(); ctx.translate(s.laneX, H - 110); ctx.rotate(tilt);
    ctx.font = "44px serif"; ctx.textAlign = "center"; ctx.fillText("🏃", 0, 20);
    ctx.restore();

    // Lane arrows hint
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    if (s.targetLane > 0) { ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.fillText("◀", 30, H - 100); }
    if (s.targetLane < LANES - 1) { ctx.fillText("▶", W - 30, H - 100); }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`🏃 ${Math.floor(s.speed * 10)} km/h`, W - 8, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") changeLane(-1);
      if (e.key === "ArrowRight" || e.key === "d") changeLane(1);
      e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => { swipeStart.current = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - swipeStart.current;
      if (Math.abs(dx) > 30) changeLane(dx > 0 ? 1 : -1);
    };
    cv.addEventListener("touchstart", onTouchStart, { passive: true });
    cv.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => { cv.removeEventListener("touchstart", onTouchStart); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, [changeLane]);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 rounded-2xl">
            <p className="text-white font-bold text-center">Change de voie pour éviter les obstacles !<br />← → ou swipe pour changer de voie 🏃</p>
            <button onClick={start} className="rounded-2xl bg-slate-700 px-8 py-3 text-white font-black">🏃 Courir !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{score} pts</p>
            <button onClick={() => {
              const s = st.current; s.lane=PLAYER_LANE; s.targetLane=PLAYER_LANE; s.laneX=LANE_W*PLAYER_LANE+LANE_W/2; s.score=0; s.frame=0; s.alive=true; s.obstacles=[]; s.coins=[]; s.particles=[]; s.spawnTimer=0; s.speed=6;
              setScore(0); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-slate-700 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <div className="flex gap-4">
        <button onClick={() => changeLane(-1)} className="w-12 h-12 rounded-xl bg-white/10 text-white font-black hover:bg-white/20 text-xl">◀</button>
        <button onClick={() => changeLane(1)} className="w-12 h-12 rounded-xl bg-white/10 text-white font-black hover:bg-white/20 text-xl">▶</button>
      </div>
    </div>
  );
}
