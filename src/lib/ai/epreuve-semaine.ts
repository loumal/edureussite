/**
 * Génération de l'épreuve de fin de semaine pour le plan de révision élève.
 *
 * Adapte le nombre de questions, la durée et le style selon le profil cognitif
 * (adaptations validées, pausesFrequentes, consignesCourtes, etc.)
 */
import { anthropic } from "./client";
import type { EpreuveGeneree } from "./exercice";
import type { NiveauScolaire, Matiere } from "@/generated/prisma";
import { lireAdaptations } from "@/lib/evaluation/adaptations";

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

export interface NotionSemaine {
  notion: string;   // ID PFEQ (ex: "MATH_FRACTIONS")
  matiere: Matiere;
  priorite: string;
}

export interface ProfilEleveSemaine {
  prenom: string;
  niveauScolaire: NiveauScolaire;
  centresInteret?: string[];
  sportFavori?: string | null;
  universMediatique?: string | null;
  autresPassions?: string | null;
  profilCognitif?: unknown;
  parcoursAdapte?: unknown;
}

/**
 * Génère une épreuve de fin de semaine structurée, adaptée au profil de l'élève.
 * - Durée cible : 25–45 min (réduite pour les profils avec adaptations)
 * - Format : 3 parties (connaissances, application, situation complexe)
 * - Adapté : questions courtes si pausesFrequentes, moins de questions si objectifsCourtsTerme
 */
