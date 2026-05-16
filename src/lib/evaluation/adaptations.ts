/**
 * Source de vérité unique pour les adaptations actives d'un profil élève.
 *
 * Couche 1 (flags) : lus directement depuis profilCognitif.ajustements (instantané, sans IA)
 * Couche 2 (parcours) : lus depuis parcoursAdapte généré par l'agent IA post-évaluation
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdaptationsUI {
  grandPolice: boolean;
  textesAeres: boolean;
  contrastEleve: boolean;
  simplificationMenus: boolean;
  limiterLectureEcran: boolean;
}

export interface AdaptationsExercices {
  tempsSupplementaire: boolean;
  multiplicateurTemps: number;
  consignesCourtes: boolean;
  pausesFrequentes: boolean;
  supportVisuel: boolean;
  synthèseVocale: boolean;
  supportOral: boolean;
  exercicesMotriciteReduits: boolean;
  alternativeEcritureManuelle: boolean;
  recompensesFrequentes: boolean;
  objectifsCourtsTerme: boolean;
  nombreQuestionsMax: number;
  dureeSessionMaxMin: number;
}

export interface AdaptationsParcours {
  notionsPrioritaires: string[];
  notionsAReporter: string[];
  typeExercicesPrivilegies: string[];
  typeExercicesAEviter: string[];
  niveauDifficulteDepart: string;
  renforcementPositifFrequence: "apres_chaque_reponse" | "fin_session" | "normal";
  strategiesPedagogiques: string[];
  axesPrioritaires: string[];
}

export interface AdaptationsActives {
  ui: AdaptationsUI;
  exercices: AdaptationsExercices;
  parcours: AdaptationsParcours;
  // Meta
  hasEvaluation: boolean;
  domaineEvalue: string | null;
  dateAdaptation: string | null;
  narratifPourIA: string;
}

// ── Valeurs par défaut (aucune adaptation) ────────────────────────────────────

const DEFAULTS: AdaptationsActives = {
  ui: {
    grandPolice: false,
    textesAeres: false,
    contrastEleve: false,
    simplificationMenus: false,
    limiterLectureEcran: false,
  },
  exercices: {
    tempsSupplementaire: false,
    multiplicateurTemps: 1.0,
    consignesCourtes: false,
    pausesFrequentes: false,
    supportVisuel: false,
    synthèseVocale: false,
    supportOral: false,
    exercicesMotriciteReduits: false,
    alternativeEcritureManuelle: false,
    recompensesFrequentes: false,
    objectifsCourtsTerme: false,
    nombreQuestionsMax: 20,
    dureeSessionMaxMin: 45,
  },
  parcours: {
    notionsPrioritaires: [],
    notionsAReporter: [],
    typeExercicesPrivilegies: [],
    typeExercicesAEviter: [],
    niveauDifficulteDepart: "ATTENDU",
    renforcementPositifFrequence: "normal",
    strategiesPedagogiques: [],
    axesPrioritaires: [],
  },
  hasEvaluation: false,
  domaineEvalue: null,
  dateAdaptation: null,
  narratifPourIA: "",
};

// ── Interface des données brutes stockées en DB ───────────────────────────────

interface ProfilCognitifRound {
  domaineEvalue?: string;
  dateEvaluation?: string;
  round?: number;
  ajustements?: Record<string, boolean | string>;
}

interface ProfilCognitifDB {
  derniereDomaine?: string;
  derniereEvaluation?: string;
  [key: string]: unknown;
}

export interface ParcoursAdapteDB {
  notionsPrioritaires?: string[];
  notionsAReporter?: string[];
  typeExercicesPrivilegies?: string[];
  typeExercicesAEviter?: string[];
  dureeSessionMax?: number;
  nombreQuestionsParSession?: number;
  niveauDifficulteDepart?: string;
  renforcementPositifFrequence?: string;
  strategiesPedagogiques?: string[];
  axesPrioritaires?: string[];
  genereLeAt?: string;
}

// ── Fonction principale ───────────────────────────────────────────────────────

export function lireAdaptations(
  profilCognitif: unknown,
  parcoursAdapte: unknown
): AdaptationsActives {
  const result = structuredClone(DEFAULTS);

  // ── Couche 1 : flags depuis profilCognitif ────────────────────────────────
  const cognitif = profilCognitif as ProfilCognitifDB | null | undefined;
  if (!cognitif) return result;

  result.hasEvaluation = true;
  result.domaineEvalue = cognitif.derniereDomaine ?? null;
  result.dateAdaptation = cognitif.derniereEvaluation ?? null;

  // Trouver le dernier round avec ajustements
  const rounds = Object.keys(cognitif)
    .filter((k) => k.startsWith("round_"))
    .map((k) => cognitif[k] as ProfilCognitifRound)
    .filter((r) => r?.ajustements);

  if (rounds.length === 0) return result;

  // Fusionner tous les rounds (les plus récents l'emportent)
  const ajustements: Record<string, boolean | string> = {};
  for (const round of rounds) {
    Object.assign(ajustements, round.ajustements ?? {});
  }

  // ── Mapping flags → adaptations UI et exercices ──────────────────────────
  if (ajustements.tempsSupplementaire === true) {
    result.exercices.tempsSupplementaire = true;
    result.exercices.multiplicateurTemps = 1.5;
  }
  if (ajustements.consignesCourtesEtClaires === true) {
    result.exercices.consignesCourtes = true;
    result.ui.textesAeres = true;
  }
  if (ajustements.pausesFrequentes === true) {
    result.exercices.pausesFrequentes = true;
    result.exercices.nombreQuestionsMax = 8;
    result.exercices.dureeSessionMaxMin = 15;
  }
  if (ajustements.supportVisuel === true) {
    result.exercices.supportVisuel = true;
  }
  if (ajustements.soutienLecture === true || ajustements.soutienMaths === true) {
    result.exercices.consignesCourtes = true;
    result.ui.textesAeres = true;
  }
  if (ajustements.synthèseVocale === true) {
    result.exercices.synthèseVocale = true;
    result.exercices.supportOral = true;
  }
  if (ajustements.exercicesMotriciteReduits === true) {
    result.exercices.exercicesMotriciteReduits = true;
    result.exercices.nombreQuestionsMax = 10;
  }
  if (ajustements.alternativeEcritureManuelle === true) {
    result.exercices.alternativeEcritureManuelle = true;
  }
  if (ajustements.supportOral === true || ajustements.explicationsOralPriority === true) {
    result.exercices.supportOral = true;
    result.exercices.synthèseVocale = true;
  }
  if (ajustements.textesAeresGrandsCaracteres === true) {
    result.ui.grandPolice = true;
    result.ui.textesAeres = true;
  }
  if (ajustements.limiterLectureEcran === true) {
    result.ui.limiterLectureEcran = true;
    result.exercices.dureeSessionMaxMin = Math.min(result.exercices.dureeSessionMaxMin, 20);
  }
  if (ajustements.recompensesFrequentes === true) {
    result.exercices.recompensesFrequentes = true;
    result.parcours.renforcementPositifFrequence = "apres_chaque_reponse";
  }
  if (ajustements.objectifsCourtsTerme === true) {
    result.exercices.objectifsCourtsTerme = true;
    result.exercices.nombreQuestionsMax = Math.min(result.exercices.nombreQuestionsMax, 10);
  }

  // ── Couche 2 : parcours adapté généré par l'agent ────────────────────────
  const parcours = parcoursAdapte as ParcoursAdapteDB | null | undefined;
  if (parcours) {
    if (parcours.notionsPrioritaires?.length) result.parcours.notionsPrioritaires = parcours.notionsPrioritaires;
    if (parcours.notionsAReporter?.length) result.parcours.notionsAReporter = parcours.notionsAReporter;
    if (parcours.typeExercicesPrivilegies?.length) result.parcours.typeExercicesPrivilegies = parcours.typeExercicesPrivilegies;
    if (parcours.typeExercicesAEviter?.length) result.parcours.typeExercicesAEviter = parcours.typeExercicesAEviter;
    if (parcours.niveauDifficulteDepart) result.parcours.niveauDifficulteDepart = parcours.niveauDifficulteDepart;
    if (parcours.renforcementPositifFrequence) {
      result.parcours.renforcementPositifFrequence = parcours.renforcementPositifFrequence as AdaptationsParcours["renforcementPositifFrequence"];
    }
    if (parcours.strategiesPedagogiques?.length) result.parcours.strategiesPedagogiques = parcours.strategiesPedagogiques;
    if (parcours.axesPrioritaires?.length) result.parcours.axesPrioritaires = parcours.axesPrioritaires;
    if (parcours.dureeSessionMax) result.exercices.dureeSessionMaxMin = Math.min(result.exercices.dureeSessionMaxMin, parcours.dureeSessionMax);
    if (parcours.nombreQuestionsParSession) result.exercices.nombreQuestionsMax = Math.min(result.exercices.nombreQuestionsMax, parcours.nombreQuestionsParSession);
  }

  // ── Couche 3 : narratif injecté dans les prompts IA ──────────────────────
  result.narratifPourIA = construireNarratifAdaptations(result, ajustements);

  return result;
}

// ── Construit le bloc texte injecté dans les prompts IA ──────────────────────

function construireNarratifAdaptations(
  adapt: AdaptationsActives,
  ajustements: Record<string, boolean | string>
): string {
  if (!adapt.hasEvaluation) return "";

  const lignes: string[] = [];
  const domaine = adapt.domaineEvalue ?? "spécialiste";

  lignes.push(`═══ ADAPTATIONS VALIDÉES (évaluation ${domaine}) ═══`);

  const adaptExercices: string[] = [];
  if (adapt.exercices.tempsSupplementaire) adaptExercices.push(`temps ×${adapt.exercices.multiplicateurTemps} (ne pas chronomètre serré)`);
  if (adapt.exercices.consignesCourtes) adaptExercices.push("consignes ≤ 2 phrases, un seul verbe d'action");
  if (adapt.exercices.pausesFrequentes) adaptExercices.push(`sessions courtes ≤ ${adapt.exercices.dureeSessionMaxMin} min, ≤ ${adapt.exercices.nombreQuestionsMax} questions`);
  if (adapt.exercices.supportVisuel) adaptExercices.push("toujours ajouter un support visuel (schéma, image, tableau)");
  if (adapt.exercices.supportOral) adaptExercices.push("expliquer à l'oral en priorité, oral avant écrit");
  if (adapt.exercices.exercicesMotriciteReduits) adaptExercices.push("éviter la copie longue — QCM et réponses courtes préférés");
  if (adapt.exercices.recompensesFrequentes) adaptExercices.push("renforcement positif après chaque réponse, jamais de critique sèche");
  if (adapt.exercices.objectifsCourtsTerme) adaptExercices.push("découper en micro-objectifs, célébrer chaque petite victoire");
  if (ajustements.soutienLecture === true) adaptExercices.push("textes courts, police claire, espacement généreux");
  if (ajustements.soutienMaths === true) adaptExercices.push("décomposer chaque calcul étape par étape, jamais de calcul mental implicite");

  if (adaptExercices.length > 0) {
    lignes.push("ADAPTATIONS OBLIGATOIRES pour CET ÉLÈVE :");
    adaptExercices.forEach((a) => lignes.push(`  → ${a}`));
  }

  if (adapt.parcours.typeExercicesPrivilegies.length > 0) {
    lignes.push(`Types d'exercices à PRIVILÉGIER : ${adapt.parcours.typeExercicesPrivilegies.join(", ")}`);
  }
  if (adapt.parcours.typeExercicesAEviter.length > 0) {
    lignes.push(`Types d'exercices à ÉVITER : ${adapt.parcours.typeExercicesAEviter.join(", ")}`);
  }
  if (adapt.parcours.notionsPrioritaires.length > 0) {
    lignes.push(`Notions prioritaires selon le spécialiste : ${adapt.parcours.notionsPrioritaires.slice(0, 5).join(", ")}`);
  }
  if (adapt.parcours.strategiesPedagogiques.length > 0) {
    lignes.push(`Stratégies pédagogiques recommandées : ${adapt.parcours.strategiesPedagogiques.slice(0, 3).join(", ")}`);
  }

  lignes.push("Ces adaptations ont été validées par le parent — elles sont OBLIGATOIRES et non optionnelles.");

  return lignes.join("\n");
}
