export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavEleve } from "@/components/layout/nav-eleve";
import { Card } from "@/components/ui/card";
import { MiraPlanBtn } from "@/components/mira/mira-plan-btn";
import Link from "next/link";

// ── Labels & couleurs ──────────────────────────────────────────────────────────

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ETHIQUE: "🤝",
  ANGLAIS: "🇨🇦", EDUCATION_PHYSIQUE: "⚽",
};

// Couleurs par matière pour les cellules Gantt
const MATIERES_CELL: Record<string, { bg: string; dot: string }> = {
  MATHEMATIQUES:    { bg: "rgba(91,79,207,0.18)",  dot: "#5b4fcf" },
  FRANCAIS:         { bg: "rgba(42,124,111,0.18)", dot: "#2a7c6f" },
  SCIENCES:         { bg: "rgba(59,130,246,0.18)", dot: "#3b82f6" },
  UNIVERS_SOCIAL:   { bg: "rgba(249,115,22,0.18)", dot: "#f97316" },
  ARTS:             { bg: "rgba(236,72,153,0.18)", dot: "#ec4899" },
  ANGLAIS:          { bg: "rgba(20,184,166,0.18)", dot: "#14b8a6" },
  ETHIQUE:          { bg: "rgba(168,85,247,0.18)", dot: "#a855f7" },
  EDUCATION_PHYSIQUE:{ bg: "rgba(34,197,94,0.18)", dot: "#22c55e" },
};

const PRIORITE_CONFIG = {
  URGENT:    { label: "Urgent",    badge: "bg-red-50 border-red-200 text-red-700",        bar: "bg-red-400" },
  IMPORTANT: { label: "Important", badge: "bg-amber-50 border-amber-200 text-amber-700",  bar: "bg-amber-400" },
  PLUS_TARD: { label: "Plus tard", badge: "bg-blue-50 border-blue-200 text-blue-700",     bar: "bg-blue-300" },
  MAITRISE:  { label: "Maîtrisé",  badge: "bg-green-50 border-green-200 text-green-700",  bar: "bg-green-400" },
};

// Durée estimée par priorité (minutes) — alimente le bin-packing
const DUREE_NOTION: Record<string, number> = { URGENT: 90, IMPORTANT: 60, PLUS_TARD: 30, MAITRISE: 0 };

// ── Jours ─────────────────────────────────────────────────────────────────────

const JOURS_ORDRE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
type JourKey = typeof JOURS_ORDRE[number];

const JOURS_COURTS: Record<JourKey, string> = {
  lundi: "Lu", mardi: "Ma", mercredi: "Me",
  jeudi: "Je", vendredi: "Ve", samedi: "Sa", dimanche: "Di",
};
const JOURS_COMPLETS: Record<JourKey, string> = {
  lundi: "Lundi", mardi: "Mardi", mercredi: "Mercredi",
  jeudi: "Jeudi", vendredi: "Vendredi", samedi: "Samedi", dimanche: "Dimanche",
};
const JOUR_INDEX: Record<number, JourKey> = {
  1: "lundi", 2: "mardi", 3: "mercredi", 4: "jeudi",
  5: "vendredi", 6: "samedi", 0: "dimanche",
};

// ── Helpers date ──────────────────────────────────────────────────────────────

function getSemaineISO(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getLundiDeISO(isoWeek: string): Date {
  const [year, week] = isoWeek.split("-W").map(Number);
  const jan4 = new Date(year, 0, 4);
  const lundi = new Date(jan4);
  lundi.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (week - 1) * 7);
  lundi.setHours(0, 0, 0, 0);
  return lundi;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function formatDateRange(lundi: Date): string {
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);
  const optsD: Intl.DateTimeFormatOptions = { day: "numeric" };
  const optsM: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (lundi.getMonth() === dimanche.getMonth()) {
    return `${lundi.getDate()}–${dimanche.toLocaleDateString("fr-CA", optsM)}`;
  }
  return `${lundi.toLocaleDateString("fr-CA", optsM)} – ${dimanche.toLocaleDateString("fr-CA", optsM)}`;
}

function formatJourDate(date: Date): string {
  return date.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
}

function getMoisKey(date: Date): string {
  return date.toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
}

