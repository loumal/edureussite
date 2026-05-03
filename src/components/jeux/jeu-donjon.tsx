"use client";
import { useEffect, useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const CELL = 44, COLS = 9, ROWS = 9;
const TILE = { WALL: 0, FLOOR: 1, STAIRS: 2, CHEST: 3 };

type Pos = { r: number; c: number };
type Entity = Pos & { hp: number; maxHp: number; emoji: string; atk: number };

function generateDungeon(cols: number, rows: number) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(TILE.WALL));
  const rooms: { r: number; c: number; w: number; h: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const rw = 3 + Math.floor(Math.random() * 3), rh = 3 + Math.floor(Math.random() * 3);
    const rc = 1 + Math.floor(Math.random() * (cols - rw - 1)), rr = 1 + Math.floor(Math.random() * (rows - rh - 1));
    rooms.push({ r: rr, c: rc, w: rw, h: rh });
    for (let y = rr; y < rr + rh; y++) for (let x = rc; x < rc + rw; x++) grid[y][x] = TILE.FLOOR;
  }
  // Connect rooms
  for (let i = 1; i < rooms.length; i++) {
    let { r: r1, c: c1 } = rooms[i - 1], { r: r2, c: c2 } = rooms[i];
    r1 += 1; c1 += 1; r2 += 1; c2 += 1;
    while (c1 !== c2) { grid[r1][c1] = TILE.FLOOR; c1 += c1 < c2 ? 1 : -1; }
    while (r1 !== r2) { grid[r1][c1] = TILE.FLOOR; r1 += r1 < r2 ? 1 : -1; }
  }
  return { grid, rooms };
}

