import Link from "next/link";
import { getGradientAvatar, getTitreEquipe } from "@/lib/boutique/items";
import type { Cosmetiques } from "@/lib/boutique/items";

const NIVEAUX = [
  { nom: "Apprenti",     emoji: "🌱" },
  { nom: "Explorateur",  emoji: "🗺️" },
  { nom: "Chercheur",    emoji: "🔍" },
  { nom: "Érudit",       emoji: "📚" },
  { nom: "Expert",       emoji: "⭐" },
  { nom: "Champion",     emoji: "🏆" },
  { nom: "Maître",       emoji: "🎓" },
  { nom: "Légende",      emoji: "🌟" },
];

const NIVEAUX_JEUNES = [
  { nom: "Apprenti",    emoji: "🌱" },
  { nom: "Explorateur", emoji: "🗺️" },
  { nom: "Grimpeur",    emoji: "🧗" },
  { nom: "Étoile",      emoji: "⭐" },
  { nom: "Super-héros", emoji: "🦸" },
  { nom: "Champion",    emoji: "🏆" },
  { nom: "Magicien",    emoji: "🧙" },
  { nom: "Légende",     emoji: "🌟" },
];

const XP_PAR_NIVEAU = 500;

interface HeroEleveProps {
  prenom: string;
  niveauJeu: number;
  totalPoints: number;
  streak: number;
  streakBoucliers: number;
  aFaitExerciceAujourdhui: boolean;
  modeDoux: boolean;
  cosmetiques: Cosmetiques;
  jeune: boolean;
}

export function HeroEleve({
  prenom,
  niveauJeu,
  totalPoints,
  streak,
  streakBoucliers,
  aFaitExerciceAujourdhui,
  modeDoux,
  cosmetiques,
  jeune,
}: HeroEleveProps) {
  const avatarGradient = getGradientAvatar(cosmetiques.avatarEquipe);
  const titreItem = getTitreEquipe(cosmetiques.titreEquipe);

  const niveauxList = jeune ? NIVEAUX_JEUNES : NIVEAUX;
  const niveauIdx = Math.min(niveauJeu - 1, niveauxList.length - 1);
  const niveauActuel = niveauxList[niveauIdx];
  const niveauSuivant = niveauJeu < niveauxList.length ? niveauxList[niveauIdx + 1] : null;
  const isLegende = niveauJeu > niveauxList.length;

  const xpDansCeNiveau = totalPoints % XP_PAR_NIVEAU;
  const xpProgression = Math.round((xpDansCeNiveau / XP_PAR_NIVEAU) * 100);
  const xpRestant = XP_PAR_NIVEAU - xpDansCeNiveau;

  const streakEmoji = streak >= 30 ? "💎" : streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "🌱";

  // CTA principal
  const ctaLabel = jeune
    ? aFaitExerciceAujourdhui
      ? "✨ Continuer à jouer !"
      : streak > 0
      ? `${streakEmoji} Garder ma série !`
      : "✨ Commencer un exercice !"
    : aFaitExerciceAujourdhui
    ? "✨ Continuer les exercices"
    : streak > 0
    ? `${streakEmoji} Maintenir ma série`
    : "✨ Faire un exercice";

  const ctaDone = aFaitExerciceAujourdhui;

  return (
    <div className={`relative mb-6 overflow-hidden rounded-3xl ${jeune ? "shadow-lg" : "shadow-md"}`}>
      {/* Gradient de fond basé sur l'avatar équipé */}
      <div className={`absolute inset-0 bg-gradient-to-br ${avatarGradient} opacity-90`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        {/* Rangée du haut — identité */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-sm ring-3 ring-white/50 text-2xl font-black text-white sm:h-20 sm:w-20 sm:text-3xl">
              {prenom.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Nom + titre + niveau */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`font-black text-white leading-tight ${jeune ? "text-2xl" : "text-xl"}`}>
                {modeDoux ? "💙 " : ""}{prenom}
              </h1>
              {!isLegende && niveauActuel && (
                <span className="rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-white">
                  {niveauActuel.emoji} {jeune ? "" : `Niv. ${niveauJeu} · `}{niveauActuel.nom}
                </span>
              )}
            </div>

            {/* Titre boutique */}
            {titreItem && (
              <p
                className="text-xs font-bold mt-0.5 opacity-95"
                style={{ color: titreItem.couleurTitre ? "white" : "rgba(255,255,255,0.85)" }}
              >
                {titreItem.emoji} {titreItem.label}
              </p>
            )}

            {/* Streak */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-bold text-white/90">
                {streakEmoji} {streak > 0 ? `${streak} jour${streak > 1 ? "s" : ""} de suite` : "Lance ta série !"}
                {streakBoucliers > 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">🛡️×{streakBoucliers}</span>
                )}
              </span>
              <span className="text-xs font-bold text-white/80">
                ⭐ {totalPoints.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        {/* Barre XP */}
        {!isLegende && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/80 mb-1.5">
              <span>{xpDansCeNiveau} / {XP_PAR_NIVEAU} XP</span>
              {niveauSuivant && (
                <span>
                  {jeune ? `encore ${xpRestant} XP → ` : `${xpRestant} XP → `}
                  {niveauSuivant.emoji} {niveauSuivant.nom}
                </span>
              )}
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all duration-700"
                style={{ width: `${xpProgression}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA principal */}
        <Link
          href="/eleve/exercices/nouveau"
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-all active:scale-95 ${
            ctaDone
              ? "bg-white/25 text-white backdrop-blur-sm hover:bg-white/35"
              : "bg-white text-[var(--color-ink)] shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          } ${jeune ? "text-base py-4" : ""}`}
        >
          {ctaLabel}
          {ctaDone && (
            <span className="ml-1 rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-bold">
              ✓ Fait aujourd'hui
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
