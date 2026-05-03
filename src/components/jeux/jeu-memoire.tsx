"use client";
import { useState, useCallback, useEffect } from "react";

const DECKS = {
  facile: ["🐶","🐱","🐭","🐹","🦊","🐻","🐼","🐸"],
  moyen:  ["🦁","🐯","🐮","🐷","🐸","🐙","🦋","🦄","🐧","🦀"],
  difficile: ["🦁","🐯","🐮","🐷","🐸","🐙","🦋","🦄","🐧","🦀","🦓","🦒","🦘","🦥","🐊","🦈"],
};

type Card = { id: number; emoji: string; matched: boolean; flipped: boolean };

function makeCards(emojis: string[]): Card[] {
  return [...emojis, ...emojis]
    .map((emoji, i) => ({ id: i, emoji, matched: false, flipped: false }))
    .sort(() => Math.random() - 0.5);
}

export function JeuMemoire({ niveau = "facile", onScore }: { niveau?: "facile" | "moyen" | "difficile"; onScore?: (s: number) => void }) {
  const [started, setStarted] = useState(false);
  const [cards, setCards] = useState<Card[]>(() => makeCards(DECKS[niveau]));
  const [selected, setSelected] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const total = DECKS[niveau].length;

  useEffect(() => {
    if (won) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [won]);

  const handleFlip = useCallback((idx: number) => {
    if (locked || won) return;
    const card = cards[idx];
    if (card.flipped || card.matched) return;
    if (selected.length === 1 && selected[0] === idx) return;

    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    const newSel = [...selected, idx];
    setCards(newCards); setSelected(newSel);

    if (newSel.length === 2) {
      setLocked(true); setAttempts(a => a + 1);
      const [i1, i2] = newSel;
      if (newCards[i1].emoji === newCards[i2].emoji) {
        setTimeout(() => {
          setCards(c => c.map((card, i) => i === i1 || i === i2 ? { ...card, matched: true } : card));
          setMatchCount(m => {
            const nm = m + 1;
            if (nm === total) {
              setWon(true);
              const score = Math.max(0, total * 100 - attempts * 5 - elapsed * 2);
              onScore?.(score);
            }
            return nm;
          });
          setSelected([]); setLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(c => c.map((card, i) => i === i1 || i === i2 ? { ...card, flipped: false } : card));
          setSelected([]); setLocked(false);
        }, 900);
      }
    }
  }, [locked, won, cards, selected, attempts, elapsed, total, onScore]);

  const reset = () => { setCards(makeCards(DECKS[niveau])); setSelected([]); setAttempts(0); setMatchCount(0); setLocked(false); setWon(false); setElapsed(0); setStarted(false); };
  const cols = total <= 8 ? 4 : total <= 10 ? 5 : 6;

  if (!started) return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <div className="text-5xl">🧠</div>
      <div className="text-center">
        <p className="text-white font-black text-xl">Jeu de Mémoire</p>
        <p className="text-white/60 text-sm mt-1">Niveau : {niveau === "facile" ? "😊 Facile" : niveau === "moyen" ? "😐 Moyen" : "😈 Difficile"} — {total} paires</p>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm text-white/70 w-full max-w-xs">
        <p className="font-bold text-white/90 mb-1">Comment jouer :</p>
        <div className="flex items-start gap-2"><span>1️⃣</span><span>Clique sur une carte pour la retourner</span></div>
        <div className="flex items-start gap-2"><span>2️⃣</span><span>Retourne une 2ème carte pour trouver la paire</span></div>
        <div className="flex items-start gap-2"><span>✅</span><span>Les paires trouvées restent visibles</span></div>
        <div className="flex items-start gap-2"><span>🏆</span><span>Trouve toutes les paires en un minimum d&apos;essais !</span></div>
      </div>
      <button onClick={() => setStarted(true)} className="rounded-2xl bg-green-600 px-8 py-3 text-white font-black shadow-lg hover:bg-green-500">
        🧠 Jouer !
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex gap-6 text-sm">
        <div className="text-center"><p className="text-white/50 text-xs">Paires</p><p className="text-xl font-black text-white">{matchCount}/{total}</p></div>
        <div className="text-center"><p className="text-white/50 text-xs">Essais</p><p className="text-xl font-black text-white">{attempts}</p></div>
        <div className="text-center"><p className="text-white/50 text-xs">Temps</p><p className="text-xl font-black text-white">{elapsed}s</p></div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: 380 }}>
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => handleFlip(idx)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 border-2
              ${card.matched ? "bg-green-500/20 border-green-500/40 scale-95" : ""}
              ${card.flipped && !card.matched ? "bg-white/15 border-white/30 scale-105" : ""}
              ${!card.flipped && !card.matched ? "bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105" : ""}
            `}
          >
            {card.flipped || card.matched ? card.emoji : "❓"}
          </button>
        ))}
      </div>

      {won && (
        <div className="text-center space-y-2">
          <p className="text-white font-black text-2xl">🎉 Bravo !</p>
          <p className="text-white/70 text-sm">{attempts} essais · {elapsed}s</p>
          <p className="text-yellow-400 font-black text-xl">{Math.max(0, total * 100 - attempts * 5 - elapsed * 2)} pts</p>
          <button onClick={reset} className="rounded-xl bg-green-500 text-white px-6 py-2 font-black">Rejouer</button>
        </div>
      )}
    </div>
  );
}
