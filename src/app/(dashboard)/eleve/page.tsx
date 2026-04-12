import { api } from "@/lib/trpc/server";
import { CheckInEmotionnelWidget } from "@/components/dashboard/check-in-widget";
import { ExercicesDuJourWidget } from "@/components/dashboard/exercices-du-jour";
import { PlanDuJourWidget, ObjectifsProgressionWidget } from "@/components/dashboard/plan-du-jour-widget";
import { ProgressionWidget } from "@/components/dashboard/progression-widget";
import { StreakBadgesWidget } from "@/components/dashboard/streak-badges";
import { CoursWidget } from "@/components/dashboard/cours-widget";
import { DefJourWidget } from "@/components/dashboard/def-jour-widget";
import { MissionsWidget } from "@/components/dashboard/missions-widget";
import { ClassementWidget } from "@/components/dashboard/classement-widget";
import { StreakDangerBanner } from "@/components/dashboard/streak-danger-banner";
import { NavEleve } from "@/components/layout/nav-eleve";
import { CommentaireEleveWidget } from "@/components/eleve/commentaire-eleve-widget";
import { MesCommentaires } from "@/components/eleve/mes-commentaires";
import { InspirationsWidget } from "@/components/eleve/inspirations-widget";
import { selectionnerHistoires, getMessageIntro, HISTOIRES } from "@/lib/stories/histoires-inspirantes";
import { BirthdayOverlay } from "@/components/eleve/birthday-overlay";
import { SessionTracker } from "@/components/eleve/session-tracker";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { SurpriseCard } from "@/components/eleve/surprise-card";
import { MiraLibreBtn } from "@/components/mira/mira-libre";
import { GamificationGuide } from "@/components/dashboard/gamification-guide";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";

export default async function EleveDashboardPage() {
  const { profil, totalExercices, aFaitExerciceAujourdhui } = await api.eleve.getDashboard();

  if (!profil) return null;

  const derniereSession = profil.sessions[0];
  const modeDoux = profil.checkIns[0]?.modeDoux ?? false;
  const jeune = estJeuneEleve(profil.niveauScolaire);

  const profilPourSelection = {
    tdah: profil.tdah,
    dyslexie: profil.dyslexie,
    anxieteScolaire: profil.anxieteScolaire,
    matieresRedoutees: profil.matieresRedoutees as string[],
    matieresPreferees: profil.matieresPreferees as string[],
    niveauxMatieres: profil.niveauxMatieres.map((n) => ({
      matiere: n.matiere,
      scoreGlobal: n.scoreGlobal,
    })),
  };
  const histoiresSelectionnees = selectionnerHistoires(profilPourSelection, 3);
  const messageIntro = getMessageIntro(profil.prenom, profilPourSelection);

  const estAnniversaire = (() => {
    if (!profil.dateNaissance) return false;
    const auj = new Date();
    const nais = new Date(profil.dateNaissance);
    return auj.getDate() === nais.getDate() && auj.getMonth() === nais.getMonth();
  })();

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <WelcomeTour role="eleve" prenom={profil.prenom} />
      <SessionTracker />
      {estAnniversaire && <BirthdayOverlay prenom={profil.prenom} />}
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">

        {/* ── SALUTATION — sobre et directe ── */}
        <div className="mb-4">
          {jeune ? (
            <>
              <h1 className="text-2xl font-black text-[var(--color-ink)] sm:text-3xl">
                {modeDoux ? "💙" : "👋"} Coucou {profil.prenom} !
              </h1>
              <p className="text-base text-[var(--color-ink-soft)] mt-1">
                {modeDoux ? "Prends soin de toi aujourd'hui 💙" : "C'est le moment de pratiquer ! 🌟"}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-black text-[var(--color-ink)] sm:text-2xl">
                {getGreeting()}, {profil.prenom} ! {modeDoux ? "💙" : "👋"}
              </h1>
              {(modeDoux || totalExercices > 0) && (
                <p className="text-sm text-[var(--color-ink-soft)] mt-1">
                  {modeDoux
                    ? "Prends soin de toi aujourd'hui. Des exercices doux t'attendent."
                    : `Tu as complété ${totalExercices} exercice${totalExercices > 1 ? "s" : ""} au total. Continue comme ça !`}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── BANNIÈRE STREAK — juste après la salutation ── */}
        <StreakDangerBanner
          streak={profil.streakJours}
          aFaitExerciceAujourdhui={aFaitExerciceAujourdhui}
        />

        {/* ── GRILLE PRINCIPALE ── */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-[2fr_1fr] lg:grid-cols-3">
          {/* Colonne principale (2/3) */}
          <div className="md:col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">

            {/* ── DÉFI DU JOUR — première chose visible ── */}
            <PlanDuJourWidget niveauScolaire={profil.niveauScolaire} />

            {/* ── Check-in émotionnel — intégré dans le flux, non bloquant ── */}
            {!derniereSession && (
              <CheckInEmotionnelWidget niveauScolaire={profil.niveauScolaire} />
            )}

            {/* ── Cours personnalisés (remédiation en cours) ── */}
            {profil.coursRemediation.filter((c) => c.statut !== "TERMINE").length > 0 && (
              <CoursWidget cours={profil.coursRemediation} />
            )}

            {/* ── Aller plus loin — exploration libre ── */}
            {!jeune && <DefJourWidget />}

            {/* ── Exercices recommandés par Mira ── */}
            {profil.exercicesAssignes.filter((e) => e.statut !== "TERMINE").length > 0 && (
              <ExercicesDuJourWidget
                exercices={profil.exercicesAssignes}
                modeDoux={modeDoux}
              />
            )}

            {/* ── Missions de la semaine ── */}
            <MissionsWidget />

            {/* ── Ma progression — décalée après le contenu principal ── */}
            <ObjectifsProgressionWidget />

            {/* ── Surprise parentale ── */}
            <SurpriseCard />

            {profil.coursRemediation.filter((c) => c.statut === "TERMINE").length > 0 && (
              <CoursWidget cours={profil.coursRemediation.filter((c) => c.statut === "TERMINE")} />
            )}
          </div>

          {/* Sidebar droite */}
          <div className="space-y-4 sm:space-y-6">
            <StreakBadgesWidget
              streak={profil.streakJours}
              streakBoucliers={profil.streakBoucliers}
              totalBadges={profil.badges.length}
              badges={profil.badges.slice(0, 3)}
              totalPoints={profil.totalPoints}
              niveauJeu={profil.niveauJeu}
              niveauScolaire={profil.niveauScolaire}
            />

            {/* Classement hebdomadaire — masqué pour les jeunes (notion de compétition prématurée) */}
            {!jeune && <ClassementWidget />}

            <ProgressionWidget niveauxMatieres={profil.niveauxMatieres} />

            {/* Guide gamification — explication XP/niveaux/séries */}
            <GamificationGuide />

            <div>
              <CommentaireEleveWidget prenom={profil.prenom} />
              <MesCommentaires />
            </div>
          </div>
        </div>

        {/* Bouton flottant Mira aide libre */}
        <MiraLibreBtn />

        {/* Section inspirations — textes longs, non adaptés aux jeunes lecteurs */}
        {!jeune && (
          <InspirationsWidget
            histoires={histoiresSelectionnees}
            messageIntro={messageIntro}
            prenom={profil.prenom}
            allHistoiresCount={HISTOIRES.length}
          />
        )}
      </main>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}
