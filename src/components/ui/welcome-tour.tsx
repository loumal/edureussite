"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "parent" | "enseignant" | "eleve" | "specialiste";

interface Etape {
  icon: string;
  titre: string;
  description: string;
  conseil: string;
  visuel?: {
    // Mini-aperçu visuel (composant JSX inline via render)
    lignes: Array<{ label: string; valeur?: string; couleur?: string; pct?: number }>;
    titre?: string;
  };
  lien?: { href: string; label: string };
  badge?: string; // ex. "NOUVEAU"
}

// ── Contenu des étapes par rôle ───────────────────────────────────────────────

const ETAPES: Record<Role, Etape[]> = {

  // ╔══════════════════════════════════════════════════════════╗
  // ║                         ÉLÈVE                           ║
  // ╚══════════════════════════════════════════════════════════╝
  eleve: [
    {
      icon: "👋",
      titre: "Bienvenue sur Édu-Réussite !",
      description: "Édu-Réussite est ta plateforme d'apprentissage personnalisée. Elle s'adapte à ton niveau, ton rythme et même ton humeur pour t'aider à progresser dans toutes tes matières.",
      conseil: "Ce guide te présente les 7 fonctions principales. Tu peux y revenir à tout moment via le bouton ? en bas à droite. Prends 2 minutes — ça changera ta façon d'étudier.",
      visuel: {
        titre: "Ce que tu vas pouvoir faire",
        lignes: [
          { label: "🤖 Mira — Ton IA personnelle",      couleur: "#5b4fcf" },
          { label: "📝 Exercices adaptés chaque jour",   couleur: "#2a7c6f" },
          { label: "🗺️ Plan de réussite semaine/mois",   couleur: "#c9952a" },
          { label: "🏆 XP, streak, badges, classement", couleur: "#d94f2b" },
          { label: "📈 Progression matière par matière", couleur: "#3b82f6" },
        ],
      },
    },
    {
      icon: "🤖",
      titre: "Mira — Ton assistante IA",
      description: "Mira est ton tuteur personnel alimenté par l'IA. Elle explique les notions difficiles dans TES mots, répond à tes questions à tout moment et s'adapte à ton style d'apprentissage (visuel, auditif, kinesthésique).",
      conseil: "Tu peux parler à Mira par texte ou par microphone. Elle comprend le français québécois et répond à voix haute. Plus tu l'utilises, plus elle apprend à te connaître.",
      visuel: {
        titre: "Mira dans l'application",
        lignes: [
          { label: "💬 Chat libre — aide sur n'importe quel sujet",    couleur: "#5b4fcf" },
          { label: "🗺️ Mode Plan — conseils sur ta notion en cours",   couleur: "#5b4fcf" },
          { label: "📚 Mode Cours — explications pas à pas",           couleur: "#5b4fcf" },
          { label: "🎤 Microphone disponible pour parler",             couleur: "#5b4fcf" },
        ],
      },
      lien: { href: "/eleve/cours", label: "Commencer un cours avec Mira →" },
    },
    {
      icon: "📅",
      titre: "Check-in du jour",
      description: "Chaque matin, Édu-Réussite te demande comment tu te sens. Stressé, fatigué, super motivé ? Ta réponse adapte l'exercice du jour — plus doux si tu es à plat, plus stimulant si tu es en forme.",
      conseil: "Si tu actives le Mode Doux, les exercices deviennent moins intenses et Mira t'encourage davantage. Ton état émotionnel est privé — personne d'autre ne peut le voir.",
      visuel: {
        titre: "États émotionnels disponibles",
        lignes: [
          { label: "😄 Super en forme !",   couleur: "#2a7c6f" },
          { label: "😐 Correct, ça ira",   couleur: "#c9952a" },
          { label: "😔 Un peu fatigué",     couleur: "#d94f2b" },
          { label: "😰 Stressé / anxieux", couleur: "#d94f2b" },
        ],
      },
    },
    {
      icon: "📝",
      titre: "Exercices du jour",
      description: "Chaque exercice est généré par l'IA selon ton niveau exact, tes lacunes identifiées et tes centres d'intérêt. Complète-les pour obtenir un feedback détaillé avec correction étape par étape.",
      conseil: "Le feedback IA explique chaque erreur en détail : type d'erreur, étapes de correction PFEQ, astuce mémoire et exemple similaire. C'est beaucoup plus utile qu'un simple ✓ ou ✗.",
      visuel: {
        titre: "Le cycle d'un exercice",
        lignes: [
          { label: "1. Génération adaptée à ton niveau",    couleur: "#5b4fcf" },
          { label: "2. Tu réponds",                         couleur: "#5b4fcf" },
          { label: "3. IA corrige + diagnostique l'erreur", couleur: "#5b4fcf" },
          { label: "4. Feedback détaillé PFEQ",             couleur: "#5b4fcf" },
          { label: "5. XP + mise à jour de ton niveau",     couleur: "#5b4fcf" },
        ],
      },
      lien: { href: "/eleve/exercices/nouveau", label: "Faire mon premier exercice →" },
    },
    {
      icon: "🗺️",
      titre: "Plan de réussite",
      badge: "NOUVEAU",
      description: "Ton plan de réussite est un calendrier d'apprentissage personnalisé. Tu choisis les notions à maîtriser, tu indiques ton temps disponible chaque jour, et l'application planifie tout — semaine par semaine, jour par jour.",
      conseil: "L'algorithme adapte la planification à ta disponibilité réelle. Si tu as 15 notions pour 4 semaines, il les répartit intelligemment selon le temps que tu as chaque jour. Les urgences passent toujours en premier.",
      visuel: {
        titre: "Comment le plan s'organise",
        lignes: [
          { label: "🔴 Urgent  → 90 min estimées",  pct: 90,  couleur: "#d94f2b" },
          { label: "🟡 Important → 60 min estimées", pct: 60,  couleur: "#c9952a" },
          { label: "🔵 Plus tard → 30 min estimées", pct: 30,  couleur: "#3b82f6" },
        ],
      },
      lien: { href: "/eleve/plan", label: "Voir mon plan de réussite →" },
    },
    {
      icon: "🏆",
      titre: "XP, streak et classement",
      description: "Chaque exercice complété te rapporte des XP. Les bonnes réponses font monter ton niveau de jeu. Les missions hebdomadaires donnent des XP bonus. Ton streak (jours consécutifs actifs) te protège grâce aux Boucliers de streak.",
      conseil: "Si tu rates un jour, ton Bouclier de streak absorbe l'interruption. Tu gagnes un bouclier tous les 7 jours de streak actif. Le classement est par niveau scolaire — tu te compares à tes vrais pairs.",
      visuel: {
        titre: "Comment gagner plus d'XP",
        lignes: [
          { label: "Score 100/100",        valeur: "×2 XP",       couleur: "#c9952a" },
          { label: "Score 90-99",          valeur: "×1.5 XP",     couleur: "#c9952a" },
          { label: "Bonus vitesse",        valeur: "+10 XP",       couleur: "#2a7c6f" },
          { label: "Connexion quotidienne", valeur: "+10 XP",      couleur: "#2a7c6f" },
          { label: "Objectif de note atteint", valeur: "+50 XP",  couleur: "#5b4fcf" },
        ],
      },
    },
    {
      icon: "📈",
      titre: "Progression et cours de remédiation",
      description: "La page Progression te montre ton niveau dans chaque matière sous forme de graphique. Après 3 exercices, Mira génère automatiquement un cours de remédiation ciblé sur tes lacunes réelles.",
      conseil: "Le cours de remédiation est différent d'un cours ordinaire — il part de TES erreurs pour reconstruire la notion depuis la base. Il est régénéré à chaque série de 3 exercices.",
      visuel: {
        titre: "Tes données de progression",
        lignes: [
          { label: "Mathématiques",    pct: 72, couleur: "#5b4fcf" },
          { label: "Français",         pct: 85, couleur: "#2a7c6f" },
          { label: "Sciences",         pct: 60, couleur: "#3b82f6" },
        ],
      },
      lien: { href: "/eleve/progression", label: "Voir ma progression →" },
    },
    {
      icon: "⚙️",
      titre: "Personnalise ton profil",
      description: "Dans Paramètres, tu peux indiquer ton style d'apprentissage, tes centres d'intérêt, si tu as un TDAH ou de la dyslexie. Ces données permettent à l'IA de vraiment personnaliser chaque exercice et chaque explication.",
      conseil: "Plus ton profil est complet, plus Mira devient précise. Par exemple, si tu aimes le hockey, Mira va te donner des exemples mathématiques avec des stats de hockey. Ça aide vraiment !",
      lien: { href: "/eleve/parametres", label: "Compléter mon profil →" },
    },
  ],

  // ╔══════════════════════════════════════════════════════════╗
  // ║                        PARENT                           ║
  // ╚══════════════════════════════════════════════════════════╝
  parent: [
    {
      icon: "👋",
      titre: "Bienvenue sur Édu-Réussite !",
      description: "Édu-Réussite est une plateforme éducative qui accompagne vos enfants et vous informe en temps réel de leurs progrès. Vous êtes le partenaire clé de leur réussite scolaire.",
      conseil: "Ce guide présente les 6 fonctions principales de votre espace. Le bouton ? en bas à droite vous y redonne accès à tout moment pendant votre première semaine.",
      visuel: {
        titre: "Votre espace parent en un coup d'œil",
        lignes: [
          { label: "👶 Suivi temps réel de chaque enfant",    couleur: "#5b4fcf" },
          { label: "📄 Rapports IA détaillés par matière",    couleur: "#2a7c6f" },
          { label: "👩‍⚕️ Accès à des spécialistes qualifiés",  couleur: "#c9952a" },
          { label: "🔔 Alertes automatiques sur les progrès", couleur: "#d94f2b" },
          { label: "🎁 Surprises motivantes pour votre enfant",couleur: "#3b82f6" },
        ],
      },
    },
    {
      icon: "👶",
      titre: "Tableau de bord de vos enfants",
      description: "Pour chaque enfant, votre tableau de bord affiche : sa progression par matière, son humeur du jour, ses badges débloqués, son streak actif et le temps de travail cette semaine.",
      conseil: "Un point rouge sur la fiche d'un enfant signale plusieurs check-ins émotionnels négatifs consécutifs. C'est un signal précoce — intervenez avant que la démotivation s'installe.",
      visuel: {
        titre: "Indicateurs de suivi disponibles",
        lignes: [
          { label: "Score moyen par matière",   pct: 78, couleur: "#5b4fcf" },
          { label: "Exercices complétés",        valeur: "12 cette semaine", couleur: "#2a7c6f" },
          { label: "Streak actuel",              valeur: "8 jours",          couleur: "#c9952a" },
          { label: "État émotionnel du jour",    valeur: "😊 En forme",      couleur: "#2a7c6f" },
        ],
      },
    },
    {
      icon: "📄",
      titre: "Rapports générés par l'IA",
      description: "La section Rapports génère un bilan complet par matière avec le niveau actuel, les lacunes identifiées, les points forts et des recommandations concrètes adaptées à l'âge et au profil de votre enfant.",
      conseil: "Vous pouvez partager ces rapports directement avec l'enseignant ou le spécialiste depuis la plateforme, sans avoir à tout réexpliquer. Le rapport inclut l'historique des exercices.",
      visuel: {
        titre: "Contenu d'un rapport IA",
        lignes: [
          { label: "📊 Niveau actuel + évolution",           couleur: "#5b4fcf" },
          { label: "🔍 Lacunes identifiées précisément",      couleur: "#d94f2b" },
          { label: "✅ Points forts à valoriser",              couleur: "#2a7c6f" },
          { label: "💡 Recommandations concrètes",            couleur: "#c9952a" },
          { label: "📅 Historique des 30 derniers jours",     couleur: "#3b82f6" },
        ],
      },
      lien: { href: "/parent/rapports", label: "Consulter les rapports →" },
    },
    {
      icon: "👩‍⚕️",
      titre: "Trouver un spécialiste",
      description: "Accédez à des orthophonistes, psychologues scolaires, tuteurs spécialisés et autres professionnels. L'IA analyse le profil de votre enfant et vous recommande les spécialistes les plus adaptés.",
      conseil: "La recommandation IA prend en compte le niveau scolaire, les difficultés identifiées (TDAH, dyslexie, anxiété) et la localisation. Plus le profil de votre enfant est complet, plus la recommandation est précise.",
      lien: { href: "/parent/specialistes", label: "Explorer les spécialistes →" },
    },
    {
      icon: "🔔",
      titre: "Notifications et alertes",
      description: "Vous recevez des notifications automatiques pour les événements importants : objectif de note atteint, cap de streak franchi, exercice exceptionnel, ou au contraire signal de difficulté.",
      conseil: "Les alertes importantes sont aussi envoyées par courriel. Consultez la section Notifications régulièrement — certaines exigent votre action (ex. rendez-vous à confirmer).",
      lien: { href: "/parent/notifications", label: "Voir mes notifications →" },
    },
    {
      icon: "🎁",
      titre: "Surprises motivantes",
      description: "Vous pouvez accorder une surprise à votre enfant directement depuis la plateforme. Elle s'affiche sur son tableau de bord sous forme d'une carte spéciale qui le motive à continuer ses efforts.",
      conseil: "L'IA peut aussi suggérer automatiquement une surprise lorsque votre enfant atteint un cap important (10 jours de streak, 5 badges, objectif de note). Vous recevez alors une notification pour valider.",
      lien: { href: "/parent", label: "Voir le tableau de bord →" },
    },
    {
      icon: "📅",
      titre: "Rendez-vous avec des spécialistes",
      description: "Prenez rendez-vous directement depuis la plateforme. Vous choisissez le spécialiste, la date et le mode (en personne ou en ligne). Une confirmation automatique est envoyée par courriel.",
      conseil: "Un rappel est envoyé 24h avant le rendez-vous avec les informations de connexion si c'est une rencontre en ligne. Vous pouvez annuler ou reporter jusqu'à 12h avant.",
      lien: { href: "/parent/rendez-vous", label: "Gérer mes rendez-vous →" },
    },
  ],

  // ╔══════════════════════════════════════════════════════════╗
  // ║                      ENSEIGNANT                         ║
  // ╚══════════════════════════════════════════════════════════╝
  enseignant: [
    {
      icon: "👋",
      titre: "Bienvenue sur Édu-Réussite !",
      description: "Édu-Réussite est votre tableau de bord pédagogique. Il centralise le suivi de tous vos élèves, la génération d'épreuves PFEQ et la communication avec les familles — tout en un seul endroit.",
      conseil: "Ce guide vous présente les 6 fonctions clés. Le bouton ? en bas à droite vous y redonne accès à tout moment pendant votre première semaine. Présentez-le à vos élèves dès aujourd'hui !",
      visuel: {
        titre: "Ce que vous pouvez faire ici",
        lignes: [
          { label: "👥 Suivi temps réel de vos élèves",      couleur: "#5b4fcf" },
          { label: "📝 Génération d'épreuves PFEQ en 1 clic",couleur: "#2a7c6f" },
          { label: "💬 Commentaires visibles par les parents",couleur: "#c9952a" },
          { label: "🔍 Alertes automatiques sur les difficultés", couleur: "#d94f2b" },
          { label: "📊 Rapports IA par élève et par matière",  couleur: "#3b82f6" },
        ],
      },
    },
    {
      icon: "👥",
      titre: "Vos élèves en temps réel",
      description: "Votre liste d'élèves affiche pour chacun : l'état émotionnel du jour, le score moyen, les alertes actives, le nombre d'exercices complétés et le temps de travail cette semaine.",
      conseil: "Les élèves marqués en rouge ont eu plusieurs check-ins négatifs consécutifs. Un clic sur leur fiche vous donne leur historique complet. Une intervention précoce change vraiment les résultats.",
      visuel: {
        titre: "Indicateurs visibles par élève",
        lignes: [
          { label: "😊 État émotionnel du jour",      couleur: "#2a7c6f" },
          { label: "📊 Score moyen (7 derniers jours)", pct: 74, couleur: "#5b4fcf" },
          { label: "🔴 Alertes actives",               valeur: "2 élèves", couleur: "#d94f2b" },
          { label: "⏱ Temps travaillé cette semaine",  valeur: "3h 40min", couleur: "#c9952a" },
        ],
      },
    },
    {
      icon: "🔑",
      titre: "Connecter vos élèves",
      description: "Chaque élève rejoint votre classe avec votre code enseignant unique. Une fois connecté, son profil complet apparaît dans votre liste avec toutes ses données d'apprentissage.",
      conseil: "Votre code enseignant est affiché dans la fiche de chaque élève (section Informations). Partagez-le en classe dès aujourd'hui — l'intégration prend moins de 5 minutes par élève.",
    },
    {
      icon: "📝",
      titre: "Générer des épreuves PFEQ",
      description: "Créez des évaluations conformes au Programme de Formation de l'École Québécoise en quelques clics. L'IA génère la structure complète : 3 parties, barème sur 100, selon le niveau et les notions ciblées.",
      conseil: "Vous pouvez générer une épreuve pour toute la classe ou pour un élève spécifique. Les épreuves respectent la terminologie officielle du MEES et s'impriment directement depuis la plateforme.",
      visuel: {
        titre: "Options de génération",
        lignes: [
          { label: "Matière et niveau scolaire",           couleur: "#5b4fcf" },
          { label: "Notions ciblées (PFEQ)",               couleur: "#5b4fcf" },
          { label: "Difficulté adaptée à la classe",       couleur: "#5b4fcf" },
          { label: "3 parties structurées (15/35/50 pts)", couleur: "#5b4fcf" },
        ],
      },
      lien: { href: "/admin/epreuves/nouveau", label: "Créer une épreuve PFEQ →" },
    },
    {
      icon: "💬",
      titre: "Commentaires et communication",
      description: "Depuis la fiche de chaque élève, vous pouvez ajouter un commentaire pédagogique. Il est immédiatement visible par les parents, qui reçoivent une notification automatique.",
      conseil: "Vos commentaires sont datés et conservés dans l'historique. C'est un outil de communication directe, traçable et professionnel — bien plus efficace qu'un courriel non structuré.",
      lien: { href: "/enseignant", label: "Voir la liste de mes élèves →" },
    },
    {
      icon: "📊",
      titre: "Rapports et données de classe",
      description: "Accédez à des rapports agrégés par classe : distribution des niveaux, notions les plus difficiles, progression moyenne, élèves nécessitant un suivi spécialisé.",
      conseil: "Ces données sont mises à jour en temps réel à chaque exercice complété. Utilisez-les pour orienter vos révisions en classe — l'IA identifie les lacunes collectives automatiquement.",
    },
  ],

  // ╔══════════════════════════════════════════════════════════╗
  // ║                      SPÉCIALISTE                        ║
  // ╚══════════════════════════════════════════════════════════╝
  specialiste: [
    {
      icon: "👋",
      titre: "Bienvenue sur Édu-Réussite !",
      description: "Édu-Réussite vous connecte avec des familles qui ont besoin de votre expertise. Gérez vos demandes, vos rendez-vous et développez votre clientèle — tout depuis un seul espace.",
      conseil: "Ce guide vous présente les 5 fonctions principales. Commencez par compléter votre profil public — c'est la base pour être recommandé par l'IA aux familles.",
      visuel: {
        titre: "Votre espace spécialiste",
        lignes: [
          { label: "👤 Profil public visible par les familles",   couleur: "#5b4fcf" },
          { label: "📋 Demandes de rencontre des parents",        couleur: "#2a7c6f" },
          { label: "📅 Agenda et rendez-vous intégrés",           couleur: "#c9952a" },
          { label: "🎓 Webinaires pour développer votre audience",couleur: "#3b82f6" },
          { label: "🤖 Recommandation IA aux familles ciblées",   couleur: "#d94f2b" },
        ],
      },
    },
    {
      icon: "👤",
      titre: "Votre profil public",
      description: "Votre profil est votre vitrine sur la plateforme. Les familles y trouvent votre spécialité, votre approche, vos tarifs et vos disponibilités. Un profil complet génère 3× plus de demandes.",
      conseil: "L'IA recommande les spécialistes ayant : une photo, une description de plus de 100 mots, leurs spécialités renseignées et des disponibilités à jour. Cinq minutes maintenant, des clients réguliers ensuite.",
    },
    {
      icon: "📋",
      titre: "Demandes des parents",
      description: "Les parents vous envoient une demande de rencontre accompagnée d'un résumé IA du profil de leur enfant (niveau, difficultés, historique). Vous avez toutes les informations avant même de répondre.",
      conseil: "Répondre en moins de 24h améliore votre score de réactivité, visible sur votre profil. Les spécialistes réactifs sont mis en avant dans les résultats de recherche.",
      lien: { href: "/specialiste/demandes", label: "Voir les demandes en attente →" },
    },
    {
      icon: "📅",
      titre: "Votre agenda intégré",
      description: "Gérez vos disponibilités, confirmez vos rendez-vous et suivez vos séances directement depuis votre agenda. Parent et spécialiste reçoivent automatiquement une confirmation et un rappel 24h avant.",
      conseil: "Si le rendez-vous est en ligne, les informations de visioconférence sont automatiquement incluses dans la confirmation. Vous n'avez pas à gérer de lien séparément.",
      lien: { href: "/specialiste/agenda", label: "Ouvrir mon agenda →" },
    },
    {
      icon: "🎓",
      titre: "Organiser des webinaires",
      description: "Animez des webinaires éducatifs pour les parents et enseignants de la plateforme. Chaque webinaire est diffusé à toutes les familles intéressées par votre thématique.",
      conseil: "Les webinaires sont le meilleur levier de visibilité sur la plateforme. Les familles qui y participent sont 4× plus susceptibles de prendre un rendez-vous individuel par la suite.",
      lien: { href: "/specialiste/agenda", label: "Planifier un webinaire →" },
    },
  ],
};

