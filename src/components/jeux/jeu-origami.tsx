"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

interface Step {
  title: string;
  desc: string;
  emoji: string;
  shape: React.ReactNode;
}

interface Model {
  name: string;
  emoji: string;
  color: string;
  steps: Step[];
}

const PAPER_COLOR_MAP: Record<string, string> = {
  crane: "#fbbf24",
  frog: "#22c55e",
  boat: "#3b82f6",
  fox: "#f97316",
};

function PaperSVG({ stage, color }: { stage: number; color: string }) {
  const c = color;
  const d = `${color}88`;
  const stages = [
    // Stage 0: flat square
    <polygon key="s0" points="80,20 220,20 220,160 80,160" fill={c} stroke="#fff" strokeWidth={2} />,
    // Stage 1: folded diagonally
    <g key="s1">
      <polygon points="80,20 220,20 80,160" fill={c} stroke="#fff" strokeWidth={2} />
      <polygon points="80,20 220,20 220,160" fill={d} stroke="#fff" strokeWidth={1} strokeDasharray="4 3" />
    </g>,
    // Stage 2: triangle folded again
    <g key="s2">
      <polygon points="150,20 220,90 80,90" fill={c} stroke="#fff" strokeWidth={2} />
      <line x1="150" y1="20" x2="150" y2="90" stroke="#fff" strokeWidth={1} strokeDasharray="4 3" />
    </g>,
    // Stage 3: model taking shape (unique per model below, fallback here)
    <g key="s3">
      <polygon points="150,30 200,100 100,100" fill={c} stroke="#fff" strokeWidth={2} />
      <polygon points="150,30 200,100 150,110" fill={d} stroke="#fff" strokeWidth={1} />
    </g>,
    // Stage 4: finished silhouette (per model)
    <g key="s4">
      <polygon points="150,20 210,80 190,130 150,150 110,130 90,80" fill={c} stroke="#fff" strokeWidth={2} />
      <circle cx="150" cy="90" r="20" fill={d} />
    </g>,
  ];
  return (
    <svg width={300} height={180} style={{ borderRadius: 8, background: "#0f172a" }}>
      {stages[Math.min(stage, stages.length - 1)]}
    </svg>
  );
}

const MODELS: Model[] = [
  {
    name: "Grue en papier",
    emoji: "🦢",
    color: PAPER_COLOR_MAP.crane,
    steps: [
      { title: "Commence avec un carré", desc: "Prends une feuille carrée, colorée vers le haut.", emoji: "📄", shape: <></> },
      { title: "Plie en diagonale", desc: "Plie le coin bas-droit vers le coin haut-gauche.", emoji: "📐", shape: <></> },
      { title: "Plie en deux", desc: "Replie le triangle en deux pour obtenir un triangle plus petit.", emoji: "🔺", shape: <></> },
      { title: "Forme le corps", desc: "Ouvre les couches et aplatis pour former un carré.", emoji: "⬛", shape: <></> },
      { title: "La grue est prête !", desc: "Tire doucement les ailes pour ouvrir ta grue !", emoji: "🦢", shape: <></> },
    ],
  },
  {
    name: "Bateau",
    emoji: "⛵",
    color: PAPER_COLOR_MAP.boat,
    steps: [
      { title: "Plie en deux", desc: "Plie la feuille en deux — haut vers bas.", emoji: "📄", shape: <></> },
      { title: "Plie les coins", desc: "Replie chaque coin supérieur vers le centre.", emoji: "📐", shape: <></> },
      { title: "Remonte les bords", desc: "Remonte le bord inférieur sur les deux faces.", emoji: "🔺", shape: <></> },
      { title: "Ouvre le chapeau", desc: "Glisse les doigts à l'intérieur et ouvre le chapeau.", emoji: "🎩", shape: <></> },
      { title: "Le bateau flotte !", desc: "Aplatit doucement le fond pour que le bateau tienne debout.", emoji: "⛵", shape: <></> },
    ],
  },
  {
    name: "Grenouille sautante",
    emoji: "🐸",
    color: PAPER_COLOR_MAP.frog,
    steps: [
      { title: "Commence avec un rectangle", desc: "Plie une feuille en deux dans la longueur.", emoji: "📄", shape: <></> },
      { title: "Marque le centre", desc: "Plie en deux dans la largeur, puis déplie.", emoji: "📐", shape: <></> },
      { title: "Forme les pattes avant", desc: "Plie les deux coins supérieurs vers le centre.", emoji: "🔺", shape: <></> },
      { title: "Plie le corps", desc: "Replie la moitié inférieure vers le haut.", emoji: "⬛", shape: <></> },
      { title: "La grenouille saute !", desc: "Appuie sur l'arrière et elle saute ! 🐸", emoji: "🐸", shape: <></> },
    ],
  },
];

