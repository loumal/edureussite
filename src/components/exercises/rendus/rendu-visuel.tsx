"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisuelPoint = { label: string; x: number; y: number; couleur?: string };
export type VisuelSegment = [string, string];
export type TypeSolide =
  | "cube" | "pave_droit" | "cylindre" | "cone"
  | "pyramide_carree" | "prisme_triangulaire" | "sphere";

export type Visuel =
  | {
      type: "plan_cartesien";
      titre?: string;
      points?: VisuelPoint[];
      segments?: VisuelSegment[];
      polygones?: { sommets: string[]; couleur?: string; rempli?: boolean }[];
      xRange?: [number, number];
      yRange?: [number, number];
      grille?: boolean;
    }
  | {
      type: "tableau";
      titre?: string;
      colonnes: string[];
      lignes: (string | number)[][];
      surligner?: number[]; // indices de lignes à surligner
    }
  | {
      type: "figure_geometrique";
      titre?: string;
      forme: "rectangle" | "triangle_rectangle" | "triangle_equilateral" | "cercle" | "parallelogramme" | "trapeze";
      dimensions?: Record<string, number>;
      etiquettes?: string[];
      couleur?: string;
      question?: string;
    }
  | {
      type: "solide_3d";
      titre?: string;
      nom?: string;
      forme: TypeSolide;
      dimensions?: Record<string, number>;
      etiquettes?: string[];
      couleur?: string;
    }
  | {
      type: "solides_multiples";
      titre?: string;
      solides: { nom: string; forme: TypeSolide; dimensions?: Record<string, number>; couleur?: string }[];
    }
  | {
      type: "graphique_barres";
      titre?: string;
      axeX?: string;
      axeY?: string;
      donnees: { label: string; valeur: number; couleur?: string }[];
      unite?: string;
    }
  | {
      type: "graphique_lignes";
      titre?: string;
      axeX?: string;
      axeY?: string;
      donnees: { label: string; valeur: number }[];
      unite?: string;
    };

// ─── Dispatcher principal ─────────────────────────────────────────────────────

export function RenduVisuel({ visuel }: { visuel: Visuel }) {
  if (!visuel?.type) return null;

  return (
    <div className="my-4 rounded-xl border border-[var(--color-rule)] bg-white overflow-hidden">
      {visuel.titre && (
        <div className="px-4 py-2 bg-[var(--color-paper-warm)] border-b border-[var(--color-rule)]">
          <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">
            {visuel.titre}
          </p>
        </div>
      )}
      <div className="p-3">
        {visuel.type === "plan_cartesien" && <PlanCartesien v={visuel} />}
        {visuel.type === "tableau" && <Tableau v={visuel} />}
        {visuel.type === "figure_geometrique" && <FigureGeometrique v={visuel} />}
        {visuel.type === "solide_3d" && <Solide3D v={visuel} />}
        {visuel.type === "solides_multiples" && <SolidesMultiples v={visuel} />}
        {visuel.type === "graphique_barres" && <GraphiqueBarres v={visuel} />}
        {visuel.type === "graphique_lignes" && <GraphiqueLignes v={visuel} />}
      </div>
    </div>
  );
}

export function RenduVisuels({ visuels }: { visuels?: Visuel[] }) {
  if (!visuels || visuels.length === 0) return null;
  return (
    <div className="space-y-3">
      {visuels.map((v, i) => (
        <RenduVisuel key={i} visuel={v} />
      ))}
    </div>
  );
}

// ─── Plan cartésien (SVG pur) ─────────────────────────────────────────────────

