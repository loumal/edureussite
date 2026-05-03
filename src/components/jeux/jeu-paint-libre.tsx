"use client";
import { useRef, useState, useEffect, useCallback } from "react";

const W = 340, H = 300;
const COLORS = ["#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff","#94a3b8"];
const SIZES = [2, 5, 10, 18, 28];
const TOOLS = ["✏️","🖌️","🩹","🪣"] as const;
type Tool = typeof TOOLS[number];

export function JeuPaintLibre({ onScore }: { onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#3b82f6");
  const [size, setSize] = useState(5);
  const [tool, setTool] = useState<Tool>("🖌️");
  const [strokes, setStrokes] = useState(0);
  const strokesRef = useRef(0);

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  }, [started]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const floodFill = useCallback((canvas: HTMLCanvasElement, x: number, y: number, fillColor: string) => {
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;
    const px = (Math.floor(x) + Math.floor(y) * W) * 4;
    const targetR = data[px], targetG = data[px+1], targetB = data[px+2], targetA = data[px+3];

    const fillR = parseInt(fillColor.slice(1,3), 16);
    const fillG = parseInt(fillColor.slice(3,5), 16);
    const fillB = parseInt(fillColor.slice(5,7), 16);

    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const match = (i: number) => Math.abs(data[i]-targetR)<30 && Math.abs(data[i+1]-targetG)<30 && Math.abs(data[i+2]-targetB)<30 && Math.abs(data[i+3]-targetA)<30;
    const set = (i: number) => { data[i]=fillR; data[i+1]=fillG; data[i+2]=fillB; data[i+3]=255; };

    const stack = [[Math.floor(x), Math.floor(y)]];
    const visited = new Uint8Array(W * H);
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cx >= W || cy < 0 || cy >= H) continue;
      const i = (cy * W + cx) * 4;
      if (visited[cy * W + cx] || !match(i)) continue;
      visited[cy * W + cx] = 1;
      set(i);
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    if ("touches" in e) e.preventDefault();
    const pos = getPos(e, canvas);

    if (tool === "🪣") {
      floodFill(canvas, pos.x, pos.y, color);
      strokesRef.current++;
      setStrokes(strokesRef.current);
      if (strokesRef.current % 5 === 0) onScore?.(strokesRef.current * 2);
      return;
    }

    drawing.current = true;
    lastPos.current = pos;

    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === "🩹" ? size * 4 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "🩹" ? "#ffffff" : color;
    ctx.fill();
  }, [tool, color, size, floodFill, onScore]);

  const moveDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    if ("touches" in e) e.preventDefault();
    const pos = getPos(e, canvas);
    const ctx = canvas.getContext("2d")!;

    const brushSize = tool === "🩹" ? size * 4 : size;
    const brushColor = tool === "🩹" ? "#ffffff" : color;

    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = tool === "✏️" ? Math.max(1, brushSize * 0.6) : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
  }, [tool, color, size]);

  const endDraw = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    lastPos.current = null;
    strokesRef.current++;
    setStrokes(strokesRef.current);
    if (strokesRef.current % 5 === 0) onScore?.(strokesRef.current * 2);
  }, [onScore]);

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
  };

  if (!started) return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-5xl">🖌️</div>
      <p className="text-white font-bold text-center">Un tableau blanc pour toi !<br />Dessine ce que tu veux !</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-purple-600 px-8 py-3 text-white font-black">🎨 Dessiner !</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Tool selector */}
        <div className="flex gap-1">
          {TOOLS.map(t => (
            <button key={t} onClick={() => setTool(t)}
              className="w-8 h-8 rounded text-base flex items-center justify-center"
              style={{ background: tool === t ? "#6366f1" : "#334155" }}>
              {t}
            </button>
          ))}
        </div>
        {/* Size selector */}
        <div className="flex gap-1 items-center">
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)}
              style={{ width: s + 12, height: s + 12, borderRadius: "50%", background: size === s ? color : "#64748b", border: size === s ? `2px solid ${color}` : "2px solid transparent", transition: "all 0.1s" }} />
          ))}
        </div>
        <button onClick={clearCanvas} className="rounded px-2 py-1 text-xs text-white bg-red-600 font-bold">🗑 Effacer</button>
      </div>

      {/* Color palette */}
      <div className="flex gap-1 flex-wrap justify-center">
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            style={{ width: 24, height: 24, borderRadius: 4, background: c, border: color === c ? "3px solid #fbbf24" : "2px solid #475569", transition: "border 0.1s" }} />
        ))}
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          style={{ width: 24, height: 24, borderRadius: 4, border: "2px solid #475569", cursor: "pointer", padding: 0 }} title="Couleur personnalisée" />
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} width={W} height={H}
        style={{ borderRadius: 8, border: "2px solid #475569", cursor: tool === "🪣" ? "cell" : "crosshair", touchAction: "none", maxWidth: "100%" }}
        onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
      />

      <p className="text-white/30 text-xs">{strokes} traits — {tool === "🪣" ? "Remplissage" : tool === "🩹" ? "Gomme" : tool === "✏️" ? "Crayon" : "Pinceau"}</p>
    </div>
  );
}
