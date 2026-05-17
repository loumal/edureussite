"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { RapportDetail } from "@/lib/evaluation/report-generator";
import type { ValidationParent } from "@/generated/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  token: string;
  evaluationId: string;
  rapportFr: RapportDetail;
  rapportEn: RapportDetail | null;
  alreadyValidated: boolean;
  parentValidation: ValidationParent;
  parentComment?: string;
}

type Niveau = "eleve" | "moyen" | "faible";

// ── Helpers ────────────────────────────────────────────────────────────────────

const DOMAINE_ICONS: Record<string, string> = {
  NEUROPSYCHOLOGUE: "🧠",
  ORTHOPEDAGOGUE: "📚",
  ORTHOPHONISTE: "🗣️",
  ERGOTHERAPEUTE: "✋",
  OPTOMETRISTE: "👁️",
  PSYCHOEDUCATEUR: "💬",
};

const NIVEAU_SCORE: Record<Niveau, number> = { eleve: 3, moyen: 2, faible: 1 };
const NIVEAU_PCT: Record<Niveau, number> = { eleve: 88, moyen: 55, faible: 22 };

const NIVEAU_STYLE = {
  eleve: {
    bg: "#fff7ed", border: "#fb923c", text: "#9a3412",
    bar: "linear-gradient(90deg,#f97316,#ef4444)",
    badge: { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b" },
    labelFr: "Élevé", labelEn: "High",
    dot: "#ef4444",
  },
  moyen: {
    bg: "#fefce8", border: "#fbbf24", text: "#78350f",
    bar: "linear-gradient(90deg,#fbbf24,#f59e0b)",
    badge: { bg: "#fffbeb", border: "#fde68a", color: "#92400e" },
    labelFr: "Modéré", labelEn: "Moderate",
    dot: "#f59e0b",
  },
  faible: {
    bg: "#f0fdf4", border: "#4ade80", text: "#166534",
    bar: "linear-gradient(90deg,#4ade80,#22c55e)",
    badge: { bg: "#f0fdf4", border: "#86efac", color: "#166534" },
    labelFr: "Faible", labelEn: "Low",
    dot: "#22c55e",
  },
} satisfies Record<Niveau, { bg: string; border: string; text: string; bar: string; badge: { bg: string; border: string; color: string }; labelFr: string; labelEn: string; dot: string }>;

// ── Radar Chart (pure SVG, no deps) ───────────────────────────────────────────

function RadarChart({ sections, fr }: { sections: RapportDetail["analyseSections"]; fr: boolean }) {
  const n = sections.length;
  if (n < 3) return null;

  const cx = 170, cy = 150, maxR = 105;
  const scores = sections.map((s) => NIVEAU_SCORE[s.niveau]);
  const avg = scores.reduce((a, b) => a + b, 0) / n;

  function polar(r: number, i: number): { x: number; y: number } {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function polygonPath(r: number): string {
    return Array.from({ length: n }, (_, i) => {
      const p = polar(r, i);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(" ") + " Z";
  }

  const dataPoints = scores.map((s, i) => polar((s / 3) * maxR, i));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") + " Z";

  const fillColor = avg >= 2.6 ? "#ef4444" : avg >= 1.9 ? "#f59e0b" : "#22c55e";
  const strokeColor = avg >= 2.6 ? "#dc2626" : avg >= 1.9 ? "#d97706" : "#16a34a";

  // Label wrapping
  const wrapLabel = (text: string, maxLen = 13): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + (cur ? " " : "") + w).length <= maxLen) {
        cur = cur ? cur + " " + w : w;
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 2);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg
        viewBox="0 0 340 300"
        style={{ width: "100%", maxWidth: "320px", overflow: "visible" }}
      >
        <defs>
          <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.55" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Background grid rings */}
        {[1, 2, 3].map((level) => (
          <path
            key={level}
            d={polygonPath((level / 3) * maxR)}
            fill={level === 3 ? "rgba(243,244,246,0.8)" : "none"}
            stroke="#e5e7eb"
            strokeWidth={level === 3 ? "1.5" : "1"}
            strokeDasharray={level < 3 ? "4,4" : undefined}
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const outer = polar(maxR, i);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
              stroke="#d1d5db"
              strokeWidth="1"
            />
          );
        })}

        {/* Data area */}
        <path d={dataPath} fill="url(#radarFill)" stroke={strokeColor} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Data point dots */}
        {dataPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="7" fill="white" stroke={strokeColor} strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="3.5" fill={strokeColor} />
          </g>
        ))}

        {/* Axis labels */}
        {sections.map((sec, i) => {
          const labelR = maxR + 32;
          const lp = polar(labelR, i);
          const lines = wrapLabel(sec.section);
          const lineH = 12;
          const totalH = lines.length * lineH;
          const levelStyle = NIVEAU_STYLE[sec.niveau];

          return (
            <text
              key={i}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill={levelStyle.text}
            >
              {lines.map((line, li) => (
                <tspan
                  key={li}
                  x={lp.x.toFixed(2)}
                  y={(lp.y - totalH / 2 + li * lineH + 5).toFixed(2)}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}

        {/* Center: avg score */}
        <circle cx={cx} cy={cy} r="28" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="19" fontWeight="900" fill={strokeColor}>
          {avg.toFixed(1)}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8.5" fill="#9ca3af" fontWeight="500">
          {fr ? "/ 3.0" : "/ 3.0"}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fontSize="7.5" fill="#6b7280">
          {fr ? "score moy." : "avg score"}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", marginTop: "8px", justifyContent: "center" }}>
        {(["faible", "moyen", "eleve"] as Niveau[]).map((n) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: NIVEAU_STYLE[n].dot }} />
            <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "500" }}>
              {fr ? NIVEAU_STYLE[n].labelFr : NIVEAU_STYLE[n].labelEn}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal Bar for a section ──────────────────────────────────────────────

function SectionBar({
  section,
  index,
  expanded,
  onToggle,
  fr,
}: {
  section: RapportDetail["analyseSections"][0];
  index: number;
  expanded: boolean;
  onToggle: () => void;
  fr: boolean;
}) {
  const s = NIVEAU_STYLE[section.niveau];
  const pct = NIVEAU_PCT[section.niveau];

  return (
    <div style={{ marginBottom: "10px" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          background: "white",
          border: `1.5px solid ${expanded ? s.border : "#e5e7eb"}`,
          borderRadius: expanded ? "12px 12px 0 0" : "12px",
          padding: "14px 16px",
          cursor: "pointer",
          display: "block",
          transition: "border-color 0.2s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "26px", height: "26px", borderRadius: "50%",
              background: s.badge.bg, border: `1px solid ${s.badge.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "800", color: s.badge.color, flexShrink: 0,
            }}>
              {index + 1}
            </div>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827", lineHeight: "1.3" }}>
              {section.section}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{
              fontSize: "10px", fontWeight: "700",
              color: s.badge.color, background: s.badge.bg,
              border: `1px solid ${s.badge.border}`,
              borderRadius: "100px", padding: "3px 10px",
            }}>
              {fr ? s.labelFr : s.labelEn}
            </span>
            <span style={{ fontSize: "11px", color: "#9ca3af", transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none" }}>▼</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: "#f3f4f6", borderRadius: "100px", height: "7px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: s.bar,
            borderRadius: "100px",
          }} />
        </div>
      </button>

      {/* Observations (expanded) */}
      {expanded && (
        <div style={{
          background: s.bg,
          border: `1.5px solid ${s.border}`,
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "14px 16px 16px",
        }}>
          {section.observations.map((obs, j) => (
            <div key={j} style={{
              display: "flex", gap: "10px", alignItems: "flex-start",
              marginBottom: j < section.observations.length - 1 ? "10px" : 0,
            }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%",
                background: s.badge.bg, border: `1px solid ${s.badge.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: "1px",
              }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot }} />
              </div>
              <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.55" }}>{obs}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Force Badge ───────────────────────────────────────────────────────────────

function ForceBadge({ text }: { text: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      background: "white",
      border: "1.5px solid #bbf7d0",
      borderRadius: "12px",
      padding: "12px 14px",
    }}>
      <div style={{
        width: "22px", height: "22px", borderRadius: "50%",
        background: "linear-gradient(135deg,#4ade80,#22c55e)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: "12px", color: "white", fontWeight: "700",
      }}>
        ✓
      </div>
      <span style={{ fontSize: "13px", color: "#166534", lineHeight: "1.5", fontWeight: "500" }}>{text}</span>
    </div>
  );
}

// ── Vulnerability Card ────────────────────────────────────────────────────────

function VulnerabilityCard({ text, index }: { text: string; index: number }) {
  return (
    <div style={{
      display: "flex", gap: "12px", alignItems: "flex-start",
      background: "#fffbeb",
      border: "1.5px solid #fde68a",
      borderRadius: "12px",
      padding: "12px 14px",
    }}>
      <div style={{
        width: "24px", height: "24px", borderRadius: "50%",
        background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: "11px", color: "white", fontWeight: "800",
      }}>
        {index + 1}
      </div>
      <span style={{ fontSize: "13px", color: "#78350f", lineHeight: "1.55" }}>{text}</span>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────

function RecommendationCard({ text, index }: { text: string; index: number }) {
  const colors = [
    { accent: "#7c5cbf", bg: "#f5f3ff", border: "#ddd6fe" },
    { accent: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
    { accent: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    { accent: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { accent: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    { accent: "#9333ea", bg: "#faf5ff", border: "#e9d5ff" },
  ];
  const c = colors[index % colors.length];

  return (
    <div style={{
      display: "flex", gap: "0",
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      borderRadius: "12px",
      overflow: "hidden",
    }}>
      <div style={{
        width: "6px", flexShrink: 0,
        background: c.accent,
      }} />
      <div style={{ padding: "14px 16px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "50%",
            background: c.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: "11px", color: "white", fontWeight: "800",
          }}>
            {index + 1}
          </div>
          <span style={{ fontSize: "13px", color: "#374151", lineHeight: "1.55", paddingTop: "3px" }}>{text}</span>
        </div>
      </div>
    </div>
  );
}

// ── Next Step (Timeline) ──────────────────────────────────────────────────────

function NextStep({ text, index, isLast }: { text: string; index: number; isLast: boolean }) {
  return (
    <div style={{ display: "flex", gap: "14px" }}>
      {/* Timeline rail */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          background: "linear-gradient(135deg,#7c5cbf,#6d28d9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", color: "white", fontWeight: "800", flexShrink: 0,
        }}>
          {index + 1}
        </div>
        {!isLast && (
          <div style={{
            width: "2px", flex: 1, minHeight: "20px",
            background: "linear-gradient(to bottom, #7c5cbf40, transparent)",
            marginTop: "4px",
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? 0 : "16px", paddingTop: "6px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#374151", lineHeight: "1.55" }}>{text}</p>
      </div>
    </div>
  );
}

// ── Metric Pill ───────────────────────────────────────────────────────────────

function MetricPill({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div style={{
      flex: 1, textAlign: "center",
      background: bg,
      borderRadius: "16px",
      padding: "14px 8px",
    }}>
      <div style={{ fontSize: "28px", fontWeight: "900", color, lineHeight: 1, marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    </div>
  );
}

// ── Section Heading ───────────────────────────────────────────────────────────

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
      <div style={{
        width: "32px", height: "32px", borderRadius: "10px",
        background: "#0f1623",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "15px", flexShrink: 0,
      }}>
        {icon}
      </div>
      <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#0f1623", letterSpacing: "-0.2px" }}>
        {title}
      </h2>
    </div>
  );
}

// ── Section Divider ───────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ borderTop: "1px solid #f0ece6", margin: "28px 0" }} />;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function RapportValidationClient({
  token,
  rapportFr,
  rapportEn,
  alreadyValidated,
  parentValidation,
  parentComment: commentInitial,
}: Props) {
  const [langue, setLangue] = useState<"fr" | "en">("fr");
  const [step, setStep] = useState<"lecture" | "validation">("lecture");
  const [choix, setChoix] = useState<"CONFIRMED" | "COMMENTED" | "REFUSED" | null>(null);
  const [commentaire, setCommentaire] = useState(commentInitial ?? "");
  const [done, setDone] = useState(alreadyValidated);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const valider = trpc.evaluation.validerRapportParent.useMutation();

  const rapport = langue === "fr" ? rapportFr : (rapportEn ?? rapportFr);
  const fr = langue === "fr";
  const icon = DOMAINE_ICONS[rapport.domaine] ?? "📋";

  const toggleSection = (i: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!choix) return;
    setError(null);
    try {
      await valider.mutateAsync({ token, validation: choix, commentaire: commentaire || undefined });
      setDone(true);
    } catch {
      setError(fr ? "Une erreur est survenue. Veuillez réessayer." : "An error occurred. Please try again.");
    }
  };

  // Already validated — confirmation screen
  if (done && alreadyValidated && parentValidation !== "PENDING") {
    const msgs: Record<string, { fr: string; en: string; icon: string; color: string }> = {
      CONFIRMED: {
        fr: "Vous avez confirmé que ce rapport correspond à votre enfant. La plateforme va ajuster le parcours d'apprentissage en conséquence.",
        en: "You confirmed this report matches your child. The platform will adjust the learning path accordingly.",
        icon: "✅", color: "#16a34a",
      },
      COMMENTED: {
        fr: "Votre commentaire a été enregistré. L'équipe en prendra connaissance pour affiner les recommandations.",
        en: "Your comment has been recorded. The team will review it to refine recommendations.",
        icon: "💬", color: "#2563eb",
      },
      REFUSED: {
        fr: "Vous avez indiqué que ce rapport ne correspond pas à votre enfant. Aucun ajustement ne sera apporté au parcours.",
        en: "You indicated this report does not match your child. No adjustments will be made to the learning path.",
        icon: "❌", color: "#dc2626",
      },
    };
    const msg = msgs[parentValidation] ?? msgs.CONFIRMED;
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>{msg.icon}</div>
        <p style={{ fontSize: "14px", color: "#6b7280", maxWidth: "380px", margin: "0 auto", lineHeight: "1.6" }}>
          {fr ? msg.fr : msg.en}
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Report Header Card ──────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f1623 0%, #1e2a3a 100%)",
        borderRadius: "20px",
        padding: "24px 28px",
        marginBottom: "20px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circle */}
        <div style={{
          position: "absolute", top: "-30px", right: "-30px",
          width: "120px", height: "120px", borderRadius: "50%",
          background: "rgba(124,92,191,0.2)",
        }} />
        <div style={{
          position: "absolute", bottom: "-20px", right: "60px",
          width: "70px", height: "70px", borderRadius: "50%",
          background: "rgba(124,92,191,0.1)",
        }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "28px" }}>{icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#7c5cbf", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
                    {fr ? "Rapport d'évaluation" : "Evaluation Report"}
                  </p>
                  <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.5px" }}>
                    {rapport.enfant.prenom}
                  </h1>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                <span style={{
                  fontSize: "11px", color: "#94a3b8",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "100px", padding: "3px 10px",
                }}>
                  {rapport.enfant.niveauScolaire}
                </span>
                <span style={{
                  fontSize: "11px", color: "#94a3b8",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "100px", padding: "3px 10px",
                }}>
                  {new Date(rapport.dateGeneration).toLocaleDateString(fr ? "fr-CA" : "en-CA", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Language selector */}
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setLangue("fr")}
                style={{
                  padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "600",
                  border: "1.5px solid",
                  cursor: "pointer", transition: "all 0.2s",
                  background: langue === "fr" ? "#7c5cbf" : "transparent",
                  borderColor: langue === "fr" ? "#7c5cbf" : "rgba(255,255,255,0.2)",
                  color: langue === "fr" ? "white" : "#94a3b8",
                }}
              >
                FR
              </button>
              {rapportEn && (
                <button
                  onClick={() => setLangue("en")}
                  style={{
                    padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "600",
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all 0.2s",
                    background: langue === "en" ? "#7c5cbf" : "transparent",
                    borderColor: langue === "en" ? "#7c5cbf" : "rgba(255,255,255,0.2)",
                    color: langue === "en" ? "white" : "#94a3b8",
                  }}
                >
                  EN
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {step === "lecture" && (
        <>
          {/* ── Metric Dashboard ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <MetricPill
              value={rapport.forces.length}
              label={fr ? "Forces" : "Strengths"}
              color="#16a34a"
              bg="#f0fdf4"
            />
            <MetricPill
              value={rapport.zonesVulnerabilite.length}
              label={fr ? "Zones attention" : "Focus areas"}
              color="#d97706"
              bg="#fffbeb"
            />
            <MetricPill
              value={rapport.recommandationsParents.length}
              label={fr ? "Conseils" : "Tips"}
              color="#7c5cbf"
              bg="#f5f3ff"
            />
          </div>

          {/* ── Introduction ───────────────────────────────────────────────────── */}
          <div style={{
            background: "white",
            border: "1.5px solid #e5e7eb",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
          }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#374151", lineHeight: "1.75" }}>
              {rapport.introduction}
            </p>
          </div>

          {/* ── Radar + Domain Analysis ────────────────────────────────────────── */}
          {rapport.analyseSections.length > 0 && (
            <div style={{
              background: "white",
              border: "1.5px solid #e5e7eb",
              borderRadius: "16px",
              padding: "22px",
              marginBottom: "20px",
            }}>
              <SectionHeading
                icon="📊"
                title={fr ? "Profil des domaines évalués" : "Domain profile overview"}
              />

              {/* Radar Chart */}
              <div style={{
                background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
                borderRadius: "14px",
                padding: "20px 16px 16px",
                marginBottom: "20px",
              }}>
                <RadarChart sections={rapport.analyseSections} fr={fr} />
              </div>

              {/* Section bars */}
              <div>
                <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {fr ? "Détail par domaine — cliquer pour voir les observations" : "By domain — click to see observations"}
                </p>
                {rapport.analyseSections.map((sec, i) => (
                  <SectionBar
                    key={i}
                    section={sec}
                    index={i}
                    expanded={expandedSections.has(i)}
                    onToggle={() => toggleSection(i)}
                    fr={fr}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Forces ─────────────────────────────────────────────────────────── */}
          {rapport.forces.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
              border: "1.5px solid #bbf7d0",
              borderRadius: "16px",
              padding: "22px",
              marginBottom: "20px",
            }}>
              <SectionHeading
                icon="✨"
                title={fr ? `Forces identifiées (${rapport.forces.length})` : `Identified strengths (${rapport.forces.length})`}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {rapport.forces.map((f, i) => <ForceBadge key={i} text={f} />)}
              </div>
            </div>
          )}

          {/* ── Zones de vulnérabilité ─────────────────────────────────────────── */}
          {rapport.zonesVulnerabilite.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
              border: "1.5px solid #fde68a",
              borderRadius: "16px",
              padding: "22px",
              marginBottom: "20px",
            }}>
              <SectionHeading
                icon="⚡"
                title={fr ? `Zones nécessitant un soutien (${rapport.zonesVulnerabilite.length})` : `Areas needing support (${rapport.zonesVulnerabilite.length})`}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {rapport.zonesVulnerabilite.map((z, i) => (
                  <VulnerabilityCard key={i} text={z} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Recommandations ────────────────────────────────────────────────── */}
          {rapport.recommandationsParents.length > 0 && (
            <div style={{
              background: "white",
              border: "1.5px solid #e5e7eb",
              borderRadius: "16px",
              padding: "22px",
              marginBottom: "20px",
            }}>
              <SectionHeading
                icon="💡"
                title={fr ? `Recommandations pour vous (${rapport.recommandationsParents.length})` : `Recommendations for you (${rapport.recommandationsParents.length})`}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {rapport.recommandationsParents.map((r, i) => (
                  <RecommendationCard key={i} text={r} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── Prochaines étapes ──────────────────────────────────────────────── */}
          {rapport.prochainesEtapes.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #faf5ff, #f3e8ff)",
              border: "1.5px solid #ddd6fe",
              borderRadius: "16px",
              padding: "22px",
              marginBottom: "20px",
            }}>
              <SectionHeading
                icon="🗺️"
                title={fr ? "Prochaines étapes suggérées" : "Suggested next steps"}
              />
              <div>
                {rapport.prochainesEtapes.map((p, i) => (
                  <NextStep
                    key={i}
                    text={p}
                    index={i}
                    isLast={i === rapport.prochainesEtapes.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Mot de clôture ─────────────────────────────────────────────────── */}
          <div style={{
            background: "#f8f7f3",
            border: "1.5px solid #e8e2d9",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "12px",
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>💌</span>
              <p style={{ margin: 0, fontSize: "14px", color: "#4b5563", lineHeight: "1.75", fontStyle: "italic" }}>
                {rapport.motCloture}
              </p>
            </div>
          </div>

          {/* ── Avertissement ──────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            background: "#f9fafb",
            border: "1px solid #f3f4f6",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "24px",
          }}>
            <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>⚠️</span>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", lineHeight: "1.6" }}>
              {rapport.avertissement}
            </p>
          </div>

          {/* ── CTA ────────────────────────────────────────────────────────────── */}
          <button
            onClick={() => setStep("validation")}
            style={{
              width: "100%",
              padding: "16px",
              background: "linear-gradient(135deg, #d94f2b, #c1410f)",
              color: "white",
              fontSize: "14px",
              fontWeight: "700",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.2px",
            }}
          >
            {fr ? "Ce rapport correspond-il à votre enfant ? →" : "Does this report match your child? →"}
          </button>
        </>
      )}

      {/* ── Validation Step ────────────────────────────────────────────────────── */}
      {step === "validation" && !done && (
        <div>
          <div style={{
            background: "white",
            border: "1.5px solid #e5e7eb",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "16px",
          }}>
            <h2 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "800", color: "#0f1623" }}>
              {fr ? "Votre avis sur ce rapport" : "Your feedback on this report"}
            </h2>
            <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#6b7280", lineHeight: "1.6" }}>
              {fr
                ? "Votre validation permet à Édu-Réussite d'ajuster le parcours scolaire de façon pertinente."
                : "Your validation allows Édu-Réussite to adjust the learning path in a relevant way."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  val: "CONFIRMED", icon: "✅",
                  labelFr: "Oui, ce rapport correspond bien à mon enfant",
                  labelEn: "Yes, this report matches my child",
                  desc: fr
                    ? "Le parcours sera ajusté en conséquence."
                    : "The learning path will be adjusted accordingly.",
                  accentColor: "#16a34a", accentBg: "#f0fdf4",
                },
                {
                  val: "COMMENTED", icon: "💬",
                  labelFr: "Partiellement — j'ai des précisions à ajouter",
                  labelEn: "Partially — I have clarifications to add",
                  desc: fr ? "Vous pourrez ajouter un commentaire." : "You can add a comment below.",
                  accentColor: "#2563eb", accentBg: "#eff6ff",
                },
                {
                  val: "REFUSED", icon: "❌",
                  labelFr: "Non, ce rapport ne correspond pas à mon enfant",
                  labelEn: "No, this report does not match my child",
                  desc: fr ? "Aucun ajustement ne sera effectué." : "No adjustments will be made.",
                  accentColor: "#dc2626", accentBg: "#fef2f2",
                },
              ].map((opt) => {
                const selected = choix === opt.val;
                return (
                  <button
                    key={opt.val}
                    onClick={() => setChoix(opt.val as typeof choix)}
                    style={{
                      width: "100%", textAlign: "left",
                      background: selected ? opt.accentBg : "white",
                      border: `2px solid ${selected ? opt.accentColor : "#e5e7eb"}`,
                      borderRadius: "14px",
                      padding: "14px 16px",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "20px" }}>{opt.icon}</span>
                      <div>
                        <p style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: "700", color: selected ? opt.accentColor : "#111827" }}>
                          {fr ? opt.labelFr : opt.labelEn}
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {(choix === "COMMENTED" || choix === "REFUSED") && (
            <div style={{
              background: "white", border: "1.5px solid #e5e7eb",
              borderRadius: "16px", padding: "20px", marginBottom: "16px",
            }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
                {fr ? "Vos précisions (optionnel)" : "Your clarifications (optional)"}
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                placeholder={fr
                  ? "Ex : Mon enfant présente aussi des difficultés en…"
                  : "E.g.: My child also has difficulties with…"}
                style={{
                  width: "100%", border: "1.5px solid #d1d5db",
                  borderRadius: "10px", padding: "10px 12px",
                  fontSize: "13px", resize: "none",
                  outline: "none", boxSizing: "border-box",
                  fontFamily: "inherit", lineHeight: "1.5",
                }}
              />
            </div>
          )}

          {error && (
            <p style={{ fontSize: "13px", color: "#dc2626", marginBottom: "12px" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!choix || valider.isPending}
            style={{
              width: "100%", padding: "16px",
              background: !choix || valider.isPending
                ? "#d1d5db"
                : "linear-gradient(135deg, #d94f2b, #c1410f)",
              color: "white", fontSize: "14px", fontWeight: "700",
              borderRadius: "14px", border: "none",
              cursor: !choix || valider.isPending ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {valider.isPending
              ? (fr ? "Envoi en cours…" : "Submitting…")
              : (fr ? "Valider ma réponse" : "Submit my response")}
          </button>

          <button
            onClick={() => setStep("lecture")}
            style={{
              width: "100%", marginTop: "10px", padding: "10px",
              background: "transparent", border: "none",
              fontSize: "13px", color: "#9ca3af",
              cursor: "pointer", fontWeight: "500",
            }}
          >
            {fr ? "← Relire le rapport" : "← Re-read the report"}
          </button>
        </div>
      )}
    </div>
  );
}
