"use client";

// ─── Palette commune ─────────────────────────────────────────────────────────
const C = {
  fill:    "#dbeafe", // bleu clair
  stroke:  "#2563eb", // bleu
  fill2:   "#fef9c3", // jaune clair
  stroke2: "#ca8a04", // doré
  fill3:   "#dcfce7", // vert clair
  stroke3: "#16a34a", // vert
  fill4:   "#ffe4e6", // rose clair
  stroke4: "#e11d48", // rose
  text:    "#1e3a8a", // bleu foncé
  gray:    "#94a3b8",
  bg:      "#f0f9ff",
};

const SVG_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  className: "mx-auto",
};

// ─── 2D — Carré ───────────────────────────────────────────────────────────────
function FigCarre() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 160 160" width="160" height="160">
      <rect x="30" y="30" width="100" height="100" fill={C.fill} stroke={C.stroke} strokeWidth="2.5" />
      {/* Marqueurs angle droit */}
      {[[30,30],[130,30],[130,130],[30,130]].map(([x,y],i) => {
        const dx = x === 30 ? 10 : -10, dy = y === 30 ? 10 : -10;
        return <path key={i} d={`M${x+dx},${y} L${x+dx},${y+dy} L${x},${y+dy}`} fill="none" stroke={C.stroke} strokeWidth="1.5"/>;
      })}
      <text x="80" y="22" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Carré</text>
      <text x="80" y="152" textAnchor="middle" fontSize="10" fill={C.text}>côté a</text>
      <line x1="30" y1="145" x2="130" y2="145" stroke={C.stroke} strokeWidth="1" markerEnd="url(#ar)" markerStart="url(#ar)"/>
      <defs>
        <marker id="ar" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke={C.stroke} strokeWidth="1"/>
        </marker>
      </defs>
    </svg>
  );
}

// ─── 2D — Rectangle ──────────────────────────────────────────────────────────
function FigRectangle() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 140" width="200" height="140">
      <rect x="20" y="30" width="160" height="80" fill={C.fill} stroke={C.stroke} strokeWidth="2.5" />
      <text x="100" y="22" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Rectangle</text>
      {/* labels */}
      <text x="100" y="126" textAnchor="middle" fontSize="10" fill={C.text}>longueur ℓ</text>
      <text x="9" y="72" textAnchor="middle" fontSize="10" fill={C.text} transform="rotate(-90,9,72)">largeur l</text>
      {/* angle markers */}
      {([[20,30],[180,30],[180,110],[20,110]] as [number,number][]).map(([x,y],i) => {
        const dx = x===20 ? 10 : -10, dy = y===30 ? 10 : -10;
        return <path key={i} d={`M${x+dx},${y} L${x+dx},${y+dy} L${x},${y+dy}`} fill="none" stroke={C.stroke} strokeWidth="1.5"/>;
      })}
    </svg>
  );
}

// ─── 2D — Triangle rectangle ─────────────────────────────────────────────────
function FigTriangleRectangle() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 160" width="180" height="160">
      <polygon points="20,130 20,30 140,130" fill={C.fill} stroke={C.stroke} strokeWidth="2.5" />
      {/* angle droit */}
      <path d="M20,110 L40,110 L40,130" fill="none" stroke={C.stroke} strokeWidth="1.8"/>
      <text x="90" y="18" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Triangle rectangle</text>
      <text x="8" y="82" textAnchor="middle" fontSize="10" fill={C.text} transform="rotate(-90,8,82)">hauteur</text>
      <text x="80" y="148" textAnchor="middle" fontSize="10" fill={C.text}>base</text>
      <text x="100" y="78" textAnchor="middle" fontSize="10" fill={C.text} transform="rotate(-40,100,78)">hypoténuse</text>
    </svg>
  );
}

// ─── 2D — Triangle quelconque ────────────────────────────────────────────────
function FigTriangle() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 160" width="180" height="160">
      <polygon points="90,20 20,140 160,140" fill={C.fill} stroke={C.stroke} strokeWidth="2.5" />
      <text x="90" y="12" textAnchor="middle" fontSize="10" fill={C.text}>A</text>
      <text x="10" y="152" textAnchor="middle" fontSize="10" fill={C.text}>B</text>
      <text x="165" y="152" textAnchor="middle" fontSize="10" fill={C.text}>C</text>
      <text x="90" y="155" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Triangle ABC</text>
    </svg>
  );
}

// ─── 2D — Cercle ─────────────────────────────────────────────────────────────
function FigCercle() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 180" width="180" height="180">
      <circle cx="90" cy="90" r="65" fill={C.fill} stroke={C.stroke} strokeWidth="2.5" />
      <circle cx="90" cy="90" r="3" fill={C.stroke} />
      <line x1="90" y1="90" x2="155" y2="90" stroke={C.stroke} strokeWidth="2" strokeDasharray="4,3"/>
      <text x="122" y="84" fontSize="11" fill={C.text} fontWeight="700">r</text>
      <text x="90" y="10" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Cercle</text>
      <text x="90" y="172" textAnchor="middle" fontSize="10" fill={C.text}>Aire = π × r²</text>
    </svg>
  );
}

