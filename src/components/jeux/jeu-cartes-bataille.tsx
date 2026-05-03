"use client";
import { useState, useCallback } from "react";
import { SFX } from "@/lib/jeux/sounds";

const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
const VAL_MAP: Record<string, number> = Object.fromEntries(VALUES.map((v, i) => [v, i + 2]));

type Card = { suit: string; value: string; rank: number };

function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function makeDeck(): Card[] {
  return SUITS.flatMap(s => VALUES.map(v => ({ suit: s, value: v, rank: VAL_MAP[v] })));
}

function CardView({ card, back = false }: { card?: Card; back?: boolean }) {
  if (!card || back) return (
    <div className="w-16 h-24 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 border-2 border-blue-500 flex items-center justify-center shadow-lg">
      <span className="text-2xl">🂠</span>
    </div>
  );
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={`w-16 h-24 rounded-xl bg-white border-2 border-gray-200 flex flex-col items-center justify-center shadow-lg ${red ? "text-red-600" : "text-gray-900"}`}>
      <div className="text-xs font-black">{card.value}</div>
      <div className="text-2xl">{card.suit}</div>
    </div>
  );
}

export function JeuCartesBataille({ onScore }: { onScore?: (s: number) => void }) {
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [aiDeck, setAiDeck] = useState<Card[]>([]);
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [aiCard, setAiCard] = useState<Card | null>(null);
  const [result, setResult] = useState<"win" | "lose" | "tie" | null>(null);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);

  const startGame = () => {
    const deck = shuffle(makeDeck());
    setPlayerDeck(deck.slice(0, 26)); setAiDeck(deck.slice(26));
    setPlayerCard(null); setAiCard(null); setResult(null); setGameOver(false); setStarted(true); setRound(0);
  };

  const battle = useCallback(() => {
    if (playerDeck.length === 0 || aiDeck.length === 0) { setGameOver(true); return; }
    const pc = playerDeck[0], ac = aiDeck[0];
    setPlayerCard(pc); setAiCard(ac);
    const newPDeck = playerDeck.slice(1), newADeck = aiDeck.slice(1);
    setRound(r => r + 1);

    if (pc.rank > ac.rank) {
      setResult("win"); setScore(s => { const ns = s + 10; onScore?.(ns); return ns; });
      setPlayerDeck([...newPDeck, pc, ac]); setAiDeck(newADeck); SFX.correct();
    } else if (pc.rank < ac.rank) {
      setResult("lose"); setAiDeck([...newADeck, ac, pc]); setPlayerDeck(newPDeck); SFX.wrong();
    } else {
      setResult("tie"); setScore(s => { const ns = s + 5; onScore?.(ns); return ns; });
      setPlayerDeck([...newPDeck, pc]); setAiDeck([...newADeck, ac]); SFX.tick();
    }

    if (newPDeck.length === 0) setGameOver(true);
    if (newADeck.length === 0) { setScore(s => { const ns = s + 100; onScore?.(ns); return ns; }); setGameOver(true); }
  }, [playerDeck, aiDeck, onScore]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex gap-4 text-sm font-bold text-white/80">
        <span>⭐ {score} pts</span><span>Manche {round}</span>
        <span>🃏 Tu: {playerDeck.length} · IA: {aiDeck.length}</span>
      </div>

      {!started ? (
        <div className="flex flex-col items-center gap-4 p-6">
          <p className="text-white font-bold text-center">La carte la plus haute gagne la manche !<br />Récupère toutes les cartes de l'adversaire 🃏</p>
          <button onClick={startGame} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">🃏 Jouer !</button>
        </div>
      ) : (
        <>
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/60 text-xs font-bold">TOI</span>
              <CardView card={playerCard ?? undefined} />
              {playerCard && <span className="text-white font-bold text-sm">{playerCard.value}{playerCard.suit}</span>}
            </div>
            <div className="flex flex-col items-center">
              {result && (
                <div className={`text-2xl font-black ${result === "win" ? "text-green-400" : result === "lose" ? "text-red-400" : "text-yellow-400"}`}>
                  {result === "win" ? "✅ +10" : result === "lose" ? "❌" : "🤝 ÉG."}
                </div>
              )}
              <span className="text-white/40 text-lg">VS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-white/60 text-xs font-bold">IA</span>
              <CardView card={aiCard ?? undefined} />
              {aiCard && <span className="text-white font-bold text-sm">{aiCard.value}{aiCard.suit}</span>}
            </div>
          </div>

          {!gameOver ? (
            <button onClick={battle} className="rounded-2xl bg-indigo-600 px-10 py-3 text-white font-black text-lg">
              ⚔️ Retourner !
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className={`text-2xl font-black ${playerDeck.length > aiDeck.length ? "text-yellow-400" : "text-white/70"}`}>
                {playerDeck.length > aiDeck.length ? "🏆 Tu gagnes!" : playerDeck.length < aiDeck.length ? "🤖 IA gagne" : "Match nul!"}
              </p>
              <p className="text-yellow-400 font-black">{score} pts</p>
              <button onClick={startGame} className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-black">Rejouer</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
