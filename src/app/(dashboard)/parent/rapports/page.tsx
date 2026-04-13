export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavParent } from "@/components/layout/nav-parent";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { PrintButton } from "@/components/ui/print-button";
import { EnfantSelector } from "@/components/parent/enfant-selector";
import { Suspense } from "react";
import { isFeatureActive, FEATURE_KEYS } from "@/lib/features";

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique",
  ETHIQUE: "Éthique",
};

const ETAT_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  TRES_BIEN: { emoji: "🤩", label: "Très bien", color: "bg-[rgba(42,124,111,0.15)]" },
  BIEN:      { emoji: "😊", label: "Bien",      color: "bg-[rgba(42,124,111,0.1)]"  },
  CORRECT:   { emoji: "😐", label: "Correct",   color: "bg-[rgba(201,149,42,0.15)]" },
  FATIGUE:   { emoji: "😴", label: "Fatigué",   color: "bg-[rgba(217,79,43,0.1)]"  },
  STRESSE:   { emoji: "😰", label: "Stressé",   color: "bg-[rgba(217,79,43,0.15)]" },
  TRISTE:    { emoji: "😔", label: "Triste",    color: "bg-[rgba(217,79,43,0.12)]" },
};

const NIVEAUX_LABELS: Record<string, string> = {
  PRIMAIRE_1: "1re primaire", PRIMAIRE_2: "2e primaire", PRIMAIRE_3: "3e primaire",
  PRIMAIRE_4: "4e primaire", PRIMAIRE_5: "5e primaire", PRIMAIRE_6: "6e primaire",
  SECONDAIRE_1: "Secondaire 1", SECONDAIRE_2: "Secondaire 2", SECONDAIRE_3: "Secondaire 3",
  SECONDAIRE_4: "Secondaire 4", SECONDAIRE_5: "Secondaire 5",
};

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ enfant?: string }>;
}) {
  await requireRole(["PARENT", "ADMIN", "SUPER_ADMIN"]);

  const { enfant: enfantIdParam } = await searchParams;

  const [profilParent, eleves, specialistesActif] = await Promise.all([
    api.parent.getDashboard(),
    api.parent.getRapports(),
    isFeatureActive(FEATURE_KEYS.SPECIALISTES),
  ]);

  const enfantActif =
    eleves.find((e) => e.id === enfantIdParam) ?? eleves[0] ?? null;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavParent nom={profilParent.nom} specialistesActif={specialistesActif} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/parent"
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              ← Tableau de bord
            </Link>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Rapports de progression</h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              Vue détaillée des progrès, de l'état émotionnel et des objectifs.
            </p>
          </div>
          <PrintButton />
        </div>

        {eleves.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-lg font-bold text-[var(--color-ink)] mb-2">Aucun enfant lié</p>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Ajoutez un enfant depuis le tableau de bord pour voir ses rapports.
            </p>
          </Card>
        ) : (
          <>
            {/* Sélecteur d'enfant */}
            {eleves.length > 1 && (
              <div className="mb-6">
                <Suspense>
                  <EnfantSelector
                    enfants={eleves.map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom }))}
                    enfantActifId={enfantActif!.id}
                    basePath="/parent/rapports"
                  />
                </Suspense>
              </div>
            )}

            {/* Rapport de l'enfant actif */}
            {enfantActif && <EleveRapport eleve={enfantActif} />}
          </>
        )}
      </main>

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

type EleveRapport = Awaited<ReturnType<typeof api.parent.getRapports>>[0];