// ─── 3D — Cube ───────────────────────────────────────────────────────────────
function FigCube() {
  // Projection cavalière
  const d = 25; // offset oblique
  return (
    <svg {...SVG_PROPS} viewBox="0 0 190 170" width="190" height="170">
      <text x="95" y="14" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Cube</text>
      {/* Face avant */}
      <polygon points="40,50 120,50 120,130 40,130" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      {/* Face dessus */}
      <polygon points={`40,50 ${40+d},${50-d} ${120+d},${50-d} 120,50`} fill="#bfdbfe" stroke={C.stroke} strokeWidth="2"/>
      {/* Face droite */}
      <polygon points={`120,50 ${120+d},${50-d} ${120+d},${130-d} 120,130`} fill="#93c5fd" stroke={C.stroke} strokeWidth="2"/>
      {/* Arêtes cachées */}
      <line x1={40} y1={130} x2={40+d} y2={130-d} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <line x1={40+d} y1={50-d} x2={40+d} y2={130-d} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <line x1={40+d} y1={130-d} x2={120+d} y2={130-d} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <text x="95" y="162" textAnchor="middle" fontSize="10" fill={C.text}>toutes les faces sont des carrés</text>
    </svg>
  );
}

// ─── 3D — Pavé droit ─────────────────────────────────────────────────────────
function FigPave() {
  const ox=30, oy=60, w=90, h=70, dx=30, dy=22;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 170" width="200" height="170">
      <text x="100" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Pavé droit (prisme rectangulaire)</text>
      <polygon points={`${ox},${oy} ${ox+w},${oy} ${ox+w},${oy+h} ${ox},${oy+h}`} fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <polygon points={`${ox},${oy} ${ox+dx},${oy-dy} ${ox+w+dx},${oy-dy} ${ox+w},${oy}`} fill="#bfdbfe" stroke={C.stroke} strokeWidth="2"/>
      <polygon points={`${ox+w},${oy} ${ox+w+dx},${oy-dy} ${ox+w+dx},${oy+h-dy} ${ox+w},${oy+h}`} fill="#93c5fd" stroke={C.stroke} strokeWidth="2"/>
      <line x1={ox} y1={oy+h} x2={ox+dx} y2={oy+h-dy} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <line x1={ox+dx} y1={oy-dy} x2={ox+dx} y2={oy+h-dy} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <line x1={ox+dx} y1={oy+h-dy} x2={ox+w+dx} y2={oy+h-dy} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <text x="75" y="155" textAnchor="middle" fontSize="10" fill={C.text}>longueur × largeur × hauteur</text>
    </svg>
  );
}

// ─── 3D — Pyramide ───────────────────────────────────────────────────────────
function FigPyramide() {
  const bx=45, by=120, bw=100, bh=36, apex=[95,18];
  const [ax,ay]=apex;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 190 160" width="190" height="160">
      <text x="95" y="11" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Pyramide à base carrée</text>
      <polygon points={`${bx},${by} ${bx+bw/2},${by-bh} ${bx+bw},${by} ${bx+bw/2},${by+bh}`} fill={C.fill} stroke={C.stroke} strokeWidth="1.5"/>
      <polygon points={`${ax},${ay} ${bx},${by} ${bx+bw/2},${by-bh}`} fill="#bfdbfe" stroke={C.stroke} strokeWidth="2"/>
      <polygon points={`${ax},${ay} ${bx+bw/2},${by-bh} ${bx+bw},${by}`} fill="#93c5fd" stroke={C.stroke} strokeWidth="2"/>
      <polygon points={`${ax},${ay} ${bx},${by} ${bx+bw/2},${by+bh}`} fill="#dbeafe" stroke={C.stroke} strokeWidth="1.5"/>
      <line x1={ax} y1={ay} x2={bx+bw} y2={by} stroke={C.stroke} strokeWidth="2"/>
      <line x1={ax} y1={ay} x2={bx+bw/2} y2={by+bh} stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3"/>
      <text x="95" y="152" textAnchor="middle" fontSize="10" fill={C.text}>1 sommet (apex) + base carrée</text>
    </svg>
  );
}

// ─── 3D — Cône ───────────────────────────────────────────────────────────────
function FigCone() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 180" width="180" height="180">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Cône</text>
      <ellipse cx="90" cy="140" rx="55" ry="18" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <line x1="35" y1="140" x2="90" y2="28" stroke={C.stroke} strokeWidth="2"/>
      <line x1="145" y1="140" x2="90" y2="28" stroke={C.stroke} strokeWidth="2"/>
      <ellipse cx="90" cy="140" rx="55" ry="18" fill="none" stroke={C.stroke} strokeWidth="2"/>
      <circle cx="90" cy="28" r="3" fill={C.stroke}/>
      <line x1="90" y1="140" x2="145" y2="140" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="118" y="134" fontSize="10" fill={C.text}>r</text>
      <line x1="90" y1="28" x2="90" y2="140" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="96" y="90" fontSize="10" fill={C.text}>h</text>
      <text x="90" y="172" textAnchor="middle" fontSize="10" fill={C.text}>1 sommet + 1 base circulaire</text>
    </svg>
  );
}

