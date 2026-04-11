import { anthropic } from "./client";
import {
  type Matiere,
  type TypeExercice,
  type NiveauDifficulte,
  type EtatEmotionnel,
  type StyleApprentissage,
  type NiveauScolaire,
} from "@/generated/prisma";

/**
 * Extrait le premier objet JSON valide depuis une réponse de l'IA.
 * Gère les cas : fences markdown, texte introductif, texte après le JSON.
 */
function extractJSON(text: string): string {
  // 1. Nettoyage des fences markdown (``` ou ```json)
  let cleaned = text.replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "").trim();

  // 2. Si ça parse déjà, parfait
  try { JSON.parse(cleaned); return cleaned; } catch { /* continue */ }

  // 3. Extraire le premier objet JSON complet { ... } dans le texte brut
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try { JSON.parse(candidate); return candidate; } catch { /* continue */ }
  }

  // 4. Retourner le texte nettoyé (le parse suivant lèvera l'erreur explicite)
  return cleaned;
}
import { type SectionAnalysee, formaterContexteModele } from "./epreuve";

interface ModeleReference {
  titre: string;
  styleGeneral: string;
  niveauLangue: string;
  sections: SectionAnalysee[];
}

export interface ProfilComplet {
  prenom: string;
  niveauScolaire: NiveauScolaire;
  styleApprentissage?: StyleApprentissage | null;
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  // Univers personnel
  centresInteret?: string[];
  sportFavori?: string | null;
  universMediatique?: string | null;
  autresPassions?: string | null;
  environnement?: string | null;
  personnalite?: string[];
  objectifScolaire?: string | null;
}

interface GenerateExerciceInput {
  profil: ProfilComplet;
  matiere: Matiere;
  type?: TypeExercice;
  niveauActuel: NiveauDifficulte;
  etatEmotionnel?: EtatEmotionnel | null;
  competencePFEQ?: string;
  modeleReference?: ModeleReference;
  sectionReference?: SectionAnalysee;
  /** Notions PFEQ choisies par l'élève (labels + descriptions) */
  notions?: { label: string; description: string }[];
  /** Documents pédagogiques filtrés par matière/niveau — enrichissent l'approche pédagogique */
  contexteDocuments?: string;
  /** Difficulté choisie explicitement par l'élève — court-circuite le calcul automatique */
  difficulteChoisie?: NiveauDifficulte;
  /** Lacunes identifiées dans cette matière — l'exercice doit les cibler en priorité */
  lacunes?: string[];
}

export interface EpreuveGeneree {
  titre: string;
  miseEnSituation: string;
  notionsCiblees: string[];
  dureeMinutes: number;
  parties: PartieEpreuve[];
  totalPoints: number;
}

export interface PartieEpreuve {
  numero: number;
  titre: string;
  description: string;
  points: number;
  questions: QuestionEpreuve[];
}

export interface QuestionEpreuve {
  id: string;
  type: "QCM" | "REPONSE_COURTE" | "DEVELOPPEMENT" | "PROBLEME";
  enonce: string;
  pointsQuestion: number;
  choix?: { lettre: string; texte: string }[];   // pour QCM
  reponseAttendue: string;
  criteresCorrection: string[];
}

interface ExerciceGenere {
  titre: string;
  consigne: string;
  contenu: object;
  type: TypeExercice;
  difficulte: NiveauDifficulte;
  competencesPFEQ: string[];
  dureeMinutes: number;
  correctionAttendue: object;
}

const NIVEAUX_LABELS: Record<NiveauScolaire, string> = {
  PRIMAIRE_1: "1re année du primaire (6-7 ans)",
  PRIMAIRE_2: "2e année du primaire (7-8 ans)",
  PRIMAIRE_3: "3e année du primaire (8-9 ans)",
  PRIMAIRE_4: "4e année du primaire (9-10 ans)",
  PRIMAIRE_5: "5e année du primaire (10-11 ans)",
  PRIMAIRE_6: "6e année du primaire (11-12 ans)",
  SECONDAIRE_1: "1re secondaire (12-13 ans)",
  SECONDAIRE_2: "2e secondaire (13-14 ans)",
  SECONDAIRE_3: "3e secondaire (14-15 ans)",
  SECONDAIRE_4: "4e secondaire (15-16 ans)",
  SECONDAIRE_5: "5e secondaire (16-17 ans)",
};

const MATIERES_LABELS: Record<Matiere, string> = {
  FRANCAIS: "Français langue d'enseignement",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Science et technologie",
  UNIVERS_SOCIAL: "Univers social (Histoire, Géographie)",
  ARTS: "Arts plastiques",
  ETHIQUE: "Éthique et culture religieuse",
  ANGLAIS: "Anglais langue seconde",
  EDUCATION_PHYSIQUE: "Éducation physique et à la santé",
};

const INTERET_LABELS: Record<string, string> = {
  SOCCER: "soccer", HOCKEY: "hockey", BASKETBALL: "basketball",
  NATATION: "natation", SPORT_AUTRE: "sport",
  JEUX_VIDEO: "jeux vidéo", MANGA_BD: "manga et bandes dessinées",
  LECTURE: "romans et lecture", MUSIQUE: "musique", CINEMA_SERIES: "films et séries",
  YOUTUBE: "YouTube et TikTok", DESSIN: "dessin et art",
  CUISINE: "cuisine", DANSE: "danse", THEATRE: "théâtre",
  ANIMAUX: "animaux", NATURE: "nature et plein air",
  TECHNOLOGIE: "technologie et programmation", VOYAGE: "voyage", MODE: "mode",
};

const PERSONNALITE_LABELS: Record<string, string> = {
  CURIEUX: "curieux/se et explorateur/trice",
  CREATIF: "créatif/ve",
  COMPETITEUR: "compétiteur/trice qui aime se dépasser",
  COOPERATIF: "coopératif/ve qui aime travailler en équipe",
  ANALYTIQUE: "analytique et méthodique",
  CALME: "calme et réfléchi/e",
  SOCIABLE: "sociable",
  AMBITIEUX: "ambitieux/se",
};

const OBJECTIF_LABELS: Record<string, string> = {
  REUSSIR_ANNEE: "réussir son année sans stress",
  AMELIORER_NOTES: "améliorer ses résultats",
  CEGEP_UNIVERSITE: "se préparer pour le CÉGEP ou l'université",
  AIMER_APPRENDRE: "mieux aimer l'école",
  COMBLER_LACUNES: "combler ses lacunes",
  SOUTIEN_PARENTS: "être soutenu(e) par ses parents",
};