export function JeuOrigami({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [modelIdx, setModelIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const model = MODELS[modelIdx];
  const step = model.steps[stepIdx];
  const totalSteps = model.steps.length;
  const isLastStep = stepIdx === totalSteps - 1;

  const nextStep = useCallback(() => {
    SFX.correct();
    if (isLastStep) {
      const pts = score + 100;
      setScore(pts); onScore?.(pts);
      setCompleted(prev => [...prev, modelIdx]);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
    } else {
      setStepIdx(s => s + 1);
    }
  }, [isLastStep, score, modelIdx, onScore]);

  const selectModel = (idx: number) => {
    setModelIdx(idx); setStepIdx(0); setCelebrate(false);
  };

  if (!started) return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-5xl">🦢</div>
      <p className="text-white font-bold text-center">Origami Digital !<br />Suis les instructions pour plier du papier virtuel.</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-yellow-600 px-8 py-3 text-white font-black">🦢 Commencer !</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score}</span>
        <span>Étape {stepIdx + 1} / {totalSteps}</span>
      </div>

      {/* Model selection */}
      <div className="flex gap-2">
        {MODELS.map((m, i) => (
          <button key={i} onClick={() => selectModel(i)}
            className="rounded-xl px-3 py-1.5 text-sm font-bold transition-all"
            style={{ background: modelIdx === i ? m.color : "#334155", color: "#fff", border: completed.includes(i) ? `2px solid ${m.color}` : "2px solid transparent" }}>
            {m.emoji} {m.name} {completed.includes(i) ? "✓" : ""}
          </button>
        ))}
      </div>

      {/* Paper visualization */}
      <div style={{ position: "relative" }}>
        <PaperSVG stage={stepIdx} color={model.color} />
        {celebrate && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", borderRadius: 8 }}>
            <span style={{ fontSize: 48 }}>{model.emoji}</span>
          </div>
        )}
      </div>

      {/* Step card */}
      <div className="rounded-2xl bg-white/10 border border-white/20 p-4 w-full max-w-xs text-center">
        <div className="text-3xl mb-2">{step.emoji}</div>
        <p className="text-white font-black text-base">{step.title}</p>
        <p className="text-white/70 text-sm mt-1">{step.desc}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((stepIdx + 1) / totalSteps) * 100}%`, background: model.color }} />
      </div>

      {/* Action button */}
      {!celebrate ? (
        <button onClick={nextStep}
          className="rounded-2xl px-8 py-3 text-white font-black transition-all"
          style={{ background: isLastStep ? "#22c55e" : model.color }}>
          {isLastStep ? `${model.emoji} Terminé !` : "✅ Fait ! Étape suivante →"}
        </button>
      ) : (
        <div className="text-center text-white font-black text-lg animate-bounce">
          🎉 Bravo ! +100 pts ! 🎉
        </div>
      )}

      <p className="text-white/30 text-xs">Suis les instructions et appuie sur &quot;Fait !&quot; à chaque étape</p>
    </div>
  );
}
