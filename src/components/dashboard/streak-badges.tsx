import { Card, CardLabel } from "@/components/ui/card";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";
import type { Badge as BadgeModel, BadgeEleve } from "@/generated/prisma";

type BadgeAvecDetails = BadgeEleve & { badge: BadgeModel };

const NIVEAUX = [
  { nom: "Apprenti",    emoji: "🌱", desc: "Tu fais tes premiers pas !" },
  { nom: "Explorateur", emoji: "🗺️", desc: "Tu découvres de nouvelles notions !" },
  { nom: "Chercheur",   emoji: "🔍", desc: "Tu poses les bonnes questions !" },
  { nom: "Érudit",      emoji: "📚", desc: "Tu maîtrises beaucoup de choses !" },
  { nom: "Expert",      emoji: "⭐", desc: "Tu pourrais aider les autres !" },
  { nom: "Champion",    emoji: "🏆", desc: "Tu es parmi les meilleurs !" },
  { nom: "Maître",      emoji: "🎓", desc: "Presque rien ne te résiste !" },
  { nom: "Légende",     emoji: "🌟", desc: "Tu as tout maîtrisé !" },
];

// Niveaux version jeune élève — vocabulaire très accessible
const NIVEAUX_JEUNES = [
  { nom: "Apprenti",   emoji: "🌱", desc: "Tu commences ton aventure !" },
  { nom: "Explorateur",emoji: "🗺️", desc: "Tu découvres plein de choses !" },
  { nom: "Grimpeur",   emoji: "🧗", desc: "Tu montes de plus en plus haut !" },
  { nom: "Étoile",     emoji: "⭐", desc: "Tu brilles comme une étoile !" },
  { nom: "Super-héros",emoji: "🦸", desc: "Tu es vraiment fort(e) !" },
  { nom: "Champion",   emoji: "🏆", desc: "Tu es un(e) champion(ne) !" },
  { nom: "Magicien",   emoji: "🧙", desc: "La magie des mots et des chiffres !" },
  { nom: "Légende",    emoji: "🌟", desc: "Tu as tout appris !" },
];

const XP_PAR_NIVEAU = 500;

const STREAK_JALONS = [
  { jours: 1,  emoji: "🌱", label: "1j",  desc: "C'est parti !" },
  { jours: 3,  emoji: "⚡", label: "3j",  desc: "La flamme s'allume !" },
  { jours: 7,  emoji: "🔥", label: "7j",  desc: "+ un bouclier 🛡️" },
  { jours: 30, emoji: "💎", label: "30j", desc: "Légendaire !" },
];

const MYSTERY_SLOTS = 6;

interface Props {
  streak: number;
  streakBoucliers: number;
  totalBadges: number;
  badges: BadgeAvecDetails[];
  totalPoints: number;
  niveauJeu: number;
  niveauScolaire?: string;
}

