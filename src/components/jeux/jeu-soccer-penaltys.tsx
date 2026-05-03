"use client";
import { useState, useCallback, useRef } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 320;
const GOAL_X = 60, GOAL_Y = 80, GOAL_W = 240, GOAL_H = 120;
const GK_W = 50, GK_H = 70;
const BALL_R = 14;

type Phase = "aim" | "flying" | "result" | "gk" | "gk_flying" | "gk_result";
type ShotResult = "goal" | "saved" | "miss";

interface Shot { tx: number; ty: number; }

export function JeuSoccerPenaltys({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("aim");
  const [shotResult, setShotResult] = useState<ShotResult | null>(null);
  const [ballX, setBallX] = useState(W / 2);
  const [ballY, setBallY] = useState(H - 50);
  const [targetX, setTargetX] = useState(W / 2);
  const [targetY, setTargetY] = useState(GOAL_Y + GOAL_H / 2);
  const [gkX, setGkX] = useState(W / 2 - GK_W / 2);
  const [arrow, setArrow] = useState({ x: W / 2, y: GOAL_Y + GOAL_H / 2 });
  const [shotsLeft, setShotsLeft] = useState(5);
  const [gkShotsLeft, setGkShotsLeft] = useState(3);
  const [message, setMessage] = useState("");
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  const shoot = useCallback(() => {
    if (phase !== "aim") return;
    const tx = arrow.x, ty = arrow.y;
    setTargetX(tx); setTargetY(ty);
    setPhase("flying");
    SFX.drop();

    // GK dives randomly
    const gkTarget = tx < W / 3 ? 0 : tx > (W * 2 / 3) ? W - GK_W : W / 2 - GK_W / 2;
    const gkInGoal = GOAL_Y + (GOAL_H - GK_H) / 2;

    let prog = 0;
    const startBX = W / 2, startBY = H - 50;

    const animate = () => {
      prog = Math.min(prog + 0.04, 1);
      const bx = startBX + (tx - startBX) * prog;
      const by = startBY + (ty - startBY) * prog;
      setBallX(bx); setBallY(by);
      const newGkX = (W / 2 - GK_W / 2) + (gkTarget - (W / 2 - GK_W / 2)) * Math.min(prog * 1.5, 1);
      setGkX(newGkX);

      if (prog < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Check result
        const inGoal = tx >= GOAL_X && tx <= GOAL_X + GOAL_W && ty >= GOAL_Y && ty <= GOAL_Y + GOAL_H;
        const gkCenter = gkTarget + GK_W / 2;
        const saved = inGoal && Math.abs(tx - gkCenter) < GK_W * 0.9 && Math.abs(ty - (gkInGoal + GK_H / 2)) < GK_H * 0.9;

        if (!inGoal) {
          setShotResult("miss"); setMessage("Raté ! 😬"); SFX.wrong();
        } else if (saved) {
          setShotResult("saved"); setMessage("Arrêté ! 🧤"); SFX.lose();
        } else {
          setShotResult("goal");
          setMessage("BUUUT ! ⚽🎉");
          const pts = score + 50;
          setScore(pts); onScore?.(pts);
          SFX.win();
        }
        setPhase("result");

        setTimeout(() => {
          const left = shotsLeft - 1;
          setShotsLeft(left);
          setShotResult(null);
          setBallX(W / 2); setBallY(H - 50);
          setGkX(W / 2 - GK_W / 2);
          setArrow({ x: W / 2, y: GOAL_Y + GOAL_H / 2 });
          if (left <= 0) { setPhase("gk"); setMessage("Maintenant, joue comme gardien ! 🧤"); }
          else setPhase("aim");
        }, 1500);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [phase, arrow, score, shotsLeft, onScore]);

  // GK phase: player moves the goalkeeper by mouse/touch
  const handleGkMove = useCallback((cx: number) => {
    if (phase !== "gk") return;
    setGkX(Math.max(GOAL_X, Math.min(GOAL_X + GOAL_W - GK_W, cx - GK_W / 2)));
  }, [phase]);

  const handleGkShoot = useCallback(() => {
    if (phase !== "gk") return;
    setPhase("gk_flying");
    SFX.drop();

    // AI shoots at random corner
    const corners = [
      { x: GOAL_X + 20, y: GOAL_Y + 20 },
      { x: GOAL_X + GOAL_W - 20, y: GOAL_Y + 20 },
      { x: GOAL_X + 20, y: GOAL_Y + GOAL_H - 20 },
      { x: GOAL_X + GOAL_W - 20, y: GOAL_Y + GOAL_H - 20 },
    ];
    const tgt = corners[Math.floor(Math.random() * corners.length)];
    setTargetX(tgt.x); setTargetY(tgt.y);

    let prog = 0;
    const startBX = W / 2, startBY = H - 50;
    const gkCenter = gkX + GK_W / 2;
    const gkMidY = GOAL_Y + (GOAL_H - GK_H) / 2 + GK_H / 2;

    const animate = () => {
      prog = Math.min(prog + 0.04, 1);
      const bx = startBX + (tgt.x - startBX) * prog;
      const by = startBY + (tgt.y - startBY) * prog;
      setBallX(bx); setBallY(by);

      if (prog < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const saved = Math.abs(tgt.x - gkCenter) < GK_W * 1.1 && Math.abs(tgt.y - gkMidY) < GK_H * 0.8;
        if (saved) {
          setShotResult("saved"); setMessage("Arrêt ! Super gardien ! 🧤🎉"); SFX.win();
          const pts = score + 40;
          setScore(pts); onScore?.(pts);
        } else {
          setShotResult("goal"); setMessage("But encaissé 😓"); SFX.lose();
        }
        setPhase("gk_result");
        setTimeout(() => {
          const left = gkShotsLeft - 1;
          setGkShotsLeft(left);
          setShotResult(null);
          setBallX(W / 2); setBallY(H - 50);
          if (left <= 0) { setPhase("result"); setMessage("Partie terminée ! ⚽"); }
          else { setPhase("gk"); setMessage("Prêt pour le prochain tir ?"); }
        }, 1500);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [phase, gkX, score, gkShotsLeft, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-5xl">⚽</div>
      <p className="text-white font-bold text-center">Tire les pénaltys !<br />Vise la cage, évite le gardien.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-green-600 px-8 py-3 text-white font-black">⚽ Jouer !</button>
    </div>
  );

  const isOver = phase === "result" && shotsLeft <= 0 && gkShotsLeft <= 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score}</span>
        <span>{phase === "gk" || phase === "gk_flying" || phase === "gk_result" ? `🧤 Tirs restants : ${gkShotsLeft}` : `⚽ Tirs restants : ${shotsLeft}`}</span>
      </div>

      <svg width={W} height={H} style={{ background: "#16a34a", borderRadius: 12, cursor: phase === "aim" ? "crosshair" : phase === "gk" ? "ew-resize" : "default", touchAction: "none" }}
        onMouseMove={e => {
          const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
          const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
          if (phase === "aim") setArrow({ x: Math.max(GOAL_X, Math.min(GOAL_X + GOAL_W, cx)), y: Math.max(GOAL_Y, Math.min(GOAL_Y + GOAL_H, cy)) });
          if (phase === "gk") handleGkMove(cx);
        }}
        onTouchMove={e => {
          e.preventDefault();
          const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
          const t = e.touches[0];
          const cx = t.clientX - rect.left, cy = t.clientY - rect.top;
          if (phase === "aim") setArrow({ x: Math.max(GOAL_X, Math.min(GOAL_X + GOAL_W, cx)), y: Math.max(GOAL_Y, Math.min(GOAL_Y + GOAL_H, cy)) });
          if (phase === "gk") handleGkMove(cx);
        }}
        onClick={() => {
          if (phase === "aim") shoot();
          if (phase === "gk") handleGkShoot();
        }}
        onTouchEnd={() => {
          if (phase === "aim") shoot();
          if (phase === "gk") handleGkShoot();
        }}
      >
        {/* Field lines */}
        <rect x={0} y={0} width={W} height={H} fill="#15803d" />
        <rect x={W/2 - 1} y={0} width={2} height={H} fill="#16a34a" opacity={0.4} />
        <ellipse cx={W/2} cy={H/2} rx={80} ry={50} fill="none" stroke="#16a34a" strokeWidth={2} opacity={0.4} />

        {/* Goal */}
        <rect x={GOAL_X - 4} y={GOAL_Y - 4} width={GOAL_W + 8} height={GOAL_H + 8} fill="#1e3a5f" rx={4} />
        <rect x={GOAL_X} y={GOAL_Y} width={GOAL_W} height={GOAL_H} fill="#0f172a" rx={2} />
        {/* Goal grid */}
        {[1,2].map(i => <line key={i} x1={GOAL_X + GOAL_W/3*i} y1={GOAL_Y} x2={GOAL_X + GOAL_W/3*i} y2={GOAL_Y+GOAL_H} stroke="#1e3a5f" strokeWidth={1} />)}
        {[1].map(i => <line key={i} x1={GOAL_X} y1={GOAL_Y + GOAL_H/2} x2={GOAL_X+GOAL_W} y2={GOAL_Y+GOAL_H/2} stroke="#1e3a5f" strokeWidth={1} />)}

        {/* Aim crosshair */}
        {phase === "aim" && (
          <g>
            <circle cx={arrow.x} cy={arrow.y} r={12} fill="none" stroke="#fbbf24" strokeWidth={2} opacity={0.8} />
            <line x1={arrow.x - 16} y1={arrow.y} x2={arrow.x + 16} y2={arrow.y} stroke="#fbbf24" strokeWidth={1.5} opacity={0.8} />
            <line x1={arrow.x} y1={arrow.y - 16} x2={arrow.x} y2={arrow.y + 16} stroke="#fbbf24" strokeWidth={1.5} opacity={0.8} />
          </g>
        )}

        {/* GK instruction */}
        {(phase === "gk") && (
          <text x={W/2} y={GOAL_Y - 12} textAnchor="middle" fill="#fbbf24" fontSize={12} fontWeight="bold">← Bouge pour bloquer, touche pour tirer ! →</text>
        )}

        {/* Goalkeeper */}
        <g transform={`translate(${gkX}, ${GOAL_Y + (GOAL_H - GK_H) / 2})`}>
          <rect width={GK_W} height={GK_H} fill="#f97316" rx={6} />
          <circle cx={GK_W/2} cy={-10} r={10} fill="#fde68a" />
          <text x={GK_W/2} y={-5} textAnchor="middle" fontSize={14}>🧤</text>
        </g>

        {/* Penalty spot */}
        <circle cx={W/2} cy={H - 70} r={4} fill="white" opacity={0.6} />

        {/* Ball */}
        <circle cx={ballX} cy={ballY} r={BALL_R} fill="white" stroke="#222" strokeWidth={2} />
        <text x={ballX} y={ballY + 5} textAnchor="middle" fontSize={14}>⚽</text>

        {/* Result overlay */}
        {(shotResult || isOver) && (
          <g>
            <rect x={0} y={H/2 - 30} width={W} height={60} fill="rgba(0,0,0,0.7)" />
            <text x={W/2} y={H/2 + 8} textAnchor="middle" fill={shotResult === "goal" ? "#fbbf24" : shotResult === "saved" ? "#f97316" : "#ef4444"} fontSize={22} fontWeight="bold">{message}</text>
          </g>
        )}

        {isOver && (
          <g>
            <rect x={0} y={H/2 + 40} width={W} height={40} fill="rgba(0,0,0,0.5)" />
            <text x={W/2} y={H/2 + 67} textAnchor="middle" fill="white" fontSize={16}>Score final : {score} pts</text>
          </g>
        )}
      </svg>

      <p className="text-white/40 text-xs">
        {phase === "aim" ? "Déplace ta souris dans le but et clique pour tirer" : phase === "gk" ? "Déplace ta souris et clique pour te positionner !" : ""}
      </p>
    </div>
  );
}