function construireProfilNarratif(profil: ProfilComplet): string {
  const parties: string[] = [];

  // Identité
  parties.push(`L'élève s'appelle ${profil.prenom} et est en ${NIVEAUX_LABELS[profil.niveauScolaire]}.`);

  // Style d'apprentissage
  if (profil.styleApprentissage) {
    const styles: Record<string, string> = {
      VISUEL: "apprend mieux avec des éléments visuels (schémas, images, tableaux)",
      AUDITIF: "apprend mieux en écoutant et en parlant",
      KINESTHESIQUE: "apprend mieux en pratiquant et en faisant",
      LECTURE_ECRITURE: "apprend mieux par la lecture et l'écriture",
    };
    parties.push(`Son style d'apprentissage : ${styles[profil.styleApprentissage] ?? profil.styleApprentissage}.`);
  }

  // Centres d'intérêt
  const interets = (profil.centresInteret ?? [])
    .map((i) => INTERET_LABELS[i])
    .filter(Boolean);
  if (interets.length > 0) {
    parties.push(`Ses centres d'intérêt : ${interets.join(", ")}.`);
  }

  // Sport
  if (profil.sportFavori) {
    parties.push(`Son sport/équipe favori(e) : ${profil.sportFavori}.`);
  }

  // Univers médiatique
  if (profil.universMediatique) {
    parties.push(`Ses références culturelles : ${profil.universMediatique}.`);
  }

  // Autres passions
  if (profil.autresPassions) {
    parties.push(`Autres informations : ${profil.autresPassions}.`);
  }

  // Environnement
  if (profil.environnement) {
    const envs: Record<string, string> = {
      VILLE: "habite en ville (contexte urbain québécois)",
      BANLIEUE: "habite en banlieue",
      REGION: "habite en région ou à la campagne",
    };
    parties.push(`Environnement : ${envs[profil.environnement] ?? profil.environnement}.`);
  }

  // Personnalité
  const perso = (profil.personnalite ?? [])
    .map((p) => PERSONNALITE_LABELS[p])
    .filter(Boolean);
  if (perso.length > 0) {
    parties.push(`Sa personnalité : ${perso.join(", ")}.`);
  }

  // Objectif
  if (profil.objectifScolaire && OBJECTIF_LABELS[profil.objectifScolaire]) {
    parties.push(`Son objectif : ${OBJECTIF_LABELS[profil.objectifScolaire]}.`);
  }

  // Adaptations
  const adaptations: string[] = [];
  if (profil.tdah) adaptations.push("TDAH : consignes très courtes (max 2 phrases), une seule tâche à la fois, texte aéré");
  if (profil.dyslexie) adaptations.push("Dyslexie : phrases courtes, vocabulaire accessible, peu de texte dense");
  if (profil.anxieteScolaire) adaptations.push("Anxiété scolaire : ton particulièrement encourageant, exercice rassurant, jamais de pression");
  if (adaptations.length > 0) {
    parties.push(`Adaptations OBLIGATOIRES : ${adaptations.join(" | ")}.`);
  }

  return parties.join("\n");
}

