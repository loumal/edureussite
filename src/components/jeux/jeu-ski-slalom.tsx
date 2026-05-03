"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, PLAYER_R = 14;

export function JeuSkiSlalom({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    px: W / 2, speed: 3, score: 0, frame: 0, alive: true,
    gates: [] as { x: number; y: number; gap: number; passed: boolean; color: string }[],
    trees: [] as { x: number; y: number; size: number }[],
    gateTimer: 0, combo: 0,
  });
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const targetX = useRef(W / 2);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Scrolling snow background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#e0f2fe"); bg.addColorStop(1, "#dbeafe");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Snow texture
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 20; i++) {
      const sx = (i * 137 + s.frame * 0.3) % (W + 20) - 10;
      const sy = (s.frame * s.speed + i * 80) % (H + 20);
      ctx.fillRect(sx, sy, 3, 8);
    }

    // Trees (sides)
    s.trees.forEach(t => {
      t.y += s.speed * 0.8;
      if (t.y > H + 50) { t.y = -50; t.x = Math.random() < 0.5 ? Math.random() * 40 : W - Math.random() * 40; }
      ctx.fillStyle = "#166534";
      ctx.beginPath(); ctx.moveTo(t.x, t.y - t.size); ctx.lineTo(t.x - t.size * 0.6, t.y + t.size * 0.5); ctx.lineTo(t.x + t.size * 0.6, t.y + t.size * 0.5); ctx.fill();
      ctx.fillStyle = "#14532d";
      ctx.beginPath(); ctx.moveTo(t.x, t.y - t.size * 0.6); ctx.lineTo(t.x - t.size * 0.4, t.y + t.size * 0.2); ctx.lineTo(t.x + t.size * 0.4, t.y + t.size * 0.2); ctx.fill();
    });

    // Spawn gates
    s.gateTimer++;
    if (s.gateTimer >= Math.max(50, 90 - s.frame / 100)) {
      s.gateTimer = 0;
      const gap = Math.max(60, 120 - s.frame / 50);
      const cx = 60 + Math.random() * (W - 120);
      s.gates.push({ x: cx, y: -30, gap, passed: false, color: Math.random() < 0.5 ? "#ef4444" : "#3b82f6" });
    }

    // Move & draw gates
    s.gates.forEach(g => {
      g.y += s.speed;
      const lx = g.x - g.gap / 2, rx = g.x + g.gap / 2;
      ctx.fillStyle = g.color;
      ctx.fillRect(lx - 6, g.y - 20, 12, 40); ctx.fillRect(rx - 6, g.y - 20, 12, 40);
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(lx - 4, g.y - 3, 8, 6); ctx.fillRect(rx - 4, g.y - 3, 8, 6);
      // Horizontal bar hint
      ctx.strokeStyle = g.color + "40"; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(lx, g.y); ctx.lineTo(rx, g.y); ctx.stroke(); ctx.setLineDash([]);

      if (!g.passed && g.y > H - 150 && g.y < H - 100) {
        if (s.px > lx && s.px < rx) {
          g.passed = true; s.score += 10 + s.combo * 5; s.combo++;
          onScore?.(s.score); setScore(s.score); SFX.correct();
        } else if (g.y > H - 60) {
          s.combo = 0; g.passed = true; SFX.wrong();
        }
      }
      // Hit poles
      if ((Math.abs(s.px - lx) < PLAYER_R + 5 || Math.abs(s.px - rx) < PLAYER_R + 5) && Math.abs(g.y - (H - 120)) < 30) {
        s.alive = false; SFX.lose(); setDead(true);
      }
    });
    s.gates = s.gates.filter(g => g.y < H + 60);

    // Move player
    s.px += (targetX.current - s.px) * 0.12;
    s.px = Math.max(PLAYER_R + 5, Math.min(W - PLAYER_R - 5, s.px));
    s.speed = 3 + s.frame / 400;

    // Player (skier)
    ctx.save();
    ctx.translate(s.px, H - 100);
    ctx.fillStyle = "#1e40af";
    ctx.beginPath(); ctx.ellipse(0, 0, PLAYER_R, PLAYER_R * 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#93c5fd";
    ctx.beginPath(); ctx.arc(0, -PLAYER_R * 1.2, PLAYER_R * 0.8, 0, Math.PI * 2); ctx.fill();
    // Skis
    const lean = (targetX.current - s.px) * 0.1;
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath(); ctx.roundRect(-PLAYER_R * 1.5 + lean, PLAYER_R * 0.8, PLAYER_R * 3, 5, 3); ctx.fill();
    ctx.restore();

    // Combo display
    if (s.combo >= 3) {
      ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fbbf24";
      ctx.fillText(`🔥 Combo ×${s.combo}`, W / 2, 50);
    }

    // HUD
    ctx.font = "bold 14px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#1e3a5f";
    ctx.fillText(`⭐ ${s.score}`, 10, 25);

    if (s.alive) animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    // Init trees
    const trees = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() < 0.5 ? Math.random() * 40 : W - Math.random() * 40,
      y: Math.random() * H, size: 15 + Math.random() * 20,
    }));
    st.current.trees = trees;

    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      targetX.current = (cx - rect.left) * (W / rect.width);
    };
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") targetX.current = Math.max(PLAYER_R, targetX.current - 20);
      if (e.key === "ArrowRight") targetX.current = Math.min(W - PLAYER_R, targetX.current + 20);
    };
    window.addEventListener("keydown", onKey);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl">
            <p className="text-slate-800 font-bold text-center">Passe entre les portes !<br />Bouge la souris pour diriger</p>
            <button onClick={start} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">⛷️ Dévaler !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl">
            <p className="text-3xl font-black text-slate-800">{score} pts</p>
            <button onClick={() => {
              const s = st.current; s.px=W/2; s.speed=3; s.score=0; s.frame=0; s.alive=true; s.gates=[]; s.gateTimer=0; s.combo=0;
              targetX.current=W/2; setScore(0); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
    </div>
  );
}
