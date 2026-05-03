"use client";
import type { JeuCatalog } from "@/lib/jeux/catalog";

export function JeuComingSoon({ jeu }: { jeu: JeuCatalog }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
      <span className="text-8xl">{jeu.emoji}</span>
      <div>
        <h2 className="text-2xl font-black text-white mb-2">{jeu.nom}</h2>
        <p className="text-white/60 max-w-sm">{jeu.description}</p>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4">
        <p className="text-yellow-400 font-bold text-lg">🚧 Bientôt disponible !</p>
        <p className="text-white/50 text-sm mt-1">Ce jeu arrive très prochainement.<br/>Reste connecté·e pour être le premier à jouer !</p>
      </div>
    </div>
  );
}
