export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/auth/utils";
import { api } from "@/lib/trpc/server";
import { NavParent } from "@/components/layout/nav-parent";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { NotificationsClient } from "@/components/parent/notifications-client";
import { isFeatureActive, FEATURE_KEYS } from "@/lib/features";

const TYPE_DESCRIPTIONS: Record<string, string> = {
  ALERTE_BLOCAGE: "Votre enfant semble bloqué sur certains exercices depuis plusieurs jours.",
  ALERTE_DECROCHAGE: "Des signes de décrochage ont été détectés (absences répétées, scores en baisse).",
  ALERTE_EMOTIONNELLE: "Des états émotionnels difficiles ont été enregistrés plusieurs jours de suite.",
  RAPPORT_POSITIF: "Votre enfant a fait de beaux progrès récemment — félicitez-le !",
  RAPPORT_HEBDOMADAIRE: "Le résumé de la semaine est disponible.",
  RELANCE_ABSENCE: "Votre enfant n'a pas utilisé la plateforme depuis plusieurs jours.",
  EXERCICE_AJOUTE: "De nouveaux exercices ont été assignés.",
  PLAN_MODIFIE: "Le plan d'action de votre enfant a été mis à jour.",
  AIDE_PLANIFICATION: "Votre enfant a mis à jour son plan de travail — consultez-le et aidez-le si besoin.",
};

