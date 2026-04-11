"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "@/hooks/useSound";

interface CelebrationProps {
  type: "milestone" | "levelup" | "badge" | "streak" | "mission" | "bouclier";
  titre: string;
  soustitre: string;
  emoji: string;
  detail?: string;       // Ligne de contexte supplémentaire (ex: description du niveau)
  onClose?: () => void;
  autoCloseMs?: number;
}

const CONFIG = {
  milestone: { bg: "from-amber-500 to-orange-500", ring: "border-amber-300", sound: "milestone" as const },
  levelup:   { bg: "from-violet-600 to-purple-600", ring: "border-violet-300", sound: "levelup" as const },
  badge:     { bg: "from-yellow-500 to-amber-500",  ring: "border-yellow-300", sound: "badge" as const },
  streak:    { bg: "from-orange-500 to-red-500",    ring: "border-orange-300", sound: "correct" as const },
  mission:   { bg: "from-green-500 to-emerald-600", ring: "border-green-300",  sound: "mission" as const },
  bouclier:  { bg: "from-blue-500 to-cyan-500",     ring: "border-blue-300",   sound: "bouclier" as const },
};

export function CelebrationOverlay({ type, titre, soustitre, emoji, detail, onClose, autoCloseMs = 3500 }: CelebrationProps) {
  const { play } = useSound();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = CONFIG[type];

  useEffect(() => {
    // Entrée avec léger délai pour l'animation
    const t = setTimeout(() => {
      setVisible(true);
      play(cfg.sound);
    }, 50);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 400);
    }, autoCloseMs);

    return () => {
      clearTimeout(t);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(() => onClose?.(), 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-400 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.45)" }}
      onClick={handleClose}
    >
      {/* Confettis SVG animés */}
      <ConfettiLayer />

      <div
        className={`relative max-w-sm w-full rounded-3xl bg-gradient-to-br ${cfg.bg} p-8 text-center shadow-2xl transition-all duration-500 ${
          visible ? "scale-100 translate-y-0" : "scale-75 translate-y-8"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Anneau lumineux */}
        <div className={`absolute inset-0 rounded-3xl border-4 ${cfg.ring} opacity-60 animate-pulse pointer-events-none`} />

        <div className="text-7xl mb-4 drop-shadow-lg animate-bounce">{emoji}</div>
        <h2 className="text-2xl font-black text-white mb-2 drop-shadow">{titre}</h2>
        <p className="text-white/90 text-sm font-medium mb-2">{soustitre}</p>
        {detail && (
          <p className="text-white/70 text-xs font-medium mb-4 bg-white/10 rounded-xl px-4 py-2">
            {detail}
          </p>
        )}
        <div className={detail ? "" : "mb-6"} />
        <button
          onClick={handleClose}
          className="rounded-full bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-2 text-sm transition-colors border border-white/30"
        >
          Super ! 🚀
        </button>
      </div>
    </div>
  );
}

// Confettis légers en SVG/CSS
function ConfettiLayer() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    dur: 2 + Math.random() * 2,
    color: ["#FFD700", "#FF6B6B", "#4ECDC4", "#95E1D3", "#F38181", "#A8E6CF", "#FFD3B6", "#DCEDC1"][i % 8],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ zIndex: -1 }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Gestionnaire de célébrations (pile de notifications) ─────────────────────
interface CelebrationItem extends CelebrationProps {
  id: string;
}

interface UseCelebrationsReturn {
  celebrations: CelebrationItem[];
  celebrate: (props: Omit<CelebrationProps, "onClose">) => void;
  dismiss: (id: string) => void;
}

let celebrationIdCounter = 0;

export function useCelebrations(): UseCelebrationsReturn {
  const [celebrations, setCelebrations] = useState<CelebrationItem[]>([]);

  const celebrate = (props: Omit<CelebrationProps, "onClose">) => {
    const id = `cel_${++celebrationIdCounter}`;
    setCelebrations((prev) => [...prev, { ...props, id }]);
  };

  const dismiss = (id: string) => {
    setCelebrations((prev) => prev.filter((c) => c.id !== id));
  };

  return { celebrations, celebrate, dismiss };
}

// Composant racine qui affiche la pile
export function CelebrationsHost({ celebrations, dismiss }: { celebrations: CelebrationItem[]; dismiss: (id: string) => void }) {
  const current = celebrations[0]; // Afficher une seule à la fois
  if (!current) return null;
  return (
    <CelebrationOverlay
      key={current.id}
      {...current}
      onClose={() => dismiss(current.id)}
    />
  );
}
