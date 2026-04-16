import { anthropic } from "./client";
import type { NiveauScolaire, StyleApprentissage } from "@/generated/prisma";

// ─── Types exportés ──────────────────────────────────────────────────────────

export interface ErreurIdentifiee {
  erreur: string;
  commentCaSeManifeste: string;
  pourquoiCestNormal: string;
}

export interface EtapeLecon {
  numero: number;
  titre: string;
  lienAvecErreur: string;       // Quelle erreur de l'élève cette étape corrige
  explication: string;           // L'explication claire du concept (peut contenir [FIGURE:xxx])
  analogie: string;              // Toujours dans l'univers de l'élève
  figureCode?: string;           // Code SVG optionnel ex: "trapeze", "arbre_proba" (sans crochets)
  demonstration: string;         // Résolution pas à pas, numérotée (peut contenir [FIGURE:xxx])
  methodeQC?: string;            // Méthode pédagogique québécoise utilisée
  pointCle: string;              // La chose la plus importante à retenir
  checkpoint: string;            // Question courte à tenter avant de passer
  checkpointReponse: string;     // Réponse attendue au checkpoint
  checkpointExplication: string; // Pourquoi c'est la bonne réponse
}

export interface ExerciceVerification {
  numero: number;
  enonce: string;
  indices: string[];
  solution: string;
  explicationSolution: string;
  encouragement: string;
}

export interface BasePedagogique {
  approche: string;
  chercheur: string;
  annee: number;
  source: string;
  explication: string;
}

export interface CoursStructure {
  titre: string;
  matiere: string;
  niveauDifficulte: string;
  introduction: string;
  erreursIdentifiees: ErreurIdentifiee[];
  lecon: EtapeLecon[];
  astucesMnemotechniques: string[];
  basesPedagogiques: BasePedagogique[];
  exercicesVerification: ExerciceVerification[];
  messageEncouragement: string;
  prochainDefi: string;
  dureeEstimeeMinutes: number;
}

// ─── Profil pour la génération ────────────────────────────────────────────────

export interface ProfilPourCours {
  prenom: string;
  niveauScolaire: NiveauScolaire;
  styleApprentissage?: StyleApprentissage | null;
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  centresInteret: string[];
  sportFavori?: string | null;
  universMediatique?: string | null;
  autresPassions?: string | null;
  personnalite: string[];
}

