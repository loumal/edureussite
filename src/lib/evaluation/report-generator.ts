import { anthropic } from "@/lib/ai/client";
import { logClaude } from "@/lib/api-usage/logger";
import { ApiService, type DomaineSpecialiste, type NiveauScolaire } from "@/generated/prisma";
import type { Questionnaire } from "./questionnaire-types";
import { getQuestionnaire, QUESTIONNAIRE_ANAMNESE } from "./questionnaires";

// ── Types de rapport ──────────────────────────────────────────────────────────

export interface RapportSommaire {
  type: "SOMMAIRE";
  domaine: DomaineSpecialiste;
  langue: "fr" | "en";
  enfant: { prenom: string; niveauScolaire: string };
  dateGeneration: string;
  // Points saillants (3-5 points pour l'école/enseignant)
  pointsSaillants: string[];
  // Forces observées
  forces: string[];
  // Recommandations pratiques pour l'enseignant
  recommandationsEnseignant: string[];
  // Ajustements suggérés en classe
  ajustementsClasse: string[];
  // Avertissement légal
  avertissement: string;
}

export interface RapportDetail {
  type: "DETAIL";
  domaine: DomaineSpecialiste;
  langue: "fr" | "en";
  enfant: { prenom: string; niveauScolaire: string };
  dateGeneration: string;
  // Introduction (contexte, pourquoi ce questionnaire)
  introduction: string;
  // Analyse par section (points élevés)
  analyseSections: {
    section: string;
    observations: string[];
    niveau: "eleve" | "moyen" | "faible";
  }[];
  // Forces de l'enfant
  forces: string[];
  // Zones de vulnérabilité
  zonesVulnerabilite: string[];
  // Recommandations détaillées pour les parents
  recommandationsParents: string[];
  // Ressources et prochaines étapes suggérées
  prochainesEtapes: string[];
  // Mot de clôture rassurant
  motCloture: string;
  // Avertissement légal
  avertissement: string;
}

export type RapportContenu = RapportSommaire | RapportDetail;

// ── Labels ─────────────────────────────────────────────────────────────────

const DOMAINE_LABELS_FR: Record<DomaineSpecialiste, string> = {
  NEUROPSYCHOLOGUE: "Neuropsychologue",
  ORTHOPEDAGOGUE: "Orthopédagogue",
  ORTHOPHONISTE: "Orthophoniste",
  ERGOTHERAPEUTE: "Ergothérapeute",
  OPTOMETRISTE: "Optométriste développemental",
  PSYCHOEDUCATEUR: "Psychoéducateur",
};
const DOMAINE_LABELS_EN: Record<DomaineSpecialiste, string> = {
  NEUROPSYCHOLOGUE: "Neuropsychologist",
  ORTHOPEDAGOGUE: "Learning specialist",
  ORTHOPHONISTE: "Speech-language pathologist",
  ERGOTHERAPEUTE: "Occupational therapist",
  OPTOMETRISTE: "Developmental optometrist",
  PSYCHOEDUCATEUR: "Psychoeducator",
};

const NIVEAU_LABELS_FR: Partial<Record<NiveauScolaire, string>> = {
  PRIMAIRE_1: "1re année du primaire", PRIMAIRE_2: "2e année", PRIMAIRE_3: "3e année",
  PRIMAIRE_4: "4e année", PRIMAIRE_5: "5e année", PRIMAIRE_6: "6e année",
  SECONDAIRE_1: "Secondaire 1", SECONDAIRE_2: "Secondaire 2", SECONDAIRE_3: "Secondaire 3",
  SECONDAIRE_4: "Secondaire 4", SECONDAIRE_5: "Secondaire 5",
};

// ── Résumé des réponses pour le prompt ────────────────────────────────────