// ── Logique de persistance (7 jours) ─────────────────────────────────────────

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_AUTO_SHOWS = 3;

interface TourState {
  firstSeen: number;
  seenCount: number;
}

// ── Mini-visuel (aperçu de l'UI) ──────────────────────────────────────────────

function MiniVisuel({ visuel }: { visuel: NonNullable<Etape["visuel"]> }) {
  return (
    <div className="rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-warm)] overflow-hidden mb-4">
      {visuel.titre && (
        <div className="px-4 py-2 border-b border-[var(--color-rule)] bg-white/60">
          <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-ink-soft)]">
            {visuel.titre}
          </p>
        </div>
      )}
      <div className="px-4 py-2.5 space-y-1.5">
        {visuel.lignes.map((ligne, i) => (
          <div key={i} className="flex items-center gap-2">
            {ligne.pct !== undefined ? (
              <>
                <p className="text-[11px] font-medium text-[var(--color-ink)] w-40 flex-shrink-0 truncate">
                  {ligne.label}
                </p>
                <div className="flex-1 h-1.5 rounded-full bg-[var(--color-rule)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${ligne.pct}%`, backgroundColor: ligne.couleur ?? "#5b4fcf" }}
                  />
                </div>
                <span className="text-[10px] font-bold w-7 text-right flex-shrink-0" style={{ color: ligne.couleur }}>
                  {ligne.pct}%
                </span>
              </>
            ) : (
              <>
                <div
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ligne.couleur ?? "#5b4fcf" }}
                />
                <p className="text-[11px] text-[var(--color-ink)] flex-1 truncate">{ligne.label}</p>
                {ligne.valeur && (
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: ligne.couleur }}>
                    {ligne.valeur}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function WelcomeTour({ role, prenom }: { role: Role; prenom: string }) {
  const cle = `edureussite_guide_${role}_v4`;
  const etapes = ETAPES[role];

  const [visible, setVisible] = useState(false);
  const [boutonVisible, setBoutonVisible] = useState(false);
  const [etape, setEtape] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cle);
      let etat: TourState;

      if (raw) {
        etat = JSON.parse(raw) as TourState;
      } else {
        etat = { firstSeen: Date.now(), seenCount: 0 };
        localStorage.setItem(cle, JSON.stringify(etat));
      }

      const dansLaSemaine = Date.now() - etat.firstSeen < SEPT_JOURS_MS;
      if (!dansLaSemaine) return;

      setBoutonVisible(true);

      if (etat.seenCount < MAX_AUTO_SHOWS) {
        const t = setTimeout(() => {
          setEtape(0);
          setVisible(true);
          const nouvelEtat: TourState = { ...etat, seenCount: etat.seenCount + 1 };
          localStorage.setItem(cle, JSON.stringify(nouvelEtat));
        }, 900);
        return () => clearTimeout(t);
      }
    } catch {
      // Silencieux si localStorage inaccessible
    }
  }, [cle]);

  const estDerniere = etape === etapes.length - 1;
  const courante = etapes[etape];

  function fermer() { setVisible(false); }
  function ouvrir() { setEtape(0); setVisible(true); }
  function suivant() { estDerniere ? fermer() : setEtape((e) => e + 1); }
  function precedent() { setEtape((e) => e - 1); }

  return (
    <>
      {/* ── Bouton flottant ? ── */}
      {boutonVisible && !visible && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={ouvrir}
            title="Guide d'utilisation"
            className="group relative h-12 w-12 rounded-full bg-[var(--color-ink)] text-white shadow-lg flex items-center justify-center font-black text-base hover:scale-110 active:scale-95 transition-all ring-4 ring-white/20"
          >
            ?
            <span className="absolute bottom-14 right-0 bg-[var(--color-ink)] text-white text-[11px] font-medium px-2.5 py-1 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Guide d&apos;utilisation
              <span className="absolute top-full right-3.5 border-4 border-transparent border-t-[var(--color-ink)]" />
            </span>
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {visible && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[4px]" onClick={fermer} />

          {/* Carte */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-[480px] rounded-3xl bg-[var(--color-paper)] shadow-[0_32px_80px_rgba(15,22,35,0.30)] overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barre de progression */}
              <div className="h-[3px] bg-[var(--color-rule)] flex-shrink-0">
                <div
                  className="h-full bg-[var(--color-ink)] transition-all duration-400 ease-out"
                  style={{ width: `${((etape + 1) / etapes.length) * 100}%` }}
                />
              </div>

              {/* En-tête sombre */}
              <div className="relative bg-[var(--color-ink)] px-7 pt-6 pb-5 text-center flex-shrink-0">
                <button
                  onClick={fermer}
                  className="absolute top-4 right-4 text-white/40 hover:text-white/90 text-xs font-semibold transition-colors"
                >
                  Passer ✕
                </button>

                <div className="text-4xl mb-2 leading-none">{courante.icon}</div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-white leading-tight">
                    {etape === 0 ? `Bonjour${prenom ? `, ${prenom}` : ""} !` : courante.titre}
                  </h2>
                  {courante.badge && (
                    <span className="rounded-full bg-[var(--color-gold)] px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wide">
                      {courante.badge}
                    </span>
                  )}
                </div>

                {/* Numérotation + nom de l'étape */}
                <p className="text-white/40 text-[10px] mt-1.5 font-medium tracking-wide uppercase">
                  {etape + 1} / {etapes.length} — {etape === 0 ? "Introduction" : courante.titre}
                </p>
              </div>

              {/* Corps — scrollable */}
              <div className="px-6 pt-5 pb-4 overflow-y-auto flex-1 min-h-0">
                {etape === 0 && (
                  <p className="text-[15px] font-black text-[var(--color-ink)] mb-2">
                    {courante.titre}
                  </p>
                )}

                <p className="text-sm text-[var(--color-ink)] leading-relaxed mb-4">
                  {courante.description}
                </p>

                {/* Mini-visuel si disponible */}
                {courante.visuel && <MiniVisuel visuel={courante.visuel} />}

                {/* Conseil */}
                <div className="rounded-2xl bg-[rgba(91,79,207,0.05)] border border-[rgba(91,79,207,0.15)] px-4 py-3 mb-4">
                  <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                    <span className="font-bold text-[var(--color-purple)]">💡 À savoir : </span>
                    {courante.conseil}
                  </p>
                </div>

                {/* Lien d'action */}
                {courante.lien && (
                  <Link
                    href={courante.lien.href}
                    onClick={fermer}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-rule)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors group"
                  >
                    <span>{courante.lien.label}</span>
                    <span className="text-[var(--color-ink-soft)] group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                )}
              </div>

              {/* Pied de page */}
              <div className="px-6 pb-6 flex-shrink-0 border-t border-[var(--color-rule)] pt-4">
                {/* Points de navigation */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {etapes.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEtape(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === etape
                          ? "w-6 bg-[var(--color-ink)]"
                          : i < etape
                          ? "w-1.5 bg-[var(--color-ink-soft)]"
                          : "w-1.5 bg-[var(--color-rule)]"
                      }`}
                      aria-label={`Aller à l'étape ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Boutons */}
                <div className="flex gap-2.5">
                  {etape > 0 && (
                    <button
                      onClick={precedent}
                      className="flex-1 rounded-2xl border border-[var(--color-rule)] bg-white py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-paper-warm)] transition-colors"
                    >
                      ← Précédent
                    </button>
                  )}
                  <button
                    onClick={suivant}
                    className="flex-[2] rounded-2xl bg-[var(--color-ink)] py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                  >
                    {estDerniere ? "C'est parti ! 🚀" : "Suivant →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
