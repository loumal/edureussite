"use client";

import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";
import type { Exercice, ExerciceAssigne } from "@/generated/prisma";

type ExerciceAvecDetails = ExerciceAssigne & { exercice: Exercice };

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ANGLAIS: "🇨🇦",
  EDUCATION_PHYSIQUE: "⚽", ETHIQUE: "💭",
};

const MATIERE_JEUNE: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Maths", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Le monde", ARTS: "Arts", ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Sport", ETHIQUE: "Éthique",
};

const MATIERES_FR: Record<string, string> = {
  MATHEMATIQUES: "Mathématiques", FRANCAIS: "Français", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais",
  ARTS: "Arts", ETHIQUE: "Éthique", EDUCATION_PHYSIQUE: "Éd. physique",
};

const PRIORITE_EMOJI: Record<string, string> = {
  URGENT: "🔴", IMPORTANT: "🟡", PLUS_TARD: "🔵", MAITRISE: "✅",
};

// ── Date du jour en français ──────────────────────────────────────────────────
function getDateDuJour(): string {
  const now = new Date();
  return now.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Toronto",
  });
}

interface Props {
  niveauScolaire?: string;
}

export function PlanDuJourWidget({ niveauScolaire }: Props) {
  const { data, isLoading } = trpc.plan.getPlanDuJour.useQuery();
  const jeune = estJeuneEleve(niveauScolaire ?? "");
  const dateDuJour = getDateDuJour();

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 space-y-4">
      <div className="h-4 w-48 bg-amber-100 rounded animate-pulse" />
      <div className="h-20 bg-amber-100 rounded-xl animate-pulse" />
      <div className="h-10 bg-amber-200 rounded-xl animate-pulse" />
    </div>
  );

  // ── Pas de plan ──────────────────────────────────────────────────────────────
  if (!data?.aUnPlan) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-3xl mb-3">🗺️</p>
        <p className="text-base font-black text-[var(--color-ink)] mb-1">Aucun défi configuré</p>
        <p className="text-sm text-[var(--color-ink-soft)] mb-4">
          Crée ton plan personnalisé et reçois un défi ciblé chaque jour.
        </p>
        <Link href="/eleve/plan/configurer"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors">
          Créer mon plan 🚀
        </Link>
      </div>
    );
  }

  const { titreDuJour, minutesDispo, notionsPlanifiees, objectifs, exercicesPlan, notionsSRSDues } = data;

  const enAttentePlan = exercicesPlan.filter((e) => e.statut !== "TERMINE");
  const completesAujourdhui = exercicesPlan.length - enAttentePlan.length;
  const progressionPct = exercicesPlan.length > 0
    ? Math.round((completesAujourdhui / exercicesPlan.length) * 100)
    : 0;
  const defiFait = progressionPct === 100 && exercicesPlan.length > 0;

  // ── Source d'affichage : exercice réel en attente > notion du plan ──────────
  // Si un exercice existe déjà (généré précédemment), on affiche SA matière/titre.
  // Sinon on se base sur la première notion du plan pour orienter l'enfant.
  const premierExercice = enAttentePlan[0] ?? null;
  const matierePrincipale = premierExercice
    ? premierExercice.exercice.matiere
    : notionsPlanifiees[0]?.matiere ?? null;
  const notionPrincipale = notionsPlanifiees[0] ?? null;

  const matiereEmoji = matierePrincipale ? (MATIERE_EMOJI[matierePrincipale] ?? "📚") : "📚";
  const matiereLabel = matierePrincipale
    ? (jeune
        ? (MATIERE_JEUNE[matierePrincipale] ?? matierePrincipale)
        : (MATIERES_FR[matierePrincipale] ?? matierePrincipale))
    : "";

  // Titre : titre de l'exercice réel si dispo, sinon notion du plan
  const titrePrincipal = premierExercice
    ? premierExercice.exercice.titre
    : notionPrincipale
      ? `Maîtrise : ${notionPrincipale.notion.replace(/_/g, " ").toLowerCase()}`
      : titreDuJour;

  const lienDefi = enAttentePlan.length > 0
    ? `/eleve/exercices/${enAttentePlan[0].id}`
    : matierePrincipale
      ? `/eleve/exercices/nouveau?plan=1&matiere=${matierePrincipale}`
      : "/eleve/exercices/nouveau?plan=1";

  // ── XP estimé selon priorité ──
  const XP_PAR_PRIORITE: Record<string, number> = {
    URGENT: 80, IMPORTANT: 60, PLUS_TARD: 40, MAITRISE: 30,
  };
  const xpBonus = notionPrincipale ? (XP_PAR_PRIORITE[notionPrincipale.priorite] ?? 50) : 50;

  // ══════════════════════════════════════════════════════════════════════════
  // MODE JEUNE ÉLÈVE (PRIMAIRE 1-2)
  // ══════════════════════════════════════════════════════════════════════════
  if (jeune) {
    return (
      <div className="space-y-4">
        {/* Hero défi — style amber */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 overflow-hidden">
          <div className="p-5">
            {/* Date */}
            <p className="text-xs font-bold text-amber-600 mb-3 capitalize">
              C'est {dateDuJour} — voici ton défi ! 🌟
            </p>

            {matierePrincipale ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl flex-shrink-0">
                  {matiereEmoji}
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">{matiereLabel}</p>
                  <p className="text-base font-black text-[var(--color-ink)] leading-snug">
                    {titrePrincipal}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🎲</span>
                <p className="text-base font-bold text-[var(--color-ink)]">Un exercice surprise !</p>
              </div>
            )}

            {defiFait ? (
              <div className="rounded-xl bg-amber-100 border border-amber-200 py-3 text-center">
                <p className="text-sm font-black text-amber-700">✅ Défi complété ! +{xpBonus} XP gagnés 🏆</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⭐</span>
                  <span className="text-xs font-bold text-amber-600">+{xpBonus} XP</span>
                </div>
                <Link href={lienDefi}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black px-5 py-2.5 transition-colors">
                  Je relève le défi ! →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Révisions SRS */}
        {notionsSRSDues.length > 0 && (
          <div className="rounded-2xl border border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.05)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔁</span>
              <p className="text-sm font-black text-[var(--color-ink)]">On révise ce qu'on a appris !</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {notionsSRSDues.map((matiere) => (
                <Link key={matiere} href={`/eleve/exercices/nouveau?matiere=${matiere}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-[rgba(201,149,42,0.3)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[rgba(201,149,42,0.1)] transition-colors">
                  <span className="text-xl">{MATIERE_EMOJI[matiere] ?? "📚"}</span>
                  {MATIERE_JEUNE[matiere] ?? matiere}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Exercices déjà générés */}
        {enAttentePlan.length > 1 && (
          <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-4">
            <p className="text-sm font-black text-[var(--color-ink)] mb-3">⚡ Mes exercices à faire</p>
            <ExercicesListJeune exercices={enAttentePlan} />
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODE STANDARD (PRIMAIRE 3+)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* ── HERO — Défi du jour (style screenshot) ── */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 overflow-hidden relative">
        {/* Fond décoratif */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 pointer-events-none" />

        <div className="relative p-5">
          {/* Date du jour */}
          <p className="text-xs font-bold text-amber-600 mb-3 capitalize">
            C'est {dateDuJour} — voici ton défi du jour !
          </p>

          {/* En-tête label + badge */}
          <div className="flex items-center justify-between mb-4">
            <CardLabel>Défi du jour</CardLabel>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1">
              <span className="text-xs">⏰</span>
              <span className="text-[11px] font-bold text-amber-700">Aujourd'hui seulement</span>
            </div>
          </div>

          {defiFait ? (
            /* ── Défi complété ── */
            <div className="text-center py-4">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-base font-black text-[var(--color-success)]">Défi du jour complété !</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">+{xpBonus} XP gagnés aujourd'hui 🏆</p>
              {exercicesPlan.length > 1 && (
                <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                  {exercicesPlan.length} exercice{exercicesPlan.length > 1 ? "s" : ""} réalisé{exercicesPlan.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            /* ── Défi à relever ── */
            <>
              {/* Matière + titre — toujours aligné sur l'exercice réel */}
              {matierePrincipale ? (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl flex-shrink-0">
                    {matiereEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                      {matiereLabel}
                      {notionPrincipale?.priorite === "URGENT" && (
                        <span className="ml-1.5 text-red-500">· 🔴 Urgent</span>
                      )}
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-ink)] leading-snug">
                      {titrePrincipal}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📚</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{titreDuJour}</p>
                    <p className="text-xs text-amber-600">⏱️ {minutesDispo} min d'exercices</p>
                  </div>
                </div>
              )}

              {/* Barre de progression si exercices déjà générés */}
              {exercicesPlan.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-amber-600 font-bold mb-1">
                    <span>{completesAujourdhui}/{exercicesPlan.length} exercice{exercicesPlan.length > 1 ? "s" : ""} complété{completesAujourdhui > 1 ? "s" : ""}</span>
                    <span>⏱️ {minutesDispo} min</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                      style={{ width: `${progressionPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Autres notions (pills discrètes) */}
              {notionsPlanifiees.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {notionsPlanifiees.slice(1, 4).map((n) => (
                    <span key={n.notion}
                      className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      {PRIORITE_EMOJI[n.priorite]} {n.notion.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer : XP + CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⭐</span>
                  <span className="text-xs font-bold text-amber-600">+{xpBonus} XP bonus</span>
                </div>
                <Link
                  href={lienDefi}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 transition-colors shadow-sm"
                >
                  Relever le défi →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Lien "Modifier mon plan" discret */}
        <div className="relative border-t border-amber-200 px-5 py-2 flex justify-between items-center bg-amber-50/60">
          <span className="text-[10px] text-amber-600">Plan personnel · {minutesDispo} min / jour</span>
          <Link href="/eleve/plan/configurer"
            className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 underline">
            Modifier mon plan
          </Link>
        </div>
      </div>

      {/* ── Liste exercices déjà générés (si > 1) ── */}
      {enAttentePlan.length > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <CardLabel>📋 Exercices de mon défi</CardLabel>
            <span className="text-xs font-bold text-[var(--color-ink-soft)]">{enAttentePlan.length} à faire</span>
          </div>
          <ExercicesList exercices={enAttentePlan} />
        </Card>
      )}

      {/* ── Révisions espacées dues ── */}
      {notionsSRSDues.length > 0 && (
        <Card className="p-4 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.05)]">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">🔁</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--color-gold)] mb-1">
                Révisions du jour — {notionsSRSDues.length} matière{notionsSRSDues.length > 1 ? "s" : ""} à revoir
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] mb-2">
                C'est le bon moment pour ancrer ces notions en mémoire à long terme !
              </p>
              <div className="flex flex-wrap gap-1.5">
                {notionsSRSDues.map((matiere) => (
                  <Link key={matiere} href={`/eleve/exercices/nouveau?matiere=${matiere}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white border border-[rgba(201,149,42,0.3)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[rgba(201,149,42,0.1)] transition-colors">
                    {MATIERE_EMOJI[matiere] ?? "📚"} {MATIERES_FR[matiere] ?? matiere}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Objectifs & progression ── */}
      {objectifs.length > 0 && (
        <Card className="p-5">
          <CardLabel className="mb-3">📈 Ma progression</CardLabel>
          <div className="space-y-3">
            {objectifs.map((obj) => (
              <div key={obj.id} className="rounded-xl border border-[var(--color-rule)] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{MATIERE_EMOJI[obj.matiere] ?? "📚"}</span>
                  <span className="text-sm font-bold text-[var(--color-ink)]">
                    {MATIERES_FR[obj.matiere] ?? obj.matiere}
                  </span>
                  <span className="ml-auto text-xs font-bold text-[var(--color-ink-soft)]">
                    {Math.round(obj.scoreActuel)}% → {obj.scoreVise}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-success)] transition-all duration-700"
                    style={{ width: `${obj.progressionPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { label: "Ce mois", val: obj.sousObjectifs.mensuel.label },
                    { label: "Cette semaine", val: obj.sousObjectifs.hebdo.label },
                    { label: "Aujourd'hui", val: obj.sousObjectifs.journalier.label },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-[var(--color-paper-warm)] p-1.5">
                      <p className="text-[9px] uppercase tracking-wider text-[var(--color-ink-soft)] font-bold">{item.label}</p>
                      <p className="text-[11px] font-semibold text-[var(--color-ink)] mt-0.5 leading-snug">{item.val}</p>
                    </div>
                  ))}
                </div>
                {obj.joursRestants <= 14 && (
                  <p className="text-[10px] text-[var(--color-accent)] font-semibold mt-2">
                    ⚡ {obj.joursRestants} jours restants !
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ExercicesListJeune({ exercices }: { exercices: ExerciceAvecDetails[] }) {
  return (
    <div className="space-y-3">
      {exercices.map((ea) => (
        <Link key={ea.id} href={`/eleve/exercices/${ea.id}`}>
          <div className="flex items-center gap-4 rounded-2xl bg-[var(--color-paper-warm)] p-4 hover:bg-white hover:shadow-sm transition-all active:scale-[0.98]">
            <span className="text-4xl flex-shrink-0">{MATIERE_EMOJI[ea.exercice.matiere] ?? "📚"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-[var(--color-ink)] line-clamp-1">{ea.exercice.titre}</p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">⏱️ ~{ea.exercice.dureeMinutes} min</p>
            </div>
            <span className="text-2xl text-[var(--color-ink-soft)]">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ExercicesList({ exercices }: { exercices: ExerciceAvecDetails[] }) {
  return (
    <div className="space-y-2">
      {exercices.map((ea, i) => (
        <Link key={ea.id} href={`/eleve/exercices/${ea.id}`}>
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-paper-warm)] p-3 hover:bg-white hover:shadow-sm transition-all group">
            <span className="text-xl">{MATIERE_EMOJI[ea.exercice.matiere] ?? "📚"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink)] line-clamp-1">{ea.exercice.titre}</p>
              <p className="text-xs text-[var(--color-ink-soft)]">~{ea.exercice.dureeMinutes} min</p>
            </div>
            {i === 0 && (
              <span className="text-[10px] font-bold bg-amber-500 text-white rounded-full px-2 py-0.5 flex-shrink-0">
                Prochain
              </span>
            )}
            <span className="text-[var(--color-ink-soft)] group-hover:text-amber-600">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
