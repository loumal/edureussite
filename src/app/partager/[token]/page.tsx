import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { PlanAccompagnementGenere } from "@/lib/ai/accompagnement";

interface Props {
  params: Promise<{ token: string }>;
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
  orthopedagogue:     { titre: "Orthopédagogue",         icone: "🧩", couleur: "border-[rgba(101,88,166,0.3)] bg-[rgba(101,88,166,0.04)]" },
  coach:              { titre: "Coach en développement", icone: "🏆", couleur: "border-[rgba(217,79,43,0.3)] bg-[rgba(217,79,43,0.04)]"  },
  psychoneurologue:   { titre: "Psychoneurologue",       icone: "🧠", couleur: "border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.04)]" },
  conseillerEducation:{ titre: "Conseiller en éducation",icone: "🎓", couleur: "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.04)]" },
  enseignant:         { titre: "Enseignant PFEQ",        icone: "📚", couleur: "border-[var(--color-rule)] bg-[var(--color-paper-warm)]"  },
};

export default async function PartagerPage({ params }: Props) {
  const { token } = await params;

  const planRecord = await prisma.planAccompagnementParent.findUnique({
    where: { tokenPartage: token },
    include: {
      eleve: { select: { prenom: true, nom: true, niveauScolaire: true } },
      parent: { select: { prenom: true, nom: true } },
    },
  });

  if (!planRecord) notFound();

  const plan = planRecord.contenu as unknown as PlanAccompagnementGenere;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* En-tête public */}
      <div className="border-b border-[var(--color-rule)] bg-white print:hidden">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">Édu-Réussite QC</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Plan d'accompagnement parental partagé</p>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            🖨️ Imprimer / Exporter PDF
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* En-tête du plan */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-ink)]">
            Plan d'accompagnement parental
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Pour {planRecord.eleve.prenom} {planRecord.eleve.nom} ·{" "}
            {NIVEAUX_LABELS[planRecord.eleve.niveauScolaire] ?? planRecord.eleve.niveauScolaire}
          </p>
          <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
            Partagé par {planRecord.parent.prenom} {planRecord.parent.nom} · Généré le{" "}
            {new Date(planRecord.genereLeAt).toLocaleDateString("fr-CA", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-8">
          {/* Profil */}
          <section>
            <SectionTitle icone="👤" titre="Profil de l'enfant" />
            <Card className="p-6 bg-gradient-to-br from-[rgba(101,88,166,0.06)] to-white border-[rgba(101,88,166,0.2)]">
              <p className="text-sm text-[var(--color-ink)] leading-relaxed mb-4">{plan.synthese.profilGlobal}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-success)] mb-2">✦ Points forts</p>
                  <ul className="space-y-1.5">
                    {plan.synthese.pointsForts.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-[var(--color-success)] font-bold flex-shrink-0">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-gold)] mb-2">◆ Défis</p>
                  <ul className="space-y-1.5">
                    {plan.synthese.defisIdentifies.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-[var(--color-gold)] flex-shrink-0">◇</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* Analyse experte */}
          <section>
            <SectionTitle icone="🔬" titre="Analyse multi-experte" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(plan.analyseExperte).map(([key, texte]) => {
                const cfg = EXPERT_CONFIG[key];
                if (!cfg) return null;
                return (
                  <Card key={key} className={`p-4 border ${cfg.couleur}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{cfg.icone}</span>
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">{cfg.titre}</p>
                    </div>
                    <p className="text-sm text-[var(--color-ink)] leading-relaxed">{texte}</p>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Axes */}
          <section>
            <SectionTitle icone="🗺️" titre="Axes d'accompagnement" />
            <div className="space-y-5">
              {plan.axes.map((axe, i) => {
                const prio = PRIORITE_CONFIG[axe.priorite] ?? PRIORITE_CONFIG.moyenne;
                return (
                  <Card key={i} className="overflow-hidden p-0">
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
                    <div className="divide-y divide-[var(--color-rule)]">
                      {axe.strategies.map((strat, j) => (
                        <div key={j} className="px-5 py-4">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-bold text-[var(--color-ink)]">{strat.titre}</p>
                            <span className="ml-auto rounded-full bg-[var(--color-paper-warm)] px-2 py-0.5 text-xs text-[var(--color-ink-soft)]">
                              {strat.frequence}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-ink-soft)] mb-3">{strat.description}</p>
                          <ul className="space-y-1.5">
                            {strat.actions.map((action, k) => (
                              <li key={k} className="flex items-start gap-2 text-sm">
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

          {/* Stratégies fondées sur la recherche */}
          {plan.strategiesRecherche && plan.strategiesRecherche.length > 0 && (
            <section>
              <SectionTitle icone="🔭" titre="Stratégies fondées sur la recherche scientifique" />
              <p className="text-xs text-[var(--color-ink-soft)] mb-4 -mt-2">
                Ces recommandations s'appuient sur des recherches réelles en éducation, neurosciences et psychologie de l'enfant.
              </p>
              <div className="space-y-4">
                {plan.strategiesRecherche.map((strat, i) => (
                  <Card key={i} className="overflow-hidden p-0 border-[rgba(91,79,207,0.2)]">
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
                    <div className="px-5 py-4">
                      <div className="rounded-xl bg-[rgba(91,79,207,0.05)] border border-[rgba(91,79,207,0.15)] px-4 py-3 mb-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)] mb-1">Ce que la recherche démontre</p>
                        <p className="text-sm text-[var(--color-ink)] leading-relaxed">{strat.conclusion}</p>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">Comment l'appliquer concrètement</p>
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

          {/* Routine */}
          <section>
            <SectionTitle icone="⏰" titre="Routine quotidienne" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RoutineCard icone="🌅" titre="Avant l'école" items={plan.routineRecommandee.avantEcole} couleur="bg-[rgba(201,149,42,0.06)] border-[rgba(201,149,42,0.2)]" />
              <RoutineCard icone="🏠" titre="Retour à la maison" items={plan.routineRecommandee.retourEcole} couleur="bg-[rgba(42,124,111,0.06)] border-[rgba(42,124,111,0.2)]" />
              <RoutineCard icone="📖" titre="Étude du soir" items={plan.routineRecommandee.soirEtude} couleur="bg-[rgba(101,88,166,0.06)] border-[rgba(101,88,166,0.2)]" />
              <RoutineCard icone="🌿" titre="Fin de semaine" items={plan.routineRecommandee.weekend} couleur="bg-[rgba(217,79,43,0.06)] border-[rgba(217,79,43,0.2)]" />
            </div>
          </section>

          {/* Signes à observer */}
          <section>
            <SectionTitle icone="👁️" titre="Signes à surveiller" />
            <Card className="divide-y divide-[var(--color-rule)] p-0 overflow-hidden">
              {plan.signesAObserver.map((item, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <span className="mt-0.5 flex-shrink-0 text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">{item.signe}</p>
                    <p className="text-sm text-[var(--color-ink-soft)]">→ {item.action}</p>
                  </div>
                </div>
              ))}
            </Card>
          </section>

          {/* Message au parent */}
          <Card className="p-6 bg-[var(--color-ink)] text-white text-center">
            <div className="text-4xl mb-3">💙</div>
            <p className="text-sm leading-relaxed max-w-xl mx-auto">{plan.messageAuParent}</p>
          </Card>

          {/* Footer légal */}
          <p className="text-xs text-center text-[var(--color-ink-soft)] pb-4">
            Document généré par Édu-Réussite QC · à titre informatif · ne remplace pas un avis professionnel
          </p>
        </div>
      </main>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
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

function RoutineCard({ icone, titre, items, couleur }: { icone: string; titre: string; items: string[]; couleur: string }) {
  return (
    <Card className={`p-5 border ${couleur}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icone}</span>
        <p className="text-sm font-bold text-[var(--color-ink)]">{titre}</p>
      </div>
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="flex-shrink-0 text-[var(--color-ink-soft)] font-bold text-xs mt-0.5">{i + 1}.</span>
            {item}
          </li>
        ))}
      </ol>
    </Card>
  );
}
