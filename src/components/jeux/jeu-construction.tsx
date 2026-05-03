"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480, BLOCK_W = 80, BLOCK_H = 28;

export function JeuConstruction({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    blocks: [] as { x: number; y: number; w: number; color: string }[],
    moving: { x: 0, y: 40, dir: 1, speed: 3, w: BLOCK_W },
    score: 0, level: 1, frame: 0, alive: true,
    dropped: false, perfect: 0,
  });
  const [info, setInfo] = useState({ score: 0, level: 1 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);

  const COLORS = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#a855f7","#ec4899","#14b8a6","#f97316"];

  const dropBlock = useCallback(() => {
    const s = st.current;
    if (!s.alive || s.dropped) return;
    s.dropped = true;
    const m = s.moving;
    const prev = s.blocks[s.blocks.length - 1];
    const baseX = prev ? prev.x : W / 2 - BLOCK_W / 2;
    const baseW = prev ? prev.w : BLOCK_W;

    // Overlap
    const left = Math.max(m.x, baseX);
    const right = Math.min(m.x + m.w, baseX + baseW);
    const newW = right - left;

    if (newW <= 5) {
      s.alive = false; SFX.lose(); setDead(true); return;
    }

    const isPerfect = Math.abs(newW - baseW) < 6;
    if (isPerfect) { s.perfect++; SFX.win(); } else { s.perfect = 0; SFX.correct(); }

    const blockY = H - 40 - s.blocks.length * BLOCK_H;
    s.blocks.push({ x: left, y: blockY, w: newW, color: COLORS[(s.blocks.length) % COLORS.length] });
    s.score += isPerfect ? 20 : Math.round(newW / baseW * 10);
    s.level = Math.floor(s.blocks.length / 5) + 1;
    onScore?.(s.score); setInfo({ score: s.score, level: s.level });

    // Next moving block
    m.x = -BLOCK_W; m.y = blockY - BLOCK_H; m.w = isPerfect ? newW : newW;
    m.speed = Math.min(8, 3 + s.blocks.length * 0.2);
    s.dropped = false;
  }, [onScore]);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Sky gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0ea5e9"); bg.addColorStop(1, "#7dd3fc");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    [[80, 60, 35], [220, 40, 28], [300, 80, 40]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.ellipse(x + Math.sin(s.frame * 0.005) * 5, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    });

    // Ground
    ctx.fillStyle = "#92400e"; ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = "#78350f"; ctx.fillRect(0, H - 40, W, 6);

    // Base platform
    ctx.fillStyle = "#1e293b"; ctx.fillRect(W / 2 - BLOCK_W / 2 - 5, H - 40, BLOCK_W + 10, 8);

    // Stacked blocks
    s.blocks.forEach((b, i) => {
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, BLOCK_H - 2, 4); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, 8, [4, 4, 0, 0]); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, BLOCK_H - 2, 4); ctx.stroke();
    });

    // Moving block
    const m = s.moving;
    m.x += m.speed * m.dir;
    if (m.x + m.w > W + 10) m.dir = -1;
    if (m.x < -10) m.dir = 1;

    ctx.fillStyle = COLORS[s.blocks.length % COLORS.length];
    ctx.beginPath(); ctx.roundRect(m.x, m.y, m.w, BLOCK_H - 2, 4); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.roundRect(m.x, m.y, m.w, 8, [4, 4, 0, 0]); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(m.x, m.y, m.w, BLOCK_H - 2, 4); ctx.stroke();

    // Perfect indicator
    if (s.perfect > 0) {
      ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fbbf24";
      ctx.fillText(`⚡ PARFAIT ×${s.perfect}!`, W / 2, m.y - 10);
    }

    // Height indicator
    if (s.blocks.length >= 3) {
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(W - 35, 40, 25, H - 80);
      const maxH = 15;
      const pct = Math.min(1, s.blocks.length / maxH);
      ctx.fillStyle = `hsl(${120 - pct * 120}, 80%, 50%)`;
      ctx.fillRect(W - 35, 40 + (H - 80) * (1 - pct), 25, (H - 80) * pct);
      ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      ctx.fillText("🏗️", W - 22, 55);
    }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, W, 30);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`Niv. ${s.level} · ${s.blocks.length} blocs`, W - 8, 20);

    if (s.alive) animRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const handler = () => dropBlock();
    cv.addEventListener("click", handler);
    cv.addEventListener("touchend", handler);
    window.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "ArrowDown") { e.preventDefault(); dropBlock(); } });
    return () => { cv.removeEventListener("click", handler); cancelAnimationFrame(animRef.current); };
  }, [dropBlock]);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm rounded-2xl">
            <p className="text-white font-bold text-center">Clic pour poser le bloc au bon moment !<br />PARFAIT = les blocs s'alignent 🏗️</p>
            <button onClick={start} className="rounded-2xl bg-sky-600 px-8 py-3 text-white font-black">🏗️ Construire !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 rounded-2xl">
            <p className="text-2xl font-black text-white">Tour de {st.current.blocks.length} blocs!</p>
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.blocks=[]; s.moving={x:-BLOCK_W,y:40,dir:1,speed:3,w:BLOCK_W}; s.score=0; s.level=1; s.frame=0; s.alive=true; s.dropped=false; s.perfect=0;
              setInfo({score:0,level:1}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
            }} className="rounded-2xl bg-sky-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Clic ou Espace pour poser le bloc</p>
    </div>
  );
}
