"use client";
import { useState, useRef, useCallback } from "react";

const GRID = 24;
const PALETTE = [
  "#000000","#ffffff","#ef4444","#f97316","#facc15","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899",
  "#7f1d1d","#9a3412","#713f12","#14532d","#164e63","#1e3a8a","#4c1d95","#831843",
  "#fca5a5","#fed7aa","#fef08a","#bbf7d0","#a5f3fc","#bfdbfe","#ddd6fe","#fbcfe8",
  "#94a3b8","#64748b","#475569","#334155","#1e293b","#0f172a",
];

export function JeuPixelArt() {
  const [cells, setCells] = useState<Record<string, string>>({});
  const [color, setColor] = useState("#ef4444");
  const [tool, setTool] = useState<"draw" | "erase" | "fill">("draw");
  const painting = useRef(false);

  const paint = useCallback((r: number, c: number) => {
    if (tool === "fill") {
      const targetColor = cells[`${r}-${c}`] ?? "#1e293b";
      if (targetColor === color && tool === "fill") return;
      const toFill: [number,number][] = [[r,c]];
      const newCells = { ...cells };
      const visited = new Set<string>();
      while (toFill.length) {
        const [cr, cc] = toFill.pop()!;
        const key = `${cr}-${cc}`;
        if (visited.has(key) || cr<0 || cr>=GRID || cc<0 || cc>=GRID) continue;
        if ((newCells[key]??("#1e293b")) !== targetColor) continue;
        visited.add(key);
        newCells[key] = color;
        toFill.push([cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]);
      }
      setCells(newCells);
    } else {
      setCells(prev => {
        const k = `${r}-${c}`;
        if (tool === "erase") { const n = {...prev}; delete n[k]; return n; }
        return { ...prev, [k]: color };
      });
    }
  }, [cells, color, tool]);

  const handlePointer = (r: number, c: number, type: "down" | "move") => {
    if (type === "down") { painting.current = true; paint(r, c); }
    else if (painting.current) paint(r, c);
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none"
      onMouseUp={() => { painting.current = false; }}
      onTouchEnd={() => { painting.current = false; }}>
      {/* Tools */}
      <div className="flex gap-2">
        {[{ t: "draw" as const, icon: "✏️", label: "Dessiner" }, { t: "erase" as const, icon: "🧹", label: "Effacer" }, { t: "fill" as const, icon: "🪣", label: "Remplir" }].map(({ t, icon, label }) => (
          <button key={t} onClick={() => setTool(t)}
            className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${tool === t ? "bg-white text-slate-900 shadow-lg" : "bg-white/10 text-white hover:bg-white/20"}`}>
            {icon} {label}
          </button>
        ))}
        <button onClick={() => setCells({})} className="rounded-xl px-3 py-2 text-sm font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30">
          🗑️ Tout
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Palette */}
        <div className="flex flex-col gap-1">
          <p className="text-white/50 text-xs text-center mb-1">Couleur</p>
          <div className="grid grid-cols-4 gap-1" style={{ width: 80 }}>
            {PALETTE.map(c => (
              <button key={c} onClick={() => { setColor(c); setTool("draw"); }}
                className={`rounded-sm transition-transform ${color === c ? "scale-125 ring-2 ring-white z-10" : "hover:scale-110"}`}
                style={{ background: c, width: 16, height: 16 }}
              />
            ))}
          </div>
          <div className="mt-2 rounded-lg border-2 border-white/30 flex items-center justify-center"
            style={{ background: color, width: 38, height: 38, margin: "0 auto" }}>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="rounded-lg overflow-hidden border border-white/20 touch-none"
          style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, 14px)`, cursor: tool === "erase" ? "cell" : tool === "fill" ? "crosshair" : "default" }}
          onMouseLeave={() => { painting.current = false; }}
        >
          {Array.from({ length: GRID }, (_, r) =>
            Array.from({ length: GRID }, (_, c) => {
              const key = `${r}-${c}`;
              return (
                <div
                  key={key}
                  style={{
                    width: 14, height: 14,
                    background: cells[key] ?? ((r + c) % 2 === 0 ? "#1e293b" : "#172033"),
                    borderRight: "0.5px solid rgba(255,255,255,0.03)",
                    borderBottom: "0.5px solid rgba(255,255,255,0.03)",
                  }}
                  onMouseDown={() => handlePointer(r, c, "down")}
                  onMouseMove={() => handlePointer(r, c, "move")}
                  onTouchStart={(e) => { e.preventDefault(); handlePointer(r, c, "down"); }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const el = e.target as HTMLElement;
                    const parent = el.parentElement;
                    if (!parent) return;
                    const rect = parent.getBoundingClientRect();
                    const touch = e.touches[0];
                    const col = Math.floor((touch.clientX - rect.left) / 14);
                    const row = Math.floor((touch.clientY - rect.top) / 14);
                    if (col >= 0 && col < GRID && row >= 0 && row < GRID) handlePointer(row, col, "move");
                  }}
                />
              );
            })
          )}
        </div>
      </div>
      <p className="text-white/30 text-xs">Crée ce que tu veux ! Ton œuvre s'efface à la fin de la session.</p>
    </div>
  );
}
