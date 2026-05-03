"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 480;
const INGR = ["🍅","🧅","🫑","🥕","🍄","🧄","🫒","🌽"];
const RECIPES: { name: string; items: string[]; pts: number }[] = [
  { name: "Salade", items: ["🍅","🧅","🫑"], pts: 30 },
  { name: "Soupe", items: ["🥕","🍄","🧄"], pts: 40 },
  { name: "Ratatouille", items: ["🍅","🫑","🥕","🍄"], pts: 60 },
  { name: "Pizza", items: ["🍅","🧅","🫒"], pts: 50 },
];

export function JeuCuisinier({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    falling: [] as { x: number; y: number; emoji: string; id: number; speed: number }[],
    basket: [] as string[],
    recipe: RECIPES[0], score: 0, lives: 3, frame: 0, nextId: 0,
    spawnTimer: 0, plateX: W / 2, completed: 0, timeLeft: 90,
    wrongAnim: 0,
  });
  const [info, setInfo] = useState({ score: 0, lives: 3 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const plateRef = useRef(W / 2);

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current; s.frame++;

    // Kitchen background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#fef3c7"); bg.addColorStop(1, "#fde68a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Tiles
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    for (let x = 0; x < W; x += 40) for (let y = 0; y < H; y += 40) {
      if ((x / 40 + y / 40) % 2 === 0) ctx.fillRect(x, y, 40, 40);
    }

    // Counter
    ctx.fillStyle = "#92400e"; ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = "#b45309"; ctx.fillRect(0, H - 70, W, 8);

    // Plate
    s.plateX += (plateRef.current - s.plateX) * 0.15;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(s.plateX, H - 40, 50, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d4d4d4"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.plateX, H - 40, 50, 20, 0, 0, Math.PI * 2); ctx.stroke();
    // Items in basket on plate
    s.basket.forEach((e, i) => { ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.fillText(e, s.plateX - 20 + i * 14, H - 35); });

    // Spawn ingredients
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(30, 60 - s.completed * 3)) {
      s.spawnTimer = 0;
      s.falling.push({ x: 20 + Math.random() * (W - 40), y: -30, emoji: INGR[Math.floor(Math.random() * INGR.length)], id: s.nextId++, speed: 1.5 + Math.random() * 2 });
    }

    // Move & draw falling items
    s.falling.forEach(f => {
      f.y += f.speed;
      ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.fillText(f.emoji, f.x, f.y);
      // Catch
      if (f.y > H - 70 && Math.abs(f.x - s.plateX) < 55) {
        if (s.recipe.items.includes(f.emoji) && !s.basket.includes(f.emoji)) {
          s.basket.push(f.emoji);
          f.y = H + 50; SFX.correct();
          // Check complete
          if (s.recipe.items.every(i => s.basket.includes(i))) {
            s.score += s.recipe.pts + s.completed * 10; s.completed++;
            onScore?.(s.score); setInfo(i => ({ ...i, score: s.score }));
            s.recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
            s.basket = []; SFX.win();
          }
        } else if (f.y > H - 60) {
          // Wrong item fell in plate
          if (!s.recipe.items.includes(f.emoji)) {
            s.lives--; setInfo(i => ({ ...i, lives: s.lives })); s.wrongAnim = 20; SFX.wrong();
            if (s.lives <= 0) { setDead(true); return; }
          }
          f.y = H + 50;
        }
      } else if (f.y > H) { f.y = H + 100; }
    });
    s.falling = s.falling.filter(f => f.y < H + 60);

    // Wrong anim flash
    if (s.wrongAnim > 0) { ctx.fillStyle = "rgba(239,68,68,0.2)"; ctx.fillRect(0, 0, W, H); s.wrongAnim--; }

    // Recipe card
    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.roundRect(10, 35, W - 20, 55, 12); ctx.fill();
    ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(10, 35, W - 20, 55, 12); ctx.stroke();
    ctx.font = "bold 12px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#92400e";
    ctx.fillText(`Recette: ${s.recipe.name} (${s.recipe.pts} pts)`, 20, 52);
    ctx.font = "22px serif"; ctx.textAlign = "center";
    s.recipe.items.forEach((e, i) => {
      const collected = s.basket.includes(e);
      ctx.globalAlpha = collected ? 0.4 : 1;
      ctx.fillText(e, 30 + i * 36, 78);
    });
    ctx.globalAlpha = 1;
    if (s.basket.length > 0) { ctx.font = "10px sans-serif"; ctx.fillStyle = "#22c55e"; ctx.textAlign = "center"; ctx.fillText(`✓ ${s.basket.length}/${s.recipe.items.length}`, 20 + s.recipe.items.length * 18, 82); }

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, W, 32);
    ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⭐ ${s.score}`, 8, 20);
    ctx.textAlign = "center"; ctx.fillStyle = "#ef4444";
    ctx.fillText("❤️".repeat(s.lives), W / 2, 20);
    ctx.textAlign = "right"; ctx.fillStyle = "#fff";
    ctx.fillText(`⏱ ${s.timeLeft}s`, W - 8, 20);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      plateRef.current = Math.max(55, Math.min(W - 55, (cx - rect.left) * (W / rect.width)));
    };
    cv.addEventListener("mousemove", onMove); cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") plateRef.current = Math.max(55, plateRef.current - 20);
      if (e.key === "ArrowRight") plateRef.current = Math.min(W - 55, plateRef.current + 20);
    };
    window.addEventListener("keydown", onKey);
    return () => { cv.removeEventListener("mousemove", onMove); cv.removeEventListener("touchmove", onMove as EventListener); window.removeEventListener("keydown", onKey); cancelAnimationFrame(animRef.current); clearInterval(timerRef.current); };
  }, []);

  const start = () => {
    setStarted(true); animRef.current = requestAnimationFrame(loop);
    timerRef.current = setInterval(() => {
      setInfo(i => {
        const t = i.score; // keep score
        st.current.timeLeft--;
        if (st.current.timeLeft <= 0) { setDead(true); clearInterval(timerRef.current); }
        return i;
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-sm rounded-2xl">
            <p className="text-white font-bold text-center">Attrape les bons ingrédients avec ton assiette !<br />Complète les recettes 🍳</p>
            <button onClick={start} className="rounded-2xl bg-amber-600 px-8 py-3 text-white font-black">👨‍🍳 Cuisiner !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 rounded-2xl">
            <p className="text-3xl font-black text-yellow-400">{info.score} pts</p>
            <button onClick={() => {
              const s = st.current; s.falling=[]; s.basket=[]; s.score=0; s.lives=3; s.frame=0; s.spawnTimer=0; s.completed=0; s.timeLeft=90; s.recipe=RECIPES[0];
              setInfo({score:0,lives:3}); setDead(false); setStarted(true); animRef.current=requestAnimationFrame(loop);
              timerRef.current = setInterval(() => { st.current.timeLeft--; if (st.current.timeLeft <= 0) { setDead(true); clearInterval(timerRef.current); } }, 1000);
            }} className="rounded-2xl bg-amber-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Déplace la souris · ←→ pour bouger l'assiette</p>
    </div>
  );
}
