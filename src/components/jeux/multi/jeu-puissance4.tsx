"use client";
import { useState, useEffect, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const ROWS = 6, COLS = 7;

type Grille = number[][];
type Ligne = [number, number][];

interface Props {
  joueurs: { eleveId: string; prenom: string; score: number }[];
  etat: {
    grille: Grille;
    tourIndex: 0 | 1;
    gagnant: number | null;
    dernierCoup: { row: number; col: number } | null;
    ligneGagnante: Ligne | null;
  };
  monEleveId: string;
  onCoup: (coup: { col: number }) => void;
  isMyTurn: boolean;
  loading: boolean;
}

const COLORS = [
  // player 1 — crimson
  "radial-gradient(circle at 35% 30%, #ff6b9d, #e63946)",
  // player 2 — golden
  "radial-gradient(circle at 35% 30%, #ffd166, #f4a11d)",
];
const SHADOWS = [
  "0 6px 20px rgba(230,57,70,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(0,0,0,0.3)",
  "0 6px 20px rgba(244,161,29,0.6), 0 2px 4px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(0,0,0,0.3)",
];

function isGagnante(r: number, c: number, ligne: Ligne | null) {
  return ligne?.some(([lr, lc]) => lr === r && lc === c) ?? false;
}

export function JeuPuissance4({ joueurs, etat, monEleveId, onCoup, isMyTurn, loading }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const [dropping, setDropping] = useState<{ row: number; col: number } | null>(null);
  const monIndex = joueurs.findIndex(j => j.eleveId === monEleveId);

  // Animate drop
  useEffect(() => {
    if (etat.dernierCoup) {
      setDropping(etat.dernierCoup);
      SFX.drop();
      setTimeout(() => setDropping(null), 400);
    }
  }, [etat.dernierCoup?.row, etat.dernierCoup?.col]);

  useEffect(() => {
    if (etat.gagnant) {
      setTimeout(() => {
        if (etat.gagnant === monIndex + 1) SFX.win(); else SFX.lose();
      }, 300);
    }
  }, [etat.gagnant]);

  const handleColClick = useCallback((col: number) => {
    if (!isMyTurn || loading || etat.gagnant) return;
    SFX.select();
    onCoup({ col });
  }, [isMyTurn, loading, etat.gagnant, onCoup]);

  const tour = joueurs[etat.tourIndex];
  const gagnantJoueur = etat.gagnant ? joueurs[etat.gagnant - 1] : null;
  const nul = !etat.gagnant && etat.grille[0].every(c => c !== 0);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Score strip */}
      <div className="flex gap-4 w-full max-w-sm">
        {joueurs.map((j, i) => (
          <div key={j.eleveId} className={`flex-1 rounded-2xl px-3 py-2 text-center transition-all ${etat.tourIndex === i && !etat.gagnant ? "ring-2 ring-white/40 scale-105" : "opacity-70"}`}
            style={{ background: i === 0 ? "rgba(230,57,70,0.15)" : "rgba(244,161,29,0.15)" }}>
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i], boxShadow: SHADOWS[i] }} />
              <span className="text-xs font-bold text-white">{j.prenom}</span>
              {j.eleveId === monEleveId && <span className="text-[10px] text-white/50">(toi)</span>}
            </div>
            <p className="text-lg font-black" style={{ color: i === 0 ? "#ff6b9d" : "#ffd166" }}>{j.score}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-sm font-semibold text-white/80 min-h-[20px]">
        {gagnantJoueur
          ? <span className="text-yellow-300 font-black text-base animate-pulse">🏆 {gagnantJoueur.prenom} gagne !</span>
          : nul ? <span className="text-white/60">Match nul !</span>
          : isMyTurn ? <span className="text-green-300">🎯 À toi de jouer !</span>
          : <span className="text-white/50">⏳ {tour?.prenom} joue...</span>}
      </div>

      {/* Board */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          perspective: "700px",
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
        }}
      >
        <div style={{ transform: "rotateX(8deg)", transformStyle: "preserve-3d" }}>
          {/* Column hover indicators */}
          <div className="flex" style={{ background: "rgba(30,41,59,0.9)" }}>
            {Array.from({ length: COLS }, (_, c) => (
              <div key={c}
                className="flex items-center justify-center transition-all duration-150"
                style={{ width: 52, height: 24 }}
              >
                {isMyTurn && hover === c && !etat.gagnant && (
                  <div className="w-4 h-4 rounded-full animate-bounce"
                    style={{
                      background: COLORS[monIndex] || COLORS[0],
                      boxShadow: SHADOWS[monIndex] || SHADOWS[0],
                      opacity: 0.9,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            style={{
              background: "linear-gradient(160deg, #1e3a6e 0%, #162d55 100%)",
              borderTop: "3px solid rgba(255,255,255,0.1)",
              padding: "6px 6px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            {etat.grille.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: 5 }}>
                {row.map((cell, c) => {
                  const isDrop = dropping?.row === r && dropping?.col === c;
                  const isWin = isGagnante(r, c, etat.ligneGagnante);
                  return (
                    <button
                      key={c}
                      onClick={() => handleColClick(c)}
                      onMouseEnter={() => setHover(c)}
                      onMouseLeave={() => setHover(null)}
                      disabled={!isMyTurn || loading || !!etat.gagnant}
                      style={{
                        width: 46, height: 46,
                        borderRadius: "50%",
                        background: cell
                          ? COLORS[cell - 1]
                          : "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.08), rgba(0,0,20,0.6))",
                        boxShadow: cell
                          ? isWin
                            ? `${SHADOWS[cell-1]}, 0 0 20px 6px rgba(255,255,255,0.4)`
                            : SHADOWS[cell - 1]
                          : "inset 0 3px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(255,255,255,0.05)",
                        border: "none",
                        cursor: isMyTurn && !cell && !etat.gagnant ? "pointer" : "default",
                        transition: "transform 0.15s",
                        transform: isWin ? "scale(1.15)" : isDrop ? "scale(0.85)" : "scale(1)",
                        animation: isDrop ? "dropBounce 0.4s ease-out" : isWin ? "winPulse 0.8s ease-in-out infinite alternate" : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dropBounce {
          0% { transform: scale(0.6) translateY(-8px); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes winPulse {
          from { transform: scale(1.1); filter: brightness(1.2); }
          to   { transform: scale(1.25); filter: brightness(1.6); }
        }
      `}</style>

      {loading && <p className="text-white/40 text-xs animate-pulse">Synchronisation...</p>}
    </div>
  );
}