// ── Algorithme d'assignation jour par jour ────────────────────────────────────
// Pour chaque notion dans une semaine, retourne les jours où elle est travaillée.
// Principe : bin-packing glouton sur les jours disponibles.

function assignerJoursParNotion(
  notions: Array<{ id: string; priorite: string }>,
  dispoMap: Record<string, number>,
): Record<string, JourKey[]> {
  // Construire la liste ordonnée des jours avec leurs minutes
  const jours = JOURS_ORDRE
    .map((key) => ({ key, mins: dispoMap[key] ?? 0 }))
    .filter((j) => j.mins > 0);

  if (jours.length === 0) return {};

  let dayIdx = 0;
  let minRestants = jours[0].mins;
  const result: Record<string, JourKey[]> = {};

  for (const notion of notions) {
    let restant = DUREE_NOTION[notion.priorite] ?? 60;
    const joursOccupes = new Set<JourKey>();

    while (restant > 0 && dayIdx < jours.length) {
      const consomme = Math.min(restant, minRestants);
      joursOccupes.add(jours[dayIdx].key);
      restant -= consomme;
      minRestants -= consomme;
      if (minRestants <= 0) {
        dayIdx++;
        if (dayIdx < jours.length) minRestants = jours[dayIdx].mins;
      }
    }

    result[notion.id] = [...joursOccupes];
  }
  return result;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PlanPage() {
  await requireRole(["ELEVE"]);

  const [{ profil }, planDuJour, planifNotions, dispo] = await Promise.all([
    api.eleve.getDashboard(),
    api.plan.getPlanDuJour(),
    api.plan.getPlanifNotions(),
    api.plan.getDisponibilite(),
  ]);

  if (!profil) return null;

  const { objectifs, minutesDispo, aUnPlan } = planDuJour;
  const dispoMap = dispo as Record<string, number>;

  // Capacité hebdomadaire (pour recalcul auto des semaineDebut nulles)
  const capaciteSemaine = Math.max(
    JOURS_ORDRE.reduce((s, j) => s + (dispoMap[j] ?? 0), 0),
    30,
  );

  // Notions actives triées
  const notionsOrdered = [...planifNotions]
    .filter((n) => n.priorite !== "MAITRISE" && !n.maitrisee)
    .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  const notionsMaitrisees = planifNotions.filter((n) => n.maitrisee || n.priorite === "MAITRISE");
  const notionActive = notionsOrdered[0] ?? null;
  const now = new Date();
  const semaineActuelle = getSemaineISO(now);
  const jourAujourdhui = JOUR_INDEX[now.getDay()];

  // Auto-compléter semaineDebut null (données legacy ou plan non recalculé)
  let semAutoIdx = 0;
  let minsAutoSemaine = 0;
  const notionsAvecSemaine = notionsOrdered.map((n) => {
    if (n.semaineDebut) return n;
    const duree = DUREE_NOTION[n.priorite] ?? 60;
    if (minsAutoSemaine + duree > capaciteSemaine && minsAutoSemaine > 0) {
      semAutoIdx++;
      minsAutoSemaine = 0;
    }
    minsAutoSemaine += duree;
    return { ...n, semaineDebut: getSemaineISO(addWeeks(now, semAutoIdx)) };
  });

  // Grouper par semaine (clé ISO triée)
  const parSemaine: Record<string, typeof notionsAvecSemaine> = {};
  for (const n of notionsAvecSemaine) {
    const sem = n.semaineDebut!;
    if (!parSemaine[sem]) parSemaine[sem] = [];
    parSemaine[sem].push(n);
  }
  const semainesTri = Object.keys(parSemaine).sort();

  // Grouper par mois (pour le strip)
  const parMois: Record<string, { total: number; maitrisees: number; isoWeeks: string[] }> = {};
  for (const sem of semainesTri) {
    const lundi = getLundiDeISO(sem);
    const moisKey = getMoisKey(lundi);
    if (!parMois[moisKey]) parMois[moisKey] = { total: 0, maitrisees: 0, isoWeeks: [] };
    parMois[moisKey].total += parSemaine[sem].length;
    parMois[moisKey].isoWeeks.push(sem);
  }
  // Ajouter les maîtrisées dans le mois en cours (pour progression exacte)
  notionsMaitrisees.forEach((n) => {
    const moisKey = getMoisKey(now);
    if (parMois[moisKey]) parMois[moisKey].maitrisees++;
  });

  const moisActuel = getMoisKey(now);
  const totalNotions = notionsOrdered.length + notionsMaitrisees.length;
  const nbSemaines = semainesTri.length;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} />

      <main className="mx-auto max-w-3xl px-4 py-8">

        {/* ── En-tête ── */}
        <div className="mb-6">
          <Link href="/eleve" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            ← Tableau de bord
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-[var(--color-ink)]">🗺️ Mon plan de réussite</h1>
              {aUnPlan && notionsOrdered.length > 0 && (
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                  {notionsOrdered.length} notion{notionsOrdered.length > 1 ? "s" : ""} sur {nbSemaines} semaine{nbSemaines > 1 ? "s" : ""} · ~{capaciteSemaine} min/sem
                </p>
              )}
            </div>
            <Link
              href="/eleve/plan/configurer"
              className="flex-shrink-0 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              {aUnPlan ? "✏️ Modifier" : "🚀 Créer mon plan"}
            </Link>
          </div>
        </div>

        {!aUnPlan ? (
          /* ── État vide ── */
          <Card className="p-10 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">Crée ton plan de réussite</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 max-w-sm mx-auto leading-relaxed">
              Choisis tes notions prioritaires. L'application les planifie semaine par semaine —
              tu maîtrises une notion, tu passes à la suivante.
            </p>
            <div className="grid grid-cols-3 gap-3 my-6 max-w-xs mx-auto">
              {[
                { emoji: "🎯", label: "Objectifs de note" },
                { emoji: "⏰", label: "Ton temps dispo" },
                { emoji: "📚", label: "Notions urgentes" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
                  <div className="text-2xl mb-1">{item.emoji}</div>
                  <p className="text-[10px] font-semibold text-[var(--color-ink-soft)]">{item.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/eleve/plan/configurer"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              Créer mon plan en 3 min 🚀
            </Link>
          </Card>
        ) : (
          <>
            {/* ── Banner : objectifs définis mais aucune notion ── */}
            {notionsOrdered.length === 0 && objectifs.length > 0 && (
              <Card className="mb-6 p-5 border-[rgba(201,149,42,0.35)] bg-[rgba(201,149,42,0.06)]">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📚</span>
                  <div className="flex-1">
                    <p className="font-black text-[var(--color-ink)] mb-1">Il manque tes notions à travailler !</p>
                    <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-3">
                      Tu as défini tes objectifs, mais tu n'as pas encore choisi les notions à maîtriser.
                      C'est l'étape 3 du wizard — c'est là que le plan prend vie semaine par semaine.
                    </p>
                    <Link
                      href="/eleve/plan/configurer?section=notions"
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      📚 Choisir mes notions →
                    </Link>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Hero : Aujourd'hui ── */}
            {notionActive && (
              <section className="mb-6">
                <Card className="overflow-hidden border-[rgba(91,79,207,0.3)] shadow-sm">
                  {/* Header sombre */}
                  <div className="bg-[var(--color-ink)] px-5 py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-0.5">
                        📍 Aujourd'hui · {formatJourDate(now)}
                      </p>
                      <p className="text-sm font-black text-white">
                        {minutesDispo > 0 ? `${minutesDispo} min prévues` : "Prêt à travailler ?"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-white/50">Notion en cours</p>
                      <p className="text-xs font-bold text-white/80">
                        {notionsMaitrisees.length}/{totalNotions} maîtrisées
                      </p>
                    </div>
                  </div>
                  {/* Corps */}
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
                        style={{ backgroundColor: MATIERES_CELL[notionActive.matiere]?.bg ?? "rgba(91,79,207,0.12)" }}>
                        {MATIERES_EMOJI[notionActive.matiere] ?? "📚"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-black text-[var(--color-ink)] text-base leading-tight truncate">
                            {notionActive.notion.replace(/_/g, " ")}
                          </p>
                          {(() => {
                            const cfg = PRIORITE_CONFIG[notionActive.priorite as keyof typeof PRIORITE_CONFIG];
                            return cfg ? (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${cfg.badge}`}>
                                {cfg.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <p className="text-xs text-[var(--color-ink-soft)]">
                          {MATIERES_LABELS[notionActive.matiere] ?? notionActive.matiere}
                        </p>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round((notionsMaitrisees.length / Math.max(totalNotions, 1)) * 100)}%`,
                              backgroundColor: MATIERES_CELL[notionActive.matiere]?.dot ?? "#5b4fcf",
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--color-ink-soft)] mt-0.5">
                          Progression globale du plan
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/eleve/exercices/nouveau?plan=1&matiere=${notionActive.matiere}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity mb-3"
                    >
                      ✨ Faire l'exercice du jour
                    </Link>
                    <MiraPlanBtn
                      variant="inline"
                      planContext={{
                        notionActive: notionActive.notion.replace(/_/g, " "),
                        matiere: notionActive.matiere,
                        matiereLabel: MATIERES_LABELS[notionActive.matiere] ?? notionActive.matiere,
                        matiereEmoji: MATIERES_EMOJI[notionActive.matiere] ?? "📚",
                        nbNotions: notionsOrdered.length,
                        nbMaitrisees: notionsMaitrisees.length,
                      }}
                    />
                  </div>
                </Card>
              </section>
            )}

            {/* ── Strip mensuel ── */}
            {Object.keys(parMois).length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
                    📆 Vue par mois
                  </h2>
                  <span className="text-[10px] text-[var(--color-ink-soft)]">
                    {notionsMaitrisees.length}/{totalNotions} notions terminées
                  </span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4">
                  {Object.entries(parMois).map(([moisKey, data]) => {
                    const isCurrent = moisKey === moisActuel;
                    const pct = data.total > 0 ? Math.round((data.maitrisees / data.total) * 100) : 0;
                    return (
                      <div
                        key={moisKey}
                        className={`flex-shrink-0 rounded-2xl border p-3 min-w-[130px] transition-colors ${
                          isCurrent
                            ? "border-[rgba(91,79,207,0.35)] bg-[rgba(91,79,207,0.05)]"
                            : "border-[var(--color-rule)] bg-[var(--color-paper-warm)]"
                        }`}
                      >
                        <p className={`text-[11px] font-black mb-1.5 capitalize ${isCurrent ? "text-[var(--color-purple)]" : "text-[var(--color-ink-soft)]"}`}>
                          {isCurrent && <span className="mr-1">📍</span>}{moisKey.split(" ")[0]}
                        </p>
                        <div className="h-1.5 w-full rounded-full bg-[var(--color-rule)] overflow-hidden mb-1.5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: isCurrent ? "#5b4fcf" : "#2a7c6f",
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--color-ink-soft)]">
                          <span className="font-bold text-[var(--color-ink)]">{data.total}</span> notion{data.total > 1 ? "s" : ""}
                        </p>
                        <p className="text-[10px] text-[var(--color-ink-soft)]">
                          {data.isoWeeks.length} semaine{data.isoWeeks.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Calendrier semaine par semaine (Gantt) ── */}
            {semainesTri.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
                    📅 Planification semaine par semaine
                  </h2>
                  <Link
                    href="/eleve/plan/configurer?section=notions"
                    className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline underline-offset-2"
                  >
                    Réordonner
                  </Link>
                </div>

                <div className="space-y-3">
                  {semainesTri.map((semaine, semIdx) => {
                    const notions = parSemaine[semaine];
                    const lundiDate = getLundiDeISO(semaine);
                    const estActive = semaine === semaineActuelle;
                    const enRetard = semaine < semaineActuelle && !estActive;
                    const totalMinsSemaine = notions.reduce((s, n) => s + (DUREE_NOTION[n.priorite] ?? 60), 0);
                    const jourParNotion = assignerJoursParNotion(notions, dispoMap);

                    // Jours avec disponibilité cette semaine
                    const joursDispos = JOURS_ORDRE.filter((j) => (dispoMap[j] ?? 0) > 0);

                    return (
                      <Card
                        key={semaine}
                        className={`overflow-hidden ${
                          estActive ? "border-[rgba(91,79,207,0.35)] shadow-sm"
                          : enRetard ? "border-[rgba(217,79,43,0.3)]"
                          : ""
                        }`}
                      >
                        {/* ── Header semaine ── */}
                        <div className={`px-4 py-3 border-b border-[var(--color-rule)] ${
                          estActive ? "bg-[rgba(91,79,207,0.06)]"
                          : enRetard ? "bg-[rgba(217,79,43,0.04)]"
                          : "bg-[var(--color-paper-warm)]"
                        }`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {estActive && <span className="h-2 w-2 rounded-full bg-[var(--color-purple)] animate-pulse flex-shrink-0" />}
                              {enRetard && <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] flex-shrink-0" />}
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${
                                  estActive ? "text-[var(--color-purple)]"
                                  : enRetard ? "text-[var(--color-accent)]"
                                  : "text-[var(--color-ink-soft)]"
                                }`}>
                                  {estActive ? "📍 Cette semaine"
                                  : enRetard ? "⏳ À rattraper"
                                  : `Semaine ${semIdx + 1}`}
                                </p>
                                <p className="text-sm font-black text-[var(--color-ink)]">
                                  {formatDateRange(lundiDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-bold text-[var(--color-ink)]">
                                {notions.length} notion{notions.length > 1 ? "s" : ""}
                              </p>
                              <p className="text-[10px] text-[var(--color-ink-soft)]">~{totalMinsSemaine} min</p>
                            </div>
                          </div>
                        </div>

                        {/* ── Grille Gantt ── */}
                        <div className="px-4 pt-3 pb-2">
                          {/* En-tête des jours */}
                          <div className="grid items-center mb-1" style={{ gridTemplateColumns: `1fr repeat(${JOURS_ORDRE.length}, 28px)`, gap: "4px" }}>
                            <div /> {/* colonne vide (labels notions) */}
                            {JOURS_ORDRE.map((jour) => {
                              const mins = dispoMap[jour] ?? 0;
                              const isToday = estActive && jourAujourdhui === jour;
                              return (
                                <div key={jour} className="text-center">
                                  <p className={`text-[9px] font-black uppercase leading-tight ${
                                    isToday ? "text-[var(--color-purple)]" : "text-[var(--color-ink-soft)]"
                                  }`}>
                                    {JOURS_COURTS[jour]}
                                  </p>
                                  <p className={`text-[8px] leading-tight ${
                                    mins === 0 ? "text-[var(--color-rule)]"
                                    : isToday ? "text-[var(--color-purple)] font-bold"
                                    : "text-[var(--color-ink-soft)]"
                                  }`}>
                                    {mins > 0 ? `${mins}` : "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Lignes par notion */}
                          <div className="space-y-1.5">
                            {notions.map((n) => {
                              const joursNotion = jourParNotion[n.id] ?? [];
                              const cfg = PRIORITE_CONFIG[n.priorite as keyof typeof PRIORITE_CONFIG];
                              const isActive = n.notion === notionActive?.notion;
                              const cellColor = MATIERES_CELL[n.matiere];

                              return (
                                <div
                                  key={n.id}
                                  className={`grid items-center rounded-lg py-1 px-1 -mx-1 transition-colors ${
                                    isActive ? "bg-[rgba(91,79,207,0.04)]" : ""
                                  }`}
                                  style={{ gridTemplateColumns: `1fr repeat(${JOURS_ORDRE.length}, 28px)`, gap: "4px" }}
                                >
                                  {/* Label notion */}
                                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                    <span className="text-sm flex-shrink-0">
                                      {MATIERES_EMOJI[n.matiere] ?? "📚"}
                                    </span>
                                    <div className="min-w-0">
                                      <p className={`text-[11px] font-semibold truncate leading-tight ${
                                        isActive ? "text-[var(--color-purple)]" : "text-[var(--color-ink)]"
                                      }`}>
                                        {n.notion.replace(/_/g, " ")}
                                        {isActive && <span className="ml-1 text-[9px] font-black text-[var(--color-purple)]">EN COURS</span>}
                                      </p>
                                      {cfg && (
                                        <span className={`inline-block rounded-full border px-1.5 py-0 text-[9px] font-bold leading-4 ${cfg.badge}`}>
                                          {cfg.label}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Cellules par jour */}
                                  {JOURS_ORDRE.map((jour) => {
                                    const mins = dispoMap[jour] ?? 0;
                                    const occupé = joursNotion.includes(jour);
                                    const isToday = estActive && jourAujourdhui === jour;

                                    if (mins === 0) {
                                      return (
                                        <div key={jour} className="flex justify-center">
                                          <div className="h-5 w-5 rounded-md flex items-center justify-center">
                                            <span className="text-[var(--color-rule)] text-[10px]">—</span>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div key={jour} className="flex justify-center">
                                        <div
                                          className={`h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                                            isToday ? "ring-2 ring-offset-1 ring-[var(--color-purple)]" : ""
                                          }`}
                                          style={occupé ? {
                                            backgroundColor: cellColor?.bg ?? "rgba(91,79,207,0.15)",
                                            boxShadow: occupé && isToday ? `0 0 0 2px ${cellColor?.dot ?? "#5b4fcf"}` : undefined,
                                          } : {
                                            backgroundColor: "var(--color-rule)",
                                            opacity: 0.4,
                                          }}
                                          title={occupé ? `${JOURS_COMPLETS[jour]} — ${n.notion.replace(/_/g, " ")}` : undefined}
                                        >
                                          {occupé && (
                                            <div
                                              className="h-2 w-2 rounded-full"
                                              style={{ backgroundColor: cellColor?.dot ?? "#5b4fcf" }}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ── CTA si semaine active ou en retard ── */}
                        {(estActive || enRetard) && (
                          <div className="px-4 pb-4 pt-1">
                            <Link
                              href={`/eleve/exercices/nouveau?plan=1&matiere=${notions[0]?.matiere ?? ""}`}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity ${
                                enRetard ? "bg-[var(--color-accent)]" : "bg-[var(--color-ink)]"
                              }`}
                            >
                              {enRetard ? "⏳ Rattraper cette semaine →" : "✨ Faire l'exercice du jour"}
                            </Link>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Objectifs de note (compact) ── */}
            {objectifs.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
                    🏆 Mes objectifs de note
                  </h2>
                  <Link href="/eleve/plan/configurer?section=objectifs"
                    className="text-xs font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline underline-offset-2">
                    Modifier
                  </Link>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {objectifs.map((obj) => {
                    const urgent = obj.joursRestants <= 30;
                    return (
                      <Card key={obj.id} className={`p-4 ${urgent ? "border-[rgba(217,79,43,0.3)]" : ""}`}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="text-xl">{MATIERES_EMOJI[obj.matiere] ?? "📚"}</span>
                          <div>
                            <p className="font-bold text-sm text-[var(--color-ink)]">
                              {MATIERES_LABELS[obj.matiere] ?? obj.matiere}
                            </p>
                            <p className={`text-xs font-semibold ${urgent ? "text-[var(--color-accent)]" : "text-[var(--color-ink-soft)]"}`}>
                              {urgent ? `⚡ ${obj.joursRestants}j restants` : `${obj.joursRestants} jours restants`}
                            </p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-base font-black text-[var(--color-ink)]">{Math.round(obj.scoreActuel)} %</p>
                            <p className="text-xs text-[var(--color-ink-soft)]">→ {obj.scoreVise} %</p>
                          </div>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-[var(--color-paper-warm)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-success)] transition-all duration-700"
                            style={{ width: `${obj.progressionPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--color-ink-soft)] mt-1">{obj.progressionPct}% du chemin parcouru</p>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Notions maîtrisées ── */}
            {notionsMaitrisees.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-ink-soft)] mb-2">
                  ✅ {notionsMaitrisees.length} notion{notionsMaitrisees.length > 1 ? "s" : ""} maîtrisée{notionsMaitrisees.length > 1 ? "s" : ""}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {notionsMaitrisees.map((n) => (
                    <span key={n.notion} className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                      ✓ {n.notion.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Mira flottante ── */}
      {aUnPlan && notionActive && (
        <MiraPlanBtn
          variant="floating"
          planContext={{
            notionActive: notionActive.notion.replace(/_/g, " "),
            matiere: notionActive.matiere,
            matiereLabel: MATIERES_LABELS[notionActive.matiere] ?? notionActive.matiere,
            matiereEmoji: MATIERES_EMOJI[notionActive.matiere] ?? "📚",
            nbNotions: notionsOrdered.length,
            nbMaitrisees: notionsMaitrisees.length,
          }}
        />
      )}
    </div>
  );
}
