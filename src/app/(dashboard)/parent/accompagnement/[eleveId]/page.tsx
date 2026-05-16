export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavParent } from "@/components/layout/nav-parent";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { isFeatureActive, FEATURE_KEYS } from "@/lib/features";
import { GenererPlanBtn } from "@/components/parent/generer-plan-btn";
import { CommentaireParentForm } from "@/components/parent/commentaire-parent-form";
import { CommentairesList } from "@/components/parent/commentaires-list";
import { PlanActions } from "@/components/parent/plan-actions";
import type { PlanAccompagnementGenere } from "@/lib/ai/accompagnement";

interface Props {
  params: Promise<{ eleveId: string }>;
}

const NIVEAUX_LABELS: Record<string, string> = {
  PRIMAIRE_1: "1re primaire", PRIMAIRE_2: "2e primaire", PRIMAIRE_3: "3e primaire",
  PRIMAIRE_4: "4e primaire", PRIMAIRE_5: "5e primaire", PRIMAIRE_6: "6e primaire",
  SECONDAIRE_1: "Secondaire 1", SECONDAIRE_2: "Secondaire 2", SECONDAIRE_3: "Secondaire 3",
  SECONDAIRE_4: "Secondaire 4", SECONDAIRE_5: "Secondaire 5",
};

const PRIORITE_CONFIG = {
  haute:   { label: "Priorité haute",   color: "text-[var(--color-accent)]",   bg: "bg-[rgba(217,79,43,0.08)]"   },
  moyenne: { label: "Priorité moyenne", color: "text-[var(--color-gold)]",     bg: "bg-[rgba(201,149,42,0.08)]"  },
  basse:   { label: "Priorité basse",   color: "text-[var(--color-success)]",  bg: "bg-[rgba(42,124,111,0.08)]"  },
};

const EXPERT_CONFIG: Record<string, { titre: string; icone: string; couleur: string }> = {
  orthopedagogue:     { titre: "Orthopédagogue",               icone: "🧩", couleur: "border-[rgba(101,88,166,0.3)] bg-[rgba(101,88,166,0.04)]" },
  coach:              { titre: "Coach en développement",        icone: "🏆", couleur: "border-[rgba(217,79,43,0.3)] bg-[rgba(217,79,43,0.04)]"  },
  psychoneurologue:   { titre: "Psychoneurologue",             icone: "🧠", couleur: "border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.04)]" },
  conseillerEducation:{ titre: "Conseiller en éducation",      icone: "🎓", couleur: "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.04)]" },
  enseignant:         { titre: "Enseignant PFEQ",              icone: "📚", couleur: "border-[var(--color-rule)] bg-[var(--color-paper-warm)]"   },
};

