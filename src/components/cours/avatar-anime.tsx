"use client";

import { useEffect, useRef, useState } from "react";

// ── Formes de bouche ─────────────────────────────────────────────────────────
// Chemin SVG : lèvre haute = arc vers le haut (sourire), lèvre basse = arc vers le bas
const MOUTH: string[] = [
  // 0 – Neutre (fermé, léger sourire)
  "M 44 79 Q 60 75 76 79 Q 60 86 44 79 Z",
  // 1 – Légèrement ouvert
  "M 44 78 Q 60 74 76 78 Q 60 90 44 78 Z",
  // 2 – Moitié ouvert
  "M 43 77 Q 60 73 77 77 Q 60 95 43 77 Z",
  // 3 – Grand ouvert
  "M 43 76 Q 60 72 77 76 Q 60 99 43 76 Z",
  // 4 – Retour moitié ouvert
  "M 43 77 Q 60 73 77 77 Q 60 93 43 77 Z",
];

// Dents (visibles quand bouche bien ouverte)
const TEETH = "M 47 80 Q 60 78 73 80 L 73 85 Q 60 84 47 85 Z";

interface Props {
  isSpeaking: boolean;
  taille?: number;
  className?: string;
}

export function AvatarAnime({ isSpeaking, taille = 120, className }: Props) {
  const [blinking, setBlinking] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const teethRef = useRef<SVGPathElement>(null);

  const blinkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const speakTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const mouthPhase = useRef(0);

  // ── Clignement aléatoire toutes les 3–5 s ──────────────────────────────────
  useEffect(() => {
    let active = true;
    function scheduleBlink() {
      blinkTimer.current = setTimeout(() => {
        if (!active) return;
        setBlinking(true);
        setTimeout(() => {
          if (!active) return;
          setBlinking(false);
          scheduleBlink();
        }, 160);
      }, 3000 + Math.random() * 2000);
    }
    scheduleBlink();
    return () => {
      active = false;
      clearTimeout(blinkTimer.current);
    };
  }, []);

  // ── Animation lèvres (isSpeaking) ─────────────────────────────────────────
  useEffect(() => {
    if (isSpeaking) {
      mouthPhase.current = 1;
      speakTimer.current = setInterval(() => {
        mouthPhase.current = (mouthPhase.current % 4) + 1;
        mouthRef.current?.setAttribute("d", MOUTH[mouthPhase.current]);
        if (teethRef.current) {
          teethRef.current.setAttribute("opacity", mouthPhase.current >= 2 ? "1" : "0");
        }
      }, 180);
    } else {
      clearInterval(speakTimer.current);
      mouthPhase.current = 0;
      mouthRef.current?.setAttribute("d", MOUTH[0]);
      teethRef.current?.setAttribute("opacity", "0");
    }
    return () => clearInterval(speakTimer.current);
  }, [isSpeaking]);

  // ── Regard souris / touch ──────────────────────────────────────────────────
  useEffect(() => {
    let rafId = 0;
    let pending = false;
    let lastX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    let lastY = typeof window !== "undefined" ? window.innerHeight / 2 : 0;

    function applyGaze() {
      pending = false;
      if (!svgRef.current || !leftPupilRef.current || !rightPupilRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width === 0) return;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = lastX - cx;
      const dy = lastY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Décalage max 5 unités SVG
      const MAX = 5;
      const svgScale = 120 / rect.width;
      const scale = dist > 0 ? Math.min(MAX / dist, 1) : 0;
      const ox = dx * scale * svgScale;
      const oy = dy * scale * svgScale;

      leftPupilRef.current.setAttribute("cx", String(42 + ox));
      leftPupilRef.current.setAttribute("cy", String(52 + oy));
      rightPupilRef.current.setAttribute("cx", String(78 + ox));
      rightPupilRef.current.setAttribute("cy", String(52 + oy));
    }

    function schedule(x: number, y: number) {
      lastX = x;
      lastY = y;
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(applyGaze);
      }
    }

    const onMouse = (e: MouseEvent) => schedule(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) schedule(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Style paupières via transform CSS (plus fiable que ry sur Safari)
  const lidStyle: React.CSSProperties = {
    transformBox: "fill-box" as const,
    transformOrigin: "top center",
    transform: blinking ? "scaleY(1)" : "scaleY(0)",
    transition: "transform 0.08s ease-in-out",
  };

  return (
    <svg
      ref={svgRef}
      width={taille}
      height={taille}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`${isSpeaking ? "" : "animate-mira-idle"} ${className ?? ""}`}
    >
      {/* ─ Ombre portée ─ */}
      <ellipse cx="60" cy="116" rx="40" ry="5" fill="rgba(0,0,0,0.10)" />

      {/* ─ Pulse sonore (anneau violet animé) ─ */}
      {isSpeaking && (
        <circle
          cx="60"
          cy="58"
          r="54"
          fill="none"
          stroke="rgba(91,79,207,0.35)"
          strokeWidth="3"
          className="animate-avatar-pulse"
        />
      )}

      {/* ─ Visage ─ */}
      <circle cx="60" cy="58" r="52" fill="#FDDBB4" />

      {/* ─ Joues ─ */}
      <ellipse cx="34" cy="72" rx="10" ry="7" fill="rgba(255,140,120,0.28)" />
      <ellipse cx="86" cy="72" rx="10" ry="7" fill="rgba(255,140,120,0.28)" />

      {/* ─ Œil gauche ─ */}
      <ellipse cx="42" cy="52" rx="13" ry="13" fill="white" />
      <circle ref={leftPupilRef} cx="42" cy="52" r="7" fill="#2E1F14" />
      <circle cx="46" cy="48" r="2.5" fill="white" />   {/* reflet */}
      {/* Paupière gauche */}
      <rect x="29" y="39" width="26" height="24" rx="13" fill="#FDDBB4" style={lidStyle} />

      {/* ─ Œil droit ─ */}
      <ellipse cx="78" cy="52" rx="13" ry="13" fill="white" />
      <circle ref={rightPupilRef} cx="78" cy="52" r="7" fill="#2E1F14" />
      <circle cx="82" cy="48" r="2.5" fill="white" />
      {/* Paupière droite */}
      <rect x="65" y="39" width="26" height="24" rx="13" fill="#FDDBB4" style={lidStyle} />

      {/* ─ Sourcils ─ */}
      <path
        d="M 31 38 Q 42 33 53 37"
        stroke="#9B6B5A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 67 37 Q 78 33 89 38"
        stroke="#9B6B5A"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* ─ Nez ─ */}
      <circle cx="56" cy="66" r="2" fill="rgba(165,105,75,0.40)" />
      <circle cx="64" cy="66" r="2" fill="rgba(165,105,75,0.40)" />

      {/* ─ Bouche ─ */}
      {/* Dents (visibles quand bouche grand ouverte) */}
      <path ref={teethRef} d={TEETH} fill="white" opacity="0" />
      {/* Lèvres */}
      <path ref={mouthRef} d={MOUTH[0]} fill="#C47B5A" />
    </svg>
  );
}
