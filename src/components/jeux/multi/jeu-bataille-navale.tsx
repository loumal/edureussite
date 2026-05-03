"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const GRID = 10;
const TAILLES = [4, 3, 3, 2, 2]; // navires à placer

type Case = [number, number];
type Navire = { cases: Case[]; coule: boolean };
type Phase = "placement" | "combat";

interface EtatBN {
  phase: Phase;
  navires: Record<string, Navire[]>;
  tirs: Record<string, Case[]>;
  tourIndex: 0 | 1;
}

interface Props {
  joueurs: { eleveId: string; prenom: string; score: number }[];
  etat: EtatBN;
  monEleveId: string;
  onCoup: (coup: unknown) => void;
  isMyTurn: boolean;
  loading: boolean;
}

type Orientation = "H" | "V";

function overlaps(a: Case[], b: Case[]): boolean {
  return a.some(([r1,c1]) => b.some(([r2,c2]) => r1===r2 && c1===c2));
}
function buildCases(r: number, c: number, taille: number, ori: Orientation): Case[] | null {
  const cases: Case[] = [];
  for (let k = 0; k < taille; k++) {
    const nr = r + (ori === "V" ? k : 0);
    const nc = c + (ori === "H" ? k : 0);
    if (nr >= GRID || nc >= GRID) return null;
    cases.push([nr, nc]);
  }
  return cases;
}

function cellBg(r: number, c: number) {
  return (r + c) % 2 === 0
    ? "linear-gradient(135deg, #0c4a6e, #075985)"
    : "linear-gradient(135deg, #075985, #0369a1)";
}