export function StreakBadgesWidget({ streak, streakBoucliers, totalBadges, badges, totalPoints, niveauJeu, niveauScolaire }: Props) {
  const jeune = estJeuneEleve(niveauScolaire ?? "");

  const xpDansCeNiveau = totalPoints % XP_PAR_NIVEAU;
  const progression = Math.round((xpDansCeNiveau / XP_PAR_NIVEAU) * 100);
  const isLegende = niveauJeu > NIVEAUX.length;
  const niveauIdx = Math.min(niveauJeu - 1, NIVEAUX.length - 1);

  const niveauActuel = jeune ? NIVEAUX_JEUNES[niveauIdx] : NIVEAUX[niveauIdx];
  const niveauSuivant = isLegende ? null : (jeune ? NIVEAUX_JEUNES : NIVEAUX)[Math.min(niveauIdx + 1, NIVEAUX.length - 1)];
  const xpRestant = XP_PAR_NIVEAU - xpDansCeNiveau;
  const mysteryCount = Math.max(0, MYSTERY_SLOTS - totalBadges);
  const prochainJalon = STREAK_JALONS.find((j) => j.jours > streak);

  /* ══════════════════════════════════════════════
     MODE JEUNE ÉLÈVE
  ══════════════════════════════════════════════ */
  if (jeune) {
    const streakEmoji = streak >= 30 ? "💎" : streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "🌱";

    return (
      <div className="space-y-4">

        {/* ── Étoiles (XP) ── */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{isLegende ? "🌟" : niveauActuel?.emoji}</span>
            <div>
              <p className="text-xl font-black text-[var(--color-ink)] leading-tight">
                {isLegende ? "Légende !" : niveauActuel?.nom}
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {isLegende ? "Tu as tout appris ! 🌟" : niveauActuel?.desc}
              </p>
            </div>
          </div>

          {/* Barre d'étoiles */}
          {!isLegende && (
            <>
              <div className="flex items-center justify-between text-sm font-bold mb-2">
                <span className="text-[var(--color-gold)]">⭐ {totalPoints} étoiles</span>
                <span className="text-[var(--color-ink-soft)] text-xs">
                  encore {xpRestant} pour {niveauSuivant?.emoji} {niveauSuivant?.nom}
                </span>
              </div>
              <div className="h-4 rounded-full bg-[var(--color-paper-warm)] overflow-hidden border border-[rgba(201,149,42,0.2)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-gold)] to-yellow-300 transition-all duration-700"
                  style={{ width: `${progression}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--color-ink-soft)] mt-2 text-center">
                💡 Tu gagnes des étoiles ⭐ à chaque exercice !
              </p>
            </>
          )}
        </Card>

        {/* ── Série de jours ── */}
        <Card className="p-5">
          <p className="text-sm font-black text-[var(--color-ink)] mb-3 text-center">
            Ma série 🔥
          </p>

          {/* Grand nombre + emoji */}
          <div className="flex flex-col items-center mb-4">
            <span className="text-7xl font-black text-[var(--color-ink)] leading-none">{streak}</span>
            <span className="text-4xl mt-1">{streakEmoji}</span>
            <p className="text-base font-bold text-[var(--color-ink-soft)] mt-1">
              jour{streak !== 1 ? "s" : ""} de suite !
            </p>
          </div>

          {streak === 0 ? (
            <div className="rounded-2xl bg-[var(--color-paper-warm)] p-4 text-center">
              <p className="text-sm font-bold text-[var(--color-ink)]">
                Fais 1 exercice aujourd'hui pour commencer ! 🌱
              </p>
            </div>
          ) : prochainJalon ? (
            <div className="rounded-2xl bg-[rgba(201,149,42,0.08)] border border-[rgba(201,149,42,0.2)] p-3 text-center">
              <p className="text-sm font-bold text-[var(--color-ink)]">
                Encore <span className="text-[var(--color-gold)] text-lg">{prochainJalon.jours - streak}</span> jour{prochainJalon.jours - streak > 1 ? "s" : ""} pour {prochainJalon.emoji} !
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[rgba(201,149,42,0.08)] border border-[rgba(201,149,42,0.2)] p-3 text-center">
              <p className="text-sm font-bold text-[var(--color-gold)]">Tu es une légende ! 💎</p>
            </div>
          )}

          {streakBoucliers > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-blue-50 border border-blue-200 px-3 py-2">
              <span className="text-xl">🛡️</span>
              <p className="text-sm font-bold text-blue-700">
                {streakBoucliers} bouclier{streakBoucliers > 1 ? "s" : ""} de protection !
              </p>
            </div>
          )}
        </Card>

        {/* ── Mes badges ── */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black text-[var(--color-ink)]">Mes badges 🏅</p>
            <span className="text-base font-bold text-[var(--color-gold)]">{totalBadges} 🏅</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                title={`${b.badge.titre} — ${b.badge.description}`}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-paper-warm)] text-3xl hover:scale-110 transition-transform cursor-default ring-2 ring-[rgba(201,149,42,0.3)]">
                  {b.badge.icone}
                </div>
                <p className="text-[10px] font-bold text-[var(--color-ink-soft)] text-center leading-tight line-clamp-1">
                  {b.badge.titre}
                </p>
              </div>
            ))}
            {totalBadges > 3 && (
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-paper-warm)] text-sm font-black text-[var(--color-ink-soft)] ring-2 ring-[var(--color-rule)]">
                  +{totalBadges - 3}
                </div>
              </div>
            )}
            {Array.from({ length: Math.min(mysteryCount, 4 - badges.length) }).map((_, i) => (
              <div key={`mystery_${i}`} className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-paper-warm)] text-2xl opacity-40 ring-2 ring-dashed ring-[var(--color-rule)]">
                  ❓
                </div>
                <p className="text-[10px] text-[var(--color-ink-soft)] opacity-40 text-center">mystère</p>
              </div>
            ))}
          </div>
          {totalBadges === 0 && (
            <p className="mt-3 text-center text-sm font-bold text-[var(--color-ink-soft)]">
              Fais des exercices pour gagner des badges ! 🏅
            </p>
          )}
        </Card>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     MODE STANDARD
  ══════════════════════════════════════════════ */
  const jalonsAtteints = STREAK_JALONS.filter((j) => j.jours <= streak);

  return (
    <div className="space-y-4">

      {/* ── Niveau & XP ── */}
      <Card className="p-5">
        <CardLabel className="mb-3">Mon niveau</CardLabel>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[rgba(201,149,42,0.15)] to-[rgba(201,149,42,0.05)] text-2xl border border-[rgba(201,149,42,0.2)]">
            {isLegende ? "🌟" : niveauActuel?.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-[var(--color-ink)] leading-none">
                {isLegende ? "MAX" : `Niveau ${niveauJeu}`}
              </span>
              <span className="rounded-full bg-[rgba(201,149,42,0.12)] px-2 py-0.5 text-xs font-bold text-[var(--color-gold)]">
                {isLegende ? "✨ Légende" : niveauActuel?.nom}
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {isLegende ? "Tu as tout maîtrisé ! 🌟" : niveauActuel?.desc}
            </p>
          </div>
        </div>

        {!isLegende && (
          <>
            <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] mb-1">
              <span className="font-medium">{xpDansCeNiveau} XP</span>
              <span>{XP_PAR_NIVEAU} XP</span>
            </div>
            <div className="progress-bar">
              <div className="xp-fill" style={{ width: `${progression}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-[var(--color-ink-soft)]">
                <span className="font-semibold text-[var(--color-gold)]">{xpRestant} XP</span> pour devenir{" "}
                <span className="font-semibold text-[var(--color-ink)]">{niveauSuivant?.nom} {niveauSuivant?.emoji}</span>
              </p>
              <span className="text-[10px] text-[var(--color-ink-soft)] font-mono">{totalPoints} XP au total</span>
            </div>
          </>
        )}

        <div className="mt-3 rounded-xl bg-[var(--color-paper-warm)] p-3">
          <p className="text-[11px] text-[var(--color-ink-soft)] leading-relaxed">
            💡 <strong>C'est quoi les XP ?</strong> Ce sont tes points d'expérience. Tu en gagnes à chaque exercice — plus ton score est élevé, plus tu gagnes de XP et plus tu montes vite de niveau !
          </p>
        </div>
      </Card>

      {/* ── Série en cours ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <CardLabel>Ma série</CardLabel>
          {streakBoucliers > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5">
              <span className="text-xs">🛡️</span>
              <span className="text-[11px] font-bold text-blue-600">×{streakBoucliers}</span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 mb-3">
          <span className={`text-5xl font-black text-[var(--color-ink)] leading-none ${streak >= 3 ? "animate-streak" : ""}`}>
            {streak}
          </span>
          <div className="pb-1">
            <p className="text-xl">{streak >= 30 ? "💎" : streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "🌱"}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              jour{streak !== 1 ? "s" : ""} de suite
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[var(--color-ink-soft)] mb-3 leading-relaxed">
          💡 <strong>C'est quoi une série ?</strong> C'est le nombre de jours de suite où tu fais au moins un exercice. Plus ta série est longue, plus tu gagnes des récompenses !
        </p>

        <div className="flex items-center gap-0 mb-3">
          {STREAK_JALONS.map((j, i) => {
            const atteint = streak >= j.jours;
            const estActuel = streak < j.jours && (i === 0 || streak >= STREAK_JALONS[i - 1].jours);
            return (
              <div key={j.jours} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-center">
                  {i > 0 && (
                    <div className={`h-0.5 flex-1 ${atteint ? "bg-[var(--color-gold)]" : "bg-[var(--color-rule)]"}`} />
                  )}
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-base transition-all ${
                    atteint
                      ? "bg-[rgba(201,149,42,0.15)] border-2 border-[var(--color-gold)] scale-110"
                      : estActuel
                      ? "bg-[var(--color-paper-warm)] border-2 border-dashed border-[var(--color-gold)] opacity-70"
                      : "bg-[var(--color-paper-warm)] border border-[var(--color-rule)] opacity-40"
                  }`}>
                    {j.emoji}
                  </div>
                  {i < STREAK_JALONS.length - 1 && (
                    <div className={`h-0.5 flex-1 ${streak > j.jours ? "bg-[var(--color-gold)]" : "bg-[var(--color-rule)]"}`} />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-bold ${atteint ? "text-[var(--color-gold)]" : "text-[var(--color-ink-soft)] opacity-60"}`}>
                  {j.label}
                </span>
              </div>
            );
          })}
        </div>

        {streak === 0 ? (
          <p className="text-xs text-[var(--color-ink-soft)] bg-[var(--color-paper-warm)] rounded-xl px-3 py-2">
            Fais au moins 1 exercice aujourd&apos;hui pour commencer ta série ! 🌱
          </p>
        ) : prochainJalon ? (
          <p className="text-xs font-medium text-[var(--color-ink-soft)] bg-[var(--color-paper-warm)] rounded-xl px-3 py-2">
            Encore <span className="font-black text-[var(--color-ink)]">{prochainJalon.jours - streak} jour{prochainJalon.jours - streak > 1 ? "s" : ""}</span> pour atteindre {prochainJalon.emoji} — {prochainJalon.desc}
          </p>
        ) : (
          <p className="text-xs font-semibold text-[var(--color-gold)] bg-[rgba(201,149,42,0.06)] rounded-xl px-3 py-2 border border-[rgba(201,149,42,0.2)]">
            Incroyable ! Tu es une légende 💎
          </p>
        )}

        {streakBoucliers > 0 ? (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5">
            <span className="text-xs">🛡️</span>
            <p className="text-[11px] text-blue-700 font-medium">
              Tu as {streakBoucliers} bouclier{streakBoucliers > 1 ? "s" : ""} — ta série survivra à {streakBoucliers} jour{streakBoucliers > 1 ? "s" : ""} d&apos;absence !
            </p>
          </div>
        ) : streak >= 3 && jalonsAtteints.length < 2 ? (
          <p className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
            💡 Atteins 7 jours pour gagner un bouclier 🛡️ qui protège ta série !
          </p>
        ) : null}
      </Card>

      {/* ── Badges ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <CardLabel>Mes badges</CardLabel>
          <span className="text-xs font-semibold text-[var(--color-gold)]">
            {totalBadges} 🏅
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {badges.map((b) => (
            <div
              key={b.id}
              title={`${b.badge.titre} — ${b.badge.description}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-paper-warm)] text-xl hover:scale-110 transition-transform cursor-default ring-1 ring-[var(--color-rule)] hover:ring-[var(--color-gold)]"
            >
              {b.badge.icone}
            </div>
          ))}
          {totalBadges > 3 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-paper-warm)] text-xs font-bold text-[var(--color-ink-soft)] ring-1 ring-[var(--color-rule)]">
              +{totalBadges - 3}
            </div>
          )}
          {Array.from({ length: Math.min(mysteryCount, 3) }).map((_, i) => (
            <div
              key={`mystery_${i}`}
              title="Badge mystère — continue à progresser pour le découvrir !"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-paper-warm)] text-base opacity-50 cursor-default ring-1 ring-dashed ring-[var(--color-rule)] hover:opacity-70 transition-opacity"
            >
              ❓
            </div>
          ))}
        </div>
        {totalBadges === 0 && (
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            Complète des exercices pour débloquer tes premiers badges ! 🏅
          </p>
        )}
        {mysteryCount > 0 && totalBadges > 0 && (
          <p className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
            {mysteryCount} badge{mysteryCount > 1 ? "s" : ""} mystère{mysteryCount > 1 ? "s" : ""} à découvrir…
          </p>
        )}
      </Card>
    </div>
  );
}
