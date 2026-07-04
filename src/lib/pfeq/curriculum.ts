/**
 * Dispatcher de curriculum — point d'entrée unique pour tous les systèmes éducatifs.
 *
 * Routing :
 *   BJ → Curriculum APC/NPE béninois (src/lib/pfeq/benin.ts)
 *   QC, FR, AFRIQUE_FR, … → Curriculum PFEQ québécois (src/lib/pfeq/notions.ts)
 *
 * Ne pas modifier notions.ts — ce fichier est le seul dispatcher.
 */

import {
  getNotionsPourNiveau,
  getNotionById as getNotionPFEQById,
  type SequencePFEQ,
  type NotionPFEQ,
} from "./notions";

import {
  getNotionsBenin,
  getNotionBeninById,
  type SequenceBenin,
  type NotionBenin,
  type SerieBeninLycee,
} from "./benin";

// ─── Type unifié ─────────────────────────────────────────────────────────────

export type SystèmeEducatif = "PFEQ" | "APC_BENIN";

export interface NotionUnifiee {
  id: string;
  label: string;
  description: string;
  systeme: SystèmeEducatif;
  /** Codes de compétences du système en vigueur */
  competences?: string[];
}

export interface SequenceUnifiee {
  id: string;
  label: string;
  emoji: string;
  notions: NotionUnifiee[];
}

// ─── Convertisseurs internes ──────────────────────────────────────────────────

function fromPFEQ(sequences: SequencePFEQ[]): SequenceUnifiee[] {
  return sequences.map((seq) => ({
    id: seq.id,
    label: seq.label,
    emoji: seq.emoji,
    notions: seq.notions.map((n: NotionPFEQ) => ({
      id: n.id,
      label: n.label,
      description: n.description,
      systeme: "PFEQ" as const,
      competences: n.competencesPFEQ,
    })),
  }));
}

function fromBenin(sequences: SequenceBenin[]): SequenceUnifiee[] {
  return sequences.map((seq) => ({
    id: seq.id,
    label: seq.label,
    emoji: seq.emoji,
    notions: seq.notions.map((n: NotionBenin) => ({
      id: n.id,
      label: n.label,
      description: n.description,
      systeme: "APC_BENIN" as const,
      competences: n.competenceAPC,
    })),
  }));
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Retourne les séquences et notions correspondant au niveau scolaire de l'élève,
 * dans le bon système éducatif selon le code de région.
 *
 * @param matiere    Valeur enum Matiere (ex: "MATHEMATIQUES", "SVT", "PCT")
 * @param niveau     Valeur enum NiveauScolaire (ex: "SECONDAIRE_5")
 * @param region     Code ISO de la région/pays (ex: "QC", "BJ", "FR")
 * @param serie      Série lycée béninoise (ex: "D") — ignoré si region ≠ "BJ"
 */
export function getNotionsPourRegion(
  matiere: string,
  niveau: string,
  region: string,
  serie?: SerieBeninLycee
): SequenceUnifiee[] {
  if (region === "BJ") {
    return fromBenin(getNotionsBenin(matiere, niveau, serie));
  }
  return fromPFEQ(getNotionsPourNiveau(matiere, niveau));
}

/**
 * Retourne une notion (unifiée) par son ID, quel que soit le système.
 */
export function getNotionById(id: string): NotionUnifiee | undefined {
  // Essai dans le curriculum béninois (préfixe BJ_)
  if (id.startsWith("BJ_")) {
    const n = getNotionBeninById(id);
    if (n) {
      return {
        id: n.id,
        label: n.label,
        description: n.description,
        systeme: "APC_BENIN",
        competences: n.competenceAPC,
      };
    }
  }
  // Sinon essai dans le PFEQ
  const n = getNotionPFEQById(id);
  if (n) {
    return {
      id: n.id,
      label: n.label,
      description: n.description,
      systeme: "PFEQ",
      competences: n.competencesPFEQ,
    };
  }
  return undefined;
}

/**
 * Retourne le système éducatif applicable à un code de région.
 */
export function getSystèmeEducatif(region: string): SystèmeEducatif {
  return region === "BJ" ? "APC_BENIN" : "PFEQ";
}
