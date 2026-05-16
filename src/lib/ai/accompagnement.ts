import { anthropic } from "./client";
import type {
  Matiere,
  NiveauScolaire,
  StyleApprentissage,
} from "@/generated/prisma";

interface CommentaireParentResume {
  type: string;
  contenu: string;
  date: string;
}

interface CommentaireEleveResume {
  type: string;
  contenu: string;
  matieres: string[];
  date: string;
}

export interface ProfilCognitifEvaluation {
  domaine: string;
  forces: string[];
  zonesVulnerabilite: string[];
  recommandationsParents: string[];
  ajustements: Record<string, boolean | string>;
}

interface ProfilPourAccompagnement {
  prenom: string;
  nom: string;
  niveauScolaire: NiveauScolaire;
  styleApprentissage?: StyleApprentissage | null;
  matieresPreferees: Matiere[];
  matieresRedoutees: Matiere[];
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  autresBesoins?: string | null;
  streakJours: number;
  niveauxMatieres: { matiere: Matiere; scoreGlobal: number; niveau: string }[];
  derniersCheckIns: { etat: string }[];
  exercicesRecents: { score: number | null; matiere: string }[];
  planActif: { titre: string; objectifs: { titre: string; atteint: boolean; matiere: string }[] } | null;
  commentairesParent?: CommentaireParentResume[];
  commentairesEleve?: CommentaireEleveResume[];
  profilCognitif?: ProfilCognitifEvaluation | null;
}

export interface StrategieAccompagnement {
  titre: string;
  description: string;
  frequence: string;
  actions: string[];
}

export interface AxeAccompagnement {
  axe: string;
  icone: string;
  priorite: "haute" | "moyenne" | "basse";
  contexte: string;
  strategies: StrategieAccompagnement[];
}

export interface CitationRecherche {
  auteurs: string;
  annee: number;
  titre: string;
  publication: string;
}

export interface StrategieRecherche {
  domaine: string;
  icone: string;
  citation: CitationRecherche;
  conclusion: string;
  applicationPratique: string[];
}

export interface PlanAccompagnementGenere {
  synthese: {
    profilGlobal: string;
    pointsForts: string[];
    defisIdentifies: string[];
    styleApprentissage: string;
  };
  analyseExperte: {
    orthopedagogue: string;
    coach: string;
    psychoneurologue: string;
    conseillerEducation: string;
    enseignant: string;
  };
  axes: AxeAccompagnement[];
  strategiesRecherche: StrategieRecherche[];
  routineRecommandee: {
    avantEcole: string[];
    retourEcole: string[];
    soirEtude: string[];
    weekend: string[];
  };
  signesAObserver: { signe: string; action: string }[];
  messageAuParent: string;
}

const NIVEAUX_LABELS: Record<NiveauScolaire, string> = {
  PRIMAIRE_1: "1re année du primaire",
  PRIMAIRE_2: "2e année du primaire",
  PRIMAIRE_3: "3e année du primaire",
  PRIMAIRE_4: "4e année du primaire",
  PRIMAIRE_5: "5e année du primaire",
  PRIMAIRE_6: "6e année du primaire",
  SECONDAIRE_1: "1re secondaire",
  SECONDAIRE_2: "2e secondaire",
  SECONDAIRE_3: "3e secondaire",
  SECONDAIRE_4: "4e secondaire",
  SECONDAIRE_5: "5e secondaire",
  SECONDAIRE_6: "6e secondaire / 1ère",
  SECONDAIRE_7: "Terminale",
};

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ETHIQUE: "Éthique",
  ANGLAIS: "Anglais",
  EDUCATION_PHYSIQUE: "Éducation physique",
};

const ETATS_LABELS: Record<string, string> = {
  TRES_BIEN: "très bien", BIEN: "bien", CORRECT: "correct",
  FATIGUE: "fatigué(e)", STRESSE: "stressé(e)", TRISTE: "triste",
};