function resumeReponses(
  reponsesEchelle: Record<string, number>,
  questionnaire: Questionnaire,
  langue: "fr" | "en"
): string {
  const lignes: string[] = [];
  const fr = langue === "fr";

  for (const section of questionnaire.sections) {
    if (!section.items) continue;
    const itemsEleves = section.items.filter((item) => {
      const score = reponsesEchelle[item.id];
      return score !== undefined && score >= 2;
    });
    if (itemsEleves.length === 0) continue;

    lignes.push(`\n[${fr ? section.titreFr : section.titreEn}]`);
    for (const item of itemsEleves) {
      const score = reponsesEchelle[item.id];
      const label = score === 3
        ? (fr ? "Très souvent" : "Very often")
        : (fr ? "Souvent" : "Often");
      lignes.push(`  • (${label}) ${fr ? item.fr : item.en}`);
    }
  }

  return lignes.join("\n") || (fr ? "Aucun item coté ≥2." : "No items rated ≥2.");
}

function resumeReponsesOuvertes(
  reponsesOuvertes: Record<string, string>,
  questionnaire: Questionnaire,
  anamneseQuestionnaire: Questionnaire,
  langue: "fr" | "en"
): string {
  const fr = langue === "fr";
  const lignes: string[] = [];

  for (const q of questionnaire.sections) {
    if (!q.questions) continue;
    for (const item of q.questions) {
      const reponse = reponsesOuvertes[item.id];
      if (reponse?.trim()) {
        lignes.push(`Q: ${fr ? item.fr : item.en}`);
        lignes.push(`R: ${reponse.trim()}`);
      }
    }
  }
  for (const q of anamneseQuestionnaire.sections) {
    if (!q.questions) continue;
    for (const item of q.questions) {
      const reponse = reponsesOuvertes[item.id];
      if (reponse?.trim()) {
        lignes.push(`[Anamnèse] Q: ${fr ? item.fr : item.en}`);
        lignes.push(`R: ${reponse.trim()}`);
      }
    }
  }

  return lignes.join("\n") || (fr ? "Aucune réponse ouverte fournie." : "No open-ended responses provided.");
}

// ── Génération du rapport sommaire ──────────────────────────────────────────

