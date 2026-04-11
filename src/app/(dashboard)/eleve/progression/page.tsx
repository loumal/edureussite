export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "✏️", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ANGLAIS: "🗣️",
  EDUCATION_PHYSIQUE: "🏃", ETHIQUE: "🤝",
};

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éducation physique", ETHIQUE: "Éthique",
};

const NIVEAU_CONFIG: Record<string, { label: string; color: string }> = {
  BASE:         { label: "Débutant",        color: "text-[var(--color-accent)]" },
  ATTENDU:      { label: "Niveau attendu",  color: "text-[var(--color-gold)]" },
  INTERMEDIAIRE:{ label: "Intermédiaire",   color: "text-[var(--color-gold)]" },
  AVANCE:       { label: "Avancé",          color: "text-[var(--color-success)]" },
  EXPERT:       { label: "Expert",          color: "text-[var(--color-purple)]" },
};

export default async function ProgressionPage() {
  await requireRole(["ELEVE"]);

  const [dashboard, data] = await Promise.all([
    api.eleve.getDashboard(),
    api.eleve.getProgression(),
  ]);

  if (!dashboard.profil) return null;

  const { profil, exercicesTermines, totalExercices, scoreMoyen } = data;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={dashboard.profil.prenom} streak={dashboard.profil.streakJours} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Link href="/eleve" className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-black text-[var(--color-ink)]">📈 Ma progression</h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Suis ton évolution et vois où tu t'améliores le plus.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <KpiCard emoji="✏️" label="Exercices complétés" value={totalExercices} />
          <KpiCard emoji="🎯" label="Score moyen" value={scoreMoyen > 0 ? `${scoreMoyen}%` : "—"} />
          <KpiCard emoji="🔥" label="Série actuelle" value={`${profil.streakJours}j`} />
          <KpiCard emoji="🏆" label="Badges débloqués" value={profil.badges.length} />
        </div>

        {/* Progression par matière */}
        <section className="mb-10">
          <h2 className="text-base font-black text-[var(--color-ink)] mb-4">📚 Progression par matière</h2>

          {profil.niveauxMatieres.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">Aucune donnée encore</p>
              <p className="text-xs text-[var(--color-ink-soft)]">Complète des exercices pour voir ta progression par matière.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {profil.niveauxMatieres.map((nm) => {
                const niveauCfg = NIVEAU_CONFIG[nm.niveau] ?? NIVEAU_CONFIG.BASE;
                const scoreColor = nm.scoreGlobal >= 80 ? "success" : nm.scoreGlobal >= 60 ? "gold" : "accent";
                return (
                  <Card key={nm.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{MATIERE_EMOJI[nm.matiere] ?? "📘"}</span>
                        <div>
                          <p className="text-sm font-bold text-[var(--color-ink)]">
                            {MATIERE_LABEL[nm.matiere] ?? nm.matiere}
                          </p>
                          <p className={`text-xs font-semibold ${niveauCfg.color}`}>{niveauCfg.label}</p>
                        </div>
                      </div>
                      <span className="text-xl font-black text-[var(--color-ink)]">
                        {Math.round(nm.scoreGlobal)}%
                      </span>
                    </div>

                    <Progress value={nm.scoreGlobal} size="sm" color={scoreColor} />

                    {/* Lacunes identifiées */}
                    {((nm.lacunes ?? []) as string[]).length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                          Points à travailler
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {((nm.lacunes ?? []) as string[]).slice(0, 3).map((l, i) => (
                            <span key={i} className="rounded-full bg-[rgba(217,79,43,0.08)] px-2 py-0.5 text-[10px] text-[var(--color-accent)]">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compétences PFEQ maîtrisées */}
                    {((nm.competencesPFEQ ?? []) as string[]).length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1.5">
                          Compétences maîtrisées
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {((nm.competencesPFEQ ?? []) as string[]).slice(0, 2).map((c, i) => (
                            <span key={i} className="rounded-full bg-[rgba(42,124,111,0.1)] px-2 py-0.5 text-[10px] text-[var(--color-success)]">
                              ✓ {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {nm.derniereEval && (
                      <p className="text-[10px] text-[var(--color-ink-soft)] mt-2">
                        Dernière activité : {new Date(nm.derniereEval).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Badges */}
        {profil.badges.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-black text-[var(--color-ink)] mb-4">
              🏆 Mes badges <span className="text-sm font-normal text-[var(--color-ink-soft)]">({profil.badges.length})</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {profil.badges.map((b) => (
                <Card key={b.id} className="p-4 text-center">
                  <div className="text-3xl mb-2">{b.badge.icone}</div>
                  <p className="text-xs font-bold text-[var(--color-ink)] leading-snug">{b.badge.titre}</p>
                  <p className="text-[10px] text-[var(--color-ink-soft)] mt-1 leading-relaxed">{b.badge.description}</p>
                  <p className="text-[10px] text-[var(--color-ink-soft)] mt-1.5">
                    {new Date(b.date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Historique des exercices */}
        <section>
          <h2 className="text-base font-black text-[var(--color-ink)] mb-4">
            📋 Mes derniers exercices <span className="text-sm font-normal text-[var(--color-ink-soft)]">({totalExercices} au total)</span>
          </h2>

          {exercicesTermines.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-4xl mb-3">✏️</p>
              <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">Pas encore d'exercices complétés</p>
              <Link href="/eleve" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Commencer maintenant
              </Link>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-[var(--color-rule)]">
                {exercicesTermines.map((ex) => {
                  const score = ex.score ?? 0;
                  const scoreColor = score >= 80 ? "text-[var(--color-success)]" : score >= 60 ? "text-[var(--color-gold)]" : "text-[var(--color-accent)]";
                  return (
                    <div key={ex.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xl flex-shrink-0">
                        {MATIERE_EMOJI[ex.exercice.matiere] ?? "📝"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-ink)] truncate">{ex.exercice.titre}</p>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          {MATIERE_LABEL[ex.exercice.matiere] ?? ex.exercice.matiere}
                          {ex.dateFin && ` · ${new Date(ex.dateFin).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}`}
                          {ex.tempsSecondes && ` · ${Math.round(ex.tempsSecondes / 60)} min`}
                        </p>
                      </div>
                      {score > 0 && (
                        <span className={`flex-shrink-0 text-sm font-black ${scoreColor}`}>
                          {Math.round(score)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>

        {/* Streak record */}
        {profil.streakMaxJours > 1 && (
          <div className="mt-8 rounded-2xl border border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.06)] px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-bold text-[var(--color-gold)]">Ton record de série : {profil.streakMaxJours} jours</p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Série actuelle : {profil.streakJours} jour{profil.streakJours > 1 ? "s" : ""}. Continue chaque jour pour battre ton record !
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-black text-[var(--color-ink)]">{value}</div>
      <div className="text-[10px] font-medium text-[var(--color-ink-soft)] mt-0.5 leading-snug">{label}</div>
    </Card>
  );
}