function PlanCartesien({ v }: { v: Extract<Visuel, { type: "plan_cartesien" }> }) {
  const W = 320;
  const H = 320;
  const PADDING = 40;

  const xMin = v.xRange?.[0] ?? -1;
  const xMax = v.xRange?.[1] ?? 10;
  const yMin = v.yRange?.[0] ?? -1;
  const yMax = v.yRange?.[1] ?? 10;

  const toSvgX = (x: number) => PADDING + ((x - xMin) / (xMax - xMin)) * (W - 2 * PADDING);
  const toSvgY = (y: number) => H - PADDING - ((y - yMin) / (yMax - yMin)) * (H - 2 * PADDING);

  const pointsByLabel: Record<string, VisuelPoint> = {};
  for (const p of v.points ?? []) pointsByLabel[p.label] = p;

  // Tick marks
  const xTicks: number[] = [];
  const yTicks: number[] = [];
  const step = xMax - xMin <= 12 ? 1 : 2;
  for (let x = Math.ceil(xMin); x <= xMax; x += step) xTicks.push(x);
  for (let y = Math.ceil(yMin); y <= yMax; y += step) yTicks.push(y);

  const COULEURS: Record<string, string> = {
    purple: "#5b4fcf", success: "#2a7c6f", accent: "#d94f2b",
    gold: "#c9952a", blue: "#3b82f6", pink: "#ec4899",
  };
  const defaultColor = "#5b4fcf";

  const axisColor = "var(--color-ink)";
  const gridColor = "rgba(0,0,0,0.07)";
  const tickColor = "var(--color-ink-soft)";

  // Origine SVG
  const ox = toSvgX(0);
  const oy = toSvgY(0);

  return (
    <div className="flex justify-center">
      <svg width={W} height={H} className="font-sans select-none" aria-label="Plan cartésien">
        {/* Grille */}
        {(v.grille !== false) && xTicks.map((x) => (
          <line key={`gx${x}`} x1={toSvgX(x)} y1={PADDING} x2={toSvgX(x)} y2={H - PADDING} stroke={gridColor} strokeWidth={1} />
        ))}
        {(v.grille !== false) && yTicks.map((y) => (
          <line key={`gy${y}`} x1={PADDING} y1={toSvgY(y)} x2={W - PADDING} y2={toSvgY(y)} stroke={gridColor} strokeWidth={1} />
        ))}

        {/* Axes */}
        <line x1={PADDING} y1={oy} x2={W - PADDING + 10} y2={oy} stroke={axisColor} strokeWidth={1.5} markerEnd="url(#arr)" />
        <line x1={ox} y1={H - PADDING} x2={ox} y2={PADDING - 10} stroke={axisColor} strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* Flèches */}
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={axisColor} />
          </marker>
        </defs>

        {/* Étiquettes axes */}
        <text x={W - PADDING + 14} y={oy + 4} fontSize="11" fill={axisColor} fontWeight="600">x</text>
        <text x={ox + 6} y={PADDING - 14} fontSize="11" fill={axisColor} fontWeight="600">y</text>

        {/* Ticks X */}
        {xTicks.filter((x) => x !== 0).map((x) => (
          <g key={`tx${x}`}>
            <line x1={toSvgX(x)} y1={oy - 3} x2={toSvgX(x)} y2={oy + 3} stroke={axisColor} strokeWidth={1} />
            <text x={toSvgX(x)} y={oy + 14} fontSize="9" fill={tickColor} textAnchor="middle">{x}</text>
          </g>
        ))}
        {/* Ticks Y */}
        {yTicks.filter((y) => y !== 0).map((y) => (
          <g key={`ty${y}`}>
            <line x1={ox - 3} y1={toSvgY(y)} x2={ox + 3} y2={toSvgY(y)} stroke={axisColor} strokeWidth={1} />
            <text x={ox - 8} y={toSvgY(y) + 3} fontSize="9" fill={tickColor} textAnchor="end">{y}</text>
          </g>
        ))}
        {/* Origine */}
        <text x={ox - 8} y={oy + 14} fontSize="9" fill={tickColor} textAnchor="middle">0</text>

        {/* Polygones */}
        {(v.polygones ?? []).map((poly, i) => {
          const coords = poly.sommets
            .map((lbl) => pointsByLabel[lbl])
            .filter(Boolean)
            .map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`)
            .join(" ");
          if (!coords) return null;
          const col = poly.couleur ?? "rgba(91,79,207,0.12)";
          return (
            <polygon
              key={i}
              points={coords}
              fill={poly.rempli !== false ? col : "none"}
              stroke={col.replace(/[\d.]+\)$/, "0.7)")}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Segments entre points nommés */}
        {(v.segments ?? []).map(([a, b], i) => {
          const pa = pointsByLabel[a];
          const pb = pointsByLabel[b];
          if (!pa || !pb) return null;
          return (
            <line key={i}
              x1={toSvgX(pa.x)} y1={toSvgY(pa.y)}
              x2={toSvgX(pb.x)} y2={toSvgY(pb.y)}
              stroke="#5b4fcf" strokeWidth={1.5} strokeDasharray="4,2"
            />
          );
        })}

        {/* Points */}
        {(v.points ?? []).map((p) => {
          const cx = toSvgX(p.x);
          const cy = toSvgY(p.y);
          const color = COULEURS[p.couleur ?? ""] ?? defaultColor;
          // Décalage étiquette pour éviter le chevauchement avec l'axe
          const dx = p.x <= xMin + 0.5 ? 10 : -10;
          const dy = p.y <= yMin + 0.5 ? -8 : p.y >= yMax - 0.5 ? 12 : -8;
          return (
            <g key={p.label}>
              <circle cx={cx} cy={cy} r={5} fill={color} />
              <text x={cx + dx} y={cy + dy} fontSize="11" fill={color} fontWeight="700">
                {p.label}({p.x},{p.y})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Tableau de valeurs ───────────────────────────────────────────────────────

function Tableau({ v }: { v: Extract<Visuel, { type: "tableau" }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {v.colonnes.map((col, i) => (
              <th key={i} className="border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-2 text-xs font-bold text-[var(--color-ink)] text-center">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.lignes.map((ligne, i) => {
            const surligne = v.surligner?.includes(i);
            return (
              <tr key={i} className={surligne ? "bg-[rgba(91,79,207,0.08)]" : i % 2 === 0 ? "bg-white" : "bg-[var(--color-paper-warm)]"}>
                {ligne.map((cell, j) => (
                  <td key={j} className="border border-[var(--color-rule)] px-3 py-2 text-center text-[var(--color-ink)] font-mono text-sm">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Figures géométriques (SVG) ───────────────────────────────────────────────

function FigureGeometrique({ v }: { v: Extract<Visuel, { type: "figure_geometrique" }> }) {
  const W = 280;
  const H = 200;
  const fill = v.couleur ?? "rgba(42,124,111,0.10)";
  const stroke = "#2a7c6f";
  const etiq = v.etiquettes ?? [];
  const d = v.dimensions ?? {};

  if (v.forme === "rectangle") {
    const rw = Math.min(200, Math.max(80, (d.largeur ?? 1) * 20));
    const rh = Math.min(120, Math.max(40, (d.hauteur ?? 1) * 20));
    const x0 = (W - rw) / 2;
    const y0 = (H - rh) / 2;
    return (
      <svg width={W} height={H} className="select-none">
        <rect x={x0} y={y0} width={rw} height={rh} fill={fill} stroke={stroke} strokeWidth={2} />
        {/* Bas */}
        {etiq[0] && <text x={W / 2} y={y0 + rh + 18} fontSize="12" textAnchor="middle" fill={stroke} fontWeight="600">{etiq[0]}</text>}
        {/* Droite */}
        {etiq[1] && <text x={x0 + rw + 14} y={H / 2} fontSize="12" textAnchor="start" fill={stroke} fontWeight="600" dominantBaseline="middle">{etiq[1]}</text>}
        {/* Question */}
        {v.question && <text x={W / 2} y={H - 4} fontSize="11" textAnchor="middle" fill="var(--color-ink-soft)" fontStyle="italic">{v.question}</text>}
      </svg>
    );
  }

  if (v.forme === "triangle_rectangle") {
    const base = Math.min(180, Math.max(80, (d.base ?? 1) * 20));
    const haut = Math.min(140, Math.max(60, (d.hauteur ?? 1) * 20));
    const x0 = (W - base) / 2;
    const y0 = (H - haut) / 2;
    const pts = `${x0},${y0 + haut} ${x0 + base},${y0 + haut} ${x0},${y0}`;
    return (
      <svg width={W} height={H} className="select-none">
        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={2} />
        {/* Angle droit */}
        <polyline points={`${x0 + 12},${y0 + haut} ${x0 + 12},${y0 + haut - 12} ${x0},${y0 + haut - 12}`} fill="none" stroke={stroke} strokeWidth={1.5} />
        {/* Base */}
        {etiq[0] && <text x={W / 2} y={y0 + haut + 18} fontSize="12" textAnchor="middle" fill={stroke} fontWeight="600">{etiq[0]}</text>}
        {/* Hauteur */}
        {etiq[1] && <text x={x0 - 16} y={H / 2} fontSize="12" textAnchor="end" fill={stroke} fontWeight="600" dominantBaseline="middle">{etiq[1]}</text>}
        {/* Hypoténuse */}
        {etiq[2] && <text x={W / 2 + 16} y={H / 2 - 10} fontSize="12" textAnchor="start" fill={stroke} fontWeight="600">{etiq[2]}</text>}
        {v.question && <text x={W / 2} y={H - 4} fontSize="11" textAnchor="middle" fill="var(--color-ink-soft)" fontStyle="italic">{v.question}</text>}
      </svg>
    );
  }

  if (v.forme === "cercle") {
    const r = Math.min(80, Math.max(30, (d.rayon ?? 3) * 12));
    const cx = W / 2;
    const cy = H / 2;
    return (
      <svg width={W} height={H} className="select-none">
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={2} />
        {/* Rayon */}
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={stroke} strokeWidth={1.5} strokeDasharray="4,2" />
        {etiq[0] && <text x={cx + r / 2} y={cy - 8} fontSize="12" textAnchor="middle" fill={stroke} fontWeight="600">{etiq[0]}</text>}
        {/* Diamètre */}
        {etiq[1] && (
          <>
            <line x1={cx - r} y1={cy + r + 14} x2={cx + r} y2={cy + r + 14} stroke={stroke} strokeWidth={1} />
            <text x={cx} y={cy + r + 28} fontSize="12" textAnchor="middle" fill={stroke} fontWeight="600">{etiq[1]}</text>
          </>
        )}
        {v.question && <text x={W / 2} y={H - 4} fontSize="11" textAnchor="middle" fill="var(--color-ink-soft)" fontStyle="italic">{v.question}</text>}
      </svg>
    );
  }

  if (v.forme === "triangle_equilateral") {
    const s = Math.min(180, Math.max(80, (d.cote ?? 4) * 20));
    const cx = W / 2;
    const base_y = (H + s * 0.866) / 2;
    const top_y = base_y - s * 0.866;
    const pts = `${cx},${top_y} ${cx - s / 2},${base_y} ${cx + s / 2},${base_y}`;
    return (
      <svg width={W} height={H} className="select-none">
        <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={2} />
        {etiq[0] && <text x={cx} y={base_y + 18} fontSize="12" textAnchor="middle" fill={stroke} fontWeight="600">{etiq[0]}</text>}
        {v.question && <text x={W / 2} y={H - 4} fontSize="11" textAnchor="middle" fill="var(--color-ink-soft)" fontStyle="italic">{v.question}</text>}
      </svg>
    );
  }

  // Fallback générique
  return (
    <svg width={W} height={H} className="select-none">
      <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="var(--color-ink-soft)">
        Figure : {v.forme}
      </text>
    </svg>
  );
}

// ─── Solides géométriques 3D ─────────────────────────────────────────────────

const SOLID_PALETTE = [
  { fill: "rgba(91,79,207,0.13)",  fillL: "rgba(91,79,207,0.07)",  stroke: "#5b4fcf" },
  { fill: "rgba(42,124,111,0.13)", fillL: "rgba(42,124,111,0.07)", stroke: "#2a7c6f" },
  { fill: "rgba(201,149,42,0.15)", fillL: "rgba(201,149,42,0.08)", stroke: "#c9952a" },
  { fill: "rgba(217,79,43,0.13)",  fillL: "rgba(217,79,43,0.07)",  stroke: "#d94f2b" },
  { fill: "rgba(59,130,246,0.13)", fillL: "rgba(59,130,246,0.07)", stroke: "#3b82f6" },
];

function solidColor(idx: number, couleur?: string) {
  if (couleur) return { fill: couleur + "22", fillL: couleur + "11", stroke: couleur };
  return SOLID_PALETTE[idx % SOLID_PALETTE.length];
}

// Point to "x,y" SVG string
function pt(x: number, y: number) { return `${Math.round(x)},${Math.round(y)}`; }
function pts(...pp: [number, number][]) { return pp.map(([x, y]) => pt(x, y)).join(" "); }

interface SP {
  W: number; H: number;
  d: Record<string, number>;
  e: string[];
  fill: string; fillL: string; stroke: string;
}

// ── Pavé droit / Cube (projection oblique cavalier) ───────────────────────────
function SvgPave({ W, H, d, e, fill, fillL, stroke }: SP) {
  const larg = d.largeur ?? d.cote ?? 5;
  const haut = d.hauteur ?? d.cote ?? 5;
  const prof = d.profondeur ?? d.cote ?? 5;
  const maxD = Math.max(larg, haut, prof, 1);
  const sc = (Math.min(W, H) * 0.42) / maxD;
  const fw = larg * sc;
  const fh = haut * sc;
  const depth = prof * sc;
  const DX = depth * 0.62;
  const DY = depth * 0.44;

  // Front-face top-left origin, centered in canvas
  const x0 = (W - fw - DX) / 2;
  const y0 = DY + (H - fh - DY) / 2;

  // 8 corners — back face = front + (DX right, DY up in SVG = -DY)
  const ftl: [number, number] = [x0,      y0     ];
  const ftr: [number, number] = [x0+fw,   y0     ];
  const fbr: [number, number] = [x0+fw,   y0+fh  ];
  const fbl: [number, number] = [x0,      y0+fh  ];
  const btl: [number, number] = [x0+DX,   y0-DY  ];
  const btr: [number, number] = [x0+fw+DX,y0-DY  ];
  const bbr: [number, number] = [x0+fw+DX,y0+fh-DY];
  const bbl: [number, number] = [x0+DX,   y0+fh-DY];

  const lbl = { fontSize: 10, fill: stroke, fontWeight: "700" as const };
  const dsh = "5,3";

  return (
    <>
      {/* Top face (light) */}
      <polygon points={pts(ftl, ftr, btr, btl)} fill={fillL} stroke={stroke} strokeWidth={1.5} />
      {/* Right face (light) */}
      <polygon points={pts(ftr, fbr, bbr, btr)} fill={fillL} stroke={stroke} strokeWidth={1.5} />
      {/* Front face (main) */}
      <polygon points={pts(ftl, ftr, fbr, fbl)} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Hidden edges */}
      <line x1={fbl[0]} y1={fbl[1]} x2={bbl[0]} y2={bbl[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.45} />
      <line x1={bbl[0]} y1={bbl[1]} x2={btl[0]} y2={btl[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.45} />
      <line x1={bbl[0]} y1={bbl[1]} x2={bbr[0]} y2={bbr[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.45} />
      {/* Labels */}
      {(e[0] ?? (d.largeur ?? d.cote)) && (
        <text x={(fbl[0]+fbr[0])/2} y={fbr[1]+15} textAnchor="middle" {...lbl}>{e[0] ?? `${d.largeur ?? d.cote} cm`}</text>
      )}
      {(e[1] ?? (d.hauteur ?? d.cote)) && (
        <text x={fbr[0]+10} y={(ftr[1]+fbr[1])/2} dominantBaseline="middle" {...lbl}>{e[1] ?? `${d.hauteur ?? d.cote} cm`}</text>
      )}
      {(e[2] ?? d.profondeur) && (
        <text x={(ftr[0]+btr[0])/2+4} y={(ftr[1]+btr[1])/2-10} textAnchor="middle" {...lbl}>{e[2] ?? `${d.profondeur} cm`}</text>
      )}
    </>
  );
}

// ── Cylindre (vue de face) ────────────────────────────────────────────────────
function SvgCylindre({ W, H, d, e, fill, stroke }: Omit<SP, "fillL">) {
  const rayon  = d.rayon ?? (d.diametre ? d.diametre / 2 : 4);
  const hauteur = d.hauteur ?? 8;
  const sc = (Math.min(W * 0.45, H * 0.50)) / Math.max(rayon, hauteur / 2, 1);
  const r  = rayon * sc;
  const h  = hauteur * sc;
  const ry = Math.max(6, r * 0.28);
  const cx = W / 2;
  const topY = (H - h) / 2;
  const botY = topY + h;
  const lbl = { fontSize: 10, fill: stroke, fontWeight: "700" as const };

  return (
    <>
      {/* Body fill */}
      <rect x={cx - r} y={topY} width={r * 2} height={h} fill={fill} stroke="none" />
      {/* Side lines */}
      <line x1={cx-r} y1={topY} x2={cx-r} y2={botY} stroke={stroke} strokeWidth={1.5} />
      <line x1={cx+r} y1={topY} x2={cx+r} y2={botY} stroke={stroke} strokeWidth={1.5} />
      {/* Bottom ellipse (base) */}
      <ellipse cx={cx} cy={botY} rx={r} ry={ry} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Top ellipse */}
      <ellipse cx={cx} cy={topY} rx={r} ry={ry} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Radius dashed line */}
      <line x1={cx} y1={topY} x2={cx+r} y2={topY} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.7} />
      {/* Labels */}
      {(e[0] ?? d.rayon) && (
        <text x={cx + r/2} y={topY - 8} textAnchor="middle" {...lbl}>{e[0] ?? `r = ${d.rayon} cm`}</text>
      )}
      {(e[1] ?? d.hauteur) && (
        <text x={cx + r + 12} y={(topY+botY)/2} dominantBaseline="middle" {...lbl}>{e[1] ?? `h = ${d.hauteur} cm`}</text>
      )}
    </>
  );
}

// ── Cône ──────────────────────────────────────────────────────────────────────
function SvgCone({ W, H, d, e, fill, stroke }: Omit<SP, "fillL">) {
  const rayon   = d.rayon ?? (d.diametre ? d.diametre / 2 : 4);
  const hauteur = d.hauteur ?? 8;
  const sc = (Math.min(W * 0.45, H * 0.50)) / Math.max(rayon, hauteur / 2, 1);
  const r  = rayon * sc;
  const h  = hauteur * sc;
  const ry = Math.max(6, r * 0.28);
  const cx = W / 2;
  const apexY = (H - h) / 2;
  const baseY = apexY + h;
  const lbl = { fontSize: 10, fill: stroke, fontWeight: "700" as const };

  return (
    <>
      {/* Body fill (triangle) */}
      <polygon points={pts([cx, apexY], [cx-r, baseY], [cx+r, baseY])} fill={fill} stroke="none" />
      {/* Base ellipse */}
      <ellipse cx={cx} cy={baseY} rx={r} ry={ry} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Slant lines */}
      <line x1={cx} y1={apexY} x2={cx-r} y2={baseY} stroke={stroke} strokeWidth={1.5} />
      <line x1={cx} y1={apexY} x2={cx+r} y2={baseY} stroke={stroke} strokeWidth={1.5} />
      {/* Altitude dashed */}
      <line x1={cx} y1={apexY} x2={cx} y2={baseY} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
      {/* Radius dashed */}
      <line x1={cx} y1={baseY} x2={cx+r} y2={baseY} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.7} />
      {/* Apex dot */}
      <circle cx={cx} cy={apexY} r={2.5} fill={stroke} />
      {/* Labels */}
      {(e[0] ?? d.rayon) && (
        <text x={cx+r/2} y={baseY+16} textAnchor="middle" {...lbl}>{e[0] ?? `r = ${d.rayon} cm`}</text>
      )}
      {(e[1] ?? d.hauteur) && (
        <text x={cx+r+12} y={(apexY+baseY)/2} dominantBaseline="middle" {...lbl}>{e[1] ?? `h = ${d.hauteur} cm`}</text>
      )}
    </>
  );
}

// ── Pyramide à base carrée (projection oblique) ───────────────────────────────
function SvgPyramide({ W, H, d, e, fill, fillL, stroke }: SP) {
  const base = d.base ?? d.cote ?? 6;
  const haut = d.hauteur ?? 8;
  const sc   = (Math.min(W, H) * 0.38) / Math.max(base, haut, 1);
  const b    = base * sc;
  const h    = haut * sc;
  const DX   = b * 0.40;
  const DY   = b * 0.28;

  // Base square in oblique: BL=front-left, BR=front-right, TR=back-right, TL=back-left
  const baseY = H - 22;
  const cx    = (W - DX) / 2;
  const BL: [number,number] = [cx - b/2,      baseY      ];
  const BR: [number,number] = [cx + b/2,      baseY      ];
  const TR: [number,number] = [cx + b/2 + DX, baseY - DY ];
  const TL: [number,number] = [cx - b/2 + DX, baseY - DY ];

  // Center of base & apex
  const bcx = (BL[0]+TR[0])/2;
  const bcy = (BL[1]+TR[1])/2;
  const apex: [number,number] = [bcx, bcy - h];

  const lbl = { fontSize: 10, fill: stroke, fontWeight: "700" as const };
  const dsh = "5,3";

  return (
    <>
      {/* Back faces (dashed, draw first) */}
      <polygon points={pts(apex, TR, TL)} fill={fillL} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.65} />
      <line x1={apex[0]} y1={apex[1]} x2={TL[0]} y2={TL[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.5} />
      <line x1={apex[0]} y1={apex[1]} x2={TR[0]} y2={TR[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.5} />
      {/* Base */}
      <polygon points={pts(BL, BR, TR, TL)} fill={fillL} stroke={stroke} strokeWidth={1.5} />
      {/* Altitude dashed */}
      <line x1={bcx} y1={bcy} x2={apex[0]} y2={apex[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.4} />
      {/* Front-left face */}
      <polygon points={pts(apex, TL, BL)} fill={fill} stroke={stroke} strokeWidth={1.5} opacity={0.8} />
      {/* Front face */}
      <polygon points={pts(apex, BL, BR)} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Labels */}
      {(e[0] ?? (d.base ?? d.cote)) && (
        <text x={(BL[0]+BR[0])/2} y={baseY+16} textAnchor="middle" {...lbl}>{e[0] ?? `${d.base ?? d.cote} cm`}</text>
      )}
      {(e[1] ?? d.hauteur) && (
        <text x={apex[0]+10} y={(apex[1]+bcy)/2} dominantBaseline="middle" {...lbl}>{e[1] ?? `h = ${d.hauteur} cm`}</text>
      )}
    </>
  );
}

// ── Prisme à base triangulaire (projection oblique) ───────────────────────────
function SvgPrisme({ W, H, d, e, fill, fillL, stroke }: SP) {
  const base   = d.base ?? 6;
  const htri   = d.hauteur_triangle ?? d.hauteur ?? 5;
  const long   = d.longueur ?? d.profondeur ?? 8;
  const maxD   = Math.max(base, htri, long / 2, 1);
  const sc     = (Math.min(W, H) * 0.38) / maxD;
  const b      = base * sc;
  const ht     = htri * sc;
  const depth  = long * sc * 0.5;
  const DX     = depth * 0.65;
  const DY     = depth * 0.45;

  // Front triangle (right-angle at bottom-left)
  const baseY  = H - 18;
  const x0     = (W - b - DX) / 2;
  const FA: [number,number] = [x0,   baseY     ]; // bottom-left
  const FB: [number,number] = [x0+b, baseY     ]; // bottom-right
  const FC: [number,number] = [x0,   baseY - ht]; // top-left (right angle)

  // Back triangle (shifted)
  const BA: [number,number] = [FA[0]+DX, FA[1]-DY];
  const BB: [number,number] = [FB[0]+DX, FB[1]-DY];
  const BC: [number,number] = [FC[0]+DX, FC[1]-DY];

  const lbl = { fontSize: 10, fill: stroke, fontWeight: "700" as const };
  const dsh = "5,3";

  return (
    <>
      {/* Hidden back edges */}
      <line x1={FA[0]} y1={FA[1]} x2={BA[0]} y2={BA[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.4} />
      <line x1={BC[0]} y1={BC[1]} x2={BA[0]} y2={BA[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.4} />
      <line x1={BA[0]} y1={BA[1]} x2={BB[0]} y2={BB[1]} stroke={stroke} strokeWidth={1} strokeDasharray={dsh} opacity={0.4} />
      {/* Bottom face (rectangle) */}
      <polygon points={pts(FA, FB, BB, BA)} fill={fillL} stroke={stroke} strokeWidth={1.5} />
      {/* Right (hypotenuse) face */}
      <polygon points={pts(FB, FC, BC, BB)} fill={fillL} stroke={stroke} strokeWidth={1.5} />
      {/* Front triangle */}
      <polygon points={pts(FA, FB, FC)} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Right angle marker */}
      <polyline points={`${FA[0]+10},${FA[1]} ${FA[0]+10},${FA[1]-10} ${FA[0]},${FA[1]-10}`} fill="none" stroke={stroke} strokeWidth={1.2} />
      {/* Visible back edges */}
      <line x1={FC[0]} y1={FC[1]} x2={BC[0]} y2={BC[1]} stroke={stroke} strokeWidth={1.5} />
      <line x1={FB[0]} y1={FB[1]} x2={BB[0]} y2={BB[1]} stroke={stroke} strokeWidth={1.5} />
      {/* Labels */}
      {(e[0] ?? d.base) && (
        <text x={(FA[0]+FB[0])/2} y={baseY+16} textAnchor="middle" {...lbl}>{e[0] ?? `${d.base} cm`}</text>
      )}
      {(e[1] ?? (d.hauteur_triangle ?? d.hauteur)) && (
        <text x={FA[0]-14} y={(FA[1]+FC[1])/2} dominantBaseline="middle" textAnchor="end" {...lbl}>{e[1] ?? `${d.hauteur_triangle ?? d.hauteur} cm`}</text>
      )}
      {(e[2] ?? d.longueur) && (
        <text x={(FB[0]+BB[0])/2+6} y={(FB[1]+BB[1])/2+14} textAnchor="middle" {...lbl}>{e[2] ?? `${d.longueur} cm`}</text>
      )}
    </>
  );
}

// ── Sphère ────────────────────────────────────────────────────────────────────
function SvgSphere({ W, H, d, e, fill, stroke }: Omit<SP, "fillL">) {
  const rayon = d.rayon ?? (d.diametre ? d.diametre / 2 : 5);
  const sc    = (Math.min(W, H) * 0.38) / Math.max(rayon, 1);
  const r     = rayon * sc;
  const cx    = W / 2;
  const cy    = H / 2;
  const lbl   = { fontSize: 10, fill: stroke, fontWeight: "700" as const };

  return (
    <>
      {/* Main circle */}
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
      {/* Equatorial ellipse */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.28} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="5,3" opacity={0.6} />
      {/* Vertical meridian */}
      <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r} fill="none" stroke={stroke} strokeWidth={1} opacity={0.35} />
      {/* Radius line */}
      <line x1={cx} y1={cy} x2={cx+r} y2={cy} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.8} />
      <circle cx={cx} cy={cy} r={2} fill={stroke} opacity={0.7} />
      {/* Label */}
      {(e[0] ?? d.rayon) && (
        <text x={cx+r/2} y={cy-10} textAnchor="middle" {...lbl}>{e[0] ?? `r = ${d.rayon} cm`}</text>
      )}
    </>
  );
}

// ── Dispatcher solide unique ──────────────────────────────────────────────────
function SolideSVG({
  forme, dimensions, etiquettes, couleur, W, H, idx = 0,
}: {
  forme: TypeSolide;
  dimensions?: Record<string, number>;
  etiquettes?: string[];
  couleur?: string;
  W: number; H: number; idx?: number;
}) {
  const { fill, fillL, stroke } = solidColor(idx, couleur);
  const props: SP = { W, H, d: dimensions ?? {}, e: etiquettes ?? [], fill, fillL, stroke };

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="select-none overflow-visible">
      {forme === "cube" || forme === "pave_droit"      ? <SvgPave {...props} />
      : forme === "cylindre"                           ? <SvgCylindre {...props} />
      : forme === "cone"                               ? <SvgCone {...props} />
      : forme === "pyramide_carree"                    ? <SvgPyramide {...props} />
      : forme === "prisme_triangulaire"                ? <SvgPrisme {...props} />
      : forme === "sphere"                             ? <SvgSphere {...props} />
      : null}
    </svg>
  );
}

function Solide3D({ v }: { v: Extract<Visuel, { type: "solide_3d" }> }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {v.nom && <p className="text-xs font-bold text-[var(--color-ink)]">{v.nom}</p>}
      <SolideSVG
        forme={v.forme}
        dimensions={v.dimensions}
        etiquettes={v.etiquettes}
        couleur={v.couleur}
        W={240} H={180}
      />
    </div>
  );
}

function SolidesMultiples({ v }: { v: Extract<Visuel, { type: "solides_multiples" }> }) {
  const count = v.solides.length;
  const cols  = count <= 2 ? 2 : count <= 4 ? 2 : count <= 6 ? 3 : 3;
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {v.solides.map((s, i) => (
        <div key={i} className="flex flex-col items-center gap-1 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper-warm)] p-2">
          <p className="text-xs font-black text-[var(--color-ink)] tracking-wide">{s.nom}</p>
          <SolideSVG
            forme={s.forme}
            dimensions={s.dimensions}
            couleur={s.couleur}
            W={150} H={120}
            idx={i}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Graphique à barres ───────────────────────────────────────────────────────

function GraphiqueBarres({ v }: { v: Extract<Visuel, { type: "graphique_barres" }> }) {
  const W = 320;
  const H = 200;
  const PL = 44; const PR = 16; const PT = 20; const PB = 44;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxVal = Math.max(...v.donnees.map((d) => d.valeur), 1);
  const barW = (chartW / v.donnees.length) * 0.6;
  const gap = (chartW / v.donnees.length) * 0.4;

  const PALETTE = ["#5b4fcf", "#2a7c6f", "#c9952a", "#d94f2b", "#3b82f6", "#ec4899"];

  return (
    <div>
      {v.axeX || v.axeY ? (
        <p className="text-xs text-[var(--color-ink-soft)] text-center mb-1">
          {v.axeY && <span>{v.axeY}</span>}
          {v.axeX && v.axeY && " / "}
          {v.axeX && <span>{v.axeX}</span>}
        </p>
      ) : null}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="select-none">
        {/* Axe Y lignes horizontales */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = PT + chartH * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={pct}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="var(--color-rule)" strokeWidth={1} />
              <text x={PL - 4} y={y + 3} fontSize="9" fill="var(--color-ink-soft)" textAnchor="end">{val}{v.unite ?? ""}</text>
            </g>
          );
        })}
        {/* Axe X */}
        <line x1={PL} y1={PT + chartH} x2={W - PR} y2={PT + chartH} stroke="var(--color-ink)" strokeWidth={1.5} />
        {/* Barres */}
        {v.donnees.map((d, i) => {
          const x = PL + i * (barW + gap) + gap / 2;
          const barH = (d.valeur / maxVal) * chartH;
          const y = PT + chartH - barH;
          const color = d.couleur ?? PALETTE[i % PALETTE.length];
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} opacity={0.85} />
              <text x={x + barW / 2} y={y - 4} fontSize="9" fill={color} textAnchor="middle" fontWeight="600">
                {d.valeur}{v.unite ?? ""}
              </text>
              <text x={x + barW / 2} y={PT + chartH + 14} fontSize="9" fill="var(--color-ink-soft)" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Graphique en lignes ──────────────────────────────────────────────────────

function GraphiqueLignes({ v }: { v: Extract<Visuel, { type: "graphique_lignes" }> }) {
  const W = 320;
  const H = 200;
  const PL = 44; const PR = 16; const PT = 20; const PB = 44;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const n = v.donnees.length;
  if (n === 0) return null;

  const maxVal = Math.max(...v.donnees.map((d) => d.valeur), 1);
  const toX = (i: number) => PL + (i / (n - 1 || 1)) * chartW;
  const toY = (val: number) => PT + chartH - (val / maxVal) * chartH;

  const pts = v.donnees.map((d, i) => `${toX(i)},${toY(d.valeur)}`).join(" ");
  const areaPath = `M${toX(0)},${PT + chartH} ` + v.donnees.map((d, i) => `L${toX(i)},${toY(d.valeur)}`).join(" ") + ` L${toX(n - 1)},${PT + chartH} Z`;

  return (
    <div>
      {v.axeX || v.axeY ? (
        <p className="text-xs text-[var(--color-ink-soft)] text-center mb-1">
          {v.axeY && <span>{v.axeY}</span>}
          {v.axeX && v.axeY && " / "}
          {v.axeX && <span>{v.axeX}</span>}
        </p>
      ) : null}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="select-none">
        {/* Grille horizontale */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = PT + chartH * (1 - pct);
          const val = Math.round(maxVal * pct);
          return (
            <g key={pct}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="var(--color-rule)" strokeWidth={1} />
              <text x={PL - 4} y={y + 3} fontSize="9" fill="var(--color-ink-soft)" textAnchor="end">{val}{v.unite ?? ""}</text>
            </g>
          );
        })}
        {/* Axes */}
        <line x1={PL} y1={PT + chartH} x2={W - PR} y2={PT + chartH} stroke="var(--color-ink)" strokeWidth={1.5} />
        {/* Aire */}
        <path d={areaPath} fill="rgba(91,79,207,0.08)" />
        {/* Ligne */}
        <polyline points={pts} fill="none" stroke="#5b4fcf" strokeWidth={2} strokeLinejoin="round" />
        {/* Points + labels */}
        {v.donnees.map((d, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(d.valeur)} r={4} fill="#5b4fcf" />
            <text x={toX(i)} y={toY(d.valeur) - 8} fontSize="9" fill="#5b4fcf" textAnchor="middle" fontWeight="600">
              {d.valeur}{v.unite ?? ""}
            </text>
            <text x={toX(i)} y={PT + chartH + 14} fontSize="9" fill="var(--color-ink-soft)" textAnchor="middle">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