const DOMAINE_LABELS: Record<string, string> = {
  NEUROPSYCHOLOGUE: "Neuropsychologue",
  ORTHOPEDAGOGUE: "Orthopédagogue",
  ORTHOPHONISTE: "Orthophoniste",
  ERGOTHERAPEUTE: "Ergothérapeute",
  OPTOMETRISTE: "Optométriste",
  PSYCHOEDUCATEUR: "Psychoéducateur",
};

export async function genererPlanAccompagnement(
  profil: ProfilPourAccompagnement,
  contexteDocuments = ""
): Promise<PlanAccompagnementGenere> {

  // Calculer le score moyen global
  const scores = profil.exercicesRecents
    .map((e) => e.score)
    .filter((s): s is number => s !== null);
  const scoreMoyen = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  // Humeur dominante récente
  const humeursNegatives = ["STRESSE", "TRISTE", "FATIGUE"];
  const alerteEmotionnelle = profil.derniersCheckIns.length >= 2 &&
    profil.derniersCheckIns.slice(0, 3).every(c => humeursNegatives.includes(c.etat));

  // Matières en difficulté
  const matieresEnDifficulte = profil.niveauxMatieres
    .filter(n => n.scoreGlobal < 60 || n.niveau === "EN_DIFFICULTE")
    .map(n => MATIERES_LABELS[n.matiere] ?? n.matiere);

  const prompt = `Tu es une équipe pluridisciplinaire d'experts en éducation québécoise composée de :
1. Une ORTHOPÉDAGOGUE spécialisée en troubles d'apprentissage et rééducation
2. Un COACH EN DÉVELOPPEMENT DE L'ENFANT (motivation, confiance, régulation émotionnelle)
3. Une PSYCHONEUROLOGUE spécialisée en neurosciences de l'apprentissage
4. Un CONSEILLER EN ORIENTATION ET ÉDUCATION familiale québécoise
5. Une ENSEIGNANTE chevronnée du programme PFEQ

Voici le profil complet de l'élève à analyser :

═══ PROFIL DE L'ÉLÈVE ═══
• Nom : ${profil.prenom} ${profil.nom}
• Niveau : ${NIVEAUX_LABELS[profil.niveauScolaire]}
• Style d'apprentissage : ${profil.styleApprentissage ?? "Non identifié"}
• Matières préférées : ${profil.matieresPreferees.map(m => MATIERES_LABELS[m]).join(", ") || "Non spécifiées"}
• Matières difficiles : ${profil.matieresRedoutees.map(m => MATIERES_LABELS[m]).join(", ") || "Non spécifiées"}
• Streak d'utilisation : ${profil.streakJours} jour(s) consécutifs

═══ BESOINS PARTICULIERS ═══
• TDAH : ${profil.tdah ? "OUI — impact sur l'attention, l'impulsivité, l'organisation" : "Non"}
• Dyslexie : ${profil.dyslexie ? "OUI — impact sur la lecture/écriture" : "Non"}
• Anxiété scolaire : ${profil.anxieteScolaire ? "OUI — impact sur la performance et le bien-être" : "Non"}
${profil.autresBesoins ? `• Autres besoins : ${profil.autresBesoins}` : ""}

═══ DONNÉES DE PROGRESSION ═══
• Score moyen aux exercices : ${scoreMoyen !== null ? `${scoreMoyen}%` : "Pas encore d'exercices complétés"}
• Matières avec difficultés détectées : ${matieresEnDifficulte.length > 0 ? matieresEnDifficulte.join(", ") : "Aucune"}
• Résultats par matière :
${profil.niveauxMatieres.map(n =>
  `  - ${MATIERES_LABELS[n.matiere] ?? n.matiere} : ${Math.round(n.scoreGlobal)}% (niveau : ${n.niveau === "AVANCE" ? "avancé" : n.niveau === "EN_DIFFICULTE" ? "en difficulté" : "attendu"})`
).join("\n") || "  Aucune donnée encore"}

═══ ÉTAT ÉMOTIONNEL ═══
• Humeurs récentes : ${profil.derniersCheckIns.map(c => ETATS_LABELS[c.etat] ?? c.etat).join(", ") || "Non enregistrées"}
• Alerte émotionnelle : ${alerteEmotionnelle ? "OUI — humeurs négatives répétées" : "Non"}

═══ PLAN D'ACTION EN COURS ═══
${profil.planActif
  ? `• "${profil.planActif.titre}"
  Objectifs : ${profil.planActif.objectifs.map(o => `${o.atteint ? "✓" : "○"} ${o.titre} (${MATIERES_LABELS[o.matiere] ?? o.matiere})`).join(", ")}`
  : "• Aucun plan actif"}
${(profil.commentairesParent && profil.commentairesParent.length > 0) ? `
═══ NOTES DU PARENT ET DE L'ENSEIGNANT ═══
${profil.commentairesParent.map(c => {
  const labels: Record<string, string> = {
    OBSERVATION_PARENT: "Observation du parent",
    COMMENTAIRE_ENSEIGNANT: "Note de l'enseignant",
    PLAN_INTERVENTION: "Plan d'intervention (PIE)",
    RAPPORT_BILAN: "Rapport / Bilan",
    AUTRE: "Note",
  };
  return `• [${labels[c.type] ?? c.type}] (${c.date}) : ${c.contenu}`;
}).join("\n")}
IMPORTANT : Intégrez EXPLICITEMENT ces informations dans votre analyse. Les notes du parent et de l'enseignant sont prioritaires et doivent orienter vos recommandations.` : ""}
${(profil.commentairesEleve && profil.commentairesEleve.length > 0) ? `
═══ MESSAGES DE L'ÉLÈVE LUI-MÊME ═══
${profil.commentairesEleve.map(c => {
  const labels: Record<string, string> = {
    DIFFICULTE: "Difficulté signalée par l'élève",
    OBJECTIF_MAITRISE: "Objectif que l'élève veut maîtriser",
    QUESTION: "Question posée par l'élève",
    AUTRE: "Note de l'élève",
  };
  const matieres = c.matieres.length > 0 ? ` [${c.matieres.join(", ")}]` : "";
  return `• [${labels[c.type] ?? c.type}]${matieres} (${c.date}) : ${c.contenu}`;
}).join("\n")}
TRÈS IMPORTANT : L'élève a exprimé lui-même ces besoins. Intégrez-les directement dans vos recommandations au parent — dites-lui comment l'aider sur ces points précis.` : ""}

${profil.profilCognitif ? `
═══ PROFIL COGNITIF (ÉVALUATION SPÉCIALISÉE) ═══
Un spécialiste (${DOMAINE_LABELS[profil.profilCognitif.domaine] ?? profil.profilCognitif.domaine}) a évalué cet enfant et voici les résultats :

• Forces identifiées par le spécialiste :
${profil.profilCognitif.forces.map(f => `  - ${f}`).join("\n") || "  Aucune force documentée"}

• Zones nécessitant un soutien selon le spécialiste :
${profil.profilCognitif.zonesVulnerabilite.map(z => `  - ${z}`).join("\n") || "  Aucune zone documentée"}

• Recommandations du spécialiste pour les parents :
${profil.profilCognitif.recommandationsParents.map(r => `  - ${r}`).join("\n") || "  Aucune recommandation documentée"}

• Ajustements validés par le parent :
${Object.entries(profil.profilCognitif.ajustements).filter(([, v]) => v === true || (typeof v === "string" && v)).map(([k, v]) => `  - ${k}${typeof v === "string" ? ` : ${v}` : ""}`).join("\n") || "  Aucun ajustement spécifique"}

TRÈS IMPORTANT : Ce rapport a été validé par le parent. Intégrez ces résultats comme base prioritaire de votre analyse. Les forces et zones de vulnérabilité identifiées par le spécialiste doivent orienter directement vos recommandations concrètes.
` : ""}
═══ MISSION ═══
Produisez un plan d'accompagnement parental COMPLET, CONCRET et BIENVEILLANT.
Ce plan est destiné AU PARENT — pas à l'enseignant ni à l'enfant directement.
Utilisez un langage accessible, chaleureux et pratique.
Basez-vous sur les données réelles ci-dessus.
Respectez le contexte scolaire québécois (PFEQ, rythme académique québécois).
${contexteDocuments}
═══ CHERCHEURS DE RÉFÉRENCE (à utiliser selon le profil) ═══
• TDAH / Fonctions exécutives : Barkley (2012, Executive Functions), Dawson & Guare (2010, Executive Skills in Children), Brown (2013, A New Understanding of ADHD)
• Dyslexie / Lecture : Dehaene (2007, Les Neurones de la lecture), Shaywitz (2003, Overcoming Dyslexia), Wolf (2007, Proust and the Squid)
• Anxiété scolaire : Siegel & Bryson (2011, The Whole-Brain Child), Kearney (2008, School Refusal Behavior), Rapee et al. (2000, Helping Your Anxious Child)
• Motivation / Croissance : Dweck (2006, Mindset), Deci & Ryan (1985, Self-Determination Theory), Bandura (1997, Self-Efficacy)
• Implication parentale : Hoover-Dempsey & Sandler (1995, Journal of Educational Psychology), Fan & Chen (2001, meta-analyse), Epstein (2001, School, Family, Community Partnerships)
• Neurosciences apprentissage : Hattie (2009, Visible Learning), Vygotski (1978, ZPD), Sousa (2011, How the Brain Learns)
• Sommeil / Santé : Walker (2017, Why We Sleep), Ratey (2008, Spark), Gruber (2014, sleep & cognition in children)

Répondez UNIQUEMENT avec ce JSON (sans markdown, sans texte avant/après) :
{
  "synthese": {
    "profilGlobal": "Paragraphe de 3-4 phrases décrivant le profil global de l'enfant de manière positive et nuancée",
    "pointsForts": ["Force 1", "Force 2", "Force 3", "Force 4"],
    "defisIdentifies": ["Défi 1", "Défi 2", "Défi 3"],
    "styleApprentissage": "Description du style et comment l'exploiter à la maison"
  },
  "analyseExperte": {
    "orthopedagogue": "Analyse courte (3-4 phrases) des défis d'apprentissage observés et recommandations spécifiques",
    "coach": "Analyse courte (3-4 phrases) de la motivation, confiance et dynamique parent-enfant à cultiver",
    "psychoneurologue": "Analyse courte (3-4 phrases) sur le fonctionnement cérébral, gestion du stress, recommandations neurologiques",
    "conseillerEducation": "Analyse courte (3-4 phrases) sur l'environnement scolaire, la routine et l'équilibre famille-école",
    "enseignant": "Analyse courte (3-4 phrases) sur les compétences PFEQ, les lacunes disciplinaires et comment y remédier"
  },
  "axes": [
    {
      "axe": "Nom de l'axe (ex: Environnement d'apprentissage)",
      "icone": "emoji unique",
      "priorite": "haute",
      "contexte": "Pourquoi cet axe est important pour CET enfant précisément",
      "strategies": [
        {
          "titre": "Titre court de la stratégie",
          "description": "Explication concrète adaptée au parent",
          "frequence": "Quotidien / 3x semaine / Hebdomadaire",
          "actions": ["Action concrète 1", "Action concrète 2", "Action concrète 3"]
        }
      ]
    }
  ],
  "strategiesRecherche": [
    {
      "domaine": "Nom du domaine ciblé (ex: Gestion de l'attention, Motivation scolaire, Sommeil et apprentissage…)",
      "icone": "emoji représentatif",
      "citation": {
        "auteurs": "Nom(s) du ou des chercheurs (ex: Barkley, R.A.)",
        "annee": 2012,
        "titre": "Titre exact de l'ouvrage ou de l'article",
        "publication": "Éditeur ou revue scientifique"
      },
      "conclusion": "Ce que cette recherche démontre, expliqué clairement pour un parent (2-3 phrases accessibles, sans jargon)",
      "applicationPratique": ["Geste concret 1 que le parent peut faire dès ce soir", "Geste concret 2 applicable à la maison", "Geste concret 3 adapté au profil de l'enfant"]
    }
  ],
  "routineRecommandee": {
    "avantEcole": ["Suggestion 1 (5-10 min)", "Suggestion 2"],
    "retourEcole": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
    "soirEtude": ["Étape 1", "Étape 2", "Étape 3", "Étape 4"],
    "weekend": ["Activité 1", "Activité 2"]
  },
  "signesAObserver": [
    {
      "signe": "Signe comportemental ou académique à surveiller",
      "action": "Que faire si ce signe apparaît"
    }
  ],
  "messageAuParent": "Message chaleureux et encourageant de 3-4 phrases pour le parent, reconnaissant son investissement et lui donnant confiance"
}

IMPORTANT :
- Les axes doivent couvrir au minimum : environnement, routine, soutien émotionnel, stratégies académiques, communication école-famille. Proposez 4 à 6 axes selon le profil. Chaque axe doit avoir 2-3 stratégies avec 3-4 actions concrètes chacune.
- Pour "strategiesRecherche" : Proposez 4 à 6 stratégies basées sur de VRAIES recherches scientifiques. Choisissez les chercheurs et domaines LES PLUS PERTINENTS pour CE profil spécifique (TDAH → Barkley, dyslexie → Dehaene/Shaywitz, anxiété → Siegel, etc.). Les citations doivent être réelles et exactes. Expliquez la recherche en langage accessible pour un parent, puis donnez 3 gestes concrets directement applicables.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    // Nettoyer les éventuels blocs markdown
    const cleaned = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Plan de secours minimal
    return {
      synthese: {
        profilGlobal: `${profil.prenom} est un(e) élève de ${NIVEAUX_LABELS[profil.niveauScolaire]} avec ses propres forces et défis. Votre accompagnement quotidien est essentiel à sa réussite.`,
        pointsForts: ["Régularité et persévérance", "Curiosité naturelle", "Engagement dans les activités préférées"],
        defisIdentifies: profil.matieresRedoutees.length > 0
          ? profil.matieresRedoutees.map(m => `Renforcer les bases en ${MATIERES_LABELS[m]}`)
          : ["Maintenir la motivation à long terme"],
        styleApprentissage: "Un style d'apprentissage varié — explorez différentes approches pour trouver ce qui fonctionne le mieux.",
      },
      analyseExperte: {
        orthopedagogue: "Des stratégies de soutien adaptées peuvent faire une grande différence. Privilégiez des sessions courtes et régulières, en alternant les supports (visuel, oral, manipulatoire).",
        coach: "Célébrez chaque progrès, aussi petit soit-il. La confiance se construit sur l'accumulation de petites victoires.",
        psychoneurologue: "Le cerveau apprend mieux dans un état de calme et de sécurité. Assurez des nuits de sommeil suffisantes et minimisez le stress avant les périodes de devoirs.",
        conseillerEducation: "Une communication régulière avec l'enseignant(e) vous permettra d'aligner les stratégies à la maison avec celles de l'école.",
        enseignant: "Référez-vous au programme PFEQ pour comprendre les attentes de fin d'année. Votre enfant a besoin d'un renforcement régulier des compétences de base.",
      },
      axes: [
        {
          axe: "Environnement d'apprentissage",
          icone: "🏠",
          priorite: "haute",
          contexte: "Un espace dédié aux devoirs aide l'enfant à se concentrer.",
          strategies: [{
            titre: "Créer un coin étude",
            description: "Un espace calme, bien éclairé, sans écran distrayant.",
            frequence: "Quotidien",
            actions: ["Choisir ensemble l'espace de travail", "Ranger le matériel la veille", "Mettre le téléphone hors de portée pendant les devoirs"],
          }],
        },
        {
          axe: "Routine quotidienne",
          icone: "⏰",
          priorite: "haute",
          contexte: "La régularité réduit l'anxiété et améliore la concentration.",
          strategies: [{
            titre: "Heure fixe de devoirs",
            description: "Toujours à la même heure, après une courte pause post-école.",
            frequence: "Quotidien",
            actions: ["Pause de 20 min au retour de l'école", "Commencer par la matière la plus difficile", "Finir avec une matière aimée"],
          }],
        },
      ],
      strategiesRecherche: [
        {
          domaine: "Implication parentale et réussite scolaire",
          icone: "🤝",
          citation: {
            auteurs: "Hoover-Dempsey, K.V. & Sandler, H.M.",
            annee: 1995,
            titre: "Parental involvement in children's education: Why does it make a difference?",
            publication: "Teachers College Record",
          },
          conclusion: "Cette recherche démontre que l'implication active et chaleureuse du parent — pas uniquement l'aide aux devoirs, mais la communication sur l'école, les encouragements et la présence émotionnelle — est l'un des facteurs les plus puissants de réussite scolaire. L'enfant qui se sent soutenu à la maison développe une meilleure confiance en ses capacités.",
          applicationPratique: [
            "Demandez chaque soir : « Qu'est-ce qui t'a rendu fier aujourd'hui ? » plutôt que « As-tu eu de bonnes notes ? »",
            "Assistez à au moins une activité scolaire par mois (réunion, spectacle, remise de bulletin) pour signifier que l'école compte pour vous aussi",
            "Créez un rituel hebdomadaire autour des apprentissages : cuisine avec fractions, lecture partagée, jeu de questions-réponses",
          ],
        },
        {
          domaine: "Motivation intrinsèque et autonomie",
          icone: "🌱",
          citation: {
            auteurs: "Deci, E.L. & Ryan, R.M.",
            annee: 1985,
            titre: "Intrinsic Motivation and Self-Determination in Human Behavior",
            publication: "Springer",
          },
          conclusion: "La théorie de l'autodétermination montre que les enfants apprennent mieux lorsqu'ils se sentent compétents, autonomes et en lien avec les autres. Les récompenses extérieures (argent, punitions) détruisent la motivation à long terme. Ce qui dure, c'est le sentiment de « je suis capable » et « ça m'intéresse ».",
          applicationPratique: [
            "Laissez votre enfant choisir l'ordre dans lequel il fait ses devoirs — ce petit contrôle renforce le sentiment d'autonomie",
            "Remplacez « bravo, tu es intelligent » par « bravo, tu as bien travaillé sur ce problème » pour ancrer l'effort plutôt que le talent",
            "Reliez les apprentissages à ses centres d'intérêt : sports, jeux vidéo, animaux — trouvez ensemble comment les maths ou le français y sont présents",
          ],
        },
      ],
      routineRecommandee: {
        avantEcole: ["Petit déjeuner nutritif ensemble", "Révision rapide (5 min) du programme de la journée"],
        retourEcole: ["Pause collation et détente (20-30 min)", "Discussion positive sur la journée", "Début des devoirs"],
        soirEtude: ["Révision des leçons à voix haute", "Exercices de pratique courts", "Préparation du cartable pour le lendemain"],
        weekend: ["Activité plaisir liée aux apprentissages", "Lecture partagée 20 minutes"],
      },
      signesAObserver: [
        { signe: "Refus répété de faire les devoirs", action: "Discuter calmement, identifier le blocage, contacter l'enseignant(e)" },
        { signe: "Plaintes fréquentes de maux de ventre avant l'école", action: "Parler à votre médecin et à l'école — signe possible d'anxiété scolaire" },
      ],
      messageAuParent: `Votre investissement dans la réussite de ${profil.prenom} est remarquable. Chaque effort que vous faites, même imparfait, contribue à bâtir sa confiance et ses compétences. Vous n'avez pas à tout faire parfaitement — votre présence bienveillante est déjà un atout immense.`,
    };
  }
}