// ─── 3D — Cylindre ───────────────────────────────────────────────────────────
function FigCylindre() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 190" width="180" height="190">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Cylindre</text>
      <ellipse cx="90" cy="145" rx="55" ry="18" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <rect x="35" y="45" width="110" height="100" fill={C.fill} stroke="none"/>
      <line x1="35" y1="45" x2="35" y2="145" stroke={C.stroke} strokeWidth="2"/>
      <line x1="145" y1="45" x2="145" y2="145" stroke={C.stroke} strokeWidth="2"/>
      <ellipse cx="90" cy="45" rx="55" ry="18" fill="#bfdbfe" stroke={C.stroke} strokeWidth="2"/>
      <line x1="90" y1="45" x2="145" y2="45" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="118" y="40" fontSize="10" fill={C.text}>r</text>
      <line x1="152" y1="45" x2="152" y2="145" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="158" y="98" fontSize="10" fill={C.text}>h</text>
      <text x="90" y="180" textAnchor="middle" fontSize="10" fill={C.text}>2 bases circulaires + surface latérale</text>
    </svg>
  );
}

// ─── 3D — Sphère ─────────────────────────────────────────────────────────────
function FigSphere() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 180" width="180" height="180">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Sphère</text>
      <circle cx="90" cy="95" r="68" fill={C.fill} stroke={C.stroke} strokeWidth="2.5"/>
      <ellipse cx="90" cy="95" rx="68" ry="22" fill="none" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="6,3"/>
      <ellipse cx="90" cy="95" rx="22" ry="68" fill="none" stroke={C.stroke} strokeWidth="1.2" strokeDasharray="4,3" opacity="0.5"/>
      <circle cx="90" cy="95" r="3" fill={C.stroke}/>
      <line x1="90" y1="95" x2="158" y2="95" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="124" y="89" fontSize="11" fill={C.text} fontWeight="700">r</text>
      <text x="90" y="173" textAnchor="middle" fontSize="10" fill={C.text}>Aire = 4πr² · Volume = 4/3 πr³</text>
    </svg>
  );
}

// ─── 3D — Prisme triangulaire ────────────────────────────────────────────────
function FigPrisme() {
  const dx=28, dy=20;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 170" width="200" height="170">
      <text x="100" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Prisme triangulaire</text>
      {/* Triangle avant */}
      <polygon points="40,130 40,50 110,130" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      {/* Triangle arrière (décalé) */}
      <polygon points={`${40+dx},${130-dy} ${40+dx},${50-dy} ${110+dx},${130-dy}`} fill="#bfdbfe" stroke={C.stroke} strokeWidth="1.5" strokeDasharray="4,3"/>
      {/* Faces latérales */}
      <polygon points={`40,130 ${40+dx},${130-dy} ${40+dx},${50-dy} 40,50`} fill="#dbeafe" stroke={C.stroke} strokeWidth="2"/>
      <polygon points={`40,130 ${40+dx},${130-dy} ${110+dx},${130-dy} 110,130`} fill="#93c5fd" stroke={C.stroke} strokeWidth="2"/>
      <line x1="110" y1="130" x2={110+dx} y2={130-dy} stroke={C.stroke} strokeWidth="2"/>
      <line x1="40" y1="50" x2={40+dx} y2={50-dy} stroke={C.stroke} strokeWidth="2"/>
      <text x="100" y="157" textAnchor="middle" fontSize="10" fill={C.text}>2 triangles + 3 rectangles</text>
    </svg>
  );
}

