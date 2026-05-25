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

// ── Constantes ────────────────────────────────────────────────────────────────

const MATIERE_LABEL: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éd. physique", ETHIQUE: "Éthique",
};

const MATIERE_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ANGLAIS: "🇨🇦",
  EDUCATION_PHYSIQUE: "⚽", ETHIQUE: "🤝",
};

const ETAT_CONFIG: Record<string, { emoji: string; label: string; isPositive: boolean }> = {
  TRES_BIEN: { emoji: "🤩", label: "Très bien",  isPositive: true  },
  BIEN:      { emoji: "😊", label: "Bien",        isPositive: true  },
  CORRECT:   { emoji: "😐", label: "Correct",     isPositive: true  },
  FATIGUE:   { emoji: "😴", label: "Fatigué",     isPositive: false },
  STRESSE:   { emoji: "😰", label: "Stressé",     isPositive: false },
  TRISTE:    { emoji: "😔", label: "Triste",      isPositive: false },
};

const NIVEAUX_LABELS: Record<string, string> = {
  PRIMAIRE_1: "1re primaire", PRIMAIRE_2: "2e primaire", PRIMAIRE_3: "3e primaire",
  PRIMAIRE_4: "4e primaire", PRIMAIRE_5: "5e primaire", PRIMAIRE_6: "6e primaire",
  SECONDAIRE_1: "Secondaire 1", SECONDAIRE_2: "Secondaire 2", SECONDAIRE_3: "Secondaire 3",
  SECONDAIRE_4: "Secondaire 4", SECONDAIRE_5: "Secondaire 5",
};

// ── Page ──────────────────────────────────────────────────────────────────────

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
            <p className="text-sm text-[var(--color-ink-soft)] mt-0.5">
              Suivi détaillé des apprentissages, de l&apos;état émotionnel et des objectifs.
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

// ── Rapport complet ───────────────────────────────────────────────────────────

type EleveRapport = Awaited<ReturnType<typeof api.parent.getRapports>>[0];

