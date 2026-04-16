import { anthropic } from "./client";
import { type Matiere, type NiveauScolaire, type TypeExercice, type NiveauDifficulte } from "@/generated/prisma";

export interface SectionAnalysee {
  ordre: number;
  titre: string;
  typeQuestion: TypeExercice;
  nombreQuestions: number;
  pointsTotal: number;
  competencesPFEQ: string[];
  difficulte: NiveauDifficulte;
  instructions?: string;
  exempleQuestion?: object;
}

export interface StructureEpreuve {
  titre: string;
  totalPoints: number;
  dureeMinutes: number;
  description: string;
  styleGeneral: string;
  sections: SectionAnalysee[];
  competencesGlobales: string[];
  niveauLangue: string;
  consignesGenerales?: string;
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

const MATIERES_LABELS: Record<Matiere, string> = {
  FRANCAIS: "Français langue d'enseignement",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Science et technologie",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ETHIQUE: "Éthique et culture religieuse",
  ANGLAIS: "Anglais langue seconde",
  EDUCATION_PHYSIQUE: "Éducation physique",
};

export async function analyserStructureEpreuve(input: {
  contenu: string;
  matiere: Matiere;
  niveauScolaire: NiveauScolaire;
}): Promise<StructureEpreuve> {
  const systemPrompt = `Tu es un expert en évaluation pédagogique québécoise, spécialisé dans le Programme de formation de l'école québécoise (PFEQ) du MEES.

Ta mission : analyser la STRUCTURE d'une épreuve fournie par un administrateur pédagogique et en extraire un modèle réutilisable.

RÈGLES ABSOLUES :
1. Tu analyses uniquement la STRUCTURE (format, types de questions, répartition des points, compétences ciblées)
2. Tu NE reproduis JAMAIS le contenu exact des questions — uniquement leur forme
3. Pour "exempleQuestion", crée un exemple ORIGINAL illustrant le TYPE de question, jamais copié
4. Aligne chaque section sur les compétences PFEQ officielles
5. Réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication`;

  const userPrompt = `Analyse la structure de cette épreuve de ${MATIERES_LABELS[input.matiere]} pour ${NIVEAUX_LABELS[input.niveauScolaire]}.

ÉPREUVE À ANALYSER :
---
${input.contenu}
---

RÉPONDS avec ce JSON exact :
{
  "titre": "Titre descriptif du type d'épreuve (ex: Épreuve de lecture compréhension — 2e cycle du secondaire)",
  "totalPoints": 100,
  "dureeMinutes": 90,
  "description": "Description pédagogique de 1-2 phrases",
  "styleGeneral": "Description du style général (ex: Questions courtes + texte long + développement)",
  "competencesGlobales": ["Compétence PFEQ 1", "Compétence PFEQ 2"],
  "niveauLangue": "Description du registre de langue attendu",
  "consignesGenerales": "Structure typique des consignes générales si présente",
  "sections": [
    {
      "ordre": 1,
      "titre": "Titre de la section (ex: Partie A — Compréhension de lecture)",
      "typeQuestion": "LECTURE_COMPREHENSION",
      "nombreQuestions": 10,
      "pointsTotal": 40,
      "difficulte": "ATTENDU",
      "competencesPFEQ": ["Lire des textes variés", "Construire du sens"],
      "instructions": "Format typique des consignes de cette section",
      "exempleQuestion": {
        "enonce": "Exemple original illustrant le format (jamais copié de l'épreuve)",
        "typeReponse": "choix_multiple | court | developpement",
        "pointsParQuestion": 4
      }
    }
  ]
}

Types de questions valides : TEXTE_TROUS, QCM, QUESTION_OUVERTE, PROBLEME_MATHEMATIQUE, LECTURE_COMPREHENSION, EXERCICE_ORAL, MISE_EN_SITUATION, SCHEMA_COMPLETER, CHRONOLOGIE, MINI_DEFI
Niveaux de difficulté valides : REMEDIATION, BASE, ATTENDU, AVANCE, EXCELLENCE`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return parsed as StructureEpreuve;
  } catch {
    throw new Error("L'analyse de structure a échoué. Vérifiez que le contenu collé est lisible.");
  }
}

/**
 * Génère le contexte de structure à injecter dans le prompt de génération d'exercice
 * pour qu'il respecte le format d'une épreuve de référence.
 */
export function formaterContexteModele(
  modele: { titre: string; styleGeneral: string; niveauLangue: string; sections: SectionAnalysee[] },
  section?: SectionAnalysee
): string {
  if (section) {
    return `
MODÈLE DE RÉFÉRENCE : "${modele.titre}"
Style général : ${modele.styleGeneral}
Registre de langue : ${modele.niveauLangue}
Section ciblée : "${section.titre}" (${section.nombreQuestions} questions, ${section.pointsTotal} pts)
Compétences PFEQ : ${section.competencesPFEQ.join(", ")}
Format de la section : ${section.instructions ?? "standard"}
${section.exempleQuestion ? `Exemple de format : ${JSON.stringify(section.exempleQuestion)}` : ""}

Génère un exercice qui RESPECTE CE FORMAT sans copier aucun contenu de l'épreuve originale.`;
  }

  return `
MODÈLE DE RÉFÉRENCE : "${modele.titre}"
Style général : ${modele.styleGeneral}
Registre de langue : ${modele.niveauLangue}

Génère un exercice qui respecte ce style sans copier aucun contenu.`;
}