export function JeuBatailleNavale({ joueurs, etat, monEleveId, onCoup, isMyTurn, loading }: Props) {
  const [naviresPoses, setNaviresPoses] = useState<Navire[]>([]);
  const [oriPlacement, setOriPlacement] = useState<Orientation>("H");
  const [hoverPlacement, setHoverPlacement] = useState<Case[] | null>(null);
  const [explosions, setExplosions] = useState<Record<string, "hit" | "miss">>({});

  const adversaireId = joueurs.find(j => j.eleveId !== monEleveId)?.eleveId ?? "";
  const monIndex = joueurs.findIndex(j => j.eleveId === monEleveId);

  const estFini = joueurs.some(j => {
    if (j.eleveId === monEleveId) return false;
    const navAdv = etat.navires[j.eleveId] ?? [];
    return navAdv.length > 0 && navAdv.every(n => n.coule);
  });

  // ── Placement ──
  const tailleCourante = TAILLES[naviresPoses.length];
  const dejaPlace = (etat.navires[monEleveId]?.length ?? 0) >= TAILLES.length;

  const handlePlacement = useCallback((r: number, c: number) => {
    if (dejaPlace) return;
    const cases = buildCases(r, c, tailleCourante, oriPlacement);
    if (!cases) return;
    const dejaPris = naviresPoses.flatMap(n => n.cases);
    if (overlaps(cases, dejaPris)) return;

    const nouveau = [...naviresPoses, { cases, coule: false }];
    setNaviresPoses(nouveau);
    SFX.drop();

    if (nouveau.length === TAILLES.length) {
      onCoup({ navires: nouveau });
    }
  }, [naviresPoses, tailleCourante, oriPlacement, dejaPlace, onCoup]);

  const handleHoverPlacement = useCallback((r: number, c: number) => {
    if (dejaPlace) return;
    const cases = buildCases(r, c, tailleCourante, oriPlacement);
    setHoverPlacement(cases);
  }, [dejaPlace, tailleCourante, oriPlacement]);

  // ── Combat ──
  const handleTir = useCallback((r: number, c: number) => {
    if (!isMyTurn || loading || estFini) return;
    const dejaVise = (etat.tirs[monEleveId] ?? []).some(([tr, tc]) => tr === r && tc === c);
    if (dejaVise) return;
    const hit = (etat.navires[adversaireId] ?? []).some(n => n.cases.some(([nr, nc]) => nr === r && nc === c));
    const key = `${r}-${c}`;
    setExplosions(prev => ({ ...prev, [key]: hit ? "hit" : "miss" }));
    hit ? SFX.hit() : SFX.miss();
    onCoup({ row: r, col: c });
  }, [isMyTurn, loading, estFini, etat.tirs, etat.navires, monEleveId, adversaireId, onCoup]);

  const mesNavires = naviresPoses.length > 0 ? naviresPoses : (etat.navires[monEleveId] ?? []);
  const mesTirs = etat.tirs[monEleveId] ?? [];
  const tirsAdv = etat.tirs[adversaireId] ?? [];
  const isMyTurnCombat = etat.tourIndex === monIndex;

  const gagnantJoueur = joueurs.find(j => j.eleveId !== monEleveId && (etat.navires[j.eleveId] ?? []).every(n => n.coule) && (etat.navires[j.eleveId] ?? []).length > 0)
    ? null // adversaire perdu
    : joueurs.find(j => j.eleveId === monEleveId && (etat.navires[monEleveId] ?? []).every(n => n.coule) && (etat.navires[monEleveId] ?? []).length > 0)
    ? null
    : null;

  // Determine gagnant from statut check via all sunk
  const advNavires = etat.navires[adversaireId] ?? [];
  const monNavires = etat.navires[monEleveId] ?? [];
  const jeGagne = advNavires.length > 0 && advNavires.every(n => n.coule);
  const jePerd = monNavires.length > 0 && monNavires.every(n => n.coule);

  function GridCell({ r, c, isMine }: { r: number; c: number; isMine: boolean }) {
    const tir = isMine
      ? tirsAdv.some(([tr, tc]) => tr === r && tc === c)
      : mesTirs.some(([tr, tc]) => tr === r && tc === c);
    const estNavire = isMine
      ? mesNavires.some(n => n.cases.some(([nr, nc]) => nr === r && nc === c))
      : false;
    const estCoule = isMine
      ? mesNavires.some(n => n.coule && n.cases.some(([nr, nc]) => nr === r && nc === c))
      : advNavires.some(n => n.coule && n.cases.some(([nr, nc]) => nr === r && nc === c));
    const estHit = tir && (isMine ? estNavire : advNavires.some(n => n.cases.some(([nr, nc]) => nr === r && nc === c)));
    const isHoverPreview = !isMine ? false : hoverPlacement?.some(([hr, hc]) => hr === r && hc === c);
    const key = `${r}-${c}`;
    const explType = explosions[key];

    return (
      <div
        onClick={() => isMine ? (etat.phase === "placement" && handlePlacement(r, c)) : handleTir(r, c)}
        onMouseEnter={() => isMine && etat.phase === "placement" && handleHoverPlacement(r, c)}
        style={{
          width: 30, height: 30,
          background: estCoule
            ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
            : estNavire && isMine
            ? "linear-gradient(135deg, #1d4ed8, #2563eb)"
            : isHoverPreview
            ? "rgba(59,130,246,0.4)"
            : cellBg(r, c),
          cursor: !isMine && isMyTurnCombat && etat.phase === "combat" ? "crosshair" : "default",
          position: "relative",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
          border: "0.5px solid rgba(255,255,255,0.08)",
          transition: "background 0.2s",
          boxShadow: estNavire && isMine ? "inset 0 1px 3px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)" : undefined,
        }}
      >
        {tir && estHit && <span style={{ animation: explType ? "explode 0.3s ease-out" : undefined }}>💥</span>}
        {tir && !estHit && <span style={{ color: "#7dd3fc", fontSize: 10 }}>●</span>}
      </div>
    );
  }

  function Grid({ isMine, label }: { isMine: boolean; label: string }) {
    return (
      <div>
        <p className="text-center text-xs font-bold text-white/60 mb-2">{label}</p>
        <div
          style={{
            display: "inline-block",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: isMine
              ? "0 8px 32px rgba(37,99,235,0.3), 0 0 0 2px rgba(59,130,246,0.3)"
              : "0 8px 32px rgba(239,68,68,0.3), 0 0 0 2px rgba(239,68,68,0.3)",
            transform: "perspective(400px) rotateX(5deg)",
          }}
        >
          {Array.from({ length: GRID }, (_, r) => (
            <div key={r} style={{ display: "flex" }}>
              {Array.from({ length: GRID }, (_, c) => (
                <GridCell key={c} r={r} c={c} isMine={isMine} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Scores */}
      <div className="flex gap-4">
        {joueurs.map((j, i) => (
          <div key={j.eleveId} className={`rounded-xl px-4 py-2 text-center transition-all ${etat.tourIndex === i && etat.phase === "combat" ? "ring-2 ring-cyan-400/50 scale-105" : "opacity-70"}`}
            style={{ background: i === 0 ? "rgba(37,99,235,0.15)" : "rgba(220,38,38,0.15)" }}>
            <p className="text-xs font-bold text-white/70">{j.prenom}{j.eleveId === monEleveId ? " (toi)" : ""}</p>
            <p className="text-xl font-black text-cyan-300">{j.score}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-sm font-semibold min-h-5">
        {jeGagne && <span className="text-yellow-300 font-black animate-pulse">🏆 Tu gagnes ! Tous les navires coulés !</span>}
        {jePerd && <span className="text-red-400 font-black">💀 Tes navires sont tous coulés...</span>}
        {!jeGagne && !jePerd && etat.phase === "placement" && !dejaPlace &&
          <span className="text-blue-300">🚢 Place tes navires — taille {tailleCourante} ({naviresPoses.length + 1}/{TAILLES.length})</span>}
        {!jeGagne && !jePerd && etat.phase === "placement" && dejaPlace &&
          <span className="text-white/50">⏳ En attente que l'adversaire place ses navires...</span>}
        {!jeGagne && !jePerd && etat.phase === "combat" && isMyTurnCombat &&
          <span className="text-green-300">🎯 Tire sur les eaux adverses !</span>}
        {!jeGagne && !jePerd && etat.phase === "combat" && !isMyTurnCombat &&
          <span className="text-white/50">⏳ {joueurs.find(j => j.eleveId !== monEleveId)?.prenom} vise...</span>}
      </div>

      {etat.phase === "placement" && !dejaPlace && (
        <button onClick={() => setOriPlacement(o => o === "H" ? "V" : "H")}
          className="rounded-xl bg-blue-500/20 border border-blue-500/40 px-4 py-1.5 text-sm font-bold text-blue-300 hover:bg-blue-500/30">
          Rotation : {oriPlacement === "H" ? "↔ Horizontal" : "↕ Vertical"}
        </button>
      )}

      {/* Grids */}
      <div className="flex flex-col gap-6 items-center sm:flex-row sm:gap-8">
        <Grid isMine={true} label="🚢 Mes eaux" />
        {etat.phase === "combat" && <Grid isMine={false} label="🎯 Eaux adverses" />}
      </div>

      <style>{`
        @keyframes explode {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {loading && <p className="text-white/40 text-xs animate-pulse">Synchronisation...</p>}
    </div>
  );
}