function EleveRapport({ eleve }: { eleve: EleveRapport }) {
  // ── Calculs sessions ──────────────────────────────────────────────────
  const now = new Date();

  const sessionsParSemaine = Array.from({ length: 8 }, (_, i) => {
    const debut = new Date(now);
    debut.setDate(debut.getDate() - (7 * (7 - i)) - now.getDay());
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);

    const sessions = eleve.sessions.filter((s) => {
      const d = new Date(s.dateSession);
      return d >= debut && d < fin;
    });

    return {
      label: `S${i + 1}`,
      count: sessions.length,
      points: sessions.reduce((acc, s) => acc + s.pointsGagnes, 0),
      reussite: sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + (s.exercicesTotal > 0 ? s.exercicesReussis / s.exercicesTotal : 0), 0) / sessions.length * 100)
        : null,
    };
  });

  const maxSessions = Math.max(...sessionsParSemaine.map((s) => s.count), 1);

  const cetteSeamaine = sessionsParSemaine[sessionsParSemaine.length - 1];
  const semainePrecedente = sessionsParSemaine[sessionsParSemaine.length - 2];

  const totalPoints = eleve.sessions.reduce((acc, s) => acc + s.pointsGagnes, 0);
  const totalExercices = eleve.exercicesAssignes.length;

  // Score moyen global
  const scores = eleve.exercicesAssignes
    .map((e) => e.score)
    .filter((s): s is number => s !== null);
  const scoreMoyen = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  // ── Progression temporelle : score moyen par semaine (8 semaines) ─────
  const scoresParSemaine = Array.from({ length: 8 }, (_, i) => {
    const debut = new Date(now);
    debut.setDate(debut.getDate() - (7 * (7 - i)) - now.getDay());
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);

    const exSemaine = eleve.exercicesAssignes.filter((e) => {
      if (!e.dateFin || e.score === null) return false;
      const d = new Date(e.dateFin);
      return d >= debut && d < fin;
    });
    const ss = exSemaine.map((e) => e.score as number);
    return {
      label: `S${i + 1}`,
      score: ss.length > 0 ? Math.round(ss.reduce((a, b) => a + b, 0) / ss.length) : null,
      count: ss.length,
    };
  });

  // ROI depuis l'inscription (5 premiers vs 5 derniers)
  const exercicesTousTriesAsc = [...eleve.exercicesAssignes].reverse();
  const cinqPremiers = exercicesTousTriesAsc.slice(0, 5).map((e) => e.score).filter((s): s is number => s !== null);
  const cinqDerniers = eleve.exercicesAssignes.slice(0, 5).map((e) => e.score).filter((s): s is number => s !== null);
  const scoreMoyenDebut = cinqPremiers.length > 0 ? Math.round(cinqPremiers.reduce((a, b) => a + b, 0) / cinqPremiers.length) : null;
  const scoreMoyenRecent = cinqDerniers.length > 0 ? Math.round(cinqDerniers.reduce((a, b) => a + b, 0) / cinqDerniers.length) : null;
  const gainDepuisDebut = scoreMoyenDebut !== null && scoreMoyenRecent !== null && cinqPremiers.length >= 3
    ? scoreMoyenRecent - scoreMoyenDebut
    : null;

  // ── Check-ins ─────────────────────────────────────────────────────────
  const checkIns14j = eleve.checkIns.slice(0, 14).reverse();
  const humeurPositive = ["TRES_BIEN", "BIEN"];
  const humeurNegative = ["STRESSE", "TRISTE", "FATIGUE"];
  const nPositif = checkIns14j.filter((c) => humeurPositive.includes(c.etat)).length;
  const nNegatif = checkIns14j.filter((c) => humeurNegative.includes(c.etat)).length;

  // ── Plan actif ────────────────────────────────────────────────────────
  const planActif = eleve.planActions[0];
  const objectifsAtteints = planActif?.objectifs.filter((o) => o.atteint).length ?? 0;
  const objectifsTotal = planActif?.objectifs.length ?? 0;

  return (
    <div>
      {/* En-tête élève */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-lg font-bold text-white flex-shrink-0">
          {eleve.prenom.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black text-[var(--color-ink)]">
            {eleve.prenom} {eleve.nom}
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {NIVEAUX_LABELS[eleve.niveauScolaire] ?? eleve.niveauScolaire}
            {eleve.ecole ? ` · ${eleve.ecole}` : ""}
          </p>
        </div>
        <Link
          href={`/parent/accompagnement/${eleve.id}`}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-rule)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
        >
          🗺️ Plan d'accompagnement
        </Link>
      </div>

      {/* KPIs résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Sessions cette semaine"
          value={String(cetteSeamaine.count)}
          sub={semainePrecedente.count > 0
            ? cetteSeamaine.count >= semainePrecedente.count
              ? `↑ vs sem. préc. (${semainePrecedente.count})`
              : `↓ vs sem. préc. (${semainePrecedente.count})`
            : undefined}
          color={cetteSeamaine.count > 0 ? "success" : "neutral"}
        />
        <KpiCard
          label="Score moyen"
          value={scoreMoyen !== null ? `${scoreMoyen}%` : "—"}
          sub={totalExercices > 0 ? `${totalExercices} exercices` : "Aucun encore"}
          color={scoreMoyen !== null ? (scoreMoyen >= 70 ? "success" : scoreMoyen >= 50 ? "gold" : "accent") : "neutral"}
        />
        <KpiCard
          label="Points accumulés"
          value={String(totalPoints)}
          sub={`Streak : ${eleve.streakJours} jour${eleve.streakJours > 1 ? "s" : ""}`}
          color="purple"
        />
        <KpiCard
          label="Badges débloqués"
          value={String(eleve.badges.length)}
          sub={eleve.badges[0]?.badge.titre ?? "Aucun encore"}
          color="gold"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* ── Graphique sessions 8 semaines ── */}
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
            Sessions par semaine (8 dernières semaines)
          </p>
          <div className="flex items-end gap-1.5 h-28">
            {sessionsParSemaine.map((sem, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-[var(--color-ink-soft)]">
                  {sem.count > 0 ? sem.count : ""}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      i === sessionsParSemaine.length - 1
                        ? "bg-[var(--color-purple)]"
                        : "bg-[rgba(91,79,207,0.25)]"
                    }`}
                    style={{ height: sem.count === 0 ? "4px" : `${(sem.count / maxSessions) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-[var(--color-ink-soft)]">{sem.label}</span>
              </div>
            ))}
          </div>
          {cetteSeamaine.reussite !== null && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-3 text-center">
              Taux de réussite cette semaine :{" "}
              <strong className="text-[var(--color-ink)]">{cetteSeamaine.reussite}%</strong>
            </p>
          )}
        </Card>

        {/* ── Progression par matière + lacunes ── */}
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
            Progression par matière
          </p>
          {eleve.niveauxMatieres.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-soft)]">
              Aucune donnée — l'élève n'a pas encore complété d'exercices.
            </p>
          ) : (
            <div className="space-y-4">
              {eleve.niveauxMatieres
                .sort((a, b) => b.scoreGlobal - a.scoreGlobal)
                .map((nm) => {
                  const score = Math.round(nm.scoreGlobal);
                  const color = score >= 80 ? "var(--color-success)" : score >= 60 ? "var(--color-gold)" : "var(--color-accent)";
                  return (
                    <div key={nm.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-[var(--color-ink)]">
                          {MATIERE_LABEL[nm.matiere] ?? nm.matiere}
                        </span>
                        <span className="text-xs font-bold" style={{ color }}>
                          {score}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-paper-warm)] overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${score}%`, backgroundColor: color }}
                        />
                      </div>
                      {/* Lacunes identifiées */}
                      {nm.lacunes.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {nm.lacunes.slice(0, 2).map((lacune, i) => (
                            <p key={i} className="text-[10px] text-[var(--color-accent)] flex items-start gap-1 leading-tight">
                              <span className="flex-shrink-0 mt-0.5">⚠</span>
                              <span>{lacune}</span>
                            </p>
                          ))}
                          {nm.lacunes.length > 2 && (
                            <p className="text-[10px] text-[var(--color-ink-soft)]">
                              +{nm.lacunes.length - 2} autre{nm.lacunes.length - 2 > 1 ? "s" : ""} lacune{nm.lacunes.length - 2 > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        {/* ── Évolution du score (8 semaines) ── */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
              Évolution du score moyen — 8 dernières semaines
            </p>
            {gainDepuisDebut !== null && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                gainDepuisDebut >= 0
                  ? "bg-[rgba(42,124,111,0.1)] text-[var(--color-success)]"
                  : "bg-[rgba(217,79,43,0.08)] text-[var(--color-accent)]"
              }`}>
                {gainDepuisDebut >= 0 ? "↑" : "↓"} {Math.abs(gainDepuisDebut)} pts depuis le début
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 h-32">
            {scoresParSemaine.map((sem, i) => {
              const scoreColor = sem.score === null
                ? "bg-[var(--color-paper-warm)]"
                : sem.score >= 80
                  ? i === scoresParSemaine.length - 1 ? "bg-[var(--color-success)]" : "bg-[rgba(42,124,111,0.35)]"
                  : sem.score >= 60
                    ? i === scoresParSemaine.length - 1 ? "bg-[var(--color-gold)]" : "bg-[rgba(201,149,42,0.35)]"
                    : i === scoresParSemaine.length - 1 ? "bg-[var(--color-accent)]" : "bg-[rgba(217,79,43,0.3)]";
              const hauteur = sem.score !== null ? `${sem.score}%` : "4px";
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-[var(--color-ink-soft)]">
                    {sem.score !== null ? `${sem.score}%` : ""}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${scoreColor}`}
                      style={{ height: hauteur }}
                      title={sem.count > 0 ? `${sem.count} exercice${sem.count > 1 ? "s" : ""}` : "Aucun exercice"}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--color-ink-soft)]">{sem.label}</span>
                </div>
              );
            })}
          </div>
          {scoreMoyenDebut !== null && scoreMoyenRecent !== null && (
            <p className="text-xs text-[var(--color-ink-soft)] mt-3 text-center">
              Début : <strong className="text-[var(--color-ink)]">{scoreMoyenDebut}%</strong>
              {" · "}
              Récent : <strong className="text-[var(--color-ink)]">{scoreMoyenRecent}%</strong>
            </p>
          )}
        </Card>

        {/* ── État émotionnel 14 derniers jours ── */}
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-1">
            État émotionnel — 14 derniers jours
          </p>
          <p className="text-[11px] text-[var(--color-ink-soft)] mb-4">
            {checkIns14j.length} check-in{checkIns14j.length > 1 ? "s" : ""} enregistré{checkIns14j.length > 1 ? "s" : ""}
            {checkIns14j.length > 0 && ` · ${nPositif} positif${nPositif > 1 ? "s" : ""}, ${nNegatif} difficile${nNegatif > 1 ? "s" : ""}`}
          </p>
          {checkIns14j.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-soft)]">Aucun check-in enregistré.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {checkIns14j.map((c, i) => {
                const cfg = ETAT_CONFIG[c.etat];
                return (
                  <div
                    key={i}
                    title={`${cfg?.label ?? c.etat} — ${new Date(c.date).toLocaleDateString("fr-CA")}`}
                    className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 ${cfg?.color ?? "bg-[var(--color-paper-warm)]"}`}
                  >
                    <span className="text-lg">{cfg?.emoji ?? "❓"}</span>
                    <span className="text-[9px] text-[var(--color-ink-soft)]">
                      {new Date(c.date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {nNegatif >= 3 && (
            <div className="mt-4 rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.2)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--color-accent)]">
                ⚠️ Plusieurs humeurs difficiles détectées
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                Consultez le plan d'accompagnement pour des stratégies de soutien émotionnel adaptées.
              </p>
            </div>
          )}
        </Card>

        {/* ── Plan d'action & objectifs ── */}
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
            Plan d'action actif
          </p>
          {!planActif ? (
            <p className="text-xs text-[var(--color-ink-soft)]">Aucun plan actif pour l'instant.</p>
          ) : (
            <>
              <p className="text-sm font-bold text-[var(--color-ink)] mb-3">{planActif.titre}</p>
              {/* Barre de progression globale */}
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-[var(--color-ink-soft)]">Objectifs atteints</span>
                  <span className="text-xs font-bold text-[var(--color-ink)]">
                    {objectifsAtteints} / {objectifsTotal}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-success)] transition-all"
                    style={{ width: objectifsTotal > 0 ? `${(objectifsAtteints / objectifsTotal) * 100}%` : "0%" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {planActif.objectifs.map((obj) => (
                  <div
                    key={obj.id}
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                      obj.atteint
                        ? "bg-[rgba(42,124,111,0.08)] text-[var(--color-success)]"
                        : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]"
                    }`}
                  >
                    <span className="flex-shrink-0 font-bold mt-0.5">{obj.atteint ? "✓" : "○"}</span>
                    <span>{obj.titre}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Badges ── */}
      {eleve.badges.length > 0 && (
        <Card className="mt-6 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
            Badges débloqués ({eleve.badges.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {eleve.badges.map((b) => (
              <div
                key={b.id}
                className="flex flex-col items-center gap-1 rounded-xl bg-[rgba(201,149,42,0.08)] border border-[rgba(201,149,42,0.2)] px-4 py-3"
              >
                <span className="text-2xl">{b.badge.icone}</span>
                <span className="text-xs font-semibold text-[var(--color-ink)] text-center max-w-[80px]">
                  {b.badge.titre}
                </span>
                <span className="text-[10px] text-[var(--color-ink-soft)]">
                  {new Date(b.date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Ce que dit l'enfant ── */}
      {(eleve.commentairesEleve as { id: string; type: string; contenu: string; matieres: string[]; createdAt: Date }[]).length > 0 && (
        <Card className="mt-6 p-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.02)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">💬</span>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)]">
              Ce que {eleve.prenom} dit lui-même
            </p>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] mb-4 -mt-2">
            Messages envoyés par {eleve.prenom} à son IA personnelle — ses difficultés, ses objectifs, ses questions.
          </p>
          <div className="space-y-3">
            {(eleve.commentairesEleve as { id: string; type: string; contenu: string; matieres: string[]; createdAt: Date }[]).map((c) => {
              const typeMap: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
                DIFFICULTE:        { emoji: "😓", label: "Difficulté signalée",    color: "text-[var(--color-accent)]",  bg: "bg-[rgba(217,79,43,0.06)] border-[rgba(217,79,43,0.2)]"   },
                OBJECTIF_MAITRISE: { emoji: "🎯", label: "Veut maîtriser",         color: "text-[var(--color-purple)]",  bg: "bg-[rgba(91,79,207,0.06)] border-[rgba(91,79,207,0.2)]"   },
                QUESTION:          { emoji: "🤔", label: "A posé une question",    color: "text-[var(--color-gold)]",    bg: "bg-[rgba(201,149,42,0.06)] border-[rgba(201,149,42,0.2)]" },
                AUTRE:             { emoji: "💬", label: "Note",                   color: "text-[var(--color-ink-soft)]",bg: "bg-[var(--color-paper-warm)] border-[var(--color-rule)]"   },
              };
              const cfg = typeMap[c.type] ?? typeMap.AUTRE;
              return (
                <div key={c.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        {c.matieres.length > 0 && (
                          <span className="text-xs text-[var(--color-ink-soft)]">
                            · {c.matieres.map((m) => MATIERE_LABEL[m] ?? m).join(", ")}
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-[var(--color-ink-soft)] flex-shrink-0">
                          {new Date(c.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long" })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-ink)] leading-relaxed">{c.contenu}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl bg-[rgba(91,79,207,0.06)] border border-[rgba(91,79,207,0.15)] px-4 py-3">
            <p className="text-xs text-[var(--color-purple)] font-semibold mb-0.5">💡 Pour vous, en tant que parent</p>
            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Ces messages sont pris en compte par l'IA pour personnaliser les exercices de {eleve.prenom}. Vous pouvez également en discuter avec lui(elle) pour mieux comprendre ses blocages.
            </p>
          </div>
        </Card>
      )}

      {/* ── Derniers exercices ── */}
      {eleve.exercicesAssignes.length > 0 && (
        <Card className="mt-6 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
            Derniers exercices complétés
          </p>
          <div className="divide-y divide-[var(--color-rule)]">
            {eleve.exercicesAssignes.slice(0, 10).map((ex) => {
              const score = ex.score !== null ? Math.round(ex.score) : null;
              const color = score !== null
                ? score >= 80 ? "var(--color-success)" : score >= 60 ? "var(--color-gold)" : "var(--color-accent)"
                : "var(--color-ink-soft)";
              return (
                <div key={ex.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xs text-[var(--color-ink-soft)] w-20 flex-shrink-0">
                    {ex.dateFin
                      ? new Date(ex.dateFin).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })
                      : "—"}
                  </span>
                  <span className="text-xs text-[var(--color-ink)] flex-1 truncate">
                    {ex.exercice.titre}
                  </span>
                  <span className="text-xs text-[var(--color-ink-soft)] flex-shrink-0">
                    {MATIERE_LABEL[ex.exercice.matiere] ?? ex.exercice.matiere}
                  </span>
                  {score !== null && (
                    <span
                      className="text-xs font-bold flex-shrink-0 rounded-full px-2 py-0.5"
                      style={{ color, backgroundColor: `${color}18` }}
                    >
                      {score}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  label, value, sub, color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "success" | "gold" | "accent" | "purple" | "neutral";
}) {
  const colorMap = {
    success: "text-[var(--color-success)] bg-[rgba(42,124,111,0.06)]",
    gold:    "text-[var(--color-gold)]    bg-[rgba(201,149,42,0.06)]",
    accent:  "text-[var(--color-accent)]  bg-[rgba(217,79,43,0.06)]",
    purple:  "text-[var(--color-purple)]  bg-[rgba(91,79,207,0.06)]",
    neutral: "text-[var(--color-ink)]     bg-[var(--color-paper-warm)]",
  };

  return (
    <div className={`rounded-2xl p-4 border border-[var(--color-rule)] ${colorMap[color]}`}>
      <p className="text-xs text-[var(--color-ink-soft)] mb-1 leading-tight">{label}</p>
      <p className="text-2xl font-black leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[var(--color-ink-soft)] mt-1 truncate">{sub}</p>}
    </div>
  );
}
