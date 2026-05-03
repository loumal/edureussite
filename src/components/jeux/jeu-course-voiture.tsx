"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, ROAD_W = 200, CAR_W = 32, CAR_H = 52;
const ROAD_LEFT = (W - ROAD_W) / 2;

export function JeuCourseVoiture({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    cx: W / 2, speed: 4, score: 0, frame: 0, alive: true,
    obstacles: [] as { x: number; y: number; color: string }[],
    coins: [] as { x: number; y: number }[],
    roadLines: [] as number[], spawnTimer: 0,
    combo: 0,
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const targetX = useRef(W / 2);

  const CAR_COLORS = ["#ef4444","#3b82f6","#f59e0b","#22c55e","#a855f7"];

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Sky / grass
    ctx.fillStyle = "#16a34a"; ctx.fillRect(0, 0, W, H);
    // Road
    ctx.fillStyle = "#374151"; ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);
    // Road edges
    ctx.fillStyle = "#f9fafb"; ctx.fillRect(ROAD_LEFT, 0, 6, H); ctx.fillRect(ROAD_LEFT + ROAD_W - 6, 0, 6, H);

    // Road lines
    if (s.roadLines.length === 0) for (let y = 0; y < H; y += 60) s.roadLines.push(y);
    s.roadLines = s.roadLines.map(y => { const ny = (y + s.speed) % (H + 60); return ny; });
    s.roadLines.forEach(y => {
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(W / 2 - 3, y - 60, 6, 36);
    });

    // Spawn
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(40, 80 - s.frame / 200)) {
      s.spawnTimer = 0;
      const lane = ROAD_LEFT + 20 + Math.floor(Math.random() * 4) * 42;
      s.obstacles.push({ x: lane + CAR_W / 2, y: -CAR_H, color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)] });
      if (Math.random() < 0.4) s.coins.push({ x: ROAD_LEFT + 20 + Math.floor(Math.random() * 4) * 42 + 16, y: -20 });
    }
    s.speed = 4 + s.frame / 500;

    // Move player
    s.cx += (targetX.current - s.cx) * 0.1;
    s.cx = Math.max(ROAD_LEFT + CAR_W / 2, Math.min(ROAD_LEFT + ROAD_W - CAR_W / 2, s.cx));

    // Score
    if (s.frame % 10 === 0) { s.score++; onScore?.(s.score); setScore(s.score); }

    // Obstacles
    s.obstacles.forEach(o => {
      o.y += s.speed;
      // Draw enemy car
      ctx.fillStyle = o.color; ctx.beginPath(); ctx.roundRect(o.x - CAR_W/2, o.y, CAR_W, CAR_H, 6); ctx.fill();
      ctx.fillStyle = "#1e293b"; ctx.fillRect(o.x - CAR_W/2 + 4, o.y + 5, 10, 8); ctx.fillRect(o.x + CAR_W/2 - 14, o.y + 5, 10, 8);
      ctx.fillRect(o.x - CAR_W/2 + 4, o.y + CAR_H - 13, 10, 8); ctx.fillRect(o.x + CAR_W/2 - 14, o.y + CAR_H - 13, 10, 8);
      if (o.y > H - 120 && o.y < H - 50 && Math.abs(o.x - s.cx) < CAR_W - 5) {
        s.alive = false; SFX.lose(); setDead(true);
      }
    });
    s.obstacles = s.obstacles.filter(o => o.y < H + CAR_H);

    // Coins
    s.coins.forEach(c => {
      c.y += s.speed;
      if (Math.hypot(c.x - s.cx, c.y - (H - 80)) < 25) {
        c.y = H + 50; s.score += 10; setScore(s.score); SFX.correct();
      } else if (c.y < H) {
        ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.font = "bold 10px sans-serif"; ctx.fillStyle = "#92400e"; ctx.textAlign = "center"; ctx.fillText("$", c.x, c.y + 4);
      }
    });
    s.coins = s.coins.filter(c => c.y < H + 30);

    // Player car
    const px = s.cx - CAR_W / 2, py = H - 80 - CAR_H;
    ctx.fillStyle = "#3b82f6"; ctx.beginPath(); ctx.roundRect(px, py, CAR_W, CAR_H, 6); ctx.fill();
    ctx.fillStyle = "#93c5fd"; ctx.fillRect(px + 4, py + 8, 10, 10); ctx.fillRect(px + CAR_W - 14, py + 8, 10, 10);
    ctx.fillStyle = "#fbbf24"; ctx.fillRect(px + 4, py + CAR_H - 12, 10, 8); ctx.fillRect(px + CAR_W - 14, py + CAR_H - 12, 10, 8);
    // Exhaust effect
    if (s.frame % 3 === 0) {
      ctx.fillStyle = "rgba(156,163,175,0.5)"; ctx.beginPath(); ctx.arc(s.cx, py + CAR_H + 8, 6, 0, Math.PI * 2); ctx.fill();
    }

    // Scenery
    ctx.fillStyle = "#15803d"; ctx.font = "20px serif"; ctx.textAlign = "left";
    ctx.fillText("🌲", (s.frame * 3) % W < ROAD_LEFT ? (s.frame * 3) % W : 0, (s.frame * 3 + 40) % H);
    ctx.fillText("🌲", W - 30 - (s.frame * 2.5) % 30, (s.frame * 2.5 + 120) % H);

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, W, 28);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`🚗 × ${Math.floor(s.speed * 10)} km/h`, W - 8, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      targetX.current = (cx - rect.left) * (W / rect.width);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") targetX.current = Math.max(ROAD_LEFT + CAR_W / 2, targetX.current - 20);
      if (e.key === "ArrowRight") targetX.current = Math.min(ROAD_LEFT + ROAD_W - CAR_W / 2, targetX.current + 20);
    };
    cv.addEventListener("mousemove", onMove); cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 rounded-2xl">
            <p className="text-white font-bold text-center">Évite les voitures adverses !<br />Déplace la souris pour conduire 🚗</p>
            <button onClick={start} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">🚗 Conduire !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{score} pts</p>
            <button onClick={() => {
              const s = st.current; s.cx=W/2; s.speed=4; s.score=0; s.frame=0; s.alive=true; s.obstacles=[]; s.coins=[]; s.roadLines=[]; s.spawnTimer=0;
              targetX.current=W/2; setScore(0); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
