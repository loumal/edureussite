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
const NIVEAU_LABELS_EN: Partial<Record<NiveauScolaire, string>> = {
  PRIMAIRE_1: "Grade 1", PRIMAIRE_2: "Grade 2", PRIMAIRE_3: "Grade 3",
  PRIMAIRE_4: "Grade 4", PRIMAIRE_5: "Grade 5", PRIMAIRE_6: "Grade 6",
  SECONDAIRE_1: "Secondary 1", SECONDAIRE_2: "Secondary 2", SECONDAIRE_3: "Secondary 3",
  SECONDAIRE_4: "Secondary 4", SECONDAIRE_5: "Secondary 5",
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

// ── Génération du rapport sommaire (toujours en anglais, puis traduit si FR) ──

export async function genererRapportSommaire(params: {
  domaine: DomaineSpecialiste;
  prenomEnfant: string;
  niveauScolaire: NiveauScolaire;
  reponsesEchelle: Record<string, number>;
  reponsesOuvertes: Record<string, string>;
}): Promise<{ en: RapportSommaire; fr: RapportSommaire }> {
  const { domaine, prenomEnfant, niveauScolaire, reponsesEchelle, reponsesOuvertes } = params;
  const questionnaire = getQuestionnaire(domaine);
  const anamnese = QUESTIONNAIRE_ANAMNESE;
  const domaineLabel = DOMAINE_LABELS_EN[domaine];
  const niveauLabelEn = NIVEAU_LABELS_EN[niveauScolaire] ?? niveauScolaire;
  const niveauLabelFr = NIVEAU_LABELS_FR[niveauScolaire] ?? niveauScolaire;

  // Data résumés en anglais (item labels EN)
  const resumeEchelle = resumeReponses(reponsesEchelle, questionnaire, "en");
  const resumeOuvertes = resumeReponsesOuvertes(reponsesOuvertes, questionnaire, anamnese, "en");

  const systemPrompt = `You are a specialized education professional (${domaineLabel}) writing a clinical summary report for teachers and schools.

⚠️ MANDATORY LANGUAGE RULE: Write EVERY word of your JSON output in English. The questionnaire data may contain French text — analyze it, but respond EXCLUSIVELY in English. Writing in French is not acceptable.

Style: clear, practical, clinically informed, no excessive jargon. This report is based on a parent-completed questionnaire, NOT a direct clinical assessment.`;

  const userPrompt = `Generate a structured summary report in JSON for the child ${prenomEnfant} (${niveauLabelEn}).

Questionnaire data (items rated ≥2/3 by parents — may include French item descriptions):
${resumeEchelle}

Open-ended parent responses (may be in French — interpret and analyze in English):
${resumeOuvertes}

Generate a JSON with exactly these fields:
{
  "pointsSaillants": ["...", "...", "..."],
  "forces": ["...", "...", "..."],
  "recommandationsEnseignant": ["...", "...", "..."],
  "ajustementsClasse": ["...", "...", "..."],
  "avertissement": "..."
}

Rules:
- pointsSaillants: 3-5 main clinical observations (neutral, factual, pattern-based interpretation)
- forces: 2-4 observed strengths identified from low-rated items and open responses
- recommandationsEnseignant: 3-5 concrete, actionable classroom recommendations
- ajustementsClasse: 3-5 specific pedagogical adjustments (e.g., extra time, visual cues, preferential seating)
- avertissement: 1 sentence stating this is based on a parent questionnaire, not a direct professional assessment
- ALL values must be in English — no French words allowed
- Reply ONLY with the JSON, no text before or after.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  logClaude({ service: ApiService.CLAUDE_ANALYSE, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude returned no valid JSON for sommaire EN");
  const parsed = JSON.parse(jsonMatch[0]);

  const dateGeneration = new Date().toISOString();
  const baseEn: RapportSommaire = {
    type: "SOMMAIRE",
    domaine,
    langue: "en",
    enfant: { prenom: prenomEnfant, niveauScolaire: niveauLabelEn },
    dateGeneration,
    pointsSaillants: parsed.pointsSaillants ?? [],
    forces: parsed.forces ?? [],
    recommandationsEnseignant: parsed.recommandationsEnseignant ?? [],
    ajustementsClasse: parsed.ajustementsClasse ?? [],
    avertissement: parsed.avertissement ?? "",
  };

  // Traduire EN → FR pour garantir contenu identique, langue correcte
  const baseFr = await traduireRapportSommaire(baseEn, niveauLabelFr);
  return { en: baseEn, fr: baseFr };
}

// ── Génération du rapport détaillé (toujours en anglais, puis traduit si FR) ──

export async function genererRapportDetail(params: {
  domaine: DomaineSpecialiste;
  prenomEnfant: string;
  niveauScolaire: NiveauScolaire;
  reponsesEchelle: Record<string, number>;
  reponsesOuvertes: Record<string, string>;
}): Promise<{ en: RapportDetail; fr: RapportDetail }> {
  const { domaine, prenomEnfant, niveauScolaire, reponsesEchelle, reponsesOuvertes } = params;
  const questionnaire = getQuestionnaire(domaine);
  const anamnese = QUESTIONNAIRE_ANAMNESE;
  const domaineLabel = DOMAINE_LABELS_EN[domaine];
  const niveauLabelEn = NIVEAU_LABELS_EN[niveauScolaire] ?? niveauScolaire;
  const niveauLabelFr = NIVEAU_LABELS_FR[niveauScolaire] ?? niveauScolaire;

  // Data résumés en anglais
  const resumeEchelle = resumeReponses(reponsesEchelle, questionnaire, "en");
  const resumeOuvertes = resumeReponsesOuvertes(reponsesOuvertes, questionnaire, anamnese, "en");

  const systemPrompt = `You are a specialized education professional (${domaineLabel}) writing a detailed parent report.

⚠️ MANDATORY LANGUAGE RULE: Write EVERY word of your JSON output in English. The questionnaire data and parent responses may be in French — analyze and interpret them, but write ALL your output exclusively in English. Any French word in your output is a failure.

Style: warm, empathetic, clinically informed, reassuring yet honest. Use "your child" when referring to the child. This report is based on a parent-completed questionnaire — it is NOT a direct clinical assessment and must say so.`;

  const userPrompt = `Generate a detailed parent report in JSON for the child ${prenomEnfant} (${niveauLabelEn}).

Questionnaire data (items rated ≥2/3 by parents — may include French item descriptions):
${resumeEchelle}

Open-ended parent responses (may be in French — interpret clinically, write output in English):
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
- introduction: 2-3 sentences contextualizing this assessment (what the questionnaire measures, why it was administered)
- analyseSections: 3-6 sections, each with a descriptive clinical name, 2-4 specific observations interpreted from the data, and a niveau ("eleve"=high concern, "moyen"=moderate, "faible"=low concern) — DO NOT translate these three niveau values
- forces: 3-5 concrete, evidence-based strengths (derived from low-rated items and positive open responses)
- zonesVulnerabilite: 3-5 areas warranting support (name patterns, not just symptoms; frame constructively without catastrophizing)
- recommandationsParents: 4-6 practical, specific, actionable home strategies (not generic advice)
- prochainesEtapes: 2-4 concrete next steps (e.g., consult specialist, request school assessment, specific accommodations)
- motCloture: 2-3 warm, encouraging closing sentences for parents
- avertissement: clear reminder this questionnaire is not a substitute for a direct professional clinical assessment
- ALL string values must be in English — no French words allowed in any value
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
  if (!jsonMatch) throw new Error("Claude returned no valid JSON for detail EN");
  const parsed = JSON.parse(jsonMatch[0]);

  const dateGeneration = new Date().toISOString();
  const baseEn: RapportDetail = {
    type: "DETAIL",
    domaine,
    langue: "en",
    enfant: { prenom: prenomEnfant, niveauScolaire: niveauLabelEn },
    dateGeneration,
    introduction: parsed.introduction ?? "",
    analyseSections: parsed.analyseSections ?? [],
    forces: parsed.forces ?? [],
    zonesVulnerabilite: parsed.zonesVulnerabilite ?? [],
    recommandationsParents: parsed.recommandationsParents ?? [],
    prochainesEtapes: parsed.prochainesEtapes ?? [],
    motCloture: parsed.motCloture ?? "",
    avertissement: parsed.avertissement ?? "",
  };

  // Traduire EN → FR pour garantir contenu identique, langue correcte
  const baseFr = await traduireRapportDetail(baseEn, niveauLabelFr);
  return { en: baseEn, fr: baseFr };
}

// ── Traduction EN → FR ────────────────────────────────────────────────────────

async function traduireRapportDetail(rapport: RapportDetail, niveauLabelFr: string): Promise<RapportDetail> {
  const system = `You are a professional medical and educational translator. Translate an evaluation report JSON from English to Quebec French (Canadian French, formal "vous" register).

Rules:
- Translate ALL string values to French
- Keep these exact values UNCHANGED (they are internal codes): "eleve", "moyen", "faible", "DETAIL", "SOMMAIRE"
- The JSON keys themselves must stay in English
- Use Quebec French educational terminology. "Your child" → "votre enfant". "Strengths" → "forces". Professional, warm tone.
- Reply ONLY with valid JSON, no text before or after.`;

  const userPrompt = `Translate all string values to Quebec French in this JSON. Keep keys in English. Keep niveau values ("eleve","moyen","faible") unchanged:\n\n${JSON.stringify(rapport, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });
  logClaude({ service: ApiService.CLAUDE_ANALYSE, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Translation returned no valid JSON for detail");
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    type: "DETAIL",
    domaine: rapport.domaine,
    langue: "fr",
    enfant: { prenom: rapport.enfant.prenom, niveauScolaire: niveauLabelFr },
    dateGeneration: rapport.dateGeneration,
    introduction: parsed.introduction ?? rapport.introduction,
    analyseSections: parsed.analyseSections ?? rapport.analyseSections,
    forces: parsed.forces ?? rapport.forces,
    zonesVulnerabilite: parsed.zonesVulnerabilite ?? rapport.zonesVulnerabilite,
    recommandationsParents: parsed.recommandationsParents ?? rapport.recommandationsParents,
    prochainesEtapes: parsed.prochainesEtapes ?? rapport.prochainesEtapes,
    motCloture: parsed.motCloture ?? rapport.motCloture,
    avertissement: parsed.avertissement ?? rapport.avertissement,
  };
}

async function traduireRapportSommaire(rapport: RapportSommaire, niveauLabelFr: string): Promise<RapportSommaire> {
  const system = `You are a professional medical and educational translator. Translate an evaluation report JSON from English to Quebec French (Canadian French, formal "vous" register).

Rules:
- Translate ALL string values to French
- The JSON keys themselves must stay in English
- Use Quebec French educational terminology. Professional, precise tone.
- Reply ONLY with valid JSON, no text before or after.`;

  const userPrompt = `Translate all string values to Quebec French in this JSON. Keep keys in English:\n\n${JSON.stringify(rapport, null, 2)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });
  logClaude({ service: ApiService.CLAUDE_ANALYSE, inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Translation returned no valid JSON for sommaire");
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    type: "SOMMAIRE",
    domaine: rapport.domaine,
    langue: "fr",
    enfant: { prenom: rapport.enfant.prenom, niveauScolaire: niveauLabelFr },
    dateGeneration: rapport.dateGeneration,
    pointsSaillants: parsed.pointsSaillants ?? rapport.pointsSaillants,
    forces: parsed.forces ?? rapport.forces,
    recommandationsEnseignant: parsed.recommandationsEnseignant ?? rapport.recommandationsEnseignant,
    ajustementsClasse: parsed.ajustementsClasse ?? rapport.ajustementsClasse,
    avertissement: parsed.avertissement ?? rapport.avertissement,
  };
}
