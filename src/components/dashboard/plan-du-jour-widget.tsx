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

const PRIORITE_STYLE: Record<string, string> = {
  URGENT:    "bg-red-50 border-red-200 text-red-700",
  IMPORTANT: "bg-amber-50 border-amber-200 text-amber-700",
  PLUS_TARD: "bg-blue-50 border-blue-200 text-blue-700",
  MAITRISE:  "bg-green-50 border-green-200 text-green-700",
};

const PRIORITE_EMOJI: Record<string, string> = {
  URGENT: "🔴", IMPORTANT: "🟡", PLUS_TARD: "🔵", MAITRISE: "✅",
};

interface Props {
  niveauScolaire?: string;
}

export function PlanDuJourWidget({ niveauScolaire }: Props) {
  const { data, isLoading } = trpc.plan.getPlanDuJour.useQuery();
  const jeune = estJeuneEleve(niveauScolaire ?? "");

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="rounded-2xl border-2 border-[rgba(91,79,207,0.15)] bg-gradient-to-br from-[rgba(91,79,207,0.04)] to-white p-6 space-y-4">
      <div className="h-5 w-40 bg-[var(--color-paper-warm)] rounded animate-pulse" />
      <div className="h-24 bg-[var(--color-paper-warm)] rounded-xl animate-pulse" />
      <div className="h-12 bg-[var(--color-paper-warm)] rounded-xl animate-pulse" />
    </div>
  );

  // ── Pas de plan ──────────────────────────────────────────────────────────────
  if (!data?.aUnPlan) {
    if (jeune) {
      return (
        <div className="rounded-2xl border-2 border-dashed border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.03)] p-6 text-center">
          <p className="text-5xl mb-3">🗺️</p>
          <p className="text-xl font-black text-[var(--color-ink)] mb-2">Pas encore de plan !</p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-5">Demande à un adulte de t'aider 😊</p>
          <Link href="/eleve/plan/configurer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-ink)] px-6 py-3 text-base font-black text-white hover:opacity-90 transition-opacity">
            Créer mon plan 🚀
          </Link>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border-2 border-dashed border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.03)] p-6 text-center">
        <p className="text-3xl mb-3">🗺️</p>
        <p className="text-base font-black text-[var(--color-ink)] mb-1">Aucun défi configuré</p>
        <p className="text-sm text-[var(--color-ink-soft)] mb-4">
          Crée ton plan personnalisé et reçois un défi ciblé chaque jour.
        </p>
        <Link href="/eleve/plan/configurer"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity">
          Créer mon plan 🚀
        </Link>
      </div>
    );
  }

  const { titreDuJour, minutesDispo, notionsPlanifiees, objectifs, exercicesPlan, notionsSRSDues } = data;

  // Calcul progression du jour
  const totalExercices = exercicesPlan.length;
  const completesAujourdhui = exercicesPlan.filter((e) => e.statut === "TERMINE").length;
  const enAttentePlan = exercicesPlan.filter((e) => e.statut !== "TERMINE");
  const progressionPct = totalExercices > 0
    ? Math.round((completesAujourdhui / totalExercices) * 100)
    : 0;

  const notionPrincipale = notionsPlanifiees[0];
  const matiereEmoji = notionPrincipale ? (MATIERE_EMOJI[notionPrincipale.matiere] ?? "📚") : "📚";
  const matiereLabel = notionPrincipale
    ? (jeune ? (MATIERE_JEUNE[notionPrincipale.matiere] ?? notionPrincipale.matiere) : (MATIERES_FR[notionPrincipale.matiere] ?? notionPrincipale.matiere))
    : "";

  const lienDefi = notionPrincipale
    ? `/eleve/exercices/nouveau?plan=1&matiere=${notionPrincipale.matiere}`
    : "/eleve/exercices/nouveau?plan=1";

  // ══════════════════════════════════════════════════════════════════════════
  // MODE JEUNE ÉLÈVE (PRIMAIRE 1-2)
  // ══════════════════════════════════════════════════════════════════════════
  if (jeune) {
    return (
      <div className="space-y-4">

        {/* ── Hero défi ── */}
        <div className="rounded-2xl border-2 border-[rgba(91,79,207,0.25)] bg-gradient-to-br from-[rgba(91,79,207,0.08)] to-white p-6">
          <p className="text-center text-base font-black text-[var(--color-ink)] mb-4">
            Ton défi d'aujourd'hui 🌟
          </p>

          {notionPrincipale ? (
            <div className="rounded-2xl bg-white border-2 border-[rgba(91,79,207,0.2)] p-5 text-center mb-5">
              <p className="text-5xl mb-2">{matiereEmoji}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">{matiereLabel}</p>
              <p className="text-lg font-black text-[var(--color-ink)] leading-snug">
                {notionPrincipale.notion.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--color-paper-warm)] p-5 text-center mb-5">
              <p className="text-4xl mb-2">🎲</p>
              <p className="text-base font-bold text-[var(--color-ink)]">Un exercice surprise !</p>
            </div>
          )}

          {/* Progression si exercices en cours */}
          {totalExercices > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold text-[var(--color-ink-soft)] mb-1.5">
                <span>Progression du défi</span>
                <span>{completesAujourdhui}/{totalExercices} ✓</span>
              </div>
              <div className="h-3 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-success)] transition-all duration-700"
                  style={{ width: `${progressionPct}%` }}
                />
              </div>
            </div>
          )}

          <Link href={lienDefi}>
            <button className="w-full rounded-2xl bg-[var(--color-ink)] py-4 text-lg font-black text-white hover:opacity-90 active:scale-95 transition-all shadow-md">
              {completesAujourdhui > 0 ? "Continuer mon défi ! ⚡" : "Je relève le défi ! ⚡"}
            </button>
          </Link>

          <p className="text-center text-xs text-[var(--color-ink-soft)] mt-2">
            ⏱️ Objectif : <strong>{minutesDispo} min</strong> aujourd'hui
          </p>
        </div>

        {/* ── Révisions SRS ── */}
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

        {/* ── Exercices déjà générés ── */}
        {enAttentePlan.length > 0 && (
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

      {/* ── HERO — Défi du jour ── */}
      <div className="rounded-2xl border-2 border-[rgba(91,79,207,0.2)] bg-gradient-to-br from-[rgba(91,79,207,0.06)] to-white overflow-hidden">

        {/* En-tête */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎯</span>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-purple)]">
                Ton défi du jour
              </span>
            </div>
            <p className="text-base font-black text-[var(--color-ink)] leading-snug">{titreDuJour}</p>
          </div>
          <Link href="/eleve/plan/configurer"
            className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline flex-shrink-0 mt-1">
            Modifier
          </Link>
        </div>

        {/* Notion principale mise en lumière */}
        {notionPrincipale && (
          <div className="mx-5 mb-4 rounded-xl bg-white border border-[rgba(91,79,207,0.15)] p-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(91,79,207,0.08)] text-2xl flex-shrink-0">
              {matiereEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-purple)] mb-0.5">
                {matiereLabel} · {PRIORITE_EMOJI[notionPrincipale.priorite]} {notionPrincipale.priorite === "URGENT" ? "Priorité haute" : notionPrincipale.priorite === "IMPORTANT" ? "Important" : "À faire"}
              </p>
              <p className="text-sm font-bold text-[var(--color-ink)] leading-snug">
                {notionPrincipale.notion.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
            <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${PRIORITE_STYLE[notionPrincipale.priorite] ?? ""}`}>
              {notionPrincipale.priorite === "URGENT" ? "Urgent" : notionPrincipale.priorite === "IMPORTANT" ? "Important" : "À faire"}
            </span>
          </div>
        )}

        {/* Autres notions du plan (pills) */}
        {notionsPlanifiees.length > 1 && (
          <div className="mx-5 mb-4 flex flex-wrap gap-1.5">
            {notionsPlanifiees.slice(1).map((n) => (
              <span key={n.notion}
                className="rounded-full bg-[var(--color-paper-warm)] border border-[var(--color-rule)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-ink-soft)]">
                {MATIERE_EMOJI[n.matiere]} {n.notion.replace(/_/g, " ").toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {/* Barre de progression du défi */}
        <div className="mx-5 mb-4">
          <div className="flex justify-between text-[11px] font-bold text-[var(--color-ink-soft)] mb-1.5">
            <span>
              {progressionPct === 100
                ? "🏆 Défi du jour complété !"
                : enAttentePlan.length > 0
                ? `${enAttentePlan.length} exercice${enAttentePlan.length > 1 ? "s" : ""} en attente`
                : "Génère tes exercices pour commencer"}
            </span>
            <span>⏱️ {minutesDispo} min</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-success)] transition-all duration-700"
              style={{ width: `${progressionPct}%` }}
            />
          </div>
          {totalExercices > 0 && (
            <p className="text-[10px] text-[var(--color-ink-soft)] mt-1 text-right">
              {completesAujourdhui}/{totalExercices} complété{completesAujourdhui > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* CTA principal — pleine largeur, dominant */}
        <div className="px-5 pb-5">
          <Link href={enAttentePlan.length > 0 ? `/eleve/exercices/${enAttentePlan[0].id}` : lienDefi}>
            <button className="w-full rounded-xl bg-[var(--color-ink)] py-3.5 text-base font-black text-white hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2">
              {progressionPct === 100
                ? "✅ Défi complété — bravo !"
                : enAttentePlan.length > 0
                ? "Continuer mon défi →"
                : "Commencer mon défi →"}
            </button>
          </Link>
        </div>
      </div>

      {/* ── Exercices du plan déjà générés (liste complète) ── */}
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

/* ── Liste exercices mode jeune ── */
function ExercicesListJeune({ exercices }: { exercices: ExerciceAvecDetails[] }) {
  const MATIERE_EMOJI: Record<string, string> = {
    FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
    UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ANGLAIS: "🇨🇦",
    EDUCATION_PHYSIQUE: "⚽", ETHIQUE: "💭",
  };
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

/* ── Liste exercices mode standard ── */
function ExercicesList({ exercices }: { exercices: ExerciceAvecDetails[] }) {
  const MATIERE_EMOJI: Record<string, string> = {
    FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
    UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ANGLAIS: "🇨🇦",
    EDUCATION_PHYSIQUE: "⚽", ETHIQUE: "💭",
  };
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
              <span className="text-[10px] font-bold bg-[var(--color-purple)] text-white rounded-full px-2 py-0.5 flex-shrink-0">
                Prochain
              </span>
            )}
            <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