// ─── Probabilités — Arbre ────────────────────────────────────────────────────
function FigArbreProba() {
  // Arbre générique: tirage d'une pièce 2 fois (Pile/Face)
  const root = [30, 100];
  const mid = [[100, 55], [100, 145]];
  const leaves = [[175, 30], [175, 80], [175, 120], [175, 170]];
  const labels1 = ["Pile", "Face"];
  const labels2 = ["Pile", "Face", "Pile", "Face"];
  const outcomes = ["P-P", "P-F", "F-P", "F-F"];
  return (
    <svg {...SVG_PROPS} viewBox="0 0 260 200" width="260" height="200">
      <text x="130" y="12" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Arbre de probabilités</text>
      <text x="130" y="192" textAnchor="middle" fontSize="9.5" fill={C.text}>Ex: lancer une pièce 2 fois</text>
      {/* root → mid */}
      {mid.map(([mx,my], i) => (
        <line key={i} x1={root[0]} y1={root[1]} x2={mx} y2={my} stroke={C.stroke} strokeWidth="1.8"/>
      ))}
      {/* Prob labels sur 1er niveau */}
      <text x="58" y="72" fontSize="10" fill={C.stroke2} fontWeight="700">½</text>
      <text x="58" y="132" fontSize="10" fill={C.stroke2} fontWeight="700">½</text>
      {/* mid → leaves */}
      {leaves.map(([lx,ly], i) => {
        const [mx,my] = mid[Math.floor(i/2)];
        return <line key={i} x1={mx} y1={my} x2={lx} y2={ly} stroke={C.stroke} strokeWidth="1.5"/>;
      })}
      {/* Prob labels sur 2e niveau */}
      {leaves.map(([lx,ly], i) => {
        const [mx,my] = mid[Math.floor(i/2)];
        return <text key={i} x={(mx+lx)/2-6} y={(my+ly)/2} fontSize="9.5" fill={C.stroke2} fontWeight="700">½</text>;
      })}
      {/* Noeuds intermédiaires */}
      {mid.map(([mx,my], i) => (
        <g key={i}>
          <ellipse cx={mx} cy={my} rx="22" ry="12" fill={C.fill} stroke={C.stroke} strokeWidth="1.5"/>
          <text x={mx} y={my+4} textAnchor="middle" fontSize="10" fill={C.text} fontWeight="600">{labels1[i]}</text>
        </g>
      ))}
      {/* Noeud racine */}
      <circle cx={root[0]} cy={root[1]} r="12" fill={C.fill2} stroke={C.stroke2} strokeWidth="2"/>
      <text x={root[0]} y={root[1]+4} textAnchor="middle" fontSize="9" fill="#92400e" fontWeight="700">Départ</text>
      {/* Feuilles */}
      {leaves.map(([lx,ly], i) => (
        <g key={i}>
          <ellipse cx={lx} cy={ly} rx="24" ry="12" fill={C.fill3} stroke={C.stroke3} strokeWidth="1.5"/>
          <text x={lx} y={ly+4} textAnchor="middle" fontSize="9.5" fill="#14532d" fontWeight="600">{outcomes[i]}</text>
        </g>
      ))}
      {/* Labels branches */}
      {labels2.map((l, i) => {
        const [lx,ly] = leaves[i];
        const [mx,my] = mid[Math.floor(i/2)];
        return <text key={i} x={lx-32} y={(my+ly)/2+(i%2===0?-4:10)} fontSize="9" fill={C.gray}>{l}</text>;
      })}
    </svg>
  );
}

// ─── Fractions — Barre ───────────────────────────────────────────────────────
function FigFractionBarre({ num, den, label }: { num: number; den: number; label: string }) {
  const W = 180, H = 44, x0 = 10;
  const cellW = W / den;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 90" width="200" height="90">
      <text x="100" y="16" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">{label}</text>
      {Array.from({ length: den }, (_, i) => (
        <rect key={i}
          x={x0 + i * cellW} y="28"
          width={cellW - 1} height={H}
          fill={i < num ? C.stroke : "#e2e8f0"}
          stroke="#94a3b8" strokeWidth="1"
          rx="3"
        />
      ))}
      {/* Fraction text */}
      <text x="100" y="82" textAnchor="middle" fontSize="11" fill={C.text}>
        <tspan fontWeight="700" fill={C.stroke}>{num}</tspan>
        <tspan fill={C.text}> partie{num>1?"s":""} colorée{num>1?"s":""} sur </tspan>
        <tspan fontWeight="700">{den}</tspan>
      </text>
    </svg>
  );
}