export default async function AccompagnementPage({ params }: Props) {
  await requireRole(["PARENT", "ADMIN", "SUPER_ADMIN"]);
  const { eleveId } = await params;

  const [profilParent, planExistant, planifEnfant, specialistesActif, evaluationValidee] = await Promise.all([
    api.parent.getDashboard(),
    api.parent.getPlanAccompagnement({ eleveId }),
    api.parent.getEnfantPlanification({ eleveId }).catch(() => null),
    isFeatureActive(FEATURE_KEYS.SPECIALISTES),
    api.parent.getDerniereEvaluationValidee({ eleveId }).catch(() => null),
  ]);

  const eleve = profilParent.eleves.find((e) => e.id === eleveId);
  const plan = planExistant?.contenu as PlanAccompagnementGenere | null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavParent nom={profilParent.nom} specialistesActif={specialistesActif} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/parent"
            className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Retour au tableau de bord
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black text-[var(--color-ink)]">
                Plan d'accompagnement parental
              </h1>
              {eleve && (
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                  Pour {eleve.prenom} {eleve.nom} · {NIVEAUX_LABELS[eleve.niveauScolaire] ?? eleve.niveauScolaire}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {plan && (
                <PlanActions
                  eleveId={eleveId}
                  prenomEnfant={eleve?.prenom ?? "votre enfant"}
                />
              )}
              <GenererPlanBtn
                eleveId={eleveId}
                dejaGenere={!!plan}
                genereLeAt={planExistant?.genereLeAt ?? null}
              />
            </div>
          </div>
        </div>

        {/* ─── Bannière évaluation cognitive ─── */}
        {evaluationValidee && <EvaluationCognitiveBanner evaluation={evaluationValidee} />}

        {/* ─── Notes du parent et de l'enseignant ─── */}
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <h2 className="text-lg font-black text-[var(--color-ink)]">
                Notes et commentaires
              </h2>
            </div>
            <CommentaireParentForm
              eleveId={eleveId}
              prenomEnfant={eleve?.prenom ?? "votre enfant"}
            />
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] mb-4">
            Vos observations, les notes de l'enseignant ou le Plan d'intervention (PIE) sont transmis à l'IA pour personnaliser le plan d'accompagnement et les exercices.
          </p>
          <CommentairesList eleveId={eleveId} />
        </section>

        {/* ─── Plan de travail de l'enfant ─── */}
        {planifEnfant && planifEnfant.aUnPlan && (
          <PlanEnfantSection planif={planifEnfant} />
        )}

        {planifEnfant && !planifEnfant.aUnPlan && (
          <Card className="mb-10 p-5 border-[rgba(91,79,207,0.15)] bg-[rgba(91,79,207,0.03)]">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <p className="text-sm font-bold text-[var(--color-ink)]">
                  {eleve?.prenom ?? "Votre enfant"} n'a pas encore de plan de travail
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                  Invitez-le(la) à créer son plan depuis son espace élève — vous pourrez suivre sa progression ici.
                </p>
              </div>
            </div>
          </Card>
        )}

        {!plan ? (
          /* État vide */
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔬</div>
            <h2 className="text-xl font-black text-[var(--color-ink)] mb-3">
              Analyse du profil de {eleve?.prenom ?? "votre enfant"}
            </h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-2 max-w-md mx-auto">
              Notre équipe virtuelle d'experts — orthopédagogue, coach, psychoneurologue, conseiller en éducation et enseignant — va analyser le profil complet de votre enfant.
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mb-8 max-w-md mx-auto">
              Le plan généré est personnalisé selon ses forces, ses défis, son style d'apprentissage, ses résultats et son état émotionnel.
            </p>
            <GenererPlanBtn eleveId={eleveId} dejaGenere={false} genereLeAt={null} variant="primary" />
          </Card>
        ) : (
          <div className="space-y-8">

            {/* ─── Synthèse du profil ─── */}
            <section>
              <SectionTitle icone="👤" titre="Profil de l'enfant" />
              <Card className="p-6 bg-gradient-to-br from-[rgba(101,88,166,0.06)] to-white border-[rgba(101,88,166,0.2)]">
                <p className="text-sm text-[var(--color-ink)] leading-relaxed mb-5">
                  {plan.synthese.profilGlobal}
                </p>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-2">
                      ✦ Points forts
                    </p>
                    <ul className="space-y-1.5">
                      {plan.synthese.pointsForts.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                          <span className="flex-shrink-0 text-[var(--color-success)] font-bold">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)] mb-2">
                      ◆ Défis identifiés
                    </p>
                    <ul className="space-y-1.5">
                      {plan.synthese.defisIdentifies.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                          <span className="flex-shrink-0 text-[var(--color-gold)]">◇</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {plan.synthese.styleApprentissage && (
                  <div className="mt-5 rounded-xl bg-[rgba(101,88,166,0.08)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-1">
                      🎨 Style d'apprentissage
                    </p>
                    <p className="text-sm text-[var(--color-ink)]">
                      {plan.synthese.styleApprentissage}
                    </p>
                  </div>
                )}
              </Card>
            </section>

            {/* ─── Analyse multi-experte ─── */}
            <section>
              <SectionTitle icone="🔬" titre="Analyse par nos experts" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(plan.analyseExperte).map(([key, texte]) => {
                  const cfg = EXPERT_CONFIG[key];
                  if (!cfg) return null;
                  return (
                    <Card key={key} className={`p-4 border ${cfg.couleur}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{cfg.icone}</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                          {cfg.titre}
                        </p>
                      </div>
                      <p className="text-sm text-[var(--color-ink)] leading-relaxed">
                        {texte}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* ─── Axes d'accompagnement ─── */}
            <section>
              <SectionTitle icone="🗺️" titre="Plan d'accompagnement — axes prioritaires" />
              <div className="space-y-5">
                {plan.axes.map((axe, i) => {
                  const prio = PRIORITE_CONFIG[axe.priorite] ?? PRIORITE_CONFIG.moyenne;
                  return (
                    <Card key={i} className="overflow-hidden p-0">
                      {/* En-tête axe */}
                      <div className="flex items-center gap-3 border-b border-[var(--color-rule)] px-5 py-4">
                        <span className="text-2xl">{axe.icone}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-[var(--color-ink)]">{axe.axe}</h3>
                          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">{axe.contexte}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${prio.bg} ${prio.color}`}>
                          {prio.label}
                        </span>
                      </div>

                      {/* Stratégies */}
                      <div className="divide-y divide-[var(--color-rule)]">
                        {axe.strategies.map((strat, j) => (
                          <div key={j} className="px-5 py-4">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-sm font-bold text-[var(--color-ink)]">{strat.titre}</p>
                              <span className="ml-auto rounded-full bg-[var(--color-paper-warm)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]">
                                {strat.frequence}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--color-ink-soft)] mb-3 leading-relaxed">
                              {strat.description}
                            </p>
                            <ul className="space-y-1.5">
                              {strat.actions.map((action, k) => (
                                <li key={k} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                                  <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded bg-[var(--color-ink)] text-white text-[10px] font-bold flex items-center justify-center">
                                    {k + 1}
                                  </span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* ─── Stratégies fondées sur la recherche ─── */}
            {plan.strategiesRecherche && plan.strategiesRecherche.length > 0 && (
              <section>
                <SectionTitle icone="🔭" titre="Stratégies fondées sur la recherche scientifique" />
                <p className="text-xs text-[var(--color-ink-soft)] mb-4 -mt-2">
                  Ces recommandations s'appuient sur des recherches réelles en éducation, neurosciences et psychologie de l'enfant — choisies spécifiquement pour le profil de {eleve?.prenom ?? "votre enfant"}.
                </p>
                <div className="space-y-4">
                  {plan.strategiesRecherche.map((strat, i) => (
                    <Card key={i} className="overflow-hidden p-0 border-[rgba(91,79,207,0.2)]">
                      {/* En-tête */}
                      <div className="flex items-center gap-3 px-5 py-4 bg-[rgba(91,79,207,0.04)] border-b border-[var(--color-rule)]">
                        <span className="text-2xl flex-shrink-0">{strat.icone}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-ink)] text-sm">{strat.domaine}</p>
                          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                            {strat.citation.auteurs} ({strat.citation.annee}) ·{" "}
                            <em>{strat.citation.titre}</em> · {strat.citation.publication}
                          </p>
                        </div>
                      </div>
                      {/* Corps */}
                      <div className="px-5 py-4">
                        <div className="rounded-xl bg-[rgba(91,79,207,0.05)] border border-[rgba(91,79,207,0.15)] px-4 py-3 mb-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-1">Ce que la recherche démontre</p>
                          <p className="text-sm text-[var(--color-ink)] leading-relaxed">{strat.conclusion}</p>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
                          Comment l'appliquer concrètement
                        </p>
                        <ul className="space-y-2">
                          {strat.applicationPratique.map((geste, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                              <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-[var(--color-purple)] text-white text-[10px] font-bold flex items-center justify-center">
                                {j + 1}
                              </span>
                              {geste}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ─── Routine recommandée ─── */}
            <section>
              <SectionTitle icone="⏰" titre="Routine quotidienne recommandée" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RoutineCard
                  icone="🌅" titre="Avant l'école"
                  items={plan.routineRecommandee.avantEcole}
                  couleur="bg-[rgba(201,149,42,0.06)] border-[rgba(201,149,42,0.2)]"
                />
                <RoutineCard
                  icone="🏠" titre="Retour à la maison"
                  items={plan.routineRecommandee.retourEcole}
                  couleur="bg-[rgba(42,124,111,0.06)] border-[rgba(42,124,111,0.2)]"
                />
                <RoutineCard
                  icone="📖" titre="Période d'étude du soir"
                  items={plan.routineRecommandee.soirEtude}
                  couleur="bg-[rgba(101,88,166,0.06)] border-[rgba(101,88,166,0.2)]"
                />
                <RoutineCard
                  icone="🌿" titre="Fin de semaine"
                  items={plan.routineRecommandee.weekend}
                  couleur="bg-[rgba(217,79,43,0.06)] border-[rgba(217,79,43,0.2)]"
                />
              </div>
            </section>

            {/* ─── Signes à observer ─── */}
            <section>
              <SectionTitle icone="👁️" titre="Signes à surveiller" />
              <Card className="divide-y divide-[var(--color-rule)] p-0 overflow-hidden">
                {plan.signesAObserver.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <span className="mt-0.5 flex-shrink-0 text-lg">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">
                        {item.signe}
                      </p>
                      <p className="text-sm text-[var(--color-ink-soft)]">
                        → {item.action}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            </section>

            {/* ─── Message au parent ─── */}
            <Card className="p-6 bg-[var(--color-ink)] text-white text-center">
              <div className="text-4xl mb-3">💙</div>
              <p className="text-sm leading-relaxed max-w-xl mx-auto">
                {plan.messageAuParent}
              </p>
              {planExistant?.genereLeAt && (
                <p className="mt-4 text-xs text-white/50">
                  Plan généré le {new Date(planExistant.genereLeAt).toLocaleDateString("fr-CA", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              )}
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}

const DOMAINE_LABELS: Record<string, string> = {
  NEUROPSYCHOLOGUE: "Neuropsychologue",
  ORTHOPEDAGOGUE: "Orthopédagogue",
  ORTHOPHONISTE: "Orthophoniste",
  ERGOTHERAPEUTE: "Ergothérapeute",
  OPTOMETRISTE: "Optométriste",
  PSYCHOEDUCATEUR: "Psychoéducateur",
};

const STATUS_VALIDATION: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REPORT_READY:      { label: "En attente de votre validation",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  PARENT_VALIDATED:  { label: "Rapport validé par vous",         color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  PARENT_COMMENTED:  { label: "Rapport commenté par vous",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  PARENT_REFUSED:    { label: "Rapport refusé",                  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  PARCOURS_ADJUSTED: { label: "Parcours ajusté",                 color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  SECOND_CYCLE_PENDING: { label: "Évaluation complémentaire en cours", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
};

interface EvaluationBannerData {
  evaluationId: string;
  status: string;
  domaine: string;
  parentValidation: string | null;
  rapportToken: string | null;
  parcoursAdjustedAt: string | null;
  forces: string[];
  zonesVulnerabilite: string[];
  recommandationsParents: string[];
}

function EvaluationCognitiveBanner({ evaluation }: { evaluation: EvaluationBannerData }) {
  const cfg = STATUS_VALIDATION[evaluation.status] ?? STATUS_VALIDATION.REPORT_READY;
  const domaineLabel = DOMAINE_LABELS[evaluation.domaine] ?? evaluation.domaine;
  const isValidated = ["PARENT_VALIDATED", "PARENT_COMMENTED", "PARCOURS_ADJUSTED", "SECOND_CYCLE_PENDING"].includes(evaluation.status);

  return (
    <div className={`mb-8 rounded-2xl border p-5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <span className="text-2xl flex-shrink-0">🧠</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm font-bold ${cfg.color}`}>
              Évaluation cognitive — {domaineLabel}
            </p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              {cfg.label}
            </span>
          </div>

          {isValidated && evaluation.forces.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">Forces identifiées</p>
                <ul className="space-y-1">
                  {evaluation.forces.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-800">
                      <span className="flex-shrink-0 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {evaluation.zonesVulnerabilite.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1.5">Points à renforcer</p>
                  <ul className="space-y-1">
                    {evaluation.zonesVulnerabilite.slice(0, 3).map((z, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                        <span className="flex-shrink-0">◦</span>
                        <span>{z}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {isValidated && evaluation.recommandationsParents.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
                Ce rapport enrichit le plan ci-dessous
              </p>
              <p className="text-xs text-emerald-800">
                Les recommandations du spécialiste ont été intégrées dans votre plan d'accompagnement personnalisé. Régénérez le plan pour inclure ces nouvelles données.
              </p>
            </div>
          )}

          {evaluation.status === "REPORT_READY" && (
            <p className="mt-2 text-xs text-amber-800">
              Un rapport d'évaluation est prêt. Veuillez le consulter et le valider pour enrichir le plan d'accompagnement.
            </p>
          )}
        </div>

        {evaluation.rapportToken && (
          <Link
            href={`/evaluation/rapport/${evaluation.rapportToken}`}
            className={`flex-shrink-0 rounded-xl border px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80 ${cfg.color} ${cfg.border} bg-white`}
          >
            Voir le rapport →
          </Link>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icone, titre }: { icone: string; titre: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xl">{icone}</span>
      <h2 className="text-lg font-black text-[var(--color-ink)]">{titre}</h2>
    </div>
  );
}

function RoutineCard({
  icone, titre, items, couleur,
}: {
  icone: string;
  titre: string;
  items: string[];
  couleur: string;
}) {
  return (
    <Card className={`p-5 border ${couleur}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icone}</span>
        <p className="text-sm font-bold text-[var(--color-ink)]">{titre}</p>
      </div>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
            <span className="flex-shrink-0 text-[var(--color-ink-soft)] font-bold text-xs mt-0.5">
              {i + 1}.
            </span>
            {item}
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ── Helpers ISO week ──────────────────────────────────────────────────────────

function getSemaineISOCourante(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function formatSemaine(cle: string): string {
  if (cle === "non-planifie") return "Non planifiée";
  const match = cle.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return cle;
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  const jan4 = new Date(year, 0, 4);
  const lundi = new Date(jan4);
  lundi.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1 + (week - 1) * 7);
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${lundi.toLocaleDateString("fr-CA", opts)} – ${dimanche.toLocaleDateString("fr-CA", opts)}`;
}

const PRIORITE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  URGENT:    { label: "Urgent",     color: "text-[var(--color-accent)]",  bg: "bg-[rgba(217,79,43,0.1)]"  },
  IMPORTANT: { label: "Important",  color: "text-[var(--color-gold)]",    bg: "bg-[rgba(201,149,42,0.1)]" },
  PLUS_TARD: { label: "Plus tard",  color: "text-[var(--color-ink-soft)]", bg: "bg-[var(--color-paper-warm)]" },
  MAITRISE:  { label: "Maîtrisée", color: "text-[var(--color-success)]", bg: "bg-[rgba(42,124,111,0.1)]" },
};

interface NotionPlanif {
  id: string;
  notion: string;
  label: string;
  matiere: string;
  priorite: string;
  ordre: number;
  maitrisee: boolean;
  semaineDebut: string | null;
}

interface PlanifData {
  prenom: string;
  niveauScolaire: string;
  notions: NotionPlanif[];
  notionActive: NotionPlanif | null;
  notionsTotal: number;
  notionsMaitrisees: number;
  progressionPct: number;
  parSemaine: Record<string, NotionPlanif[]>;
  objectifs: { matiere: string; scoreVise: number; dateEcheance: Date }[];
  aUnPlan: boolean;
}

function PlanEnfantSection({ planif }: { planif: PlanifData }) {
  const semaineCourante = getSemaineISOCourante();
  const semaines = Object.keys(planif.parSemaine).sort((a, b) => {
    if (a === "non-planifie") return 1;
    if (b === "non-planifie") return -1;
    return a.localeCompare(b);
  });

  return (
    <section className="mb-10">
      <SectionTitle icone="🗺️" titre={`Plan de travail de ${planif.prenom}`} />

      {/* Barre de progression globale */}
      <Card className="p-5 mb-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.03)]">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">
              {planif.notionsMaitrisees} / {planif.notionsTotal} notions maîtrisées
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
              {planif.progressionPct}% du plan complété
            </p>
          </div>
          {planif.notionActive && (
            <div className="rounded-xl bg-[rgba(91,79,207,0.08)] border border-[rgba(91,79,207,0.2)] px-4 py-2.5 max-w-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-purple)] mb-0.5">
                En cours maintenant
              </p>
              <p className="text-sm font-bold text-[var(--color-ink)]">{planif.notionActive.label}</p>
            </div>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-[var(--color-rule)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-purple)] transition-all"
            style={{ width: `${planif.progressionPct}%` }}
          />
        </div>
      </Card>

      {/* Calendrier par semaine */}
      <div className="space-y-4">
        {semaines.map((cle) => {
          const estCetteSemaine = cle === semaineCourante;
          const notionsDeLaSemaine = planif.parSemaine[cle] ?? [];
          return (
            <div
              key={cle}
              className={`rounded-2xl border p-4 ${
                estCetteSemaine
                  ? "border-[rgba(91,79,207,0.35)] bg-[rgba(91,79,207,0.04)]"
                  : "border-[var(--color-rule)] bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {estCetteSemaine && (
                  <span className="rounded-full bg-[var(--color-purple)] px-2 py-0.5 text-[10px] font-bold text-white">
                    Cette semaine
                  </span>
                )}
                <p className={`text-xs font-bold uppercase tracking-wider ${
                  estCetteSemaine ? "text-[var(--color-purple)]" : "text-[var(--color-ink-soft)]"
                }`}>
                  {cle === "non-planifie" ? "Non planifiées" : formatSemaine(cle)}
                </p>
              </div>
              <div className="space-y-2">
                {notionsDeLaSemaine.map((n) => {
                  const prio = PRIORITE_LABELS[n.priorite] ?? PRIORITE_LABELS.IMPORTANT;
                  return (
                    <div
                      key={n.id}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                        n.maitrisee ? "opacity-60" : ""
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">
                        {n.maitrisee ? "✅" : estCetteSemaine ? "📍" : "○"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          n.maitrisee ? "line-through text-[var(--color-ink-soft)]" : "text-[var(--color-ink)]"
                        }`}>
                          {n.label}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${prio.bg} ${prio.color}`}>
                        {prio.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
