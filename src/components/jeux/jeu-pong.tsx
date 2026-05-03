"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 480, H = 300, PAD_H = 60, PAD_W = 10, BALL_R = 8, PAD_SPEED = 5;

export function JeuPong({ onScore }: { onScore?: (s: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const st = useRef({
    ballX: W / 2, ballY: H / 2, vx: 4, vy: 3,
    playerY: H / 2 - PAD_H / 2, aiY: H / 2 - PAD_H / 2,
    playerScore: 0, aiScore: 0, totalScore: 0,
    alive: true, frame: 0, rally: 0,
  });
  const [display, setDisplay] = useState({ p: 0, ai: 0 });
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);
  const animRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());

  const loop = useCallback(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    const s = st.current;
    s.frame++;

    // BG
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(1, "#312e81");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Center line
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    // AI movement
    const aiCenter = s.aiY + PAD_H / 2;
    const diff = s.ballY - aiCenter;
    const aiSpd = 3.5 + Math.min(2, s.rally * 0.1);
    if (Math.abs(diff) > 5) s.aiY += Math.sign(diff) * Math.min(Math.abs(diff), aiSpd);
    s.aiY = Math.max(0, Math.min(H - PAD_H, s.aiY));

    // Player controls
    if (keysRef.current.has("ArrowUp") || keysRef.current.has("w")) s.playerY -= PAD_SPEED;
    if (keysRef.current.has("ArrowDown") || keysRef.current.has("s")) s.playerY += PAD_SPEED;
    s.playerY = Math.max(0, Math.min(H - PAD_H, s.playerY));

    // Ball
    s.ballX += s.vx; s.ballY += s.vy;
    if (s.ballY < BALL_R || s.ballY > H - BALL_R) { s.vy *= -1; SFX.tick(); }

    // Paddle collisions
    if (s.ballX < PAD_W + 20 + BALL_R && s.ballY > s.playerY && s.ballY < s.playerY + PAD_H && s.vx < 0) {
      const rel = (s.ballY - (s.playerY + PAD_H / 2)) / (PAD_H / 2);
      s.vx = Math.abs(s.vx) * 1.05; s.vy = rel * 5;
      s.rally++; SFX.select();
      s.totalScore += 5; onScore?.(s.totalScore);
    }
    if (s.ballX > W - PAD_W - 20 - BALL_R && s.ballY > s.aiY && s.ballY < s.aiY + PAD_H && s.vx > 0) {
      s.vx = -Math.abs(s.vx) * 1.02; s.rally++; SFX.tick();
    }

    // Score
    if (s.ballX < 0) {
      s.aiScore++; s.rally = 0;
      setDisplay({ p: s.playerScore, ai: s.aiScore });
      SFX.lose();
      if (s.aiScore >= 5) { s.alive = false; setDead(true); return; }
      s.ballX = W / 2; s.ballY = H / 2; s.vx = 4; s.vy = (Math.random() - 0.5) * 6;
    }
    if (s.ballX > W) {
      s.playerScore++; s.totalScore += 20;
      onScore?.(s.totalScore);
      setDisplay({ p: s.playerScore, ai: s.aiScore });
      SFX.win();
      s.ballX = W / 2; s.ballY = H / 2; s.vx = -4; s.vy = (Math.random() - 0.5) * 6;
    }

    // Draw paddles
    const padGrd1 = ctx.createLinearGradient(0, s.playerY, 0, s.playerY + PAD_H);
    padGrd1.addColorStop(0, "#818cf8"); padGrd1.addColorStop(1, "#6366f1");
    ctx.fillStyle = padGrd1;
    ctx.beginPath(); ctx.roundRect(20, s.playerY, PAD_W, PAD_H, 5); ctx.fill();

    const padGrd2 = ctx.createLinearGradient(0, s.aiY, 0, s.aiY + PAD_H);
    padGrd2.addColorStop(0, "#f87171"); padGrd2.addColorStop(1, "#ef4444");
    ctx.fillStyle = padGrd2;
    ctx.beginPath(); ctx.roundRect(W - PAD_W - 20, s.aiY, PAD_W, PAD_H, 5); ctx.fill();

    // Ball glow
    const g = ctx.createRadialGradient(s.ballX, s.ballY, 0, s.ballX, s.ballY, BALL_R * 3);
    g.addColorStop(0, "rgba(255,255,200,0.5)"); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(s.ballX - BALL_R * 3, s.ballY - BALL_R * 3, BALL_R * 6, BALL_R * 6);
    ctx.fillStyle = "#fffde7"; ctx.beginPath(); ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2); ctx.fill();

    // Scores
    ctx.font = "bold 32px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(129,140,248,0.8)"; ctx.fillText(`${s.playerScore}`, W / 2 - 60, 40);
    ctx.fillStyle = "rgba(248,113,113,0.8)"; ctx.fillText(`${s.aiScore}`, W / 2 + 60, 40);

    animRef.current = requestAnimationFrame(loop);
  }, [onScore]);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = cv.getBoundingClientRect();
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      st.current.playerY = Math.max(0, Math.min(H - PAD_H, (clientY - rect.top) * (H / rect.height) - PAD_H / 2));
    };
    const onKey = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const offKey = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    cv.addEventListener("mousemove", onMove);
    cv.addEventListener("touchmove", onMove as EventListener, { passive: true });
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", offKey);
    return () => {
      cv.removeEventListener("mousemove", onMove);
      cv.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", offKey);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const start = () => { setStarted(true); animRef.current = requestAnimationFrame(loop); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-8 text-sm font-bold">
        <span className="text-indigo-400">Toi: {display.p}</span>
        <span className="text-red-400">IA: {display.ai}</span>
      </div>
      <div className="relative">
        <canvas ref={canvas} width={W} height={H} className="rounded-2xl" style={{ maxWidth: "100%", touchAction: "none" }} />
        {!started && !dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <span className="text-4xl">🏓</span>
            <p className="text-white font-black text-xl">Pong</p>
            <div className="text-white/60 text-xs text-center space-y-1">
              <p>🖱️ Bouge la souris pour déplacer ta raquette</p>
              <p>⌨️ Ou utilise les touches ↑ ↓</p>
              <p>📱 Sur mobile, glisse le doigt</p>
              <p>Marque 7 points pour gagner !</p>
            </div>
            <button onClick={start} className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-white font-black shadow-lg">⚪ Jouer !</button>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded-2xl">
            <p className="text-3xl font-black text-white">{display.p > display.ai ? "🏆 Gagné !" : "😅 Perdu !"}</p>
            <button onClick={() => {
              const s = st.current; s.playerScore = 0; s.aiScore = 0; s.totalScore = 0; s.rally = 0;
              s.ballX = W/2; s.ballY = H/2; s.vx = 4; s.vy = 3;
              setDisplay({ p: 0, ai: 0 }); setDead(false); setStarted(true);
              animRef.current = requestAnimationFrame(loop);
            }} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">Rejouer</button>
          </div>
        )}
      </div>
      <p className="text-white/30 text-xs">Premier à 5 points gagne • Bouge la souris pour jouer</p>
    </div>
  );
}