function EleveRapport({ eleve }: { eleve: EleveRapport }) {
  const now = new Date();

  // ── Calculs sessions ──────────────────────────────────────────────────────
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
      reussite: sessions.length > 0
        ? Math.round(sessions.reduce((acc, s) => acc + (s.exercicesTotal > 0 ? s.exercicesReussis / s.exercicesTotal : 0), 0) / sessions.length * 100)
        : null,
    };
  });

  const semCourante = sessionsParSemaine[7];
  const semPrecedente = sessionsParSemaine[6];
  const maxSessions = Math.max(...sessionsParSemaine.map((s) => s.count), 1);

  // ── Calculs scores ────────────────────────────────────────────────────────
  const scores = eleve.exercicesAssignes.map((e) => e.score).filter((s): s is number => s !== null);
  const scoreMoyen = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : null;

  const scoresParSemaine = Array.from({ length: 8 }, (_, i) => {
    const debut = new Date(now);
    debut.setDate(debut.getDate() - (7 * (7 - i)) - now.getDay());
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);
    const exSem = eleve.exercicesAssignes.filter((e) => {
      if (!e.dateFin || e.score === null) return false;
      const d = new Date(e.dateFin);
      return d >= debut && d < fin;
    });
    const ss = exSem.map((e) => e.score as number);
    return {
      label: `S${i + 1}`,
      score: ss.length > 0 ? Math.round(ss.reduce((a, b) => a + b) / ss.length) : null,
      count: ss.length,
    };
  });

  // Début vs récent
  const cinqPremiers = [...eleve.exercicesAssignes].reverse().slice(0, 5).map((e) => e.score).filter((s): s is number => s !== null);
  const cinqDerniers = eleve.exercicesAssignes.slice(0, 5).map((e) => e.score).filter((s): s is number => s !== null);
  const scoreMoyenDebut  = cinqPremiers.length >= 2 ? Math.round(cinqPremiers.reduce((a, b) => a + b) / cinqPremiers.length) : null;
  const scoreMoyenRecent = cinqDerniers.length >= 2 ? Math.round(cinqDerniers.reduce((a, b) => a + b) / cinqDerniers.length) : null;
  const gainDepuisDebut  = scoreMoyenDebut !== null && scoreMoyenRecent !== null ? scoreMoyenRecent - scoreMoyenDebut : null;

  // ── Check-ins ────────────────────────────────────────────────────────────
  const checkIns14j = eleve.checkIns.slice(0, 14).reverse();
  const nPositif = checkIns14j.filter((c) => ETAT_CONFIG[c.etat]?.isPositive).length;
  const nNegatif = checkIns14j.filter((c) => !ETAT_CONFIG[c.etat]?.isPositive).length;
  const pctPositif = checkIns14j.length > 0 ? Math.round((nPositif / checkIns14j.length) * 100) : null;

  // ── Santé globale ────────────────────────────────────────────────────────
  const sante = (() => {
    if (scoreMoyen === null) return null;
    const sessionOk = semCourante.count >= 3;
    const scoreOk = scoreMoyen >= 70;
    const emotionOk = checkIns14j.length === 0 || nNegatif < 3;
    const trend = gainDepuisDebut !== null && gainDepuisDebut > 0;
    if (scoreOk && sessionOk && emotionOk && trend)
      return { label: "En bonne progression", icon: "🟢", color: "text-[var(--color-success)]", bg: "bg-[rgba(42,124,111,0.07)] border-[rgba(42,124,111,0.25)]" };
    if (!emotionOk || nNegatif >= 3)
      return { label: "À surveiller émotionnellement", icon: "🟠", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
    if (!scoreOk)
      return { label: "Des notions à renforcer", icon: "🔴", color: "text-[var(--color-accent)]", bg: "bg-[rgba(217,79,43,0.06)] border-[rgba(217,79,43,0.2)]" };
    return { label: "Progression stable", icon: "🔵", color: "text-[var(--color-purple)]", bg: "bg-[rgba(91,79,207,0.06)] border-[rgba(91,79,207,0.2)]" };
  })();

  // ── Matières : plus forte / plus faible ──────────────────────────────────
  const matieresSorted = [...eleve.niveauxMatieres].sort((a, b) => b.scoreGlobal - a.scoreGlobal);
  const matiereForte  = matieresSorted[0];
  const matiereFailble = matieresSorted[matieresSorted.length - 1];

  // ── Insights auto-générés pour les parents ────────────────────────────────
  const insights: Array<{ emoji: string; titre: string; texte: string; type: "bon" | "info" | "alerte" }> = [];

  if (gainDepuisDebut !== null && gainDepuisDebut >= 5) {
    insights.push({
      emoji: "📈", type: "bon",
      titre: `+${gainDepuisDebut} points depuis le début`,
      texte: `${eleve.prenom} a progressé de ${gainDepuisDebut} points en score moyen depuis ses premiers exercices. Une belle trajectoire à maintenir !`,
    });
  }
  if (eleve.streakJours >= 5) {
    insights.push({
      emoji: "🔥", type: "bon",
      titre: `${eleve.streakJours} jours consécutifs`,
      texte: `${eleve.prenom} pratique depuis ${eleve.streakJours} jours d'affilée. La régularité est la clé de la réussite scolaire.`,
    });
  }
  if (matiereFailble && matiereFailble.scoreGlobal < 60) {
    insights.push({
      emoji: "⚠️", type: "alerte",
      titre: `${MATIERE_LABEL[matiereFailble.matiere]} à renforcer`,
      texte: `${eleve.prenom} est à ${Math.round(matiereFailble.scoreGlobal)}% en ${MATIERE_LABEL[matiereFailble.matiere]}. C'est la matière qui mérite le plus d'attention en ce moment.`,
    });
  }
  if (semCourante.count === 0 && semPrecedente.count > 0) {
    insights.push({
      emoji: "💡", type: "info",
      titre: "Pas de session cette semaine",
      texte: `${eleve.prenom} n'a pas encore pratiqué cette semaine. Même 10 minutes par jour font une grande différence.`,
    });
  }
  if (nNegatif >= 3) {
    insights.push({
      emoji: "🤗", type: "alerte",
      titre: "Humeur difficile récemment",
      texte: `${eleve.prenom} a exprimé ${nNegatif} états difficiles ces 14 derniers jours. Un moment de discussion peut faire beaucoup.`,
    });
  }

  // ── Plan actif ────────────────────────────────────────────────────────────
  const planActif = eleve.planActions[0];
  const objectifsAtteints = planActif?.objectifs.filter((o) => o.atteint).length ?? 0;
  const objectifsTotal    = planActif?.objectifs.length ?? 0;

  return (
    <div className="space-y-6">

      {/* ─── 1. HERO : En-tête enfant + santé globale ─── */}
      <div className="rounded-2xl border border-[var(--color-rule)] bg-white overflow-hidden">
        <div className="bg-[var(--color-ink)] px-5 py-4 flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white">
            {eleve.prenom.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white leading-tight">{eleve.prenom} {eleve.nom}</h2>
            <p className="text-sm text-white/60">
              {NIVEAUX_LABELS[eleve.niveauScolaire] ?? eleve.niveauScolaire}
              {eleve.ecole ? ` · ${eleve.ecole}` : ""}
            </p>
          </div>
          {sante && (
            <div className={`flex-shrink-0 hidden sm:flex items-center gap-2 rounded-xl border px-3 py-1.5 ${sante.bg}`}>
              <span className="text-sm">{sante.icon}</span>
              <span className={`text-xs font-bold ${sante.color}`}>{sante.label}</span>
            </div>
          )}
        </div>

        {/* Résumé express */}
        <div className="px-5 py-4 flex items-center gap-3 flex-wrap">
          {gainDepuisDebut !== null && (
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-black ${gainDepuisDebut >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                {gainDepuisDebut >= 0 ? "↑" : "↓"} {Math.abs(gainDepuisDebut)} pts
              </span>
              <span className="text-xs text-[var(--color-ink-soft)]">depuis le début</span>
            </div>
          )}
          {gainDepuisDebut !== null && <span className="text-[var(--color-rule)]">·</span>}
          {scoreMoyen !== null && (
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-black ${scoreMoyen >= 80 ? "text-[var(--color-success)]" : scoreMoyen >= 60 ? "text-amber-600" : "text-[var(--color-accent)]"}`}>
                {scoreMoyen}%
              </span>
              <span className="text-xs text-[var(--color-ink-soft)]">de score moyen</span>
            </div>
          )}
          {scoreMoyen !== null && <span className="text-[var(--color-rule)]">·</span>}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-[var(--color-ink)]">{eleve.sessions.length}</span>
            <span className="text-xs text-[var(--color-ink-soft)]">sessions au total</span>
          </div>
          <div className="ml-auto">
            <Link
              href={`/parent/accompagnement/${eleve.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] hover:bg-white transition-colors"
            >
              🗺️ Plan d&apos;accompagnement
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. KPI STRIP ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Sessions */}
        <KpiCard
          icon="📅"
          label="Sessions / semaine"
          value={String(semCourante.count)}
          trend={semPrecedente.count > 0
            ? { delta: semCourante.count - semPrecedente.count, suffix: `vs ${semPrecedente.count}` }
            : undefined}
          color={semCourante.count >= 4 ? "success" : semCourante.count >= 2 ? "gold" : "neutral"}
          sparkline={sessionsParSemaine.map((s) => s.count)}
          sparkMax={maxSessions}
        />
        {/* Score */}
        <KpiCard
          icon={scoreMoyen !== null ? (scoreMoyen >= 80 ? "🌟" : scoreMoyen >= 60 ? "👍" : "💪") : "📊"}
          label="Score moyen"
          value={scoreMoyen !== null ? `${scoreMoyen}%` : "—"}
          trend={gainDepuisDebut !== null ? { delta: gainDepuisDebut, suffix: "depuis début" } : undefined}
          color={scoreMoyen !== null ? (scoreMoyen >= 80 ? "success" : scoreMoyen >= 60 ? "gold" : "accent") : "neutral"}
        />
        {/* Streak */}
        <KpiCard
          icon="🔥"
          label="Jours consécutifs"
          value={`${eleve.streakJours}j`}
          sub={eleve.badges.length > 0 ? `${eleve.badges.length} badge${eleve.badges.length > 1 ? "s" : ""}` : "Encouragez-le !"}
          color={eleve.streakJours >= 5 ? "success" : eleve.streakJours >= 2 ? "gold" : "neutral"}
        />
        {/* Humeur */}
        <KpiCard
          icon={pctPositif !== null ? (pctPositif >= 60 ? "😊" : pctPositif >= 30 ? "😐" : "😔") : "❓"}
          label="Humeur 14 jours"
          value={pctPositif !== null ? `${pctPositif}%` : "—"}
          sub={checkIns14j.length > 0 ? `${checkIns14j.length} check-in${checkIns14j.length > 1 ? "s" : ""}` : "Aucun encore"}
          color={pctPositif !== null ? (pctPositif >= 60 ? "success" : pctPositif >= 30 ? "gold" : "accent") : "neutral"}
        />
      </div>

      {/* ─── 3. INSIGHTS PARENTS ─── */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            💡 Ce que vous devez savoir
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.map((ins, i) => {
              const colorMap = {
                bon:    "border-[rgba(42,124,111,0.3)]  bg-[rgba(42,124,111,0.05)]  text-[var(--color-success)]",
                info:   "border-[rgba(91,79,207,0.25)]  bg-[rgba(91,79,207,0.04)]   text-[var(--color-purple)]",
                alerte: "border-[rgba(217,79,43,0.3)]   bg-[rgba(217,79,43,0.05)]   text-[var(--color-accent)]",
              };
              return (
                <div key={i} className={`rounded-2xl border p-4 ${colorMap[ins.type]}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{ins.emoji}</span>
                    <div>
                      <p className="text-sm font-bold mb-0.5">{ins.titre}</p>
                      <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">{ins.texte}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 4. PROGRESSION PAR MATIÈRE ─── */}
      {eleve.niveauxMatieres.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            📚 Progression par matière
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...eleve.niveauxMatieres]
              .sort((a, b) => b.scoreGlobal - a.scoreGlobal)
              .map((nm) => {
                const score = Math.round(nm.scoreGlobal);
                const isFort  = score >= 80;
                const isOk    = score >= 60;
                const statusLabel = isFort ? "En forme ✓" : isOk ? "À consolider" : "À renforcer";
                const statusColor = isFort ? "text-[var(--color-success)]" : isOk ? "text-amber-600" : "text-[var(--color-accent)]";
                const barColor    = isFort ? "var(--color-success)" : isOk ? "var(--color-gold)" : "var(--color-accent)";
                const bgColor     = isFort ? "rgba(42,124,111,0.06)" : isOk ? "rgba(201,149,42,0.06)" : "rgba(217,79,43,0.05)";
                const borderColor = isFort ? "rgba(42,124,111,0.2)" : isOk ? "rgba(201,149,42,0.2)" : "rgba(217,79,43,0.2)";

                return (
                  <div
                    key={nm.id}
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: bgColor, borderColor }}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-2xl">{MATIERE_EMOJI[nm.matiere] ?? "📚"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--color-ink)] truncate">
                          {MATIERE_LABEL[nm.matiere] ?? nm.matiere}
                        </p>
                        <p className={`text-[11px] font-semibold ${statusColor}`}>{statusLabel}</p>
                      </div>
                      <span className="text-xl font-black" style={{ color: barColor }}>
                        {score}%
                      </span>
                    </div>

                    {/* Barre */}
                    <div className="h-2.5 w-full rounded-full bg-white/60 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, backgroundColor: barColor }}
                      />
                    </div>

                    {/* Lacunes */}
                    {nm.lacunes.slice(0, 2).map((lac, li) => (
                      <p key={li} className="text-[10px] text-[var(--color-accent)] flex items-start gap-1 leading-tight mt-1">
                        <span className="flex-shrink-0">⚠</span>
                        <span className="truncate">{lac}</span>
                      </p>
                    ))}
                    {nm.lacunes.length > 2 && (
                      <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5">
                        +{nm.lacunes.length - 2} autre{nm.lacunes.length - 2 > 1 ? "s" : ""} lacune{nm.lacunes.length - 2 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ─── 5. GRAPHIQUE ÉVOLUTION (ligne SVG) + SESSIONS ─── */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Ligne d'évolution */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
                Évolution du score
              </p>
              <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">8 dernières semaines</p>
            </div>
            {scoreMoyenDebut !== null && scoreMoyenRecent !== null && (
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-[var(--color-paper-warm)]">
                <span className={`text-xs font-black ${gainDepuisDebut! >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                  {gainDepuisDebut! >= 0 ? "↑" : "↓"} {Math.abs(gainDepuisDebut!)} pts
                </span>
              </div>
            )}
          </div>

          <LineChart data={scoresParSemaine} />

          {scoreMoyenDebut !== null && scoreMoyenRecent !== null && (
            <div className="flex justify-between mt-3 text-[11px] text-[var(--color-ink-soft)]">
              <span>Début · <strong className="text-[var(--color-ink)]">{scoreMoyenDebut}%</strong></span>
              <span>Récent · <strong className="text-[var(--color-ink)]">{scoreMoyenRecent}%</strong></span>
            </div>
          )}
        </Card>

        {/* Sessions par semaine */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
                Sessions par semaine
              </p>
              <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">8 dernières semaines</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-[var(--color-ink)]">{semCourante.count}</p>
              <p className="text-[10px] text-[var(--color-ink-soft)]">cette semaine</p>
            </div>
          </div>

          <div className="flex items-end gap-1.5 h-28">
            {sessionsParSemaine.map((sem, i) => {
              const isCurrent = i === 7;
              const pct = maxSessions > 0 ? (sem.count / maxSessions) * 100 : 0;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  {sem.count > 0 && (
                    <span className="text-[10px] font-bold text-[var(--color-ink-soft)]">{sem.count}</span>
                  )}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: sem.count === 0 ? "3px" : `${Math.max(pct, 8)}%`,
                        backgroundColor: isCurrent
                          ? "var(--color-purple)"
                          : sem.count === 0
                          ? "var(--color-rule)"
                          : "rgba(91,79,207,0.25)",
                        borderRadius: "4px 4px 0 0",
                      }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold ${isCurrent ? "text-[var(--color-purple)]" : "text-[var(--color-ink-soft)]"}`}>
                    {sem.label}
                  </span>
                </div>
              );
            })}
          </div>

          {semCourante.reussite !== null && (
            <div className="mt-3 rounded-xl bg-[var(--color-paper-warm)] px-3 py-2 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">
                Taux de réussite cette semaine ·{" "}
                <strong className={semCourante.reussite >= 70 ? "text-[var(--color-success)]" : "text-amber-600"}>
                  {semCourante.reussite}%
                </strong>
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ─── 6. ÉTAT ÉMOTIONNEL ─── */}
      {checkIns14j.length > 0 && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
                État émotionnel
              </p>
              <p className="text-[11px] text-[var(--color-ink-soft)] mt-0.5">
                {checkIns14j.length} check-in{checkIns14j.length > 1 ? "s" : ""} sur 14 jours
              </p>
            </div>
            {pctPositif !== null && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 flex items-center justify-center rounded-full text-lg">
                  {pctPositif >= 60 ? "😊" : pctPositif >= 30 ? "😐" : "😔"}
                </div>
                <div>
                  <p className={`text-sm font-black ${pctPositif >= 60 ? "text-[var(--color-success)]" : pctPositif >= 30 ? "text-amber-600" : "text-[var(--color-accent)]"}`}>
                    {pctPositif}% positif
                  </p>
                  <p className="text-[10px] text-[var(--color-ink-soft)]">{nNegatif} difficile{nNegatif > 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>

          {/* Grille calendrier */}
          <div className="flex flex-wrap gap-2">
            {checkIns14j.map((c, i) => {
              const cfg = ETAT_CONFIG[c.etat];
              const isPos = cfg?.isPositive ?? true;
              return (
                <div
                  key={i}
                  title={`${cfg?.label ?? c.etat} — ${new Date(c.date).toLocaleDateString("fr-CA")}`}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 cursor-default transition-transform hover:scale-105 ${
                    isPos ? "bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)]" : "bg-[rgba(217,79,43,0.07)] border border-[rgba(217,79,43,0.2)]"
                  }`}
                >
                  <span className="text-xl">{cfg?.emoji ?? "❓"}</span>
                  <span className="text-[9px] font-semibold text-[var(--color-ink-soft)]">
                    {new Date(c.date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>

          {nNegatif >= 3 && (
            <div className="mt-4 rounded-xl bg-[rgba(217,79,43,0.06)] border border-[rgba(217,79,43,0.2)] px-4 py-3 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">🤗</span>
              <div>
                <p className="text-xs font-bold text-[var(--color-accent)] mb-0.5">
                  Plusieurs humeurs difficiles détectées
                </p>
                <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                  Un moment de discussion informelle avec {eleve.prenom} peut beaucoup aider. Le plan d'accompagnement contient des pistes concrètes.
                </p>
                <Link
                  href={`/parent/accompagnement/${eleve.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-[var(--color-accent)] hover:underline"
                >
                  Voir le plan d'accompagnement →
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── 7. PLAN D'ACTION (si actif) ─── */}
      {planActif && (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
              Plan d'action actif
            </p>
            <span className="text-xs font-bold text-[var(--color-success)]">
              {objectifsAtteints}/{objectifsTotal} objectifs atteints
            </span>
          </div>
          <p className="text-sm font-bold text-[var(--color-ink)] mb-3">{planActif.titre}</p>
          <div className="h-2.5 rounded-full bg-[var(--color-paper-warm)] overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-[var(--color-success)] transition-all"
              style={{ width: objectifsTotal > 0 ? `${(objectifsAtteints / objectifsTotal) * 100}%` : "0%" }}
            />
          </div>
          <div className="space-y-2">
            {planActif.objectifs.map((obj) => (
              <div key={obj.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs ${
                obj.atteint
                  ? "bg-[rgba(42,124,111,0.07)] border border-[rgba(42,124,111,0.2)]"
                  : "bg-[var(--color-paper-warm)] border border-[var(--color-rule)]"
              }`}>
                <span className={`flex-shrink-0 font-black text-sm ${obj.atteint ? "text-[var(--color-success)]" : "text-[var(--color-ink-soft)]"}`}>
                  {obj.atteint ? "✓" : "○"}
                </span>
                <span className={obj.atteint ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"}>
                  {obj.titre}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── 8. BADGES ─── */}
      {eleve.badges.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            🏅 Badges débloqués ({eleve.badges.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {eleve.badges.map((b) => (
              <div
                key={b.id}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-[rgba(201,149,42,0.07)] border border-[rgba(201,149,42,0.25)] px-4 py-3 min-w-[80px]"
              >
                <span className="text-3xl">{b.badge.icone}</span>
                <span className="text-xs font-semibold text-[var(--color-ink)] text-center max-w-[90px] leading-tight">
                  {b.badge.titre}
                </span>
                <span className="text-[10px] text-[var(--color-ink-soft)]">
                  {new Date(b.date).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 9. CE QUE DIT L'ENFANT ─── */}
      {(eleve.commentairesEleve as { id: string; type: string; contenu: string; matieres: string[]; createdAt: Date }[]).length > 0 && (
        <Card className="p-5 border-[rgba(91,79,207,0.2)] bg-[rgba(91,79,207,0.02)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💬</span>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-purple)]">
              Ce que {eleve.prenom} dit lui-même
            </p>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] mb-4">
            Messages envoyés par {eleve.prenom} à son IA — difficultés, objectifs, questions.
          </p>
          <div className="space-y-3">
            {(eleve.commentairesEleve as { id: string; type: string; contenu: string; matieres: string[]; createdAt: Date }[]).map((c) => {
              const typeMap: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
                DIFFICULTE:        { emoji: "😓", label: "Difficulté",       color: "text-[var(--color-accent)]",  bg: "bg-[rgba(217,79,43,0.06)] border-[rgba(217,79,43,0.2)]"   },
                OBJECTIF_MAITRISE: { emoji: "🎯", label: "Veut maîtriser",   color: "text-[var(--color-purple)]",  bg: "bg-[rgba(91,79,207,0.06)] border-[rgba(91,79,207,0.2)]"   },
                QUESTION:          { emoji: "🤔", label: "Question posée",   color: "text-amber-600",              bg: "bg-amber-50 border-amber-200"                             },
                AUTRE:             { emoji: "💬", label: "Note",             color: "text-[var(--color-ink-soft)]",bg: "bg-[var(--color-paper-warm)] border-[var(--color-rule)]"   },
              };
              const cfg = typeMap[c.type] ?? typeMap.AUTRE;
              return (
                <div key={c.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
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
        </Card>
      )}

      {/* ─── 10. EXERCICES RÉCENTS ─── */}
      {eleve.exercicesAssignes.length > 0 && (
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] mb-4">
            Derniers exercices complétés
          </p>
          <div className="divide-y divide-[var(--color-rule)]">
            {eleve.exercicesAssignes.slice(0, 12).map((ex) => {
              const score = ex.score !== null ? Math.round(ex.score) : null;
              const isBon  = score !== null && score >= 80;
              const isOk   = score !== null && score >= 60 && score < 80;
              const isFail = score !== null && score < 60;
              return (
                <div key={ex.id} className="flex items-center gap-3 py-3">
                  {/* Indicateur score */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${
                    isBon ? "bg-[rgba(42,124,111,0.1)] text-[var(--color-success)]"
                    : isOk ? "bg-amber-50 text-amber-600"
                    : isFail ? "bg-[rgba(217,79,43,0.08)] text-[var(--color-accent)]"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]"
                  }`}>
                    {score !== null ? `${score}` : "—"}
                  </div>
                  {/* Titre + matière */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-ink)] truncate leading-tight">
                      {ex.exercice.titre}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[var(--color-ink-soft)]">
                        {MATIERE_EMOJI[ex.exercice.matiere] ?? "📚"} {MATIERE_LABEL[ex.exercice.matiere] ?? ex.exercice.matiere}
                      </span>
                    </div>
                  </div>
                  {/* Date */}
                  <span className="text-[10px] text-[var(--color-ink-soft)] flex-shrink-0">
                    {ex.dateFin
                      ? new Date(ex.dateFin).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Composant KPI Card ─────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, trend, sub, color, sparkline, sparkMax,
}: {
  icon: string;
  label: string;
  value: string;
  trend?: { delta: number; suffix: string };
  sub?: string;
  color: "success" | "gold" | "accent" | "purple" | "neutral";
  sparkline?: number[];
  sparkMax?: number;
}) {
  const bgMap = {
    success: "bg-[rgba(42,124,111,0.05)]",
    gold:    "bg-[rgba(201,149,42,0.05)]",
    accent:  "bg-[rgba(217,79,43,0.05)]",
    purple:  "bg-[rgba(91,79,207,0.05)]",
    neutral: "bg-[var(--color-paper-warm)]",
  };
  const valColorMap = {
    success: "text-[var(--color-success)]",
    gold:    "text-amber-600",
    accent:  "text-[var(--color-accent)]",
    purple:  "text-[var(--color-purple)]",
    neutral: "text-[var(--color-ink)]",
  };

  return (
    <div className={`rounded-2xl border border-[var(--color-rule)] p-4 ${bgMap[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{icon}</span>
        {sparkline && sparkMax && (
          <div className="flex items-end gap-0.5 h-6">
            {sparkline.map((v, i) => (
              <div
                key={i}
                className="w-1.5 rounded-sm"
                style={{
                  height: v === 0 ? "2px" : `${Math.max((v / sparkMax) * 100, 15)}%`,
                  backgroundColor: i === sparkline.length - 1 ? "var(--color-purple)" : "rgba(91,79,207,0.25)",
                }}
              />
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-[var(--color-ink-soft)] mb-0.5 leading-tight">{label}</p>
      <p className={`text-2xl font-black leading-none ${valColorMap[color]}`}>{value}</p>
      {trend && (
        <p className={`text-[11px] font-semibold mt-1 ${trend.delta > 0 ? "text-[var(--color-success)]" : trend.delta < 0 ? "text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"}`}>
          {trend.delta > 0 ? "↑" : trend.delta < 0 ? "↓" : "="} {Math.abs(trend.delta)} {trend.suffix}
        </p>
      )}
      {!trend && sub && (
        <p className="text-[11px] text-[var(--color-ink-soft)] mt-1 truncate">{sub}</p>
      )}
    </div>
  );
}

// ── Graphique ligne SVG ────────────────────────────────────────────────────────

function LineChart({ data }: { data: Array<{ label: string; score: number | null; count: number }> }) {
  const W = 300;
  const H = 100;
  const PAD = { top: 10, right: 8, bottom: 20, left: 24 };

  const valid = data.filter((d) => d.score !== null);
  if (valid.length < 2) {
    return (
      <div className="h-28 flex items-center justify-center">
        <p className="text-xs text-[var(--color-ink-soft)]">Pas encore assez de données.</p>
      </div>
    );
  }

  const scores = data.map((d) => d.score ?? 0);
  const minScore = Math.max(0,  Math.min(...valid.map((d) => d.score!)) - 10);
  const maxScore = Math.min(100, Math.max(...valid.map((d) => d.score!)) + 10);
  const range = maxScore - minScore || 20;

  const xStep = (W - PAD.left - PAD.right) / (data.length - 1);
  const yScale = (v: number) => PAD.top + (H - PAD.top - PAD.bottom) * (1 - (v - minScore) / range);

  // Points valides pour la polyline
  const points = data.map((d, i) => ({
    x: PAD.left + i * xStep,
    y: d.score !== null ? yScale(d.score) : null,
  }));

  // Construire le path : sauter les null
  let pathD = "";
  let area = "";
  let lastX = PAD.left;
  let lastY = H - PAD.bottom;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.y === null) continue;
    if (pathD === "") {
      pathD = `M ${p.x} ${p.y}`;
      area  = `M ${p.x} ${H - PAD.bottom} L ${p.x} ${p.y}`;
    } else {
      // Bezier doux
      const prev = points.slice(0, i).reverse().find((pp) => pp.y !== null);
      if (prev) {
        const cx1 = prev.x + (p.x - prev.x) / 2;
        const cx2 = prev.x + (p.x - prev.x) / 2;
        pathD += ` C ${cx1} ${prev.y} ${cx2} ${p.y} ${p.x} ${p.y}`;
        area  += ` C ${cx1} ${prev.y} ${cx2} ${p.y} ${p.x} ${p.y}`;
      }
    }
    lastX = p.x;
    lastY = p.y;
  }
  area += ` L ${lastX} ${H - PAD.bottom} Z`;

  // Labels Y
  const yLabels = [minScore, Math.round((minScore + maxScore) / 2), maxScore];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--color-purple)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-purple)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grille horizontale */}
      {yLabels.map((v, i) => {
        const y = yScale(v);
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
              stroke="var(--color-rule)" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={PAD.left - 2} y={y + 3.5} fontSize="7" fill="var(--color-ink-soft)" textAnchor="end">
              {v}%
            </text>
          </g>
        );
      })}

      {/* Aire sous la courbe */}
      {area && <path d={area} fill="url(#lineGrad)" />}

      {/* Ligne */}
      {pathD && (
        <path d={pathD} fill="none" stroke="var(--color-purple)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Points */}
      {points.map((p, i) => {
        if (p.y === null) return null;
        const isLast = i === points.length - 1 || (i < points.length - 1 && points.slice(i + 1).every((pp) => pp.y === null));
        return (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={isLast ? 3.5 : 2.5}
            fill={isLast ? "var(--color-purple)" : "white"}
            stroke="var(--color-purple)"
            strokeWidth="1.5"
          />
        );
      })}

      {/* Labels X */}
      {data.map((d, i) => (
        <text
          key={i}
          x={PAD.left + i * xStep}
          y={H - 3}
          fontSize="7"
          fill={i === data.length - 1 ? "var(--color-purple)" : "var(--color-ink-soft)"}
          textAnchor="middle"
          fontWeight={i === data.length - 1 ? "700" : "400"}
        >
          {d.label}
        </text>
      ))}

      {/* Valeurs sur les points */}
      {points.map((p, i) => {
        if (p.y === null || (i !== 0 && i !== points.length - 1 && scores[i] === scores[i - 1])) return null;
        if (p.y === null) return null;
        return (
          <text
            key={`v${i}`}
            x={p.x} y={p.y - 6}
            fontSize="7.5" fontWeight="700"
            fill="var(--color-purple)"
            textAnchor="middle"
          >
            {data[i].score}%
          </text>
        );
      })}
    </svg>
  );
}