export async function generateExercice(input: GenerateExerciceInput): Promise<ExerciceGenere> {
  const { profil, matiere, type, niveauActuel, etatEmotionnel, competencePFEQ, modeleReference, sectionReference, contexteDocuments, difficulteChoisie, lacunes } = input;
  const difficulteVoulue = difficulteChoisie ?? getDifficulteAdaptee(niveauActuel, etatEmotionnel);
  const profilNarratif = construireProfilNarratif(profil);

  const systemPrompt = `Tu es un expert en psychopédagogie québécoise, spécialisé dans le Programme de formation de l'école québécoise (PFEQ) du MEES. Tu crées des exercices ULTRA-PERSONNALISÉS pour des élèves québécois.

MISSION PRINCIPALE : Utiliser l'univers, les intérêts et la personnalité de l'élève pour ancrer l'exercice dans un contexte qui lui parle vraiment. Un élève qui aime le hockey doit avoir des problèmes de maths avec des statistiques du Canadien. Un fan de Naruto doit trouver des références dans ses textes de français.

RÈGLES ABSOLUES :
1. Le contenu doit être ENTIÈREMENT ancré dans l'univers de l'élève (sport, médias, hobbies, environnement)
2. Aligné sur le PFEQ officiel — compétences ciblées réelles
3. Français québécois authentique (expressions, contextes locaux)
4. Niveau de langage adapté à l'âge exact
5. Jamais de contenu anxiogène ni stigmatisant
6. Réponds UNIQUEMENT avec un JSON valide, sans markdown`;

  const modeDouxNote = (etatEmotionnel === "STRESSE" || etatEmotionnel === "TRISTE" || etatEmotionnel === "FATIGUE")
    ? "\n⚠️ MODE DOUCEUR ACTIVÉ : L'élève est fatigué/stressé/triste. Exercice plus court, ton extra doux, difficulté réduite."
    : "";

  const lacunesNote = lacunes && lacunes.length > 0
    ? `\n🎯 LACUNES IDENTIFIÉES À CIBLER EN PRIORITÉ :\nCet élève a des difficultés dans ces domaines précis :\n${lacunes.map((l, i) => `${i + 1}. ${l}`).join("\n")}\n→ L'exercice DOIT cibler ces lacunes spécifiquement. C'est une révision corrective.`
    : "";

  const userPrompt = `PROFIL COMPLET DE L'ÉLÈVE :
${profilNarratif}
${modeDouxNote}${lacunesNote}
${contexteDocuments ? `\n${contexteDocuments}\nINSTRUCTION : Intègre les approches pédagogiques de ces ressources dans la conception de l'exercice (stratégies d'intervention, progression, style adapté au niveau et à la matière).\n` : ""}
PARAMÈTRES DE L'EXERCICE :
- Matière : ${MATIERES_LABELS[matiere]}
- Niveau de difficulté cible : ${difficulteVoulue} (niveau actuel : ${niveauActuel})
- Type demandé : ${type ?? "choisis le plus adapté et engageant pour ce profil"}
${competencePFEQ ? `- Compétence PFEQ ciblée : ${competencePFEQ}` : ""}
${input.notions && input.notions.length > 0 ? `- NOTIONS PFEQ CIBLÉES (choisies par l'élève — OBLIGATOIRE de les couvrir) :\n${input.notions.map((n) => `  • ${n.label} : ${n.description}`).join("\n")}` : ""}
${modeleReference ? formaterContexteModele(modeleReference, sectionReference) : ""}

INSTRUCTIONS DE PERSONNALISATION :
- Le titre de l'exercice doit mentionner un élément de l'univers de l'élève
- Le contexte du problème ou du texte doit être directement lié à ses intérêts
- Si maths : utilise ses équipes, stats sportives, jeux, personnages favoris
- Si français : crée un texte ou une situation inspirée de son univers médiatique/culturel
- Si sciences/univers social : ancre dans son environnement (ville/région québécoise)
- Adapte les exemples à son âge et sa personnalité

RÈGLES DE STRUCTURE JSON OBLIGATOIRES :
- Le champ "contenu" doit être STRICTEMENT structuré selon le type choisi (voir schémas ci-dessous)
- JAMAIS de texte formaté avec "---", "◆", "→" dans un seul champ enonce
- Chaque partie, chaque donnée, chaque question = un champ JSON distinct
- Les listes doivent être des TABLEAUX JSON, pas du texte avec des tirets
- ⚠️ CRITIQUE : Pour PROBLEME_MATHEMATIQUE, le champ "question" est ABSOLUMENT OBLIGATOIRE et DISTINCT de "miseEnSituation". Ne jamais mettre la question dans la mise en situation.
- ⚠️ CRITIQUE : Pour LECTURE_COMPREHENSION, le tableau "questions" doit contenir AU MOINS 2 questions. Un texte sans questions n'est PAS acceptable.
- ⚠️ CRITIQUE : Pour QCM, le champ "question" est ABSOLUMENT OBLIGATOIRE.
- L'élève doit TOUJOURS avoir quelque chose à répondre. Un exercice sans question à résoudre est invalide.

VISUELS MATHÉMATIQUES — OBLIGATOIRE pour les exercices de mathématiques :
Chaque type de contenu peut inclure un tableau optionnel "visuels" contenant des éléments graphiques.
⚠️ RÈGLE ABSOLUE : Si l'exercice implique des coordonnées, des points, des figures géométriques, des données statistiques ou un tableau de valeurs, tu DOIS générer le visuel correspondant. Ne jamais décrire un graphique ou une figure en texte quand tu peux le générer.

DÉCLENCHE un visuel dans ces situations :
- Mention de points avec coordonnées (A(x,y)) → type "plan_cartesien"
- Calcul de périmètre, aire, volume d'une figure → type "figure_geometrique"
- Table de valeurs, x→y, tableau de données → type "tableau"
- Comparaison de quantités, fréquences, statistiques → type "graphique_barres"
- Évolution dans le temps, suite de valeurs → type "graphique_lignes"

SCHÉMAS VISUELS :

"visuels": [
  {
    "type": "plan_cartesien",
    "titre": "Plan cartésien",
    "points": [
      {"label": "A", "x": 1, "y": 2},
      {"label": "B", "x": 4, "y": 5}
    ],
    "segments": [["A","B"]],
    "polygones": [{"sommets": ["A","B","C","D"], "couleur": "rgba(42,124,111,0.15)", "rempli": true}],
    "xRange": [-1, 9],
    "yRange": [-1, 9]
  }
]

"visuels": [
  {
    "type": "tableau",
    "titre": "Table de valeurs",
    "colonnes": ["x", "y = 2x + 1"],
    "lignes": [[-2, -3], [-1, -1], [0, 1], [1, 3], [2, 5]]
  }
]

"visuels": [
  {
    "type": "figure_geometrique",
    "titre": "Rectangle ABCD",
    "forme": "rectangle",
    "dimensions": {"largeur": 6, "hauteur": 4},
    "etiquettes": ["6 cm", "4 cm"],
    "question": "Calcule l'aire"
  }
]
Formes disponibles : "rectangle", "triangle_rectangle", "triangle_equilateral", "cercle", "parallelogramme", "trapeze"

"visuels": [
  {
    "type": "graphique_barres",
    "titre": "Buts marqués par équipe",
    "axeX": "Équipes",
    "axeY": "Buts",
    "donnees": [
      {"label": "Équipe A", "valeur": 12},
      {"label": "Équipe B", "valeur": 8},
      {"label": "Équipe C", "valeur": 15}
    ],
    "unite": ""
  }
]

"visuels": [
  {
    "type": "graphique_lignes",
    "titre": "Température par heure",
    "axeX": "Heure",
    "axeY": "°C",
    "donnees": [
      {"label": "8h", "valeur": 12},
      {"label": "12h", "valeur": 18},
      {"label": "16h", "valeur": 22},
      {"label": "20h", "valeur": 15}
    ],
    "unite": "°C"
  }
]

SCHÉMAS PAR TYPE :

TYPE QCM :
"contenu": {
  "miseEnSituation": "Contexte narratif (2-3 phrases max), ancré dans l'univers de l'élève",
  "question": "La question claire et précise",
  "choix": [
    {"id": "A", "texte": "Premier choix"},
    {"id": "B", "texte": "Deuxième choix"},
    {"id": "C", "texte": "Troisième choix"},
    {"id": "D", "texte": "Quatrième choix"}
  ],
  "visuels": [ /* si la question porte sur un graphique, un tableau ou une figure */ ]
}

TYPE PROBLEME_MATHEMATIQUE :
"contenu": {
  "miseEnSituation": "Le contexte narratif motivant (2-3 phrases)",
  "donnees": ["Donnée 1 complète", "Donnée 2 complète", "Donnée 3 complète"],
  "question": "La question à résoudre, formulée clairement",
  "unite": "l'unité de la réponse (ex: m², km, $, min)",
  "avecDemarche": true,
  "etapesGuidees": ["Étape 1 : identifier...", "Étape 2 : calculer..."],
  "visuels": [ /* OBLIGATOIRE si points/figures/données — voir schémas visuels ci-dessus */ ]
}

TYPE LECTURE_COMPREHENSION :
"contenu": {
  "texte": "Le texte complet à lire (bien rédigé, paragraphes distincts avec \\n\\n)",
  "questions": [
    {
      "id": "q1",
      "type": "QCM",
      "enonce": "Question 1",
      "choix": [{"id": "A", "texte": "..."}, {"id": "B", "texte": "..."}, {"id": "C", "texte": "..."}]
    },
    {
      "id": "q2",
      "type": "OUVERTE",
      "enonce": "Question 2 ouverte"
    }
  ]
}

TYPE TEXTE_TROUS :
"contenu": {
  "miseEnSituation": "Contexte (1-2 phrases)",
  "segments": [
    {"type": "texte", "valeur": "Partie fixe du texte "},
    {"type": "trou", "id": "t1", "indice": "verbe conjugué", "reponse": "jouait"},
    {"type": "texte", "valeur": " avec ses coéquipiers "},
    {"type": "trou", "id": "t2", "reponse": "depuis"},
    {"type": "texte", "valeur": " trois ans."}
  ]
}

TYPE QUESTION_OUVERTE / MINI_DEFI / MISE_EN_SITUATION :
"contenu": {
  "miseEnSituation": "Contexte narratif riche (3-4 phrases)",
  "question": "La question ou le défi à répondre",
  "pointsGuidage": ["Piste 1 pour guider la réflexion", "Piste 2"],
  "minMots": 30,
  "visuels": [ /* si la question porte sur une figure ou un graphique */ ]
}

TYPE CHRONOLOGIE / SCHEMA_COMPLETER :
"contenu": {
  "miseEnSituation": "Contexte",
  "instruction": "Ce que l'élève doit faire",
  "elements": [
    {"id": "e1", "texte": "Premier élément à ordonner/placer"},
    {"id": "e2", "texte": "Deuxième élément"},
    {"id": "e3", "texte": "Troisième élément"}
  ],
  "ordreAttendu": ["e2", "e1", "e3"]
}

RÉPONDS avec ce JSON exact :
{
  "titre": "Titre accrocheur sans ponctuation excessive",
  "consigne": "Consigne bienveillante adressée à ${profil.prenom} — 1 phrase claire qui explique ce qu'il/elle doit faire",
  "contenu": { /* schéma correspondant au type choisi, ci-dessus */ },
  "type": "QCM|TEXTE_TROUS|QUESTION_OUVERTE|PROBLEME_MATHEMATIQUE|LECTURE_COMPREHENSION|MINI_DEFI|MISE_EN_SITUATION|SCHEMA_COMPLETER|CHRONOLOGIE",
  "difficulte": "${difficulteVoulue}",
  "competencesPFEQ": ["Compétence PFEQ officielle ex: Résoudre une situation-problème mathématique"],
  "dureeMinutes": 10,
  "correctionAttendue": {
    "reponse": "La réponse correcte complète",
    "demarche": "Les étapes de résolution selon la méthode PFEQ",
    "pointsCles": ["Point clé 1", "Point clé 2"],
    "erreursCourantes": ["Erreur typique à éviter"]
  }
}`;

  const response = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    },
    { timeout: 55000 } // 55s timeout — en dessous du maxDuration Vercel (120s) pour 2 appels possibles
  );

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = extractJSON(text);

  try {
    const parsed = JSON.parse(cleaned);

    // ── Validation : s'assurer que les questions sont présentes ──────────────
    const contenu = parsed.contenu ?? {};
    const type = (parsed.type ?? "") as string;

    if (type === "PROBLEME_MATHEMATIQUE") {
      const question = contenu.question ?? contenu.enonce ?? contenu.probleme;
      if (!question || String(question).trim().length < 5) {
        throw new Error("MISSING_QUESTION");
      }
    }

    if (type === "QCM") {
      if (!contenu.question || String(contenu.question).trim().length < 5) {
        throw new Error("MISSING_QUESTION");
      }
    }

    if (type === "LECTURE_COMPREHENSION") {
      const questions = contenu.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("MISSING_QUESTION");
      }
    }

    if (["QUESTION_OUVERTE", "MINI_DEFI", "MISE_EN_SITUATION"].includes(type)) {
      if (!contenu.question || String(contenu.question).trim().length < 5) {
        throw new Error("MISSING_QUESTION");
      }
    }

    return {
      titre: parsed.titre,
      consigne: parsed.consigne,
      contenu,
      type: type as TypeExercice,
      difficulte: parsed.difficulte as NiveauDifficulte,
      competencesPFEQ: parsed.competencesPFEQ ?? [],
      dureeMinutes: parsed.dureeMinutes ?? 10,
      correctionAttendue: parsed.correctionAttendue,
    };
  } catch (err) {
    // Retry automatique si les questions manquent
    if (err instanceof Error && err.message === "MISSING_QUESTION") {
      const retry = await anthropic.messages.create(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt },
            {
              role: "assistant",
              content: "Voici l'exercice généré :\n\n" + cleaned,
            },
            {
              role: "user",
              content:
                "⚠️ ERREUR : L'exercice généré n'a pas de champ \"question\" distinct. " +
                "Le champ \"question\" est OBLIGATOIRE et doit être séparé de \"miseEnSituation\". " +
                "Régénère l'exercice complet en t'assurant que le champ \"question\" existe et contient la question posée à l'élève. " +
                "Réponds uniquement avec le JSON corrigé.",
            },
          ],
        },
        { timeout: 55000 }
      );

      const retryText =
        retry.content[0].type === "text" ? retry.content[0].text : "";
      const retryCleaned = extractJSON(retryText);

      try {
        const retryParsed = JSON.parse(retryCleaned);
        return {
          titre: retryParsed.titre,
          consigne: retryParsed.consigne,
          contenu: retryParsed.contenu ?? {},
          type: retryParsed.type as TypeExercice,
          difficulte: retryParsed.difficulte as NiveauDifficulte,
          competencesPFEQ: retryParsed.competencesPFEQ ?? [],
          dureeMinutes: retryParsed.dureeMinutes ?? 10,
          correctionAttendue: retryParsed.correctionAttendue,
        };
      } catch {
        throw new Error("L'IA a retourné une réponse invalide. Veuillez réessayer.");
      }
    }

    throw new Error("L'IA a retourné une réponse invalide. Veuillez réessayer.");
  }
}

// ─── Feedback pédagogique structuré PFEQ ─────────────────────────────────────

export async function genererFeedback({
  exercice,
  correctionAttendue,
  reponseEleve,
  profil,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exercice: { contenu: any; consigne: string; matiere: string; type: string; competencesPFEQ: string[]; correctionType: string };
  correctionAttendue?: unknown;
  reponseEleve: unknown;
  profil: ProfilComplet;
}) {
  const profilNarratif = construireProfilNarratif(profil);

  const systemPrompt = `Tu es un enseignant expert et orthopédagogue québécois avec 15 ans d'expérience, spécialisé dans la détection des erreurs d'apprentissage et la remédiation pédagogique. Tu maîtrises parfaitement le Programme de formation de l'école québécoise (PFEQ) du MEES.

Ton rôle va au-delà de la simple correction : tu ANALYSES le raisonnement de l'élève, tu DIAGNOSTIQUES la nature exacte de l'erreur, et tu fournis une ORIENTATION claire pour qu'il ne répète plus jamais la même erreur.

Ta correction doit :
1. DIAGNOSTIQUER l'erreur — identifier précisément CE QUI A BLOQUÉ l'élève dans son raisonnement
2. DISTINGUER le type d'erreur : lacune conceptuelle (notion non comprise), erreur de procédure (mauvaise application), étourderie (bonne compréhension mais mauvaise exécution), ou mauvaise lecture de la tâche
3. EXPLIQUER pourquoi cet erreur est fréquente et compréhensible — sans jamais culpabiliser
4. DONNER des stratégies concrètes pour ne PLUS jamais répéter cette erreur
5. POSER des questions de réflexion pour développer la métacognition de l'élève
6. PERSONNALISER chaque explication selon le profil, les intérêts et les besoins de l'élève
7. S'ALIGNER sur la méthodologie officielle du MEES avec des exemples ancrés dans la vie réelle
8. GÉNÉRER des visuels (plan cartésien, figure géométrique, tableau, graphique) dans les étapes de correction quand la notion le demande — utiliser les données EXACTES de l'exercice, jamais de valeurs inventées

Réponds UNIQUEMENT avec un JSON valide, sans markdown.`;

  const competencesPFEQ = exercice.competencesPFEQ?.join(", ") || "compétences du niveau";

  const userPrompt = `PROFIL DE L'ÉLÈVE :
${profilNarratif}

EXERCICE :
- Matière : ${exercice.matiere}
- Type : ${exercice.type}
- Consigne : ${exercice.consigne}
- Compétences PFEQ ciblées : ${competencesPFEQ}
- Contenu : ${JSON.stringify(exercice.contenu)}
${correctionAttendue ? `- CORRECTION OFFICIELLE (utilise UNIQUEMENT ces données pour noter — ne réinvente aucune valeur) : ${JSON.stringify(correctionAttendue)}` : ""}

RÉPONSE DE L'ÉLÈVE :
${JSON.stringify(reponseEleve)}

Génère une correction pédagogique complète, structurée et orientante. JSON :
{
  "score": <0-100>,
  "correct": <true/false>,
  "mention": "<Excellent ! | Très bien ! | Bien ! | En progression | À retravailler>",

  "ceQueJaiReussi": "<2-3 phrases précises sur ce que l'élève a bien compris ou bien fait — toujours trouver quelque chose de positif et spécifique>",

  "diagnosticErreur": {
    "typeErreur": "<lacune_conceptuelle | erreur_de_procedure | etourderie | mauvaise_lecture_tache | reponse_correcte>",
    "explication": "<2-3 phrases expliquant POURQUOI l'élève a fait cette erreur — le raisonnement sous-jacent, sans jugement. Ex: 'Tu as confondu X avec Y, ce qui est très courant car ces deux notions se ressemblent dans leur formulation…'>",
    "frequence": "<Cette erreur est très courante / fréquente / rare — et pourquoi les élèves la font souvent>"
  },

  "correctionDetaillee": {
    "etape1": {
      "titre": "Comprendre la tâche",
      "explication": "<Reformuler ce qui était demandé, en lien avec l'univers de l'élève. Identifier les MOTS-CLÉS qui donnaient l'indice sur ce qu'il fallait faire>",
      "conseil": "<Comment repérer ce type de question à l'avenir — les indices visuels ou les mots-clés à rechercher>"
    },
    "etape2": {
      "titre": "La notion à maîtriser",
      "explication": "<Quelle notion du PFEQ était nécessaire et POURQUOI elle s'applique ici>",
      "rappelTheorique": "<La règle, le concept ou la formule COMPLÈTE et EXPLIQUÉE — pas juste énoncée. Montrer le sens derrière la règle. Inclure un exemple concret tiré de la vie quotidienne ou des intérêts de l'élève>"
    },
    "etape3": {
      "titre": "Démarche de résolution pas à pas",
      "explication": "<Chaque micro-étape NUMÉROTÉE avec le raisonnement derrière chaque étape. Montrer POURQUOI on fait chaque étape, pas seulement quoi faire. Ex: '1. Je lis le problème et je souligne les données : … → 2. Je choisis la bonne opération PARCE QUE … → 3. Je calcule : …'>",
      "solution": "<La solution complète et détaillée avec toutes les étapes visibles>",
      "erreurEleve": "<Si incorrecte : décrire exactement ce que l'élève a fait, à quel moment précis son raisonnement a dévié, et quel aurait été le bon réflexe à ce moment-là — avec bienveillance>",
      "visuels": [ /* OBLIGATOIRE si la correction implique un graphique, un plan cartésien, une figure géométrique ou un tableau — reprend les données exactes de l'exercice */ ]
    },
    "etape4": {
      "titre": "Comment vérifier ma réponse",
      "explication": "<Une méthode CONCRÈTE et SPÉCIFIQUE de vérification pour ce type de question. Pas juste 'relis ta réponse' — donner la technique exacte enseignée au Québec pour ce type d'exercice>"
    }
  },

  "strategieAntiRepetition": {
    "reflexeAConstruire": "<Le réflexe précis que l'élève doit développer pour ne plus faire cette erreur — formulé comme une habitude à prendre, ex: 'Avant chaque calcul de pourcentage, je vérifie toujours si…'>",
    "piegeAEviter": "<Le piège spécifique à identifier dans les prochains exercices similaires>",
    "exerciceDeRenforcement": "<Décrire un type d'exercice à faire pour ancrer la bonne compréhension — adapté au niveau et aux intérêts de l'élève>"
  },

  "questionsReflexion": [
    "<Question 1 : amène l'élève à expliquer avec ses propres mots ce qu'il a compris de la notion>",
    "<Question 2 : amène l'élève à trouver lui-même où il a dévié dans son raisonnement>",
    "<Question 3 : amène l'élève à transférer la notion dans un nouveau contexte de sa vie>>"
  ],

  "methodeOfficielle": "<La stratégie ou méthode EXACTE enseignée dans les écoles québécoises pour ce type précis de question — avec son nom officiel si applicable (ex: 'méthode des 5 étapes de résolution de problème du MEES')>",
  "lienPFEQ": "<Compétence PFEQ spécifique développée, avec le numéro de la compétence et comment cet exercice y contribue concrètement>",

  "astuceMemoire": "<Une astuce mnémotechnique PERSONNALISÉE et ORIGINALE utilisant un élément précis de l'univers de l'élève (son sport préféré, sa série, son jeu…) — l'astuce doit vraiment aider à retenir la notion, pas juste faire un lien forcé>",

  "exempleSimilaire": {
    "enonce": "<Un nouvel exemple similaire mais dans un contexte différent, ancré dans les intérêts de l'élève — légèrement plus simple pour consolider>",
    "solution": "<La solution complète avec toutes les étapes visibles>",
    "pourquoi": "<Pourquoi résoudre cet exemple précis va consolider la compréhension>"
  },

  "encouragement": "<Message personnel et chaleureux en français québécois authentique (2-3 phrases), en référençant un intérêt ou une force de l'élève, et en soulignant que cette erreur fait partie du processus d'apprentissage normal>",

  "prochainePiste": "<Une suggestion concrète, spécifique et motivante pour progresser dans cette compétence — pas générique, liée au diagnostic et au profil de l'élève>"
}`;

  const response = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 4500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    },
    { timeout: 90000 }
  );

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = extractJSON(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      score: 50,
      correct: false,
      mention: "En progression",
      ceQueJaiReussi: "Tu as fait l'effort de répondre — c'est la première étape essentielle de tout apprentissage !",
      diagnosticErreur: {
        typeErreur: "lacune_conceptuelle",
        explication: "Il est difficile de déterminer précisément la nature de l'erreur sans analyse complète. Reprends la notion avec ton enseignant(e).",
        frequence: "Ce type d'erreur est courant en phase d'apprentissage d'une nouvelle notion.",
      },
      correctionDetaillee: {
        etape1: { titre: "Comprendre la tâche", explication: "Relis attentivement la consigne en soulignant les mots-clés.", conseil: "Prends le temps de lire deux fois avant de commencer — repère ce qu'on te demande de faire exactement." },
        etape2: { titre: "La notion à maîtriser", explication: "Identifie quelle notion du cours s'applique ici.", rappelTheorique: "Consulte tes notes de cours ou ton manuel pour retrouver la règle ou la formule liée à cet exercice." },
        etape3: { titre: "Démarche de résolution pas à pas", explication: "1. Identifie les données → 2. Choisis la bonne stratégie → 3. Applique la méthode étape par étape → 4. Formule ta réponse clairement.", solution: "Relis la correction avec ton enseignant(e) pour voir la démarche complète.", erreurEleve: "Ta réponse nécessite quelques ajustements — c'est tout à fait normal à ce stade de l'apprentissage." },
        etape4: { titre: "Comment vérifier ma réponse", explication: "Relis ta réponse en te demandant : est-ce que ça répond exactement à ce qui était demandé ? Ma démarche est-elle visible et logique ?" },
      },
      strategieAntiRepetition: {
        reflexeAConstruire: "Avant de répondre, demande-toi toujours : 'Quelle notion ai-je apprise qui s'applique ici ?'",
        piegeAEviter: "Ne jamais répondre sans avoir identifié la notion clé visée par la question.",
        exerciceDeRenforcement: "Refais 2-3 exercices similaires sur cette notion pour l'ancrer solidement.",
      },
      questionsReflexion: [
        "Avec tes propres mots, qu'est-ce que cette question te demandait de faire ?",
        "À quel moment penses-tu que ton raisonnement a pris une autre direction ?",
        "Dans ta vie de tous les jours, où pourrais-tu utiliser cette notion ?",
      ],
      methodeOfficielle: "Consulte ton enseignant(e) pour revoir la méthode officielle enseignée en classe pour ce type de question.",
      lienPFEQ: "Cet exercice développe des compétences importantes du PFEQ. Demande à ton enseignant(e) quelle compétence précise est ciblée.",
      astuceMemoire: "Crée ta propre astuce en associant cette notion à quelque chose que tu aimes — ça aide vraiment à mémoriser !",
      exempleSimilaire: { enonce: "Cherche un exercice similaire dans ton manuel pour pratiquer.", solution: "", pourquoi: "La pratique régulière est la clé pour ne plus faire cette erreur." },
      encouragement: "Chaque erreur est une occasion d'apprendre quelque chose de nouveau. T'es capable d'y arriver !",
      prochainePiste: "Reprends cette notion avec ton enseignant(e) et refais des exercices similaires pour consolider ta compréhension.",
    };
  }
}

function getDifficulteAdaptee(niveauActuel: NiveauDifficulte, etat?: EtatEmotionnel | null): NiveauDifficulte {
  if (etat === "STRESSE" || etat === "TRISTE" || etat === "FATIGUE") {
    return niveauActuel;
  }
  const progression: Record<NiveauDifficulte, NiveauDifficulte> = {
    REMEDIATION: "BASE",
    BASE: "ATTENDU",
    ATTENDU: "AVANCE",
    AVANCE: "EXCELLENCE",
    EXCELLENCE: "EXCELLENCE",
  };
  return progression[niveauActuel];
}

// ─── Génération d'une épreuve complète style PFEQ / SAÉ ──────────────────────

export async function genererEpreuve({
  profil,
  matiere,
  notions,
  niveauActuel,
  dureeMinutes = 45,
  difficulteChoisie,
}: {
  profil: ProfilComplet;
  matiere: Matiere;
  notions: { label: string; description: string }[];
  niveauActuel: NiveauDifficulte;
  dureeMinutes?: number;
  difficulteChoisie?: NiveauDifficulte;
}): Promise<EpreuveGeneree> {
  const difficulteVoulue = difficulteChoisie ?? niveauActuel;
  const profilNarratif = construireProfilNarratif(profil);

  const systemPrompt = `Tu es un concepteur d'épreuves expert en pédagogie québécoise, spécialisé dans le Programme de formation de l'école québécoise (PFEQ) du MEES.

Tu crées des ÉPREUVES COMPLÈTES structurées exactement comme celles du Ministère de l'Éducation du Québec (MEES) :

STRUCTURE D'UNE ÉPREUVE QUÉBÉCOISE :
1. MISE EN SITUATION : Contexte narratif riche, ancré dans l'univers de l'élève, qui donne du sens à toutes les questions
2. PARTIE 1 — Connaissance et compréhension (questions courtes, QCM) : vérifier la mémorisation des notions
3. PARTIE 2 — Application et analyse : exercices nécessitant l'application des notions dans des situations nouvelles
4. PARTIE 3 — Situation complexe : problème ouvert ou tâche complexe nécessitant synthèse et raisonnement

RÈGLES :
- Toutes les questions découlent de la mise en situation (cohérence narrative)
- Progression de Bloom : connaissance → compréhension → application → analyse → synthèse
- Barème clair sur 100 points
- Français québécois authentique
- Adapté au niveau scolaire exact
- Réponds UNIQUEMENT avec un JSON valide, sans markdown`;

  const notionsStr = notions.map((n) => `• ${n.label} : ${n.description}`).join("\n");

  const userPrompt = `PROFIL DE L'ÉLÈVE :
${profilNarratif}

PARAMÈTRES DE L'ÉPREUVE :
- Matière : ${MATIERES_LABELS[matiere]}
- Niveau de difficulté : ${difficulteVoulue}
- Durée : ${dureeMinutes} minutes
- Notions PFEQ à évaluer (OBLIGATOIRE de les couvrir toutes) :
${notionsStr}

INSTRUCTIONS DE PERSONNALISATION :
- La mise en situation doit être entièrement ancrée dans l'univers de ${profil.prenom} (ses sports, médias, passions)
- Toutes les questions doivent découler naturellement de cette mise en situation
- Les exemples doivent référencer ses centres d'intérêt concrets
- Ton encourageant et accessible

GÉNÈRE cette épreuve en JSON exact :
{
  "titre": "Titre de l'épreuve incluant un élément de l'univers de l'élève",
  "miseEnSituation": "Texte de mise en situation (200-400 mots) ancré dans l'univers de l'élève, présentant un contexte cohérent pour toutes les questions",
  "notionsCiblees": ["Notion 1", "Notion 2"],
  "dureeMinutes": ${dureeMinutes},
  "totalPoints": 100,
  "parties": [
    {
      "numero": 1,
      "titre": "Partie 1 — Connaissance et compréhension",
      "description": "Questions à réponse courte et choix multiples",
      "points": 30,
      "questions": [
        {
          "id": "1a",
          "type": "QCM",
          "enonce": "Question en lien avec la mise en situation",
          "pointsQuestion": 5,
          "choix": [
            {"lettre": "A", "texte": "Choix A"},
            {"lettre": "B", "texte": "Choix B"},
            {"lettre": "C", "texte": "Choix C"},
            {"lettre": "D", "texte": "Choix D"}
          ],
          "reponseAttendue": "B",
          "criteresCorrection": ["Critère 1"]
        },
        {
          "id": "1b",
          "type": "REPONSE_COURTE",
          "enonce": "Question courte en lien avec la mise en situation",
          "pointsQuestion": 5,
          "reponseAttendue": "La réponse attendue",
          "criteresCorrection": ["Critère 1", "Critère 2"]
        }
      ]
    },
    {
      "numero": 2,
      "titre": "Partie 2 — Application",
      "description": "Exercices d'application des notions",
      "points": 40,
      "questions": [
        {
          "id": "2a",
          "type": "DEVELOPPEMENT",
          "enonce": "Exercice d'application plus développé",
          "pointsQuestion": 20,
          "reponseAttendue": "Démarche et réponse complètes attendues",
          "criteresCorrection": ["Critère 1", "Critère 2", "Critère 3"]
        },
        {
          "id": "2b",
          "type": "PROBLEME",
          "enonce": "Problème à résoudre avec démarche",
          "pointsQuestion": 20,
          "reponseAttendue": "Démarche détaillée et réponse",
          "criteresCorrection": ["Critère 1", "Critère 2"]
        }
      ]
    },
    {
      "numero": 3,
      "titre": "Partie 3 — Situation complexe",
      "description": "Tâche complexe intégrant plusieurs notions",
      "points": 30,
      "questions": [
        {
          "id": "3a",
          "type": "DEVELOPPEMENT",
          "enonce": "Situation complexe nécessitant synthèse et jugement critique",
          "pointsQuestion": 30,
          "reponseAttendue": "Réponse complète attendue avec démarche et justification",
          "criteresCorrection": ["Critère 1", "Critère 2", "Critère 3", "Critère 4"]
        }
      ]
    }
  ]
}`;

  const response = await anthropic.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    },
    { timeout: 100000 }
  );

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = extractJSON(text);

  try {
    return JSON.parse(cleaned) as EpreuveGeneree;
  } catch (e) {
    console.error("[genererEpreuve] JSON invalide :", e, "\nTexte brut :", text.slice(0, 500));
    throw new Error("L'IA a retourné une épreuve invalide. Veuillez réessayer.");
  }
}

// ─── Feedback structuré pour une épreuve complète ────────────────────────────

export async function genererFeedbackEpreuve({
  epreuve,
  reponses,
  profil,
}: {
  epreuve: EpreuveGeneree;
  reponses: Record<string, string>;
  profil: ProfilComplet;
}): Promise<{
  score: number;
  mention: string;
  correctionParQuestion: Record<string, {
    bonne: boolean;
    pointsObtenus: number;
    explication: string;
    etapes?: Array<{
      titre: string;
      explication: string;
      solution?: string;
      erreurEleve?: string;
      rappelTheorique?: string;
      conseil?: string;
    }>;
    methodeOfficielle?: string;
    competencePFEQ?: string;
    astuceMemoire?: string;
  }>;
  ceQueJaiReussi?: string;
  encouragement?: string;
  prochainePiste?: string;
  patternErreurs?: string;
}> {
  const profilNarratif = construireProfilNarratif(profil);

  // Questions originales pour le fallback
  const questionsOriginales = (epreuve?.parties ?? []).flatMap((p) => p.questions ?? []);

  // Questions formatées pour l'IA — pour QCM, résolution lettre → texte dans les deux sens
  const questionsResumees = questionsOriginales.map((q) => {
    const repEleve = reponses[q.id] ?? "";

    if (q.type === "QCM" && q.choix) {
      // Résoudre la réponse de l'élève : lettre ou texte → afficher les deux
      const choixEleve = q.choix.find(
        (c) => c.lettre.toUpperCase() === repEleve.trim().toUpperCase()
          || c.texte.toLowerCase() === repEleve.trim().toLowerCase()
      );
      const choixAttendu = q.choix.find(
        (c) => c.lettre.toUpperCase() === q.reponseAttendue.trim().toUpperCase()
      );
      return {
        id: q.id,
        enonce: q.enonce,
        type: q.type,
        pointsQuestion: q.pointsQuestion,
        optionsQCM: q.choix.map((c) => `${c.lettre}: ${c.texte}`).join(" | "),
        reponseAttendue: choixAttendu
          ? `${choixAttendu.lettre} — "${choixAttendu.texte}"`
          : q.reponseAttendue,
        reponseEleve: choixEleve
          ? `${choixEleve.lettre} — "${choixEleve.texte}"`
          : repEleve || "(sans réponse)",
        criteresCorrection: q.criteresCorrection,
      };
    }

    return {
      id: q.id,
      enonce: q.enonce,
      type: q.type,
      pointsQuestion: q.pointsQuestion,
      reponseAttendue: q.reponseAttendue,
      reponseEleve: repEleve || "(sans réponse)",
      criteresCorrection: q.criteresCorrection,
    };
  });

  const systemPrompt = `Tu es un enseignant expert et orthopédagogue québécois avec 15 ans d'expérience, spécialisé dans l'évaluation et la remédiation pédagogique alignée sur le PFEQ/MEES. Tu corriges des épreuves complètes avec une approche diagnostique, bienveillante et orientante.

TON RÔLE DÉPASSE LA SIMPLE CORRECTION :
- Tu ANALYSES le raisonnement de l'élève question par question
- Tu DIAGNOSTIQUES la nature exacte de chaque erreur (lacune conceptuelle, erreur de procédure, étourderie, mauvaise lecture)
- Tu EXPLIQUES pourquoi chaque erreur est compréhensible et comment l'éviter à l'avenir
- Tu fournis des STRATÉGIES CONCRÈTES pour ne plus répéter les mêmes erreurs
- Tu identifies les PATTERNS d'erreurs à l'échelle de l'épreuve

RÈGLES ABSOLUES :
1. Chaque question (correcte OU incorrecte) reçoit OBLIGATOIREMENT 4 étapes + diagnosticErreur + methodeOfficielle + competencePFEQ + astuceMemoire + strategieAntiRepetition
2. Étape 1 – Comprendre la tâche : reformule CE QUI ÉTAIT ATTENDU + les mots-clés indicateurs dans l'énoncé
3. Étape 2 – La notion à maîtriser : donne LA RÈGLE/FORMULE COMPLÈTE avec le sens derrière elle — jamais "rappelle-toi". Donne directement le contenu avec un exemple concret
4. Étape 3 – Démarche pas à pas : liste les MICRO-ÉTAPES NUMÉROTÉES avec le POURQUOI de chaque étape (ex: "1. Je lis et souligne les données… PARCE QUE → 2. Je choisis l'opération… PARCE QUE… → 3. Je calcule…")
5. Étape 4 – Vérification : donne la TECHNIQUE CONCRÈTE de vérification spécifique à ce type de question
6. diagnosticErreur : identifie le TYPE d'erreur et EXPLIQUE le raisonnement sous-jacent de l'élève avec bienveillance
7. strategieAntiRepetition : donne LE RÉFLEXE PRÉCIS à développer pour éviter cette erreur dans les prochains exercices
8. PERSONNALISE selon le profil, les intérêts et les adaptations de l'élève
9. Si TDAH : une seule idée par étape, bullet points courts
10. Si dyslexie : vocabulaire simple, phrases courtes, pas de blocs denses
11. Réponds UNIQUEMENT avec un JSON valide, sans markdown`;

  const userPrompt = `PROFIL DE L'ÉLÈVE :
${profilNarratif}

ÉPREUVE : ${epreuve?.titre ?? "Épreuve"}
Mise en situation : ${(epreuve?.miseEnSituation ?? "").slice(0, 300)}

QUESTIONS ET RÉPONSES À CORRIGER :
${JSON.stringify(questionsResumees, null, 2)}

INSTRUCTIONS :
- Pour QCM : la réponse de l'élève et la réponse attendue sont sous forme "LETTRE — texte". L'élève peut avoir écrit la lettre (A/B/C/D) OU le texte de l'option. Dans les deux cas, si le choix correspond à la bonne option → bonne réponse, plein de points. Toutes les options sont listées dans "optionsQCM".
- Pour REPONSE_COURTE : compare le sens général, pas juste le texte exact.
- Pour DEVELOPPEMENT/PROBLEME : évalue la démarche et le raisonnement (points partiels possibles).
- TOUTES les questions (correctes ET incorrectes) reçoivent des étapes d'explication. Un élève peut trouver la bonne réponse par hasard sans comprendre — il faut toujours renforcer la compréhension.
- Utilise l'univers de l'élève pour illustrer (ses intérêts, son sport, ses médias préférés).

RÉPONDS avec ce JSON :
{
  "score": <0 à 100, proportionnel aux points totaux obtenus / totalPoints>,
  "mention": "<Excellent ! | Très bien ! | Bien ! | En progression | À retravailler>",
  "ceQueJaiReussi": "<2-3 phrases positives et SPÉCIFIQUES — nommer précisément ce que l'élève a bien fait, pas juste 'bonne tentative'>",
  "encouragement": "<2 phrases d'encouragement chaleureux en français québécois, en référençant un intérêt de l'élève et en valorisant l'effort>",
  "prochainePiste": "<1 suggestion concrète, spécifique et motivante pour progresser — liée aux erreurs observées>",
  "patternErreurs": "<Si plusieurs questions incorrectes : identifier LE PATTERN commun dans les erreurs de l'élève et la notion-clé à consolider en priorité. Si tout est correct : identifier le prochain défi à relever>",
  "correctionParQuestion": {
    "<id_question>": {
      "bonne": <true | false>,
      "pointsObtenus": <0 à pointsQuestion>,
      "explication": "<1-2 phrases résumant le résultat avec bienveillance : félicitation précise ou description de l'écart entre la réponse attendue et la réponse donnée>",
      "diagnosticErreur": {
        "typeErreur": "<lacune_conceptuelle | erreur_de_procedure | etourderie | mauvaise_lecture_tache | reponse_correcte>",
        "explication": "<2 phrases expliquant le raisonnement probable de l'élève et POURQUOI cette erreur est compréhensible — avec bienveillance>"
      },
      "etapes": [
        {
          "titre": "Comprendre la tâche",
          "explication": "<Reformuler ce qui était demandé + identifier les MOTS-CLÉS dans l'énoncé qui indiquaient quoi faire>",
          "conseil": "<Le réflexe de lecture à adopter pour ce type de question>"
        },
        {
          "titre": "La notion à maîtriser",
          "explication": "<Quelles notions du PFEQ étaient nécessaires et POURQUOI elles s'appliquent ici>",
          "rappelTheorique": "<La règle/formule/concept COMPLET expliqué avec le sens derrière lui + exemple concret tiré de la vie réelle ou des intérêts de l'élève>"
        },
        {
          "titre": "Démarche de résolution pas à pas",
          "explication": "<Chaque micro-étape NUMÉROTÉE avec le POURQUOI de chaque étape — ex: '1. Je lis et souligne les données PARCE QUE… → 2. Je choisis cette opération PARCE QUE… → 3. Je calcule…'>",
          "solution": "<La réponse complète et détaillée avec toutes les étapes visibles>",
          "erreurEleve": "<Si incorrecte : à quel MOMENT PRÉCIS le raisonnement a dévié, ce que l'élève a probablement pensé, et quel aurait été le bon réflexe à ce moment-là. Si correcte : omettre>"
        },
        {
          "titre": "Comment vérifier ma réponse",
          "explication": "<La TECHNIQUE CONCRÈTE et SPÉCIFIQUE de vérification pour ce type de question — jamais 'relis ta réponse'. Ex: 'Pour vérifier une division, je multiplie le quotient par le diviseur et je dois retrouver le dividende'>"
        }
      ],
      "strategieAntiRepetition": "<Le RÉFLEXE PRÉCIS que l'élève doit développer pour ne plus faire cette erreur — formulé comme une habitude à prendre, ex: 'Dorénavant, avant tout calcul de pourcentage, je vérifie d'abord si…'>",
      "methodeOfficielle": "<La stratégie ou méthode EXACTE et NOMMÉE enseignée dans les écoles québécoises pour ce type précis de question>",
      "competencePFEQ": "<Compétence PFEQ spécifique avec son numéro et comment cette question la développe concrètement>",
      "astuceMemoire": "<Astuce mnémotechnique ORIGINALE et PERSONNALISÉE utilisant un élément précis des intérêts de l'élève — doit vraiment aider à retenir la notion>"
    }
  }
}

IMPORTANT ABSOLU :
- "etapes" (exactement 4), "diagnosticErreur", "strategieAntiRepetition", "methodeOfficielle", "competencePFEQ" et "astuceMemoire" sont OBLIGATOIRES pour TOUTES les questions sans exception
- Dans "La notion à maîtriser" → écris directement la règle/formule avec son sens, jamais "rappelle-toi de ce que tu as appris"
- Dans "Démarche de résolution" → liste TOUJOURS des étapes numérotées avec le POURQUOI de chaque étape
- Dans "Comment vérifier" → donne la technique spécifique à CE type de question, jamais générique
- "methodeOfficielle" → la stratégie SPÉCIFIQUE enseignée au Québec pour ce TYPE précis (pas générique)
- "astuceMemoire" → utilise OBLIGATOIREMENT un élément concret des intérêts de l'élève
- "strategieAntiRepetition" → formulé comme un RÉFLEXE À PRENDRE, pas une observation
- "patternErreurs" → analyse transversale de l'épreuve, essentiel pour l'enseignant et l'élève`;

  try {
    const response = await anthropic.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeout: 90000 }
    );

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = extractJSON(text);
    return JSON.parse(cleaned);
  } catch {
    // Fallback : correction basique basée sur les réponses attendues
    const correctionParQuestion: Record<string, {
      bonne: boolean;
      pointsObtenus: number;
      explication: string;
      etapes?: Array<{ titre: string; explication: string; solution?: string; erreurEleve?: string; rappelTheorique?: string; conseil?: string }>;
      methodeOfficielle?: string;
      competencePFEQ?: string;
      astuceMemoire?: string;
    }> = {};
    let pointsObtenus = 0;

    for (const q of questionsOriginales) {
      const repEleve = (reponses[q.id] ?? "").trim();

      // Pour QCM : accepter la lettre OU le texte de l'option correcte
      let bonne = false;
      let texteCorrect = q.reponseAttendue;
      if (q.type === "QCM" && q.choix) {
        const correctOption = q.choix.find(
          (c) => c.lettre.toUpperCase() === q.reponseAttendue.trim().toUpperCase()
        );
        texteCorrect = correctOption ? `${correctOption.lettre} — ${correctOption.texte}` : q.reponseAttendue;
        if (repEleve.length > 0) {
          bonne = q.choix.some(
            (c) => c.lettre.toUpperCase() === q.reponseAttendue.trim().toUpperCase()
              && (
                c.lettre.toUpperCase() === repEleve.toUpperCase()
                || c.texte.toLowerCase() === repEleve.toLowerCase()
                || repEleve.toLowerCase().startsWith(c.lettre.toLowerCase())
              )
          );
        }
      } else {
        bonne = repEleve.length > 0 && repEleve.toLowerCase() === q.reponseAttendue.trim().toLowerCase();
      }

      const pts = bonne ? q.pointsQuestion : 0;
      pointsObtenus += pts;
      const criteresTexte = (q.criteresCorrection ?? []).join(" ") || `La réponse correcte est : ${texteCorrect}`;
      correctionParQuestion[q.id] = {
        bonne,
        pointsObtenus: pts,
        explication: bonne
          ? "Bonne réponse ! Voici le raisonnement complet pour bien comprendre :"
          : "Pas tout à fait — voici la démarche complète pour y arriver :",
        methodeOfficielle: "Consulte ton manuel scolaire ou demande à ton enseignant(e) la méthode apprise en classe pour ce type de question.",
        competencePFEQ: criteresTexte,
        astuceMemoire: "Relis tes notes de cours sur cette notion et pratique des exercices similaires pour consolider ta compréhension.",
        etapes: [
          {
            titre: "Comprendre la tâche",
            explication: q.enonce,
            conseil: "Lis attentivement la question et repère les mots-clés avant de répondre.",
          },
          {
            titre: "Mobiliser ses connaissances",
            explication: "Rappelle-toi ce que tu as appris en classe sur ce sujet.",
            rappelTheorique: criteresTexte,
          },
          {
            titre: "Démarche de résolution pas à pas",
            explication: bonne
              ? "Tu as bien trouvé la réponse. Voici le raisonnement complet :"
              : "Voici comment arriver à la bonne réponse :",
            solution: texteCorrect,
            erreurEleve: !bonne && repEleve
              ? `Ta réponse était : "${repEleve}". Voici pourquoi la réponse attendue est différente.`
              : undefined,
          },
          {
            titre: "Vérification",
            explication: "Relis ta réponse et vérifie qu'elle correspond bien à ce qui était demandé dans la question.",
          },
        ] as Array<{ titre: string; explication: string; solution?: string; erreurEleve?: string; rappelTheorique?: string; conseil?: string }>,
      };
    }

    const totalPoints = questionsOriginales.reduce((s, q) => s + q.pointsQuestion, 0) || 100;
    const score = Math.round((pointsObtenus / totalPoints) * 100);
    const mention = score >= 90 ? "Excellent !" : score >= 75 ? "Très bien !" : score >= 60 ? "Bien !" : score >= 50 ? "En progression" : "À retravailler";

    return {
      score,
      mention,
      correctionParQuestion,
      ceQueJaiReussi: "Tu as pris le temps de répondre à toutes les questions — c'est déjà un bel effort !",
      encouragement: `Continue comme ça, ${profil.prenom} — chaque épreuve te fait progresser !`,
      prochainePiste: score < 60 ? "Revois les notions de base sur ce sujet avec ton enseignant(e) avant de réessayer." : undefined,
    };
  }
}
