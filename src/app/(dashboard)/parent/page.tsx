import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { Card, CardLabel } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NavParent } from "@/components/layout/nav-parent";
import { AjouterEnfantBtn } from "@/components/parent/ajouter-enfant-btn";
import { EnfantSelector } from "@/components/parent/enfant-selector";
import { RecommandationBanner } from "@/components/parent/recommandation-banner";
import { isFeatureActive, FEATURE_KEYS } from "@/lib/features";
import { prisma } from "@/lib/prisma/client";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { ReinitialiserMdpEnfantBtn } from "@/components/parent/reinitialiser-mdp-enfant-btn";
import { AccesEnfantCard } from "@/components/parent/acces-enfant-card";
import { SurprisesParentSection } from "@/components/parent/surprises-section";
import Link from "next/link";
import { Suspense } from "react";

type ParentDashboard = Awaited<ReturnType<typeof api.parent.getDashboard>>;
type EleveShape = ParentDashboard["eleves"][0];

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

const ETAT_LABEL: Record<string, { emoji: string; label: string }> = {
  TRES_BIEN: { emoji: "🤩", label: "Très bien" },
  BIEN: { emoji: "😊", label: "Bien" },
  CORRECT: { emoji: "😐", label: "Correct" },
  FATIGUE: { emoji: "😴", label: "Fatigué(e)" },
  STRESSE: { emoji: "😰", label: "Stressé(e)" },
  TRISTE: { emoji: "😔", label: "Triste" },
};

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ enfant?: string }>;
}) {
  const session = await requireRole(["PARENT", "ADMIN", "SUPER_ADMIN"]);
  const profilParent = await api.parent.getDashboard();
  const { enfant: enfantIdParam } = await searchParams;

  const eleves = profilParent.eleves;
  const enfantActif =
    eleves.find((e) => e.id === enfantIdParam) ?? eleves[0] ?? null;

  // Lire les recommandations IA depuis la DB (sans appeler l'API IA)
  const [recommandationIaActive, specialistesActif] = await Promise.all([
    isFeatureActive(FEATURE_KEYS.RECOMMANDATION_IA),
    isFeatureActive(FEATURE_KEYS.SPECIALISTES),
  ]);
  let recommandationData: {
    recommande: boolean;
    urgence: string;
    specialites: string[];
    raisonnement: string;
    declencheurs: string[];
    messageParent: string;
  } | null = null;

  let evaluationActive: Awaited<ReturnType<typeof api.parent.getEvaluationActive>> = null;

  if (enfantActif) {
    const [recommandation, evaluation] = await Promise.all([
      recommandationIaActive
        ? prisma.recommandationIA.findFirst({
            where: { eleveId: enfantActif.id, parentId: session.user.id, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(null),
      api.parent.getEvaluationActive({ eleveId: enfantActif.id }),
    ]);
    evaluationActive = evaluation;
    if (recommandation) {
      recommandationData = {
        recommande: recommandation.recommande,
        urgence: recommandation.urgence,
        specialites: recommandation.specialites,
        raisonnement: recommandation.raisonnement,
        declencheurs: recommandation.declencheurs,
        messageParent: recommandation.messageParent,
      };
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <WelcomeTour role="parent" prenom={profilParent.prenom} />
      <NavParent nom={profilParent.nom} specialistesActif={specialistesActif} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black text-[var(--color-ink)] sm:text-2xl">
              Bonjour {profilParent.prenom} 👋
            </h1>
            <p className="text-sm text-[var(--color-ink-soft)] mt-1">
              {eleves.length === 0
                ? "Ajoutez votre premier enfant pour commencer le suivi."
                : `Suivi de ${eleves.length > 1 ? `vos ${eleves.length} enfants` : "votre enfant"}`}
            </p>
          </div>
          <AjouterEnfantBtn />
        </div>

        {/* Recommandation IA */}
        {recommandationIaActive && recommandationData && enfantActif && (
          <RecommandationBanner
            initialData={{
              recommande: recommandationData.recommande,
              urgence: recommandationData.urgence as "faible" | "moderee" | "haute",
              specialites: recommandationData.specialites,
              raisonnement: recommandationData.raisonnement,
              declencheurs: recommandationData.declencheurs,
              messageParent: recommandationData.messageParent,
            }}
            prenomEnfant={enfantActif.prenom}
          />
        )}

        {/* Banner évaluation cognitive en cours */}
        {evaluationActive && enfantActif && (
          <EvaluationStatusBanner
            evaluation={evaluationActive}
            prenomEnfant={enfantActif.prenom}
          />
        )}

        {eleves.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-lg font-bold text-[var(--color-ink)] mb-2">
              Aucun enfant lié pour l'instant
            </h2>
            <p className="text-sm text-[var(--color-ink-soft)] mb-6 max-w-sm mx-auto">
              Créez un compte pour votre enfant ou liez un compte existant pour suivre sa progression.
            </p>
            <AjouterEnfantBtn variant="primary" />
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
                  />
                </Suspense>
              </div>
            )}

            {/* Surprises parentales */}
            <SurprisesParentSection />

            {/* Dossier de l'enfant actif */}
            {enfantActif && <EleveSection eleve={enfantActif} />}
          </>
        )}
      </main>
    </div>
  );
}

function formatDuree(secondes: number): string {
  if (secondes < 60) return `${secondes} sec`;
  const min = Math.floor(secondes / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formatDerniereConnexion(date: Date | null): string {
  if (!date) return "Jamais";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 2) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ === 1) return "Hier";
  if (diffJ < 7) return `Il y a ${diffJ} jours`;
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

function EleveSection({ eleve }: { eleve: EleveShape }) {
  const planActif = eleve.planActions[0];
  const derniereHumeur = eleve.checkIns[0];
  const alerteEmotionnelle =
    eleve.checkIns.length >= 2 &&
    eleve.checkIns
      .slice(0, 2)
      .every((c: { etat: string }) => ["STRESSE", "TRISTE", "FATIGUE"].includes(c.etat));

  const totalSessions = eleve.sessions.length;
  const sessionsCetteSemaine = totalSessions;
  const tempsSecondes = eleve.sessions.reduce(
    (acc: number, s: { dureeSecondes: number }) => acc + (s.dureeSecondes ?? 0),
    0
  );

  return (
    <div>
      {/* En-tête élève */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-purple)] text-lg font-bold text-white flex-shrink-0">
            {eleve.prenom.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[var(--color-ink)]">
              {eleve.prenom} {eleve.nom}
            </h2>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {eleve.niveauScolaire.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              {eleve.ecole ? ` · ${eleve.ecole}` : ""}
            </p>
          </div>
          {alerteEmotionnelle && (
            <Badge variant="accent">😰 Alerte</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ReinitialiserMdpEnfantBtn eleveId={eleve.id} prenomEnfant={eleve.prenom} />
          <Link
            href={`/parent/accompagnement/${eleve.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-ink)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            🗺️ Plan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Progression par matière */}
        <Card className="p-5 md:col-span-2">
          <CardLabel className="mb-4">Progression par matière</CardLabel>
          {eleve.niveauxMatieres.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-soft)]">
              Aucune donnée pour l'instant — l'élève n'a pas encore complété d'exercices.
            </p>
          ) : (
            <div className="space-y-3">
              {eleve.niveauxMatieres.map((nm: { id: string; matiere: string; scoreGlobal: number }) => (
                <div key={nm.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--color-ink)]">
                      {MATIERE_LABEL[nm.matiere] ?? nm.matiere}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-ink-soft)]">
                      {Math.round(nm.scoreGlobal)}%
                    </span>
                  </div>
                  <Progress
                    value={nm.scoreGlobal}
                    size="sm"
                    color={nm.scoreGlobal >= 80 ? "success" : nm.scoreGlobal >= 60 ? "gold" : "accent"}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Colonne stats */}
        <div className="space-y-4">
          <Card className="p-4">
            <CardLabel className="mb-2">Humeur récente</CardLabel>
            {derniereHumeur ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ETAT_LABEL[derniereHumeur.etat]?.emoji}</span>
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {ETAT_LABEL[derniereHumeur.etat]?.label}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[var(--color-ink-soft)]">Pas de données</p>
            )}
          </Card>

          <Card className="p-4">
            <CardLabel className="mb-2">Temps cette semaine</CardLabel>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-[var(--color-ink)] leading-none">
                {tempsSecondes > 0 ? formatDuree(tempsSecondes) : "—"}
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              {sessionsCetteSemaine} session{sessionsCetteSemaine !== 1 ? "s" : ""} sur 7 jours
            </p>
          </Card>

          <Card className="p-4">
            <CardLabel className="mb-2">Dernière connexion</CardLabel>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {formatDerniereConnexion(eleve.derniereConnexion)}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              🔥 Streak : {eleve.streakJours} jour{eleve.streakJours !== 1 ? "s" : ""}
            </p>
          </Card>

          <Card className="p-4">
            <CardLabel className="mb-2">Badges débloqués</CardLabel>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-[var(--color-gold)] leading-none">
                {eleve.badges.length}
              </span>
              <div className="flex gap-1">
                {eleve.badges.slice(0, 3).map((b: { id: string; badge: { titre: string; icone: string } }) => (
                  <span key={b.id} className="text-lg" title={b.badge.titre}>
                    {b.badge.icone}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Accès de l'enfant — code d'accès + génération MDP */}
      <div className="mt-4">
        <AccesEnfantCard
          eleveId={eleve.id}
          prenomEnfant={eleve.prenom}
          codeAcces={eleve.codeAcces ?? null}
        />
      </div>

      {/* Plan d'action actif */}
      {planActif && (
        <Card className="mt-4 p-5">
          <div className="flex items-center justify-between mb-3">
            <CardLabel>Plan d'action actif</CardLabel>
            <Badge variant="success">Actif</Badge>
          </div>
          <p className="text-sm font-semibold text-[var(--color-ink)] mb-3">{planActif.titre}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {planActif.objectifs.map((obj: { id: string; titre: string; atteint: boolean }) => (
              <div
                key={obj.id}
                className={`rounded-lg p-3 text-xs ${
                  obj.atteint
                    ? "bg-[rgba(42,124,111,0.08)] text-[var(--color-success)]"
                    : "bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]"
                }`}
              >
                {obj.atteint ? "✓ " : "○ "}
                {obj.titre}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Banner statut évaluation cognitive ───────────────────────────────────────

const DOMAINE_LABELS_BANNER: Record<string, { fr: string; icon: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", icon: "🧠" },
  ORTHOPEDAGOGUE:   { fr: "Orthopédagogue",   icon: "📚" },
  ORTHOPHONISTE:    { fr: "Orthophoniste",     icon: "🗣️" },
  ERGOTHERAPEUTE:   { fr: "Ergothérapeute",    icon: "✋" },
  OPTOMETRISTE:     { fr: "Optométriste",      icon: "👁️" },
  PSYCHOEDUCATEUR:  { fr: "Psychoéducateur",   icon: "💬" },
};

type EvaluationActiveData = NonNullable<Awaited<ReturnType<typeof api.parent.getEvaluationActive>>>;

function EvaluationStatusBanner({
  evaluation,
  prenomEnfant,
}: {
  evaluation: EvaluationActiveData;
  prenomEnfant: string;
}) {
  const domaine = DOMAINE_LABELS_BANNER[evaluation.domaine];

  type BannerConfig = {
    icon: string;
    title: string;
    desc: string;
    cta?: string;
    href?: string;
    style: string;
    pulse?: boolean;
  };

  const config: BannerConfig | null = (() => {
    switch (evaluation.status) {
      case "FORM_SENT":
        return {
          icon: "📋",
          title: "Formulaire en attente",
          desc: `Un questionnaire d'observation est prêt pour ${prenomEnfant}. Il ne prend que 10–15 minutes.`,
          cta: "Accéder au formulaire →",
          href: evaluation.formulaireToken ? `/evaluation/${evaluation.formulaireToken}` : undefined,
          style: "border-[var(--color-accent)] bg-[rgba(217,79,43,0.04)]",
          pulse: true,
        };
      case "FORM_IN_PROGRESS":
        return {
          icon: "✍️",
          title: "Formulaire en cours",
          desc: `Vous avez commencé le questionnaire pour ${prenomEnfant}. Terminez-le quand vous êtes disponible.`,
          cta: "Continuer →",
          href: evaluation.formulaireToken ? `/evaluation/${evaluation.formulaireToken}` : undefined,
          style: "border-[var(--color-accent)] bg-[rgba(217,79,43,0.04)]",
        };
      case "FORM_COMPLETED":
      case "REPORT_GENERATING":
        return {
          icon: "⚙️",
          title: "Rapport en génération",
          desc: `L'IA analyse les réponses du questionnaire de ${prenomEnfant}. Vous recevrez une notification sous peu.`,
          style: "border-[var(--color-rule)] bg-[var(--color-paper-warm)]",
          pulse: true,
        };
      case "REPORT_READY":
        return {
          icon: "📊",
          title: "Rapport prêt à valider",
          desc: `Le rapport d'évaluation de ${prenomEnfant} est disponible. Votre validation est requise.`,
          cta: "Voir le rapport →",
          href: evaluation.formulaireToken ? `/evaluation/rapport/${evaluation.formulaireToken}` : undefined,
          style: "border-emerald-300 bg-emerald-50",
          pulse: true,
        };
      case "SECOND_CYCLE_PENDING":
        return {
          icon: "🔄",
          title: "Deuxième évaluation en préparation",
          desc: `Suite à l'évaluation initiale, un deuxième cycle d'évaluation a été lancé pour ${prenomEnfant}. Vous serez contacté prochainement.`,
          style: "border-violet-200 bg-violet-50",
        };
      default:
        return null;
    }
  })();

  if (!config) return null;

  return (
    <div className={`mb-6 rounded-2xl border-2 p-5 ${config.style}`}>
      <div className="flex items-start gap-4">
        <span className={`text-3xl flex-shrink-0 ${config.pulse ? "animate-pulse" : ""}`}>
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-[var(--color-ink)]">{config.title}</p>
            {domaine && (
              <span className="text-xs text-[var(--color-ink-soft)]">
                · {domaine.icon} {domaine.fr}
                {evaluation.round > 1 && ` · Round ${evaluation.round}`}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{config.desc}</p>
          {config.cta && config.href && (
            <Link
              href={config.href}
              className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--color-accent)] hover:underline"
            >
              {config.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