export async function genererEpreuveSemainePlan({
  notions,
  profil,
  semaineISO,
}: {
  notions: NotionSemaine[];
  profil: ProfilEleveSemaine;
  semaineISO: string;
}): Promise<EpreuveGeneree> {
  const adaptations = lireAdaptations(profil.profilCognitif, profil.parcoursAdapte);

  // ── Paramètres adaptés ──────────────────────────────────────────────────────
  const dureeBase = 35; // minutes par défaut
  let dureeMinutes = dureeBase;
  let nbQuestionsParPartie = [5, 4, 2]; // Partie 1, 2, 3
  let consignesCourtes = false;

  if (adaptations.exercices.pausesFrequentes) {
    dureeMinutes = Math.min(dureeBase, adaptations.exercices.dureeSessionMaxMin);
    nbQuestionsParPartie = [3, 2, 1];
    consignesCourtes = true;
  } else if (adaptations.exercices.objectifsCourtsTerme || adaptations.exercices.consignesCourtes) {
    dureeMinutes = 25;
    nbQuestionsParPartie = [4, 3, 1];
    consignesCourtes = true;
  } else if (adaptations.exercices.tempsSupplementaire) {
    dureeMinutes = Math.round(dureeBase * adaptations.exercices.multiplicateurTemps);
  }

  // ── Regrouper les notions par matière ────────────────────────────────────────
  const matieresDeSemaine = [...new Set(notions.map((n) => n.matiere))];
  const matierePrincipale = matieresDeSemaine[0]; // La matière qui a le plus de notions

  // ── Construire le contexte élève ─────────────────────────────────────────────
  const interets = [
    profil.sportFavori,
    profil.universMediatique,
    profil.autresPassions,
    ...(profil.centresInteret ?? []),
  ].filter(Boolean).slice(0, 4).join(", ");

  const notionsStr = notions
    .map((n) => `• ${n.notion.replace(/_/g, " ")} (${MATIERES_LABELS[n.matiere]}, priorité: ${n.priorite})`)
    .join("\n");

  const adaptationsStr = adaptations.narratifPourIA
    ? `\n\nADAPTATIONS VALIDÉES OBLIGATOIRES :\n${adaptations.narratifPourIA}`
    : "";

  const consignesFormat = consignesCourtes
    ? "CONSIGNES COURTES : chaque question = 1 seule consigne, max 15 mots."
    : "Consignes claires et précises, max 2 phrases par question.";

  const structureParties = `STRUCTURE OBLIGATOIRE :
• Partie 1 — Connaissance et rappel (${nbQuestionsParPartie[0]} questions QCM ou réponse courte, 30 pts)
• Partie 2 — Application (${nbQuestionsParPartie[1]} questions problème ou réponse courte, 40 pts)
• Partie 3 — Situation complexe (${nbQuestionsParPartie[2]} question${nbQuestionsParPartie[2] > 1 ? "s" : ""} développement, 30 pts)`;

  const systemPrompt = `Tu es un concepteur d'épreuves expert en pédagogie québécoise (PFEQ/MEES).

Tu crées une ÉPREUVE DE FIN DE SEMAINE pour valider les notions travaillées dans la semaine de révision de l'élève.

RÈGLES ABSOLUES :
1. L'épreuve doit être courte et réaliste — pas un examen de 3 heures
2. Durée cible : ${dureeMinutes} minutes maximum
3. ${structureParties}
4. ${consignesFormat}
5. Toutes les questions découlent d'une mise en situation cohérente ancrée dans l'univers de l'élève
6. Progression Bloom : connaissance → application → synthèse
7. Français québécois authentique
8. Barème sur 100 points exactement
9. Réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication${adaptationsStr}`;

  const userPrompt = `PROFIL DE L'ÉLÈVE :
• Prénom : ${profil.prenom}
• Niveau scolaire : ${NIVEAUX_LABELS[profil.niveauScolaire]}
• Centres d'intérêt : ${interets || "non spécifiés"}

SEMAINE ÉVALUÉE : ${semaineISO}
MATIÈRE PRINCIPALE : ${matierePrincipale ? MATIERES_LABELS[matierePrincipale] : "plusieurs matières"}

NOTIONS TRAVAILLÉES CETTE SEMAINE (à couvrir TOUTES dans l'épreuve) :
${notionsStr}

GÉNÈRE cette épreuve de fin de semaine en JSON exact :
{
  "titre": "Épreuve de la semaine — [notions clés] (univers de l'élève)",
  "miseEnSituation": "Texte 100-200 mots, ancré dans l'univers de ${profil.prenom}, donnant du sens à toutes les questions",
  "notionsCiblees": ["Notion 1 lisible", "Notion 2 lisible"],
  "dureeMinutes": ${dureeMinutes},
  "totalPoints": 100,
  "parties": [
    {
      "numero": 1,
      "titre": "Partie 1 — Connaissance et rappel",
      "description": "Questions pour valider la mémorisation des notions",
      "points": 30,
      "questions": [
        {
          "id": "1a",
          "type": "QCM",
          "enonce": "Question en lien avec la mise en situation",
          "pointsQuestion": 6,
          "choix": [
            { "lettre": "A", "texte": "Réponse A" },
            { "lettre": "B", "texte": "Réponse B" },
            { "lettre": "C", "texte": "Réponse C" },
            { "lettre": "D", "texte": "Réponse D" }
          ],
          "reponseAttendue": "A",
          "criteresCorrection": ["Critère 1"]
        }
      ]
    },
    {
      "numero": 2,
      "titre": "Partie 2 — Application",
      "description": "Exercices d'application dans des situations nouvelles",
      "points": 40,
      "questions": [
        {
          "id": "2a",
          "type": "REPONSE_COURTE",
          "enonce": "Question d'application",
          "pointsQuestion": 10,
          "reponseAttendue": "Réponse attendue",
          "criteresCorrection": ["Critère 1", "Critère 2"]
        }
      ]
    },
    {
      "numero": 3,
      "titre": "Partie 3 — Situation complexe",
      "description": "Tâche de synthèse intégrant les notions",
      "points": 30,
      "questions": [
        {
          "id": "3a",
          "type": "DEVELOPPEMENT",
          "enonce": "Question de synthèse ouverte",
          "pointsQuestion": 30,
          "reponseAttendue": "Éléments de réponse attendus",
          "criteresCorrection": ["Critère 1", "Critère 2", "Critère 3"]
        }
      ]
    }
  ]
}

Types valides : "QCM", "REPONSE_COURTE", "DEVELOPPEMENT", "PROBLEME"
IMPORTANT : Le total des pointsQuestion dans chaque partie doit égaler le champ "points" de cette partie.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extraction JSON robuste
  let cleaned = text.replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start > 0 && end > start) cleaned = cleaned.slice(start, end + 1);

  // Sanitize backslashes invalides
  cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, "\\\\$1");

  try {
    const parsed = JSON.parse(cleaned) as EpreuveGeneree;
    // Valider la structure minimale
    if (!parsed.parties || !Array.isArray(parsed.parties)) {
      throw new Error("Structure épreuve invalide — parties manquantes");
    }
    return parsed;
  } catch (err) {
    throw new Error(`Génération épreuve semaine échouée : ${err}`);
  }
}

/**
 * Génère le feedback IA après la complétion de l'épreuve de semaine.
 * Retourne un score + corrections détaillées par question.
 */
export async function genererFeedbackEpreuveSemaine({
  epreuve,
  reponses,
  prenom,
  profilCognitif,
  parcoursAdapte,
}: {
  epreuve: EpreuveGeneree;
  reponses: Record<string, string>;
  prenom: string;
  profilCognitif?: unknown;
  parcoursAdapte?: unknown;
}): Promise<{
  score: number;
  mention: string;
  ceQueJaiReussi: string;
  encouragement: string;
  prochainePiste: string;
  correctionParQuestion: Record<string, {
    bonne: boolean;
    pointsObtenus: number;
    explication: string;
  }>;
}> {
  const adaptations = lireAdaptations(profilCognitif, parcoursAdapte);
  const encouragementStyle = adaptations.exercices.recompensesFrequentes
    ? "Sois très encourageant·e — célèbre chaque réussite, même partielle."
    : "Sois bienveillant·e mais précis·e dans le feedback.";

  const questionsStr = epreuve.parties
    .flatMap((p) => p.questions)
    .map((q) => {
      const rep = reponses[q.id] ?? "(pas de réponse)";
      return `Q${q.id} [${q.type}, ${q.pointsQuestion}pts] : "${q.enonce}" | Réponse élève : "${rep}" | Attendu : "${q.reponseAttendue}"`;
    })
    .join("\n");

  const prompt = `Tu corriges l'épreuve de fin de semaine de ${prenom}.

QUESTIONS ET RÉPONSES :
${questionsStr}

INSTRUCTIONS :
- Calcule le score sur 100
- Génère un feedback bienveillant personnalisé
- ${encouragementStyle}
- Pour chaque question, indique si la réponse est bonne, les points obtenus, et une explication courte

Réponds UNIQUEMENT en JSON :
{
  "score": 75,
  "mention": "Bien !",
  "ceQueJaiReussi": "Ce que l'élève a bien réussi (1-2 phrases)",
  "encouragement": "Message d'encouragement personnalisé pour ${prenom}",
  "prochainePiste": "1-2 notions à retravailler en priorité",
  "correctionParQuestion": {
    "1a": { "bonne": true, "pointsObtenus": 6, "explication": "Bonne réponse car..." },
    "2a": { "bonne": false, "pointsObtenus": 5, "explication": "La réponse attendue était..." }
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  let cleaned = text.replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start > 0 && end > start) cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback minimal
    const totalPts = epreuve.parties.reduce((s, p) => s + p.points, 0);
    const obtenus = epreuve.parties
      .flatMap((p) => p.questions)
      .reduce((s, q) => {
        const rep = (reponses[q.id] ?? "").trim().toLowerCase();
        const ok = rep !== "" && rep === q.reponseAttendue.trim().toLowerCase();
        return s + (ok ? q.pointsQuestion : 0);
      }, 0);
    const score = Math.round((obtenus / Math.max(totalPts, 1)) * 100);
    return {
      score,
      mention: score >= 80 ? "Très bien !" : score >= 60 ? "Bien !" : "Continue !",
      ceQueJaiReussi: "Tu as répondu à toutes les questions — c'est déjà une belle réussite !",
      encouragement: `Bravo ${prenom} pour avoir terminé cette épreuve ! Continue sur cette lancée.`,
      prochainePiste: "Revoir les notions où tu as hésité.",
      correctionParQuestion: {},
    };
  }
}