export async function genererRapportSommaire(params: {
  domaine: DomaineSpecialiste;
  langue: "fr" | "en";
  prenomEnfant: string;
  niveauScolaire: NiveauScolaire;
  reponsesEchelle: Record<string, number>;
  reponsesOuvertes: Record<string, string>;
}): Promise<RapportSommaire> {
  const { domaine, langue, prenomEnfant, niveauScolaire, reponsesEchelle, reponsesOuvertes } = params;
  const fr = langue === "fr";
  const questionnaire = getQuestionnaire(domaine);
  const anamnese = QUESTIONNAIRE_ANAMNESE;
  const domaineLabel = fr ? DOMAINE_LABELS_FR[domaine] : DOMAINE_LABELS_EN[domaine];
  const niveauLabel = NIVEAU_LABELS_FR[niveauScolaire] ?? niveauScolaire;

  const resumeEchelle = resumeReponses(reponsesEchelle, questionnaire, langue);
  const resumeOuvertes = resumeReponsesOuvertes(reponsesOuvertes, questionnaire, anamnese, langue);

  const systemPrompt = fr
    ? `Tu es un professionnel de l'éducation spécialisé (${domaineLabel}). Tu rédiges des rapports sommaires destinés aux enseignants et à l'école — clairs, pratiques, sans jargon clinique excessif. Le rapport est basé sur un questionnaire rempli par les parents, PAS sur une évaluation clinique directe. Tu dois toujours inclure un avertissement clair à ce sujet.`
    : `You are a specialized education professional (${domaineLabel}). You write summary reports for teachers and schools — clear, practical, without excessive clinical jargon. The report is based on a parent-completed questionnaire, NOT a direct clinical assessment. Always include a clear disclaimer.`;

  const userPrompt = fr
    ? `Génère un rapport sommaire structuré en JSON pour l'enfant ${prenomEnfant} (${niveauLabel}).

Données du questionnaire (items cotés ≥2/3 par les parents) :
${resumeEchelle}

Réponses aux questions ouvertes :
${resumeOuvertes}

Génère un JSON avec exactement ces champs :
{
  "pointsSaillants": ["...", "...", "...", "...", "..."],
  "forces": ["...", "...", "..."],
  "recommandationsEnseignant": ["...", "...", "...", "..."],
  "ajustementsClasse": ["...", "...", "...", "..."],
  "avertissement": "..."
}

Rules :
- pointsSaillants : 3-5 observations cliniques principales (neutre, factuel)
- forces : 2-4 forces observées (positif)
- recommandationsEnseignant : 3-5 recommandations concrètes pour la classe
- ajustementsClasse : 3-5 ajustements pédagogiques pratiques (ex: plus de temps, support visuel)
- avertissement : 1 phrase rappelant que ceci est basé sur un questionnaire parent et non une évaluation professionnelle directe
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`
    : `Generate a structured summary report in JSON for the child ${prenomEnfant} (${niveauLabel}).

Questionnaire data (items rated ≥2/3 by parents):
${resumeEchelle}

Open-ended responses:
${resumeOuvertes}

Generate a JSON with exactly these fields:
{
  "pointsSaillants": ["...", "...", "...", "...", "..."],
  "forces": ["...", "...", "..."],
  "recommandationsEnseignant": ["...", "...", "...", "..."],
  "ajustementsClasse": ["...", "...", "...", "..."],
  "avertissement": "..."
}

Rules:
- pointsSaillants: 3-5 main clinical observations (neutral, factual)
- forces: 2-4 observed strengths (positive)
- recommandationsEnseignant: 3-5 concrete recommendations for the classroom
- ajustementsClasse: 3-5 practical pedagogical adjustments (e.g., extra time, visual supports)
- avertissement: 1 sentence reminding that this is based on a parent questionnaire and not a direct professional assessment
- Reply ONLY with the JSON, no text before or after.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  logClaude({ service: ApiService.CLAUDE_ANALYSE, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned no valid JSON for sommaire");
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    type: "SOMMAIRE",
    domaine,
    langue,
    enfant: { prenom: prenomEnfant, niveauScolaire: niveauLabel },
    dateGeneration: new Date().toISOString(),
    pointsSaillants: parsed.pointsSaillants ?? [],
    forces: parsed.forces ?? [],
    recommandationsEnseignant: parsed.recommandationsEnseignant ?? [],
    ajustementsClasse: parsed.ajustementsClasse ?? [],
    avertissement: parsed.avertissement ?? "",
  };
}

// ── Génération du rapport détaillé ──────────────────────────────────────────

export async function genererRapportDetail(params: {
  domaine: DomaineSpecialiste;
  langue: "fr" | "en";
  prenomEnfant: string;
  niveauScolaire: NiveauScolaire;
  reponsesEchelle: Record<string, number>;
  reponsesOuvertes: Record<string, string>;
}): Promise<RapportDetail> {
  const { domaine, langue, prenomEnfant, niveauScolaire, reponsesEchelle, reponsesOuvertes } = params;
  const fr = langue === "fr";
  const questionnaire = getQuestionnaire(domaine);
  const anamnese = QUESTIONNAIRE_ANAMNESE;
  const domaineLabel = fr ? DOMAINE_LABELS_FR[domaine] : DOMAINE_LABELS_EN[domaine];
  const niveauLabel = NIVEAU_LABELS_FR[niveauScolaire] ?? niveauScolaire;

  const resumeEchelle = resumeReponses(reponsesEchelle, questionnaire, langue);
  const resumeOuvertes = resumeReponsesOuvertes(reponsesOuvertes, questionnaire, anamnese, langue);

  const systemPrompt = fr
    ? `Tu es un professionnel de l'éducation spécialisé (${domaineLabel}) qui rédige un rapport détaillé pour les parents. Le ton est chaleureux, empathique, rassurant tout en étant honnête. Le rapport est basé sur un questionnaire parental — tu dois toujours mentionner qu'il ne s'agit pas d'une évaluation clinique directe. Utilise "votre enfant" pour t'adresser aux parents.`
    : `You are a specialized education professional (${domaineLabel}) writing a detailed report for parents. The tone is warm, empathetic, reassuring while being honest. The report is based on a parent questionnaire — always mention it is not a direct clinical assessment. Use "your child" when addressing parents.`;

  const userPrompt = fr
    ? `Génère un rapport détaillé structuré en JSON pour l'enfant ${prenomEnfant} (${niveauLabel}).

Données du questionnaire (items cotés ≥2/3 par les parents) :
${resumeEchelle}

Réponses aux questions ouvertes :
${resumeOuvertes}

Génère un JSON avec exactement ces champs :
{
  "introduction": "...",
  "analyseSections": [
    { "section": "...", "observations": ["...", "..."], "niveau": "eleve|moyen|faible" }
  ],
  "forces": ["...", "...", "..."],
  "zonesVulnerabilite": ["...", "...", "..."],
  "recommandationsParents": ["...", "...", "...", "...", "..."],
  "prochainesEtapes": ["...", "...", "..."],
  "motCloture": "...",
  "avertissement": "..."
}

Rules :
- introduction : 2-3 phrases de contexte (pourquoi ce questionnaire, ce qu'il mesure)
- analyseSections : 3-5 sections avec observations spécifiques basées sur les réponses élevées
- forces : 3-5 forces concrètes identifiées (basées sur réponses faibles + réponses ouvertes)
- zonesVulnerabilite : 3-5 zones nécessitant un soutien (sans dramatiser)
- recommandationsParents : 4-6 conseils pratiques à la maison (actionables, bienveillants)
- prochainesEtapes : 2-4 étapes suggérées (ex: consultation spécialiste, supports disponibles)
- motCloture : 2-3 phrases de clôture encourageantes pour les parents
- avertissement : rappel clair que ceci est un questionnaire et non une évaluation clinique directe
- Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après.`
    : `Generate a detailed structured report in JSON for the child ${prenomEnfant} (${niveauLabel}).

Questionnaire data (items rated ≥2/3 by parents):
${resumeEchelle}

Open-ended responses:
${resumeOuvertes}

Generate a JSON with exactly these fields:
{
  "introduction": "...",
  "analyseSections": [
    { "section": "...", "observations": ["...", "..."], "niveau": "eleve|moyen|faible" }
  ],
  "forces": ["...", "...", "..."],
  "zonesVulnerabilite": ["...", "...", "..."],
  "recommandationsParents": ["...", "...", "...", "...", "..."],
  "prochainesEtapes": ["...", "...", "..."],
  "motCloture": "...",
  "avertissement": "..."
}

Rules:
- introduction: 2-3 context sentences (why this questionnaire, what it measures)
- analyseSections: 3-5 sections with specific observations based on high ratings
- forces: 3-5 concrete strengths identified (from low ratings + open responses)
- zonesVulnerabilite: 3-5 areas needing support (without dramatizing)
- recommandationsParents: 4-6 practical home tips (actionable, kind)
- prochainesEtapes: 2-4 suggested next steps (e.g., specialist consultation, available supports)
- motCloture: 2-3 encouraging closing sentences for parents
- avertissement: clear reminder this is a questionnaire, not a direct clinical assessment
- Reply ONLY with valid JSON, no text before or after.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  logClaude({ service: ApiService.CLAUDE_ANALYSE, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned no valid JSON for detail");
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    type: "DETAIL",
    domaine,
    langue,
    enfant: { prenom: prenomEnfant, niveauScolaire: niveauLabel },
    dateGeneration: new Date().toISOString(),
    introduction: parsed.introduction ?? "",
    analyseSections: parsed.analyseSections ?? [],
    forces: parsed.forces ?? [],
    zonesVulnerabilite: parsed.zonesVulnerabilite ?? [],
    recommandationsParents: parsed.recommandationsParents ?? [],
    prochainesEtapes: parsed.prochainesEtapes ?? [],
    motCloture: parsed.motCloture ?? "",
    avertissement: parsed.avertissement ?? "",
  };
}