export function JeuDonjon({ onScore }: { onScore?: (s: number) => void }) {
  const [grid, setGrid] = useState<number[][]>([]);
  const [player, setPlayer] = useState<Entity>({ r: 1, c: 1, hp: 20, maxHp: 20, emoji: "🧙", atk: 3 });
  const [enemies, setEnemies] = useState<(Entity & { id: number })[]>([]);
  const [chests, setChests] = useState<Pos[]>([]);
  const [stairs, setStairs] = useState<Pos>({ r: 0, c: 0 });
  const [score, setScore] = useState(0);
  const [floor, setFloor] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState(false);
  const [nextId, setNextId] = useState(0);

  const addLog = (msg: string) => setLog(l => [msg, ...l.slice(0, 4)]);

  const buildFloor = useCallback((floorNum: number, playerPos?: Pos) => {
    const { grid: g, rooms } = generateDungeon(COLS, ROWS);
    const startRoom = rooms[0];
    const p = playerPos ?? { r: startRoom.r + 1, c: startRoom.c + 1 };
    g[p.r][p.c] = TILE.FLOOR;

    const lastRoom = rooms[rooms.length - 1];
    const stairsPos = { r: lastRoom.r + 1, c: lastRoom.c + 1 };
    g[stairsPos.r][stairsPos.c] = TILE.STAIRS;

    const newEnemies: (Entity & { id: number })[] = [];
    let id = 0;
    rooms.slice(1, -1).forEach((rm, i) => {
      if (Math.random() < 0.7) {
        const hp = 3 + floorNum * 2;
        newEnemies.push({ r: rm.r + 1, c: rm.c + 1, hp, maxHp: hp, emoji: ["👹","🐉","💀","🕷️","🦇"][i % 5], atk: 1 + Math.floor(floorNum / 2), id: id++ });
      }
    });

    const newChests: Pos[] = rooms.slice(2).filter(() => Math.random() < 0.4).map(rm => ({ r: rm.r + rm.h - 1, c: rm.c + rm.w - 1 }));
    newChests.forEach(ch => { g[ch.r][ch.c] = TILE.CHEST; });

    setGrid(g); setStairs(stairsPos); setEnemies(newEnemies); setChests(newChests);
    setNextId(id);
    return p;
  }, []);

  useEffect(() => { if (started) buildFloor(1); }, [started, buildFloor]);

  const move = useCallback((dr: number, dc: number) => {
    if (dead || !started) return;
    const nr = player.r + dr, nc = player.c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    const tile = grid[nr]?.[nc];
    if (tile === TILE.WALL) return;

    // Check enemy
    const enemyIdx = enemies.findIndex(e => e.r === nr && e.c === nc);
    if (enemyIdx >= 0) {
      const e = enemies[enemyIdx];
      const dmg = player.atk + Math.floor(Math.random() * 3);
      const newHp = e.hp - dmg;
      addLog(`Tu frappes ${e.emoji} pour ${dmg} dégâts!`);
      SFX.correct();
      if (newHp <= 0) {
        const pts = score + 20; setScore(pts); onScore?.(pts);
        setEnemies(prev => prev.filter((_, i) => i !== enemyIdx));
        addLog(`${e.emoji} vaincu! +20 pts`); SFX.win();
      } else {
        setEnemies(prev => prev.map((en, i) => i === enemyIdx ? { ...en, hp: newHp } : en));
      }
      // Counter-attack
      const eDmg = e.atk + Math.floor(Math.random() * 2);
      setPlayer(p => {
        const nhp = p.hp - eDmg;
        addLog(`${e.emoji} riposte: ${eDmg} dégâts!`);
        if (nhp <= 0) { setDead(true); SFX.lose(); }
        return { ...p, hp: Math.max(0, nhp) };
      });
      return;
    }

    if (tile === TILE.CHEST) {
      const heal = 5 + Math.floor(Math.random() * 6);
      setPlayer(p => ({ ...p, hp: Math.min(p.maxHp + 5, p.hp + heal), maxHp: p.maxHp + 5 }));
      setGrid(g => g.map((row, r) => row.map((t, c) => r === nr && c === nc ? TILE.FLOOR : t)));
      addLog(`💎 Coffre! +${heal} PV!`); SFX.win();
    }

    if (tile === TILE.STAIRS) {
      const nextFloor = floor + 1; setFloor(nextFloor);
      const pts = score + 50; setScore(pts); onScore?.(pts);
      addLog(`🪜 Niveau ${nextFloor}! +50 pts`); SFX.win();
      const newPos = buildFloor(nextFloor);
      setPlayer(p => ({ ...p, r: newPos.r, c: newPos.c, hp: Math.min(p.maxHp, p.hp + 5) }));
      return;
    }

    setPlayer(p => ({ ...p, r: nr, c: nc }));

    // Enemy turns
    setEnemies(prev => prev.map(e => {
      if (Math.abs(e.r - player.r) + Math.abs(e.c - player.c) > 4) return e;
      const drs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [edr, edc] of drs.sort(() => Math.random() - 0.5)) {
        const er = e.r + edr, ec = e.c + edc;
        if (grid[er]?.[ec] !== TILE.WALL && !prev.some(o => o.r === er && o.c === ec && o.id !== e.id)) {
          return { ...e, r: er, c: ec };
        }
      }
      return e;
    }));
    SFX.tick();
  }, [player, enemies, grid, dead, started, score, floor, onScore, buildFloor]);

  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1], w:[-1,0], s:[1,0], a:[0,-1], d:[0,1] };
      if (map[e.key]) { e.preventDefault(); move(...map[e.key]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, move]);

  const EMOJIS: Record<number, string> = { [TILE.WALL]: "⬛", [TILE.FLOOR]: "⬜", [TILE.STAIRS]: "🪜", [TILE.CHEST]: "💰" };
  const visibleRange = 3;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-4 text-xs font-bold text-white/80 flex-wrap justify-center">
        <span>⭐ {score}</span><span>⚔️ Étage {floor}</span>
        <span>❤️ {player.hp}/{player.maxHp}</span>
      </div>
      {!started ? (
        <div className="flex flex-col items-center gap-3 p-6">
          <p className="text-white font-bold text-center">Explore le donjon, bats les monstres<br />et trouve les escaliers 🗡️</p>
          <button onClick={() => setStarted(true)} className="rounded-2xl bg-purple-700 px-8 py-3 text-white font-black">🗡️ Descendre !</button>
        </div>
      ) : grid.length > 0 ? (
        <div style={{ background: "#0c0a1e", borderRadius: 12, padding: 4 }}>
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} style={{ display: "flex" }}>
              {Array.from({ length: COLS }, (_, c) => {
                const dist = Math.max(Math.abs(r - player.r), Math.abs(c - player.c));
                const visible = dist <= visibleRange;
                const isPlayer = player.r === r && player.c === c;
                const enemy = enemies.find(e => e.r === r && e.c === c);
                const tile = grid[r]?.[c] ?? TILE.WALL;
                return (
                  <div key={c} style={{ width: CELL, height: CELL, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, background: !visible ? "#000" : tile === TILE.WALL ? "#1e1040" : "#2d1b4e",
                    border: tile === TILE.WALL ? "1px solid #312e81" : "1px solid #4c1d95", borderRadius: 2,
                    opacity: visible ? 1 : 0.1 }}>
                    {visible ? (isPlayer ? player.emoji : enemy ? enemy.emoji : EMOJIS[tile] ?? "⬜") : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
      {started && !dead && (
        <div className="flex flex-col items-center gap-1">
          {log.slice(0, 2).map((l, i) => <p key={i} className={`text-xs ${i === 0 ? "text-white/80" : "text-white/40"}`}>{l}</p>)}
          <div className="grid grid-cols-3 gap-1 mt-1">
            <div /><button onClick={() => move(-1, 0)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">↑</button><div />
            <button onClick={() => move(0, -1)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">←</button>
            <button onClick={() => move(1, 0)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">↓</button>
            <button onClick={() => move(0, 1)} className="w-10 h-10 rounded-lg bg-white/10 text-white font-black hover:bg-white/20">→</button>
          </div>
        </div>
      )}
      {dead && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-red-400 font-black text-xl">💀 Tu es tombé!</p>
          <p className="text-yellow-400 font-black text-2xl">{score} pts</p>
          <button onClick={() => { setScore(0); setFloor(1); setDead(false); setLog([]); setPlayer({ r: 1, c: 1, hp: 20, maxHp: 20, emoji: "🧙", atk: 3 }); buildFloor(1); }} className="rounded-xl bg-purple-700 px-6 py-2 text-white font-black">Recommencer</button>
        </div>
      )}
    </div>
  );
}
