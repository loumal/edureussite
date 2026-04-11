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

const PRIORITE_STYLE = {
  URGENT:    "border-l-4 border-red-400   bg-red-50",
  IMPORTANT: "border-l-4 border-amber-400 bg-amber-50",
  PLUS_TARD: "border-l-4 border-blue-300  bg-blue-50",
  MAITRISE:  "border-l-4 border-green-400 bg-green-50",
};

const PRIORITE_LABEL = {
  URGENT:    { label: "Urgent",    emoji: "🔴" },
  IMPORTANT: { label: "Important", emoji: "🟡" },
  PLUS_TARD: { label: "À faire",   emoji: "🔵" },
  MAITRISE:  { label: "Maîtrisé",  emoji: "✅" },
};

const MATIERES_FR: Record<string, string> = {
  MATHEMATIQUES: "Mathématiques", FRANCAIS: "Français", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais",
  ARTS: "Arts", ETHIQUE: "Éthique", EDUCATION_PHYSIQUE: "Éd. physique",
};

interface Props {
  niveauScolaire?: string;
}

export function PlanDuJourWidget({ niveauScolaire }: Props) {
  const { data, isLoading } = trpc.plan.getPlanDuJour.useQuery();
  const jeune = estJeuneEleve(niveauScolaire ?? "");

  if (isLoading) return (
    <Card className="p-5 space-y-3">
      <div className="h-4 w-48 bg-[var(--color-paper-warm)] rounded animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-[var(--color-paper-warm)] rounded-xl animate-pulse" />
      ))}
    </Card>
  );

  if (!data?.aUnPlan) {
    if (jeune) {
      return (
        <Card className="p-6 text-center border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.03)]">
          <p className="text-5xl mb-3">🗺️</p>
          <p className="text-xl font-black text-[var(--color-ink)] mb-2">
            Pas encore de plan !
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mb-5">
            Demande à un adulte de t'aider à créer ton plan. 😊
          </p>
          <Link
            href="/eleve/plan/configurer"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-ink)] px-6 py-3 text-base font-black text-white hover:opacity-90 transition-opacity"
          >
            Créer mon plan 🚀
          </Link>
        </Card>
      );
    }
    return (
      <Card className="p-5">
        <CardLabel className="mb-3">📋 Mon plan du jour</CardLabel>
        <div className="rounded-xl bg-[var(--color-paper-warm)] p-5 text-center">
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">
            Tu n'as pas encore de plan de révision !
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mb-4">
            Crée ton plan personnalisé en 3 minutes et reçois des exercices ciblés chaque jour.
          </p>
          <Link
            href="/eleve/plan/configurer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            Créer mon plan 🚀
          </Link>
        </div>
      </Card>
    );
  }

  const { titreDuJour, minutesDispo, notionsPlanifiees, objectifs, exercicesPlan, exercicesLibres, notionsSRSDues } = data;

  /* ══════════════════════════════════════════════
     MODE JEUNE ÉLÈVE — PRIMAIRE_1 / PRIMAIRE_2
  ══════════════════════════════════════════════ */
  if (jeune) {
    const notionAujourdhui = notionsPlanifiees[0];
    const matiereEmoji = notionAujourdhui ? (MATIERE_EMOJI[notionAujourdhui.matiere] ?? "📚") : "📚";
    const matiereLabel = notionAujourdhui ? (MATIERE_JEUNE[notionAujourdhui.matiere] ?? notionAujourdhui.matiere) : "";

    return (
      <div className="space-y-4">

        {/* Carte principale "Qu'est-ce qu'on fait aujourd'hui ?" */}
        <Card className="p-6 bg-gradient-to-br from-[rgba(91,79,207,0.08)] to-white border-[rgba(91,79,207,0.2)]">
          <p className="text-center text-base font-black text-[var(--color-ink)] mb-4">
            Qu'est-ce qu'on fait aujourd'hui ? 🌟
          </p>

          {notionAujourdhui ? (
            <div className="rounded-2xl bg-white border-2 border-[rgba(91,79,207,0.2)] p-5 text-center mb-5">
              <p className="text-5xl mb-2">{matiereEmoji}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
                {matiereLabel}
              </p>
              <p className="text-lg font-black text-[var(--color-ink)] leading-snug">
                {notionAujourdhui.notion.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[var(--color-paper-warm)] p-5 text-center mb-5">
              <p className="text-4xl mb-2">🎲</p>
              <p className="text-base font-bold text-[var(--color-ink)]">Un exercice surprise !</p>
            </div>
          )}

          <Link
            href={notionAujourdhui
              ? `/eleve/exercices/nouveau?plan=1&matiere=${notionAujourdhui.matiere}`
              : "/eleve/exercices/nouveau"}
          >
            <button className="w-full rounded-2xl bg-[var(--color-ink)] py-4 text-lg font-black text-white hover:opacity-90 active:scale-95 transition-all shadow-md">
              Je commence ! ✨
            </button>
          </Link>
        </Card>

        {/* Révisions du jour — libellé enfantin */}
        {notionsSRSDues.length > 0 && (
          <Card className="p-5 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.05)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔁</span>
              <p className="text-base font-black text-[var(--color-ink)]">
                On révise ce qu'on a appris !
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {notionsSRSDues.map((matiere) => (
                <Link
                  key={matiere}
                  href={`/eleve/exercices/nouveau?matiere=${matiere}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-[rgba(201,149,42,0.3)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[rgba(201,149,42,0.1)] transition-colors"
                >
                  <span className="text-2xl">{MATIERE_EMOJI[matiere] ?? "📚"}</span>
                  {MATIERE_JEUNE[matiere] ?? matiere}
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Exercices assignés en attente */}
        {exercicesPlan.length > 0 && (
          <Card className="p-5">
            <p className="text-base font-black text-[var(--color-ink)] mb-3">
              ⚡ Mes exercices à faire
            </p>
            <ExercicesListJeune exercices={exercicesPlan} />
          </Card>
        )}

        {/* Temps à faire */}
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">⏱️</span>
          <p className="text-sm font-bold text-[var(--color-ink)]">
            Aujourd'hui : <span className="text-[var(--color-purple)]">{minutesDispo} minutes</span> d'exercices !
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     MODE STANDARD — PRIMAIRE_3 et +
  ══════════════════════════════════════════════ */
  return (
    <div className="space-y-4">

      {/* ── Titre du jour ── */}
      <Card className="p-4 bg-gradient-to-r from-[rgba(91,79,207,0.08)] to-white border-[rgba(91,79,207,0.15)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗺️</span>
          <div>
            <p className="font-black text-[var(--color-ink)]">{titreDuJour}</p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              Objectif aujourd'hui : <span className="font-semibold text-[var(--color-ink)]">{minutesDispo} min</span> d'exercices
            </p>
          </div>
          <Link
            href="/eleve/plan/configurer"
            className="ml-auto text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline flex-shrink-0"
          >
            Modifier
          </Link>
        </div>
      </Card>

      {/* ── Révisions espacées dues ── */}
      {notionsSRSDues.length > 0 && (
        <Card className="p-4 border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.05)]">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔁</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--color-gold)] mb-1">
                Révisions du jour — {notionsSRSDues.length} matière{notionsSRSDues.length > 1 ? "s" : ""} à revoir
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] mb-2">
                C'est le bon moment pour ancrer ces notions en mémoire à long terme !
              </p>
              <div className="flex flex-wrap gap-1.5">
                {notionsSRSDues.map((matiere) => (
                  <Link
                    key={matiere}
                    href={`/eleve/exercices/nouveau?matiere=${matiere}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white border border-[rgba(201,149,42,0.3)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-ink)] hover:bg-[rgba(201,149,42,0.1)] transition-colors"
                  >
                    {MATIERE_EMOJI[matiere] ?? "📚"} {MATIERES_FR[matiere] ?? matiere}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Objectifs & sous-objectifs ── */}
      {objectifs.length > 0 && (
        <Card className="p-5">
          <CardLabel className="mb-3">🎯 Mes objectifs</CardLabel>
          <div className="space-y-3">
            {objectifs.map((obj) => {
              return (
                <div key={obj.id} className="rounded-xl border border-[var(--color-rule)] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{MATIERE_EMOJI[obj.matiere] ?? "📚"}</span>
                    <span className="text-sm font-bold text-[var(--color-ink)]">
                      {MATIERES_FR[obj.matiere] ?? obj.matiere}
                    </span>
                    <span className="ml-auto text-xs font-bold text-[var(--color-ink-soft)]">
                      {Math.round(obj.scoreActuel)} % → {obj.scoreVise} %
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
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Exercices du plan ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <CardLabel>⚡ Exercices de mon plan</CardLabel>
          {exercicesPlan.length > 0 && (
            <span className="text-xs font-bold text-[var(--color-ink-soft)]">
              {exercicesPlan.length} à faire
            </span>
          )}
        </div>

        {notionsPlanifiees.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {notionsPlanifiees.map((n) => {
              const pLabel = PRIORITE_LABEL[n.priorite as keyof typeof PRIORITE_LABEL];
              return (
                <span
                  key={n.notion}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITE_STYLE[n.priorite as keyof typeof PRIORITE_STYLE] ?? ""} border border-transparent`}
                >
                  {pLabel?.emoji} {n.notion.replace(/_/g, " ").toLowerCase()}
                </span>
              );
            })}
          </div>
        )}

        {exercicesPlan.length === 0 ? (
          <div className="rounded-xl bg-[var(--color-paper-warm)] p-4 text-center">
            <p className="text-xs text-[var(--color-ink-soft)] mb-3">
              Génère tes exercices du plan pour aujourd'hui !
            </p>
            <Link
              href={`/eleve/exercices/nouveau?plan=1&matiere=${notionsPlanifiees[0]?.matiere ?? ""}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              Générer mes exercices du plan ✨
            </Link>
          </div>
        ) : (
          <ExercicesList exercices={exercicesPlan} />
        )}
      </Card>

      {/* ── Exercices libres ── */}
      {exercicesLibres.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <CardLabel>🎲 Exercices libres</CardLabel>
            <span className="text-xs text-[var(--color-ink-soft)]">{exercicesLibres.length}</span>
          </div>
          <ExercicesList exercices={exercicesLibres} />
        </Card>
      )}

      {/* ── CTA libre ── */}
      <div className="flex gap-2">
        <Link href="/eleve/exercices/nouveau" className="flex-1">
          <button className="w-full rounded-xl border-2 border-dashed border-[var(--color-rule)] py-3 text-sm font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-all">
            🎲 Exercice surprise
          </button>
        </Link>
        <Link href="/eleve/plan" className="flex-1">
          <button className="w-full rounded-xl border-2 border-dashed border-[var(--color-rule)] py-3 text-sm font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-all">
            📋 Voir mon plan
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ── Liste exercices mode jeune ── */
function ExercicesListJeune({ exercices }: { exercices: ExerciceAvecDetails[] }) {
  return (
    <div className="space-y-3">
      {exercices.map((ea) => (
        <Link key={ea.id} href={`/eleve/exercices/${ea.id}`}>
          <div className="flex items-center gap-4 rounded-2xl bg-[var(--color-paper-warm)] p-4 hover:bg-white hover:shadow-sm transition-all active:scale-98">
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
              <span className="text-[10px] font-bold bg-[var(--color-ink)] text-white rounded-full px-2 py-0.5 flex-shrink-0">
                Prioritaire
              </span>
            )}
            <span className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">→</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
