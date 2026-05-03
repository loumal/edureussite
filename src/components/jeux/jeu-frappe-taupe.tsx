"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { SFX } from "@/lib/jeux/sounds";

const GRID = 9;
const EMOJIS = ["🐹","🐭","🐿️","🦔","🐾"];
const BOMB = "💣";

export function JeuFrappeTaupe({ onScore }: { onScore?: (s: number) => void }) {
  const [cells, setCells] = useState<(string | null)[]>(Array(GRID).fill(null));
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(45);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [hits, setHits] = useState<number[]>([]);
  const [misses, setMisses] = useState<number[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const spawnMole = useCallback(() => {
    const empty = Array.from({ length: GRID }, (_, i) => i).filter(i => {
      setCells(c => { return c; }); return true;
    });
    setCells(prev => {
      const free = prev.map((v, i) => v === null ? i : -1).filter(i => i >= 0);
      if (free.length === 0) return prev;
      const idx = free[Math.floor(Math.random() * free.length)];
      const isBomb = Math.random() < 0.15;
      const emoji = isBomb ? BOMB : EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const next = [...prev];
      next[idx] = emoji;
      // Auto-hide after 1.5s
      const t = setTimeout(() => {
        setCells(c => { const n = [...c]; if (n[idx] === emoji) { n[idx] = null; } return n; });
        timers.current.delete(idx);
      }, 1500);
      timers.current.set(idx, t);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!started || done) return;
    const spawn = setInterval(spawnMole, 700);
    const timer = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { setDone(true); SFX.lose(); clearInterval(spawn); clearInterval(timer); return 0; }
      return t - 1;
    }), 1000);
    return () => { clearInterval(spawn); clearInterval(timer); timers.current.forEach(clearTimeout); };
  }, [started, done, spawnMole]);

  const whack = useCallback((idx: number) => {
    setCells(prev => {
      if (!prev[idx]) return prev;
      const emoji = prev[idx]!;
      clearTimeout(timers.current.get(idx));
      timers.current.delete(idx);
      const next = [...prev]; next[idx] = null;
      if (emoji === BOMB) {
        setLives(l => { const nl = l - 1; if (nl <= 0) { setDone(true); SFX.lose(); } return nl; });
        setMisses(m => [...m, idx]);
        SFX.wrong();
        setTimeout(() => setMisses(m => m.filter(i => i !== idx)), 300);
      } else {
        const pts = 10;
        setScore(s => { const ns = s + pts; onScore?.(ns); return ns; });
        setHits(h => [...h, idx]);
        SFX.correct();
        setTimeout(() => setHits(h => h.filter(i => i !== idx)), 300);
      }
      return next;
    });
  }, [onScore]);

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-6xl animate-bounce">🐹</div>
      <h2 className="text-2xl font-black text-white">Taupes Folles !</h2>
      <p className="text-white/60 text-sm text-center">Tape les taupes 🐹 le plus vite possible !<br />Évite les bombes 💣</p>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-10 py-4 text-white font-black text-lg">
        Taper ! 🔨
      </button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="text-5xl">🔨</div>
      <p className="text-3xl font-black text-yellow-400">{score} pts</p>
      <button onClick={() => { setScore(0); setLives(3); setTimeLeft(45); setDone(false); setCells(Array(GRID).fill(null)); setHits([]); setMisses([]); }}
        className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-8 py-3 text-white font-black">Rejouer</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex justify-between items-center">
        <span>{"❤️".repeat(lives)}{"🖤".repeat(Math.max(0, 3-lives))}</span>
        <div className="h-2 w-28 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${(timeLeft/45)*100}%` }} />
        </div>
        <span className="text-yellow-400 font-black">{score}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cells.map((cell, i) => (
          <button key={i} onClick={() => cell && whack(i)}
            className={`h-24 rounded-2xl flex items-center justify-center text-5xl transition-all active:scale-90 ${
              hits.includes(i) ? "bg-green-500/40 scale-95" :
              misses.includes(i) ? "bg-red-500/40 scale-95" :
              cell ? "bg-amber-500/20 border-2 border-amber-400/60 hover:bg-amber-500/30 cursor-pointer animate-bounce" :
              "bg-white/5 border border-white/10"
            }`}>
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}