export interface ExerciceAvecFeedback {
  titre: string;
  consigne: string;
  matiere: string;
  reponseEleve: unknown;
  feedbackIA: string | null;
  score: number | null;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const NIVEAUX_LABELS: Record<NiveauScolaire, string> = {
  PRIMAIRE_1: "1re année primaire", PRIMAIRE_2: "2e année primaire",
  PRIMAIRE_3: "3e année primaire", PRIMAIRE_4: "4e année primaire",
  PRIMAIRE_5: "5e année primaire", PRIMAIRE_6: "6e année primaire",
  SECONDAIRE_1: "1re secondaire", SECONDAIRE_2: "2e secondaire",
  SECONDAIRE_3: "3e secondaire", SECONDAIRE_4: "4e secondaire",
  SECONDAIRE_5: "5e secondaire",
  SECONDAIRE_6: "6e secondaire / 1ère",
  SECONDAIRE_7: "Terminale",
};

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

const STYLES_LABELS: Record<string, string> = {
  VISUEL: "visuel", AUDITIF: "auditif",
  KINESTHESIQUE: "kinesthésique", LECTURE_ECRITURE: "lecture-écriture",
};

const INTERETS_LABELS: Record<string, string> = {
  SOCCER: "soccer", HOCKEY: "hockey", BASKETBALL: "basketball",
  NATATION: "natation", JEUX_VIDEO: "jeux vidéo", MANGA_BD: "manga et BD",
  LECTURE: "lecture", MUSIQUE: "musique", CINEMA_SERIES: "films et séries",
  YOUTUBE: "YouTube/TikTok", DESSIN: "dessin", CUISINE: "cuisine",
  DANSE: "danse", THEATRE: "théâtre", ANIMAUX: "animaux",
  NATURE: "nature", TECHNOLOGIE: "technologie", VOYAGE: "voyage",
  MODE: "mode", SPORT_AUTRE: "sport",
};

// ─── Extraction des erreurs depuis le feedback IA ─────────────────────────────

function extraireErreursDepuisFeedback(feedbackIA: string | null): string {
  if (!feedbackIA) return "Difficulté de compréhension générale";
  try {
    const f = JSON.parse(feedbackIA) as Record<string, unknown>;

    // Format épreuve : correctionParQuestion avec etapes et explication
    if (f.correctionParQuestion && typeof f.correctionParQuestion === "object") {
      const corrections = Object.values(
        f.correctionParQuestion as Record<string, { bonne?: boolean; explication?: string; etapes?: Array<{ erreurEleve?: string }> }>
      );
      const erreurs = corrections
        .filter((c) => c.bonne === false)
        .map((c) => {
          const erreurEleve = c.etapes?.find((e) => e.erreurEleve)?.erreurEleve;
          return erreurEleve || c.explication || "";
        })
        .filter(Boolean)
        .join(" | ");
      if (erreurs) return erreurs;
    }

    // Format exercice ponctuel : correctionDetaillee avec erreurEleve
    if (f.correctionDetaillee && typeof f.correctionDetaillee === "object") {
      const erreurs = Object.values(
        f.correctionDetaillee as Record<string, { erreurEleve?: string; explication?: string }>
      )
        .map((step) => step.erreurEleve || step.explication || "")
        .filter(Boolean)
        .join(" | ");
      if (erreurs) return erreurs;
    }

    // Format simple : explication directe
    if (typeof f.explication === "string" && f.explication) return f.explication;

    return "Difficulté identifiée dans les exercices";
  } catch {
    return typeof feedbackIA === "string" ? feedbackIA.slice(0, 300) : "Difficulté identifiée";
  }
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function genererCours(
  profil: ProfilPourCours,
  exercices: ExerciceAvecFeedback[]
): Promise<CoursStructure> {

  const interets = profil.centresInteret
    .map((c) => INTERETS_LABELS[c] ?? c)
    .join(", ") || "diverses activités";

  const univers = [
    profil.universMediatique,
    profil.sportFavori,
    profil.autresPassions,
  ].filter(Boolean).join(", ") || interets;

  const matieresDansExercices = [...new Set(exercices.map((e) => e.matiere))];
  const matiereLabel = matieresDansExercices.map((m) => MATIERES_LABELS[m] ?? m).join(", ");

  const adaptations: string[] = [];
  if (profil.tdah) adaptations.push("TDAH : phrases ultra-courtes, une seule idée par paragraphe, bullets, timer visuel suggéré");
  if (profil.dyslexie) adaptations.push("Dyslexie : pas de blocs denses, listes à puces, exemples très visuels, mots simples");
  if (profil.anxieteScolaire) adaptations.push("Anxiété scolaire : ton rassurant, normaliser chaque erreur, progression très douce, jamais de jugement");
  if (profil.styleApprentissage) adaptations.push(`Style d'apprentissage ${STYLES_LABELS[profil.styleApprentissage] ?? profil.styleApprentissage} : adapter les exemples et analogies à ce style`);

  const personnaliteTexte = profil.personnalite.length > 0
    ? profil.personnalite.map((p) => p.toLowerCase()).join(", ")
    : "curieux et déterminé";

  const resumeExercices = exercices.map((e, i) => {
    const erreurs = extraireErreursDepuisFeedback(e.feedbackIA);
    return `Exercice ${i + 1} — ${MATIERES_LABELS[e.matiere] ?? e.matiere} — Score : ${e.score !== null ? `${Math.round(e.score)}%` : "N/A"}
Titre : "${e.titre}"
Ce qui était demandé : "${e.consigne}"
Réponse de l'élève : ${JSON.stringify(e.reponseEleve)}
Erreurs et difficultés détectées : ${erreurs}`;
  }).join("\n\n---\n\n");

  const systemPrompt = `Tu es un orthopédagogue et enseignant-ressource d'élite, spécialisé en pédagogie québécoise (Programme de formation de l'école québécoise — PFEQ/MEES).
Ta conviction profonde : il n'existe pas d'enfant incapable — il existe des explications qui n'ont pas encore trouvé leur chemin.
Tu combines trois rôles en un :
1. COACH : tu encourages, tu motives, tu crois en l'élève avec une conviction absolue
2. ENSEIGNANT : tu expliques avec clarté, précision et progression, une idée à la fois
3. GUIDE : tu amènes l'élève à découvrir par lui-même, pas à mémoriser passivement

━━━ ADAPTATIONS OBLIGATOIRES SELON LE PROFIL ━━━
${adaptations.length > 0 ? adaptations.join("\n") : "Aucune adaptation spéciale — niveau standard"}

━━━ ALIGNEMENT PFEQ OBLIGATOIRE ━━━
Chaque étape doit s'appuyer sur les compétences et domaines du PFEQ :
• Mathématiques primaire : résoudre des situations-problèmes, raisonner, communiquer (progression des apprentissages MEQ)
• Mathématiques secondaire : démarche de résolution de problèmes en 5 étapes (comprendre, planifier, appliquer, vérifier, communiquer)
• Français : compétences en lecture (dégager sens, réagir), en écriture (cohérence, syntaxe)
• Sciences : démarche scientifique et technologique, liens STIM
• Pour chaque étape, indique dans "methodeQC" la méthode pédagogique québécoise explicitement utilisée, ex :
  - "Modèle CPA (Concret-Pictural-Abstrait) — MEQ"
  - "Démarche de résolution de problèmes en 5 étapes — PFEQ"
  - "Approche par situations-problèmes — PFEQ"
  - "Stratégie des 3 lectures — MEQ"
  - "Protocole de correction en 4 temps — MEQ"
  - "Modelage interactif (Think-Aloud) — pratiques efficaces MEES"
  - "Enseignement explicite — modèle Rosenshine-MEQ"

━━━ FIGURES PÉDAGOGIQUES VISUELLES ━━━
Quand la notion est visuelle (géométrie, probabilités, fractions, graphiques, angles), insère obligatoirement
une figure en plaçant le code dans le champ "figureCode" de l'étape concernée.
Codes disponibles (utilise EXACTEMENT ces codes, jamais d'approximation) :
  2D : carre | rectangle | triangle_rectangle | triangle | cercle
       trapeze | losange | parallelogramme | triangle_isocele | triangle_equilateral
       pentagone | hexagone | heptagone | octogone | quadrilateres
  3D : cube | pave | pyramide | cone | cylindre | sphere | prisme
  Proba : arbre_proba | tableau_proba | venn
  Fractions : fraction_1_2 | fraction_1_3 | fraction_2_3 | fraction_1_4 | fraction_3_4
              fraction_cercle_1_2 | fraction_cercle_1_3 | fraction_cercle_1_4 | fraction_cercle_3_4
  Nombres : droite_numerique | axes
  Angles : angle_droit | angle_aigu | angle_obtus
Si la figure exacte n'est pas dans cette liste → laisse "figureCode" vide ou absent. Ne jamais approximer.

━━━ LANGUE ET NIVEAU D'ÂGE ━━━
Adapte obligatoirement le vocabulaire et la syntaxe au niveau scolaire :
• Primaire 1-3 : phrases de max 10 mots, vocabulaire quotidien, beaucoup d'images concrètes
• Primaire 4-6 : phrases courtes, exemples du quotidien, max 2 idées par paragraphe
• Secondaire 1-2 : ton plus mature mais accessible, analogies culturelles modernes
• Secondaire 3-5 : langage précis, terminologie disciplinaire correcte, nuances

━━━ RÈGLES DE TON ━━━
- Jamais condescendant, jamais de "tu aurais dû savoir"
- Toujours : "Voici comment on va voir ça ensemble"
- Quand une notion est difficile : "C'est normal, voici pourquoi même des adultes trouvent ça difficile parfois"
- Mentionner le prénom de l'élève dans les exemples et encouragements
- Utiliser les intérêts de l'élève OBLIGATOIREMENT dans les analogies

━━━ MÉTHODE PÉDAGOGIQUE PAR ÉTAPE (séquence obligatoire) ━━━
1. Partir de l'erreur concrète de l'élève → montrer ce qui s'est passé (sans jugement)
2. Expliquer le concept → une idée, en mots simples adaptés à l'âge
3. Figure visuelle → si la notion s'y prête (géométrie, fractions, stats), placer le "figureCode" approprié
4. Analogie → dans l'univers de l'élève (sport, jeu, série préférée)
5. Démonstration → résolution numérotée pas à pas avec les VRAIS calculs, chaque micro-étape visible
6. Méthode QC → nomme explicitement la méthode enseignée à l'école québécoise dans "methodeQC"
7. Point clé → "À retenir : la chose la plus importante en 1 phrase"
8. Checkpoint → mini-question vérifiable en 30 secondes, avec réponse complète et explication

Réponds UNIQUEMENT avec du JSON valide, sans markdown.`;

  const userPrompt = `PROFIL DE L'ÉLÈVE :
• Prénom : ${profil.prenom}
• Niveau : ${NIVEAUX_LABELS[profil.niveauScolaire]}
• Style d'apprentissage : ${profil.styleApprentissage ? STYLES_LABELS[profil.styleApprentissage] : "non déterminé"}
• Personnalité : ${personnaliteTexte}
• Univers / intérêts : ${univers}

EXERCICES ET ERREURS FAITES :
${resumeExercices}

MATIÈRE(S) CONCERNÉE(S) : ${matiereLabel}

TA MISSION : Crée un cours de remédiation complet, progressif et engageant qui amène ${profil.prenom} à vraiment COMPRENDRE — pas juste à mémoriser.

Réponds avec ce JSON exact :
{
  "titre": "Titre accrocheur et encourageant, lié aux erreurs ET aux intérêts de ${profil.prenom} (ex: 'Les pourcentages expliqués à travers le soccer de Neymar !')",
  "matiere": "${matieresDansExercices[0] ?? "FRANCAIS"}",
  "niveauDifficulte": "Description courte du niveau ciblé",
  "introduction": "Message chaleureux et PERSONNEL à ${profil.prenom} (4-5 phrases). Reconnaître ses efforts et ce qu'il/elle a bien fait. Annoncer qu'on va régler les points bloquants ensemble, étape par étape. Référencer ses intérêts pour créer un lien immédiat. TON : coach bienveillant et confiant, jamais moralisateur.",
  "erreursIdentifiees": [
    {
      "erreur": "Nom court et précis de l'erreur",
      "commentCaSeManifeste": "Description TRÈS CONCRÈTE de comment cette erreur est apparue dans les exercices de ${profil.prenom} — avec des exemples tirés de ses réponses réelles",
      "pourquoiCestNormal": "Explication bienveillante et factuelle — pourquoi beaucoup d'élèves font cette même erreur, quel est le mécanisme cognitif derrière, et que ça ne veut rien dire sur son intelligence"
    }
  ],
  "lecon": [
    {
      "numero": 1,
      "titre": "Titre court et clair de cette étape (ex: 'Comprendre ce qu'est vraiment un pourcentage')",
      "lienAvecErreur": "En 1-2 phrases : quelle erreur spécifique cette étape corrige, et comment elle va la corriger",
      "explication": "Explication claire et complète du concept — adaptée au niveau ${NIVEAUX_LABELS[profil.niveauScolaire]}. Plusieurs phrases, une idée progressive à la fois. Pas de jargon sans définition immédiate. Commence par 'Ce que tu dois savoir, c'est que...' Inclus des exemples concrets avec des vrais chiffres ou vrais mots.",
      "figureCode": "Code figure si visuellement utile (ex: 'trapeze', 'arbre_proba', 'fraction_cercle_1_2') — sinon chaîne vide",
      "analogie": "Analogie dans l'univers de ${profil.prenom} (${univers}). Formuler : 'C'est exactement comme quand [situation concrète de son univers]...' Rendre le concept MÉMORABLE et ÉMOTIONNELLEMENT ancré.",
      "demonstration": "Résolution PAS À PAS avec les VRAIS calculs/mots, chaque micro-étape numérotée et expliquée :\n1. [première micro-étape — expliquer POURQUOI on fait ça]\n2. [deuxième micro-étape — calcul ou manipulation explicite]\n3. [troisième micro-étape]\n4. [etc. — autant d'étapes que nécessaire pour que tout soit visible]\nRéponse finale : [réponse complète, bien formulée]",
      "methodeQC": "Méthode pédagogique québécoise utilisée (ex: 'Démarche de résolution de problèmes en 5 étapes — PFEQ', 'Modèle CPA — MEQ', 'Enseignement explicite — MEES')",
      "pointCle": "La chose la plus importante à retenir, en 1 phrase courte et mémorable — commence obligatoirement par 'À retenir : ...'",
      "checkpoint": "Question courte et précise que ${profil.prenom} peut tenter maintenant pour vérifier sa compréhension. Résolvable en 30 secondes avec ce qui vient d'être appris. Doit être un vrai problème (avec un calcul ou un choix), pas une question de mémorisation.",
      "checkpointReponse": "La réponse COMPLÈTE au checkpoint, avec tous les calculs visibles si nécessaire",
      "checkpointExplication": "En 2-3 phrases : pourquoi c'est la bonne réponse, en reliant explicitement à ce qu'on vient d'apprendre dans cette étape"
    }
  ],
  "astucesMnemotechniques": [
    "Astuce 1 : moyen fun et mémorable pour retenir la notion principale — utiliser les intérêts de ${profil.prenom}",
    "Astuce 2 : autre technique (acronyme, rime, image mentale, geste) pour un autre aspect clé"
  ],
  "basesPedagogiques": [
    {
      "approche": "Nom précis de l'approche pédagogique",
      "chercheur": "Prénom Nom du chercheur (nom réel et vérifiable)",
      "annee": 1968,
      "source": "Titre exact de l'ouvrage ou de l'article (réel et vérifiable)",
      "explication": "Pourquoi cette approche est efficace pour CE profil d'élève — en 1 phrase accessible aux parents"
    }
  ],
  "exercicesVerification": [
    {
      "numero": 1,
      "enonce": "Exercice pratique similaire aux erreurs faites mais légèrement guidé. Niveau progressif : le premier est plus simple, les suivants plus complets.",
      "indices": [
        "Indice 1 : oriente sans donner la réponse — rappelle quelle étape de la leçon s'applique ici",
        "Indice 2 : plus concret — rappelle l'analogie ou donne le premier calcul"
      ],
      "solution": "La solution COMPLÈTE et détaillée, avec chaque étape numérotée",
      "explicationSolution": "Pourquoi c'est la bonne réponse — en reliant explicitement aux étapes de la leçon",
      "encouragement": "Célébration personnalisée pour ${profil.prenom} — spécifique à cet exercice, mentionne ce qu'il/elle a démontré en résolvant ce problème"
    }
  ],
  "messageEncouragement": "Message final chaleureux et motivant pour ${profil.prenom} (4-5 phrases). Nommer précisément ce qu'il/elle a accompli dans ce cours. Projeter vers la prochaine étape avec enthousiasme. Faire le lien avec ses intérêts ou sa personnalité.",
  "prochainDefi": "Ce que ${profil.prenom} pourra bientôt accomplir une fois cette notion maîtrisée — formulé comme une aventure excitante, pas comme un devoir",
  "dureeEstimeeMinutes": 25
}

CONTRAINTES OBLIGATOIRES :
- La leçon doit avoir 3 à 5 étapes progressives (partir du plus simple vers le plus complexe)
- Chaque étape doit avoir un lien EXPLICITE avec une erreur concrète des exercices
- La "demonstration" doit montrer les VRAIS calculs/mots avec des chiffres réels
- Les exercices de vérification : 2 à 3, progressifs
- Les basesPedagogiques : 2 à 3 références RÉELLES et vérifiables
- Toujours partir de l'erreur concrète de l'élève → construire vers la maîtrise`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 12000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(cleaned) as CoursStructure;
  } catch {
    return {
      titre: `Révision personnalisée pour ${profil.prenom}`,
      matiere: matieresDansExercices[0] ?? "FRANCAIS",
      niveauDifficulte: NIVEAUX_LABELS[profil.niveauScolaire],
      introduction: `${profil.prenom}, tu as montré de la détermination en complétant ces exercices — et c'est ça qui fait la différence ! On va revoir ensemble les points qui t'ont posé problème, étape par étape, sans pression. Je suis là pour toi.`,
      erreursIdentifiees: [],
      lecon: [
        {
          numero: 1,
          titre: "Revoir les bases ensemble",
          lienAvecErreur: "Cette étape reprend les notions fondamentales qui ont posé problème dans tes exercices.",
          explication: "Ce que tu dois savoir, c'est que chaque concept devient plus facile quand on le décompose en petites étapes. On va faire ça ensemble.",
          analogie: `C'est comme dans ${univers} — même les meilleurs ont commencé par maîtriser les bases, une à la fois !`,
          demonstration: "1. Lis attentivement la question\n2. Identifie ce qu'on te demande de trouver\n3. Applique la règle vue en classe\n4. Vérifie ta réponse",
          pointCle: "À retenir : une étape à la fois, et ça marche toujours.",
          checkpoint: "Peux-tu expliquer avec tes propres mots ce qu'on vient d'apprendre ?",
          checkpointReponse: "La réponse dépend du contenu de la leçon — l'important est de relire et résumer.",
          checkpointExplication: "Reformuler avec ses propres mots est le meilleur signe de compréhension réelle.",
        },
      ],
      astucesMnemotechniques: [
        "Relis toujours l'énoncé deux fois avant de commencer — la deuxième lecture révèle souvent ce qu'on avait manqué",
        "Dessine ou schématise le problème : transformer les mots en image aide à voir la solution",
      ],
      basesPedagogiques: [
        {
          approche: "Zone proximale de développement",
          chercheur: "Lev Vygotski",
          annee: 1934,
          source: "Pensée et Langage",
          explication: "On apprend mieux en partant de ce qu'on sait déjà pour aller vers ce qu'on ne sait pas encore — jamais en sautant des étapes.",
        },
      ],
      exercicesVerification: [],
      messageEncouragement: `Tu as fait un excellent travail, ${profil.prenom} ! Compléter ce cours demande de la volonté et du courage — et tu l'as fait. Chaque notion que tu révises devient une force pour la suite. Continue dans cet élan !`,
      prochainDefi: "La prochaine fois que tu rencontreras ce type de question, tu auras les outils pour y répondre avec confiance.",
      dureeEstimeeMinutes: 25,
    };
  }
}
