import { api } from "@/lib/trpc/server";
import { CheckInEmotionnelWidget } from "@/components/dashboard/check-in-widget";
import { ExercicesDuJourWidget } from "@/components/dashboard/exercices-du-jour";
import { PlanDuJourWidget, ObjectifsProgressionWidget } from "@/components/dashboard/plan-du-jour-widget";
import { ProgressionWidget } from "@/components/dashboard/progression-widget";
import { CoursWidget } from "@/components/dashboard/cours-widget";
import { DefJourWidget } from "@/components/dashboard/def-jour-widget";
import { MissionsWidget } from "@/components/dashboard/missions-widget";
import { ClassementWidget } from "@/components/dashboard/classement-widget";
import { HeroEleve } from "@/components/dashboard/hero-eleve";
import { NavEleve } from "@/components/layout/nav-eleve";
import { BirthdayOverlay } from "@/components/eleve/birthday-overlay";
import { SessionTracker } from "@/components/eleve/session-tracker";
import { WelcomeTour } from "@/components/ui/welcome-tour";
import { SurpriseCard } from "@/components/eleve/surprise-card";
import { MiraLibreBtn } from "@/components/mira/mira-libre";
import { estJeuneEleve } from "@/lib/utils/niveau-eleve";
import { parseCosmetiques } from "@/lib/boutique/items";
import Link from "next/link";

export default async function EleveDashboardPage() {
  const { profil, totalExercices, aFaitExerciceAujourdhui } = await api.eleve.getDashboard();
  if (!profil) return null;

  const modeDoux = profil.checkIns[0]?.modeDoux ?? false;
  const jeune = estJeuneEleve(profil.niveauScolaire);
  const cosmetiques = parseCosmetiques((profil as { cosmetiques?: unknown }).cosmetiques ?? null);
  const coursEnCours = profil.coursRemediation.filter((c) => c.statut !== "TERMINE");
  const tousCoursTermines = profil.coursRemediation.length > 0 && coursEnCours.length === 0;

  const estAnniversaire = (() => {
    if (!profil.dateNaissance) return false;
    const auj = new Date(), nais = new Date(profil.dateNaissance);
    return auj.getDate() === nais.getDate() && auj.getMonth() === nais.getMonth();
  })();

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <WelcomeTour role="eleve" prenom={profil.prenom} />
      <SessionTracker />
      {estAnniversaire && <BirthdayOverlay prenom={profil.prenom} />}
      <NavEleve prenom={profil.prenom} streak={profil.streakJours} niveauScolaire={profil.niveauScolaire} avatarEquipe={cosmetiques.avatarEquipe} />

      <main className="mx-auto max-w-5xl px-4 py-5 sm:py-6">

        {/* ── HERO ── */}
        <HeroEleve
          prenom={profil.prenom}
          niveauJeu={profil.niveauJeu}
          totalPoints={profil.totalPoints}
          streak={profil.streakJours}
          streakBoucliers={profil.streakBoucliers}
          aFaitExerciceAujourdhui={aFaitExerciceAujourdhui}
          modeDoux={modeDoux}
          cosmetiques={cosmetiques}
          jeune={jeune}
        />

        {/* ── ACCÈS RAPIDE — 3 raccourcis contextuels ── */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <QuickCard href="/eleve/cours" emoji="📚" label="Mes cours" badge={profil.coursRemediation.filter(c => c.statut !== "TERMINE").length || undefined} />
          <QuickCard href="/eleve/plan" emoji="🗺️" label="Mon plan" />
          <QuickCard href="/eleve/boutique?onglet=jeux" emoji="🎮" label="Jeux" />
        </div>

        {/* ── GRILLE PRINCIPALE ── */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-[2fr_1fr] lg:grid-cols-3">

          {/* ── Colonne principale ── */}
          <div className="md:col-span-1 lg:col-span-2 space-y-4">

            {/* Défi du jour — priorité absolue */}
            <PlanDuJourWidget niveauScolaire={profil.niveauScolaire} />

            {/* Check-in — seulement si nouvelle session */}
            {!profil.sessions[0] && (
              <CheckInEmotionnelWidget niveauScolaire={profil.niveauScolaire} />
            )}

            {/* Exercices assignés par Mira */}
            {profil.exercicesAssignes.filter((e) => e.statut !== "TERMINE").length > 0 && (
              <ExercicesDuJourWidget
                exercices={profil.exercicesAssignes}
                modeDoux={modeDoux}
              />
            )}

            {/* Cours de remédiation en cours */}
            {coursEnCours.length > 0 && <CoursWidget cours={coursEnCours} />}
            {tousCoursTermines && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
                <p className="text-sm font-bold text-emerald-700">🎉 Tous tes cours sont terminés !</p>
                <p className="text-xs text-emerald-600 mt-1">Continue à t'entraîner avec les exercices du jour.</p>
              </div>
            )}

            {/* Défi avancé — secondaires seulement */}
            {!jeune && <DefJourWidget />}

            {/* Surprise parentale */}
            <SurpriseCard />
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            {/* Missions semaine */}
            <MissionsWidget />

            {/* Progression par matière */}
            <ProgressionWidget niveauxMatieres={profil.niveauxMatieres} />

            {/* Objectifs + classement — pas pour les jeunes */}
            {!jeune && (
              <>
                <ObjectifsProgressionWidget />
                <ClassementWidget />
              </>
            )}
          </div>
        </div>

        {/* Bouton Mira flottant */}
        <MiraLibreBtn />
      </main>
    </div>
  );
}

function QuickCard({ href, emoji, label, badge }: { href: string; emoji: string; label: string; badge?: number }) {
  return (
    <Link href={href}
      className="group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--color-rule)] bg-white py-3 px-2 text-center transition-all duration-200 hover:border-[var(--color-ink)] hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-none">
      <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{emoji}</span>
      <span className="text-xs font-semibold text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] leading-tight transition-colors">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