// Alertes intelligentes calculées à partir des données réelles
async function getAlertesIntelligentes(eleves: Awaited<ReturnType<typeof api.parent.getRapports>>) {
  const alertes: {
    type: string;
    titre: string;
    contenu: string;
    emoji: string;
    couleur: string;
    eleveId: string;
  }[] = [];

  for (const eleve of eleves) {
    const prenom = eleve.prenom;

    // Alerte streak cassé (0 session cette semaine)
    const now = new Date();
    const semaineDerniere = new Date(now);
    semaineDerniere.setDate(semaineDerniere.getDate() - 7);
    const sessionsRecentes = eleve.sessions.filter(
      (s) => new Date(s.dateSession) > semaineDerniere
    );
    if (sessionsRecentes.length === 0 && eleve.sessions.length > 0) {
      alertes.push({
        type: "RELANCE_ABSENCE",
        titre: `${prenom} n'a pas pratiqué cette semaine`,
        contenu: `${prenom} n'a effectué aucune session de pratique au cours des 7 derniers jours. Une courte session de 10-15 minutes suffit pour maintenir la progression.`,
        emoji: "📅",
        couleur: "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.06)]",
        eleveId: eleve.id,
      });
    }

    // Alerte humeur négative répétée
    const derniersCheckIns = eleve.checkIns.slice(0, 3);
    const humeursNegatives = ["STRESSE", "TRISTE", "FATIGUE"];
    if (
      derniersCheckIns.length >= 2 &&
      derniersCheckIns.every((c) => humeursNegatives.includes(c.etat))
    ) {
      alertes.push({
        type: "ALERTE_EMOTIONNELLE",
        titre: `${prenom} signale des humeurs difficiles`,
        contenu: `${prenom} a indiqué se sentir ${derniersCheckIns
          .map((c) => (({ STRESSE: "stressé(e)", TRISTE: "triste", FATIGUE: "fatigué(e)" } as Record<string, string>)[c.etat] ?? c.etat))
          .join(", ")} lors de ses derniers check-ins. Consultez le plan d'accompagnement pour des stratégies de soutien adaptées.`,
        emoji: "💛",
        couleur: "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.06)]",
        eleveId: eleve.id,
      });
    }

    // Rapport positif (score moyen > 80%)
    const scores = eleve.exercicesAssignes
      .slice(0, 5)
      .map((e) => e.score)
      .filter((s): s is number => s !== null);
    if (scores.length >= 3) {
      const moy = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (moy >= 80) {
        alertes.push({
          type: "RAPPORT_POSITIF",
          titre: `${prenom} excelle en ce moment ! 🎉`,
          contenu: `${prenom} maintient un score moyen de ${Math.round(moy)}% sur ses 5 derniers exercices. C'est une excellente performance — encouragez-le(la) à continuer !`,
          emoji: "🌟",
          couleur: "border-[rgba(42,124,111,0.3)] bg-[rgba(42,124,111,0.06)]",
          eleveId: eleve.id,
        });
      }
    }

    // Alerte matière en difficulté
    const matieresDifficiles = eleve.niveauxMatieres.filter(
      (n) => n.scoreGlobal < 50
    );
    if (matieresDifficiles.length > 0) {
      const matLabels: Record<string, string> = {
        FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
        UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
        EDUCATION_PHYSIQUE: "Éd. physique", ETHIQUE: "Éthique",
      };
      alertes.push({
        type: "ALERTE_BLOCAGE",
        titre: `${prenom} a besoin de soutien en ${matieresDifficiles.map((m) => matLabels[m.matiere] ?? m.matiere).join(", ")}`,
        contenu: `Le score de ${prenom} est inférieur à 50% en ${matieresDifficiles.map((m) => matLabels[m.matiere] ?? m.matiere).join(" et ")}. L'IA a généré des cours de remédiation personnalisés pour l'aider à combler ces lacunes.`,
        emoji: "🚨",
        couleur: "border-[rgba(217,79,43,0.3)] bg-[rgba(217,79,43,0.06)]",
        eleveId: eleve.id,
      });
    }

    // Badge récent
    if (eleve.badges.length > 0) {
      const badgeRecent = eleve.badges[0];
      const joursDepuisBadge = Math.floor(
        (now.getTime() - new Date(badgeRecent.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (joursDepuisBadge <= 7) {
        alertes.push({
          type: "RAPPORT_POSITIF",
          titre: `${prenom} a débloqué un badge ! ${badgeRecent.badge.icone}`,
          contenu: `${prenom} vient de gagner le badge « ${badgeRecent.badge.titre} » — ${badgeRecent.badge.description}. Félicitez-le(la) pour cet accomplissement !`,
          emoji: "🏅",
          couleur: "border-[rgba(201,149,42,0.3)] bg-[rgba(201,149,42,0.06)]",
          eleveId: eleve.id,
        });
      }
    }
  }

  return alertes;
}

export default async function NotificationsPage() {
  await requireRole(["PARENT", "ADMIN", "SUPER_ADMIN"]);

  const [profilParent, notifications, eleves, specialistesActif] = await Promise.all([
    api.parent.getDashboard(),
    api.parent.getNotifications(),
    api.parent.getRapports(),
    isFeatureActive(FEATURE_KEYS.SPECIALISTES),
  ]);

  const alertesIntelligentes = await getAlertesIntelligentes(eleves);
  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <NavParent nom={profilParent.nom} specialistesActif={specialistesActif} />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Link
            href="/parent"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            ← Tableau de bord
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Notifications</h1>
            {nonLues > 0 && (
              <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-xs font-bold text-white">
                {nonLues}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            Alertes, rapports et mises à jour concernant vos enfants.
          </p>
        </div>

        {/* ── Alertes intelligentes (calculées en temps réel) ── */}
        {alertesIntelligentes.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🧠</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                Analyse en temps réel
              </h2>
            </div>
            <div className="space-y-3">
              {alertesIntelligentes.map((alerte, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 ${alerte.couleur}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{alerte.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)] mb-1">{alerte.titre}</p>
                      <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{alerte.contenu}</p>
                      {(alerte.type === "ALERTE_EMOTIONNELLE" || alerte.type === "ALERTE_BLOCAGE" || alerte.type === "AIDE_PLANIFICATION") && (
                        <Link
                          href={`/parent/accompagnement/${alerte.eleveId}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline underline-offset-2"
                        >
                          {alerte.type === "AIDE_PLANIFICATION" ? "Voir le plan de travail →" : "Voir le plan d'accompagnement →"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Notifications stockées ── */}
        <section>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔔</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                Toutes les notifications
              </h2>
            </div>
          )}
          <NotificationsClient
            initialNotifications={notifications.map((n) => ({
              ...n,
              createdAt: new Date(n.createdAt),
            }))}
          />
        </section>

        {/* État vide total */}
        {notifications.length === 0 && alertesIntelligentes.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-lg font-bold text-[var(--color-ink)] mb-2">Tout est calme !</p>
            <p className="text-sm text-[var(--color-ink-soft)] max-w-sm mx-auto">
              Aucune alerte ni notification pour l'instant. Les mises à jour importantes concernant vos enfants apparaîtront ici.
            </p>
          </Card>
        )}

        {/* Légende des types */}
        <Card className="mt-8 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] mb-3">
            Types de notifications
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(TYPE_DESCRIPTIONS).map(([type, desc]) => {
              const emojis: Record<string, string> = {
                ALERTE_BLOCAGE: "🚨", ALERTE_DECROCHAGE: "📉", ALERTE_EMOTIONNELLE: "💛",
                RAPPORT_POSITIF: "🌟", RAPPORT_HEBDOMADAIRE: "📊", RELANCE_ABSENCE: "📅",
                EXERCICE_AJOUTE: "✏️", PLAN_MODIFIE: "🗺️", AIDE_PLANIFICATION: "🗺️",
              };
              return (
                <div key={type} className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">{emojis[type]}</span>
                  <p className="text-xs text-[var(--color-ink-soft)]">{desc}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