// ─── Fractions — Cercle ──────────────────────────────────────────────────────
function FigFractionCercle({ num, den, label }: { num: number; den: number; label: string }) {
  const cx = 100, cy = 70, r = 52;
  const slices = Array.from({ length: den }, (_, i) => {
    const a0 = (2 * Math.PI * i) / den - Math.PI / 2;
    const a1 = (2 * Math.PI * (i + 1)) / den - Math.PI / 2;
    const x1 = cx + r * Math.cos(a0), y1 = cy + r * Math.sin(a0);
    const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
    return { x1, y1, x2, y2, large: den === 1 ? 1 : 0, colored: i < num };
  });
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 130" width="200" height="130">
      <text x="100" y="14" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">{label}</text>
      {slices.map((s, i) => (
        <path key={i}
          d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.large},1 ${s.x2},${s.y2} Z`}
          fill={s.colored ? C.stroke : "#e2e8f0"}
          stroke="white" strokeWidth="2"
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.stroke} strokeWidth="2"/>
      <text x="100" y="122" textAnchor="middle" fontSize="11" fill={C.text}>
        <tspan fontWeight="700" fill={C.stroke}>{num}/{den}</tspan>
        <tspan> = {Math.round(num/den*100)} %</tspan>
      </text>
    </svg>
  );
}

// ─── Droite numérique ────────────────────────────────────────────────────────
function FigDroiteNumerique() {
  const y = 65, x0 = 20, x1 = 180, n = 10;
  const step = (x1 - x0) / n;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 95" width="200" height="95">
      <text x="100" y="14" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Droite numérique</text>
      <line x1={x0-5} y1={y} x2={x1+5} y2={y} stroke={C.stroke} strokeWidth="2.5" markerEnd="url(#arrow)"/>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={C.stroke}/>
        </marker>
      </defs>
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = x0 + i * step;
        return (
          <g key={i}>
            <line x1={x} y1={y-6} x2={x} y2={y+6} stroke={C.stroke} strokeWidth="1.8"/>
            <text x={x} y={y+20} textAnchor="middle" fontSize="10" fill={C.text} fontWeight={i===0||i===n?"700":"400"}>{i}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Angles ──────────────────────────────────────────────────────────────────
function FigAngle({ deg, label }: { deg: number; label: string }) {
  const cx = 90, cy = 130, r = 70, rArc = 35;
  const ex = cx + r;
  const x2 = cx + r * Math.cos(-(deg * Math.PI / 180)), y2 = cy + r * Math.sin(-(deg * Math.PI / 180));
  const arcX = cx + rArc * Math.cos(-(deg * Math.PI / 180)), arcY = cy + rArc * Math.sin(-(deg * Math.PI / 180));
  const largeArc = deg > 180 ? 1 : 0;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 155" width="180" height="155">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">{label}</text>
      <line x1={cx} y1={cy} x2={ex} y2={cy} stroke={C.stroke} strokeWidth="2.5"/>
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={C.stroke} strokeWidth="2.5"/>
      {deg === 90
        ? <path d={`M${cx+18},${cy} L${cx+18},${cy-18} L${cx},${cy-18}`} fill="none" stroke={C.stroke} strokeWidth="2"/>
        : <path d={`M${cx+rArc},${cy} A${rArc},${rArc} 0 ${largeArc},0 ${arcX},${arcY}`} fill={C.fill} stroke={C.stroke} strokeWidth="1.5"/>
      }
      <circle cx={cx} cy={cy} r="3" fill={C.stroke}/>
      <text x="90" y="148" textAnchor="middle" fontSize="11" fill={C.stroke} fontWeight="700">{deg}°</text>
    </svg>
  );
}

// ─── Tableau probabilités ─────────────────────────────────────────────────────
function FigTableauProba() {
  const rows = [
    ["Résultat", "1", "2", "3", "4", "5", "6"],
    ["Probabilité", "1/6", "1/6", "1/6", "1/6", "1/6", "1/6"],
  ];
  const cw = 30, ch = 24, x0 = 10;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 230 90" width="230" height="90">
      <text x="115" y="14" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Tableau — lancer d&apos;un dé</text>
      {rows.map((row, ri) =>
        row.map((cell, ci) => {
          const x = x0 + (ci === 0 ? 0 : 62 + (ci-1)*cw);
          const w = ci === 0 ? 60 : cw;
          const y = 20 + ri * ch;
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y} width={w} height={ch}
                fill={ri===0 ? C.fill : (ci > 0 ? "white" : C.fill2)}
                stroke={C.stroke} strokeWidth="1"/>
              <text x={x+w/2} y={y+ch/2+4} textAnchor="middle" fontSize="9.5"
                fill={C.text} fontWeight={ri===0||ci===0?"700":"400"}>{cell}</text>
            </g>
          );
        })
      )}
      <text x="115" y="82" textAnchor="middle" fontSize="9.5" fill={C.text}>Chaque face a la même chance de sortir</text>
    </svg>
  );
}

// ─── Diagramme de Venn ───────────────────────────────────────────────────────
function FigVenn() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 220 150" width="220" height="150">
      <text x="110" y="14" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Diagramme de Venn</text>
      <circle cx="80" cy="85" r="50" fill={C.fill} stroke={C.stroke} strokeWidth="2" opacity="0.8"/>
      <circle cx="140" cy="85" r="50" fill={C.fill2} stroke={C.stroke2} strokeWidth="2" opacity="0.8"/>
      <text x="58" y="82" textAnchor="middle" fontSize="10" fill={C.text} fontWeight="600">A</text>
      <text x="162" y="82" textAnchor="middle" fontSize="10" fill={C.text} fontWeight="600">B</text>
      <text x="110" y="82" textAnchor="middle" fontSize="9.5" fill="#92400e" fontWeight="700">A∩B</text>
      <text x="110" y="138" textAnchor="middle" fontSize="9.5" fill={C.text}>Zone commune = intersection</text>
    </svg>
  );
}

// ─── Axes de coordonnées ─────────────────────────────────────────────────────
function FigAxes() {
  const cx = 90, cy = 100, range = 70;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 180" width="180" height="180">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Plan cartésien</text>
      <defs>
        <marker id="axArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={C.stroke}/>
        </marker>
      </defs>
      <line x1={cx-range} y1={cy} x2={cx+range+5} y2={cy} stroke={C.stroke} strokeWidth="2" markerEnd="url(#axArrow)"/>
      <line x1={cx} y1={cy+range} x2={cx} y2={cy-range-5} stroke={C.stroke} strokeWidth="2" markerEnd="url(#axArrow)"/>
      {[-3,-2,-1,1,2,3].map(v => (
        <g key={v}>
          <line x1={cx+v*20} y1={cy-4} x2={cx+v*20} y2={cy+4} stroke={C.stroke} strokeWidth="1.5"/>
          <text x={cx+v*20} y={cy+14} textAnchor="middle" fontSize="9" fill={C.text}>{v}</text>
          <line x1={cx-4} y1={cy-v*20} x2={cx+4} y2={cy-v*20} stroke={C.stroke} strokeWidth="1.5"/>
          <text x={cx-10} y={cy-v*20+3} textAnchor="end" fontSize="9" fill={C.text}>{v}</text>
        </g>
      ))}
      <text x={cx+range+10} y={cy+4} fontSize="11" fill={C.text} fontWeight="700">x</text>
      <text x={cx+4} y={cy-range-6} fontSize="11" fill={C.text} fontWeight="700">y</text>
      <circle cx={cx} cy={cy} r="3" fill={C.stroke}/>
      <text x={cx-8} y={cy+13} fontSize="9" fill={C.text}>O</text>
    </svg>
  );
}

// ─── 2D — Trapèze ────────────────────────────────────────────────────────────
function FigTrapeze() {
  // Trapèze isocèle — base grande en bas, petite en haut, côtés obliques visibles
  const bx=20, by=130, bw=160, tx=55, ty=45, tw=90;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 160" width="200" height="160">
      <text x="100" y="14" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Trapèze</text>
      <polygon
        points={`${bx},${by} ${bx+bw},${by} ${tx+tw},${ty} ${tx},${ty}`}
        fill={C.fill} stroke={C.stroke} strokeWidth="2.5"
      />
      {/* Grande base — label */}
      <text x={bx+bw/2} y={by+16} textAnchor="middle" fontSize="10" fill={C.text} fontWeight="700">Grande base (B)</text>
      {/* Petite base — label */}
      <text x={tx+tw/2} y={ty-6} textAnchor="middle" fontSize="10" fill={C.text} fontWeight="700">Petite base (b)</text>
      {/* Hauteur — ligne pointillée */}
      <line x1="100" y1={ty} x2="100" y2={by} stroke={C.stroke2} strokeWidth="1.5" strokeDasharray="5,3"/>
      <path d="M100,45 L112,45 L112,57" fill="none" stroke={C.stroke2} strokeWidth="1.5"/>
      <text x="115" y="92" fontSize="10" fill={C.stroke2} fontWeight="700">h</text>
      {/* Marqueur côtés obliques */}
      <text x={bx-4} y={(by+ty)/2+4} textAnchor="end" fontSize="9" fill={C.gray}>côté</text>
      {/* Annotation parallèle */}
      <text x="100" y="150" textAnchor="middle" fontSize="9" fill={C.text}>B ∥ b (côtés parallèles)</text>
    </svg>
  );
}

// ─── 2D — Losange ────────────────────────────────────────────────────────────
function FigLosange() {
  const cx=100, cy=90, dx=70, dy=55;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 180" width="200" height="180">
      <text x="100" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Losange</text>
      <polygon points={`${cx},${cy-dy} ${cx+dx},${cy} ${cx},${cy+dy} ${cx-dx},${cy}`}
        fill={C.fill} stroke={C.stroke} strokeWidth="2.5"/>
      {/* Diagonales */}
      <line x1={cx-dx} y1={cy} x2={cx+dx} y2={cy} stroke={C.stroke2} strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1={cx} y1={cy-dy} x2={cx} y2={cy+dy} stroke={C.stroke2} strokeWidth="1.5" strokeDasharray="5,3"/>
      <circle cx={cx} cy={cy} r="3" fill={C.stroke}/>
      {/* Labels diagonales */}
      <text x={cx+dx/2+6} y={cy-6} fontSize="10" fill={C.stroke2} fontWeight="700">d₁</text>
      <text x={cx+6} y={cy+dy/2} fontSize="10" fill={C.stroke2} fontWeight="700">d₂</text>
      {/* Marques égalité des côtés */}
      {[
        [cx-dx/2, cy-dy/2, 30],
        [cx+dx/2, cy-dy/2, -30],
        [cx+dx/2, cy+dy/2, 30],
        [cx-dx/2, cy+dy/2, -30],
      ].map(([x, y, angle], i) => (
        <line key={i} x1={x as number - 5} y1={y as number} x2={(x as number) + 5} y2={y as number}
          stroke={C.stroke} strokeWidth="2"
          transform={`rotate(${angle},${x},${y})`}/>
      ))}
      <text x="100" y="173" textAnchor="middle" fontSize="9.5" fill={C.text}>4 côtés égaux · diagonales perpendiculaires</text>
    </svg>
  );
}

// ─── 2D — Parallélogramme ─────────────────────────────────────────────────────
function FigParallelogramme() {
  const offset = 35;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 210 150" width="210" height="150">
      <text x="105" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Parallélogramme</text>
      <polygon points={`${25+offset},30 ${185},30 ${185-offset},120 ${25},120`}
        fill={C.fill} stroke={C.stroke} strokeWidth="2.5"/>
      {/* Flèches parallèles */}
      <line x1={25+offset} y1={30} x2={185} y2={30} stroke={C.stroke} strokeWidth="2.5"/>
      <line x1={25} y1={120} x2={185-offset} y2={120} stroke={C.stroke} strokeWidth="2.5"/>
      {/* Marques parallélisme */}
      <text x="105" y="25" textAnchor="middle" fontSize="9" fill={C.stroke}>▶</text>
      <text x="105" y="133" textAnchor="middle" fontSize="9" fill={C.stroke}>▶</text>
      {/* Hauteur */}
      <line x1="105" y1="30" x2="105" y2="120" stroke={C.stroke2} strokeWidth="1.5" strokeDasharray="5,3"/>
      <path d="M105,30 L117,30 L117,42" fill="none" stroke={C.stroke2} strokeWidth="1.5"/>
      <text x="118" y="78" fontSize="10" fill={C.stroke2} fontWeight="700">h</text>
      <text x="105" y="143" textAnchor="middle" fontSize="9.5" fill={C.text}>2 paires de côtés parallèles et égaux</text>
    </svg>
  );
}

// ─── 2D — Pentagone ──────────────────────────────────────────────────────────
function FigPolygone({ n, label }: { n: number; label: string }) {
  const cx=100, cy=88, r=62;
  const pts = Array.from({length:n}, (_,i) => {
    const a = (2*Math.PI*i/n) - Math.PI/2;
    return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
  }).join(" ");
  return (
    <svg {...SVG_PROPS} viewBox="0 0 200 165" width="200" height="165">
      <text x="100" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">{label}</text>
      <polygon points={pts} fill={C.fill} stroke={C.stroke} strokeWidth="2.5"/>
      {/* Sommets */}
      {Array.from({length:n}, (_,i) => {
        const a = (2*Math.PI*i/n) - Math.PI/2;
        const x = cx+r*Math.cos(a), y = cy+r*Math.sin(a);
        const lx = cx+(r+14)*Math.cos(a), ly = cy+(r+14)*Math.sin(a);
        return <text key={i} x={lx} y={ly+4} textAnchor="middle" fontSize="10" fill={C.stroke} fontWeight="600">
          {String.fromCharCode(65+i)}
        </text>;
      })}
      <text x="100" y="157" textAnchor="middle" fontSize="9.5" fill={C.text}>{n} côtés égaux · {n} angles égaux</text>
    </svg>
  );
}

// ─── 2D — Triangle isocèle ───────────────────────────────────────────────────
function FigTriangleIsocele() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 165" width="180" height="165">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Triangle isocèle</text>
      <polygon points="90,25 20,140 160,140" fill={C.fill} stroke={C.stroke} strokeWidth="2.5"/>
      {/* Hauteur */}
      <line x1="90" y1="25" x2="90" y2="140" stroke={C.stroke2} strokeWidth="1.5" strokeDasharray="5,3"/>
      <path d="M90,140 L102,140 L102,128" fill="none" stroke={C.stroke2} strokeWidth="1.5"/>
      {/* Marques égalité des 2 côtés */}
      <line x1="49" y1="74" x2="62" y2="68" stroke={C.stroke} strokeWidth="2.5"/>
      <line x1="118" y1="74" x2="131" y2="68" stroke={C.stroke} strokeWidth="2.5"/>
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Triangle isocèle</text>
      <text x="8" y="145" fontSize="10" fill={C.text}>A</text>
      <text x="160" y="145" fontSize="10" fill={C.text}>B</text>
      <text x="86" y="22" fontSize="10" fill={C.text}>S</text>
      <text x="90" y="158" textAnchor="middle" fontSize="9.5" fill={C.text}>SA = SB (2 côtés égaux)</text>
    </svg>
  );
}

// ─── 2D — Triangle équilatéral ───────────────────────────────────────────────
function FigTriangleEquilateral() {
  const cx=90, h=110;
  const pts = `90,18 ${cx-h*Math.tan(Math.PI/6)},128 ${cx+h*Math.tan(Math.PI/6)},128`;
  return (
    <svg {...SVG_PROPS} viewBox="0 0 180 155" width="180" height="155">
      <text x="90" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Triangle équilatéral</text>
      <polygon points={pts} fill={C.fill} stroke={C.stroke} strokeWidth="2.5"/>
      {/* Marques égalité 3 côtés */}
      {[[90,18,27,75],[27,75,90,128],[90,128,153,75]].map(([x1,y1,x2,y2],i) => {
        const mx=(x1+x2)/2, my=(y1+y2)/2;
        return <circle key={i} cx={mx} cy={my} r="4" fill="white" stroke={C.stroke} strokeWidth="2"/>;
      })}
      <text x="90" y="148" textAnchor="middle" fontSize="9.5" fill={C.text}>3 côtés égaux · 3 angles de 60°</text>
    </svg>
  );
}

// ─── Comparaison quadrilatères (pour distinguer les formes) ──────────────────
function FigQuadrilateres() {
  return (
    <svg {...SVG_PROPS} viewBox="0 0 240 190" width="240" height="190">
      <text x="120" y="13" textAnchor="middle" fontSize="11" fill={C.text} fontWeight="600">Familles de quadrilatères</text>
      {/* Carré */}
      <rect x="10" y="28" width="44" height="44" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <text x="32" y="86" textAnchor="middle" fontSize="9" fill={C.text} fontWeight="700">Carré</text>
      {/* Rectangle */}
      <rect x="64" y="36" width="60" height="36" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <text x="94" y="86" textAnchor="middle" fontSize="9" fill={C.text} fontWeight="700">Rectangle</text>
      {/* Losange */}
      <polygon points="160,28 185,50 160,72 135,50" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <text x="160" y="86" textAnchor="middle" fontSize="9" fill={C.text} fontWeight="700">Losange</text>
      {/* Parallélogramme */}
      <polygon points="10,110 70,110 60,145 0,145" fill={C.fill} stroke={C.stroke} strokeWidth="2"/>
      <text x="35" y="162" textAnchor="middle" fontSize="9" fill={C.text} fontWeight="700">Parallélogramme</text>
      {/* Trapèze */}
      <polygon points="82,115 158,115 148,145 92,145" fill={C.fill3} stroke={C.stroke3} strokeWidth="2.5"/>
      <text x="120" y="162" textAnchor="middle" fontSize="9" fill={C.stroke3} fontWeight="700">Trapèze ←</text>
      {/* Quadrilatère quelconque */}
      <polygon points="170,108 230,118 220,150 175,145" fill="#fef9c3" stroke={C.stroke2} strokeWidth="2"/>
      <text x="200" y="162" textAnchor="middle" fontSize="9" fill={C.stroke2} fontWeight="700">Quelconque</text>
      <text x="120" y="180" textAnchor="middle" fontSize="9" fill={C.gray}>Le trapèze a UNE paire de côtés parallèles</text>
    </svg>
  );
}

// ─── Dispatch principal ──────────────────────────────────────────────────────

export function MiraFigure({ type }: { type: string }) {
  const fig = (() => {
    switch (type) {
      case "carre":                return <FigCarre />;
      case "rectangle":            return <FigRectangle />;
      case "triangle_rectangle":   return <FigTriangleRectangle />;
      case "triangle":             return <FigTriangle />;
      case "cercle":               return <FigCercle />;
      case "cube":                 return <FigCube />;
      case "pave":                 return <FigPave />;
      case "pyramide":             return <FigPyramide />;
      case "cone":                 return <FigCone />;
      case "cylindre":             return <FigCylindre />;
      case "sphere":               return <FigSphere />;
      case "prisme":               return <FigPrisme />;
      case "arbre_proba":          return <FigArbreProba />;
      case "tableau_proba":        return <FigTableauProba />;
      case "venn":                 return <FigVenn />;
      case "axes":                 return <FigAxes />;
      case "droite_numerique":     return <FigDroiteNumerique />;
      case "angle_droit":          return <FigAngle deg={90}  label="Angle droit" />;
      case "angle_aigu":           return <FigAngle deg={45}  label="Angle aigu (< 90°)" />;
      case "angle_obtus":          return <FigAngle deg={120} label="Angle obtus (> 90°)" />;
      case "fraction_1_2":         return <FigFractionBarre num={1} den={2} label="Fraction ½" />;
      case "fraction_1_3":         return <FigFractionBarre num={1} den={3} label="Fraction ⅓" />;
      case "fraction_2_3":         return <FigFractionBarre num={2} den={3} label="Fraction ⅔" />;
      case "fraction_1_4":         return <FigFractionBarre num={1} den={4} label="Fraction ¼" />;
      case "fraction_3_4":         return <FigFractionBarre num={3} den={4} label="Fraction ¾" />;
      case "fraction_cercle_1_2":  return <FigFractionCercle num={1} den={2} label="½ d'un tout" />;
      case "fraction_cercle_1_3":  return <FigFractionCercle num={1} den={3} label="⅓ d'un tout" />;
      case "fraction_cercle_1_4":  return <FigFractionCercle num={1} den={4} label="¼ d'un tout" />;
      case "fraction_cercle_3_4":  return <FigFractionCercle num={3} den={4} label="¾ d'un tout" />;
      // ── Quadrilatères supplémentaires ─────────────────────────────────────
      case "trapeze":              return <FigTrapeze />;
      case "losange":              return <FigLosange />;
      case "parallelogramme":      return <FigParallelogramme />;
      case "pentagone":            return <FigPolygone n={5} label="Pentagone" />;
      case "hexagone":             return <FigPolygone n={6} label="Hexagone" />;
      case "heptagone":            return <FigPolygone n={7} label="Heptagone" />;
      case "octogone":             return <FigPolygone n={8} label="Octogone" />;
      case "triangle_isocele":     return <FigTriangleIsocele />;
      case "triangle_equilateral": return <FigTriangleEquilateral />;
      case "quadrilateres":        return <FigQuadrilateres />;
      default: return null;
    }
  })();

  if (!fig) return null;

  return (
    <div className="my-3 flex justify-center">
      <div className="inline-block rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
        {fig}
      </div>
    </div>
  );
}

// ─── Parse un message Mira et retourne les segments texte/figure ─────────────

export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "figure"; figType: string };

export function parseMiraMessage(content: string): MessageSegment[] {
  const regex = /\[FIGURE:([^\]]+)\]/g;
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: "text", content: text });
    }
    segments.push({ type: "figure", figType: match[1].trim() });
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex).trim();
  if (remaining) segments.push({ type: "text", content: remaining });

  return segments;
}

// ─── Strip les balises figure (pour TTS) ────────────────────────────────────

export function stripFigureTags(text: string): string {
  return text.replace(/\[FIGURE:[^\]]+\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
