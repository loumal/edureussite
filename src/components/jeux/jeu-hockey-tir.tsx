"use client";
import { useState, useRef, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const W = 360, H = 300;
const GOAL_X = 120, GOAL_Y = 40, GOAL_W = 120, GOAL_H = 80;
const GK_W = 44, GK_H = 60;
const PUCK_R = 12;
const SHOOTER_X = W / 2, SHOOTER_Y = H - 50;

type Phase = "aim" | "flying" | "result";
type Result = "goal" | "saved" | "miss";

export function JeuHockeyTir({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("aim");
  const [result, setResult] = useState<Result | null>(null);
  const [puckX, setPuckX] = useState(SHOOTER_X);
  const [puckY, setPuckY] = useState(SHOOTER_Y);
  const [gkX, setGkX] = useState(GOAL_X + GOAL_W / 2 - GK_W / 2);
  const [aim, setAim] = useState({ x: GOAL_X + GOAL_W / 2, y: GOAL_Y + GOAL_H / 2 });
  const [shotsLeft, setShotsLeft] = useState(7);
  const [goals, setGoals] = useState(0);
  const animRef = useRef<number>(0);

  const shoot = useCallback(() => {
    if (phase !== "aim" || shotsLeft <= 0) return;
    setPhase("flying");
    SFX.drop();

    const tx = aim.x, ty = aim.y;
    // GK tries to dive to the aimed side
    const gkTarget = tx < GOAL_X + GOAL_W / 2
      ? GOAL_X
      : GOAL_X + GOAL_W - GK_W;
    const gkMidY = GOAL_Y + (GOAL_H - GK_H) / 2;

    let prog = 0;
    const animate = () => {
      prog = Math.min(prog + 0.05, 1);
      setPuckX(SHOOTER_X + (tx - SHOOTER_X) * prog);
      setPuckY(SHOOTER_Y + (ty - SHOOTER_Y) * prog);
      const newGkX = gkX + (gkTarget - gkX) * Math.min(prog * 1.4, 1);
      setGkX(newGkX);

      if (prog < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const inGoal = tx >= GOAL_X && tx <= GOAL_X + GOAL_W && ty >= GOAL_Y && ty <= GOAL_Y + GOAL_H;
        const gkCx = gkTarget + GK_W / 2;
        const gkCy = gkMidY + GK_H / 2;
        const saved = inGoal && Math.abs(tx - gkCx) < GK_W * 0.85 && Math.abs(ty - gkCy) < GK_H * 0.85;

        if (!inGoal) {
          setResult("miss"); SFX.wrong();
        } else if (saved) {
          setResult("saved"); SFX.lose();
        } else {
          setResult("goal"); SFX.win();
          const pts = score + 60;
          setScore(pts); onScore?.(pts);
          setGoals(g => g + 1);
        }
        setPhase("result");

        setTimeout(() => {
          const left = shotsLeft - 1;
          setShotsLeft(left);
          setResult(null);
          setPuckX(SHOOTER_X); setPuckY(SHOOTER_Y);
          setGkX(GOAL_X + GOAL_W / 2 - GK_W / 2);
          setAim({ x: GOAL_X + GOAL_W / 2, y: GOAL_Y + GOAL_H / 2 });
          setPhase(left > 0 ? "aim" : "result");
        }, 1400);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [phase, aim, gkX, score, shotsLeft, onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-5xl">🏒</div>
      <p className="text-white font-bold text-center">Tire la rondelle dans le filet !<br />Déjoue le gardien avec les bons angles.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-blue-600 px-8 py-3 text-white font-black">🏒 Jouer !</button>
    </div>
  );

  const isOver = phase === "result" && shotsLeft <= 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score}</span>
        <span>🥅 {goals} buts / {7 - shotsLeft} tirs</span>
        <span>🏒 {shotsLeft} restants</span>
      </div>

      <svg width={W} height={H}
        style={{ background: "#e0f2fe", borderRadius: 12, cursor: phase === "aim" ? "crosshair" : "default", touchAction: "none" }}
        onMouseMove={e => {
          if (phase !== "aim") return;
          const r = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
          setAim({ x: Math.max(GOAL_X, Math.min(GOAL_X + GOAL_W, e.clientX - r.left)), y: Math.max(GOAL_Y, Math.min(GOAL_Y + GOAL_H, e.clientY - r.top)) });
        }}
        onTouchMove={e => {
          if (phase !== "aim") return;
          e.preventDefault();
          const r = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
          const t = e.touches[0];
          setAim({ x: Math.max(GOAL_X, Math.min(GOAL_X + GOAL_W, t.clientX - r.left)), y: Math.max(GOAL_Y, Math.min(GOAL_Y + GOAL_H, t.clientY - r.top)) });
        }}
        onClick={() => { if (phase === "aim") shoot(); }}
        onTouchEnd={() => { if (phase === "aim") shoot(); }}
      >
        {/* Ice rink */}
        <rect x={0} y={0} width={W} height={H} fill="#e0f2fe" />
        <ellipse cx={W/2} cy={H/2} rx={W/2 - 10} ry={H/2 - 10} fill="none" stroke="#bae6fd" strokeWidth={3} />
        <line x1={W/2} y1={10} x2={W/2} y2={H - 10} stroke="#bae6fd" strokeWidth={2} />
        {/* Center circle */}
        <circle cx={W/2} cy={H/2} r={30} fill="none" stroke="#93c5fd" strokeWidth={2} />
        <circle cx={W/2} cy={H/2} r={4} fill="#3b82f6" />

        {/* Goal net */}
        <rect x={GOAL_X - 6} y={GOAL_Y - 6} width={GOAL_W + 12} height={GOAL_H + 12} fill="#1e3a5f" rx={4} />
        <rect x={GOAL_X} y={GOAL_Y} width={GOAL_W} height={GOAL_H} fill="#0f172a" rx={2} />
        {/* Net lines */}
        {[1,2,3].map(i => <line key={`v${i}`} x1={GOAL_X + GOAL_W/4*i} y1={GOAL_Y} x2={GOAL_X + GOAL_W/4*i} y2={GOAL_Y+GOAL_H} stroke="#334155" strokeWidth={1} />)}
        {[1,2].map(i => <line key={`h${i}`} x1={GOAL_X} y1={GOAL_Y + GOAL_H/3*i} x2={GOAL_X+GOAL_W} y2={GOAL_Y+GOAL_H/3*i} stroke="#334155" strokeWidth={1} />)}

        {/* Goal crease */}
        <ellipse cx={GOAL_X + GOAL_W/2} cy={GOAL_Y + GOAL_H + 10} rx={50} ry={20} fill="none" stroke="#ef4444" strokeWidth={2} />

        {/* Aim indicator */}
        {phase === "aim" && (
          <g>
            <circle cx={aim.x} cy={aim.y} r={14} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" />
            <line x1={SHOOTER_X} y1={SHOOTER_Y} x2={aim.x} y2={aim.y} stroke="#ef4444" strokeWidth={1} strokeDasharray="6 4" opacity={0.5} />
          </g>
        )}

        {/* Goalkeeper */}
        <g transform={`translate(${gkX}, ${GOAL_Y + (GOAL_H - GK_H) / 2})`}>
          <rect width={GK_W} height={GK_H} fill="#f97316" rx={6} />
          <circle cx={GK_W/2} cy={-12} r={11} fill="#fde68a" />
          <text x={GK_W/2} y={-6} textAnchor="middle" fontSize={14}>🥅</text>
        </g>

        {/* Shooter */}
        <text x={SHOOTER_X} y={SHOOTER_Y + 5} textAnchor="middle" fontSize={24}>🏒</text>

        {/* Puck */}
        <circle cx={puckX} cy={puckY} r={PUCK_R} fill="#111" stroke="#333" strokeWidth={2} />

        {/* Result */}
        {result && (
          <g>
            <rect x={0} y={H/2 - 30} width={W} height={60} fill="rgba(0,0,0,0.7)" />
            <text x={W/2} y={H/2 + 8} textAnchor="middle" fill={result === "goal" ? "#fbbf24" : result === "saved" ? "#f97316" : "#ef4444"} fontSize={22} fontWeight="bold">
              {result === "goal" ? "BUUUT ! 🏒🎉" : result === "saved" ? "Arrêté ! 🥅" : "Raté ! 😬"}
            </text>
          </g>
        )}

        {isOver && (
          <g>
            <rect x={0} y={H/2 + 35} width={W} height={40} fill="rgba(0,0,0,0.6)" />
            <text x={W/2} y={H/2 + 62} textAnchor="middle" fill="white" fontSize={15}>{goals} buts en 7 tirs — {score} pts</text>
          </g>
        )}
      </svg>

      <p className="text-white/40 text-xs">Vise dans le filet avec ta souris et clique pour tirer</p>
    </div>
  );
}
