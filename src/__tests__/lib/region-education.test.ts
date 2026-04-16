import { describe, it, expect } from "vitest";
import {
  getNiveauxParRegion,
  getMatieresParRegion,
  getCycleLabel,
} from "@/lib/education/region-education";

// ─── getNiveauxParRegion ───────────────────────────────────────────────────────

describe("getNiveauxParRegion", () => {
  it("retourne 11 niveaux pour le Québec (QC)", () => {
    const niveaux = getNiveauxParRegion("QC");
    expect(niveaux).toHaveLength(11);
  });

  it("retourne 12 niveaux pour l'Ontario anglophone (ON)", () => {
    const niveaux = getNiveauxParRegion("ON");
    expect(niveaux).toHaveLength(12);
    expect(niveaux[11].label).toBe("Grade 12");
  });

  it("retourne 12 niveaux pour la France (5 primaire + 7 secondaire)", () => {
    const niveaux = getNiveauxParRegion("FR");
    expect(niveaux).toHaveLength(12);
    expect(niveaux.at(-1)?.label).toBe("Terminale");
  });

  it("retourne 13 niveaux pour le Bénin (6 primaire + 7 secondaire)", () => {
    const bj = getNiveauxParRegion("BJ");
    expect(bj).toHaveLength(13);
    expect(bj.at(-1)?.label).toBe("Terminale");
  });

  it("retourne les niveaux QC pour une région inconnue (fallback)", () => {
    const niveaux = getNiveauxParRegion("XX");
    expect(niveaux).toEqual(getNiveauxParRegion("QC"));
  });

  it("retourne les niveaux QC pour NB (Nouveau-Brunswick)", () => {
    expect(getNiveauxParRegion("NB")).toEqual(getNiveauxParRegion("QC"));
  });

  it("utilise le cycle 'Primaire' pour les niveaux primaires QC", () => {
    const primaire = getNiveauxParRegion("QC").filter((n) => n.cycle === "Primaire");
    expect(primaire).toHaveLength(6);
  });

  it("utilise le cycle 'Elementary' pour Ontario", () => {
    const elementary = getNiveauxParRegion("ON").filter((n) => n.cycle === "Elementary");
    expect(elementary).toHaveLength(6);
  });

  it("les valeurs SECONDAIRE_6 et SECONDAIRE_7 existent pour la France", () => {
    const niveaux = getNiveauxParRegion("FR");
    const values = niveaux.map((n) => n.value);
    expect(values).toContain("SECONDAIRE_6");
    expect(values).toContain("SECONDAIRE_7");
  });

  it("les valeurs SECONDAIRE_6 et SECONDAIRE_7 n'existent PAS pour le QC", () => {
    const niveaux = getNiveauxParRegion("QC");
    const values = niveaux.map((n) => n.value);
    expect(values).not.toContain("SECONDAIRE_6");
    expect(values).not.toContain("SECONDAIRE_7");
  });
});

// ─── getMatieresParRegion ──────────────────────────────────────────────────────

describe("getMatieresParRegion", () => {
  it("retourne 8 matières pour QC", () => {
    expect(getMatieresParRegion("QC")).toHaveLength(8);
  });

  it("retourne 8 matières pour FR", () => {
    expect(getMatieresParRegion("FR")).toHaveLength(8);
  });

  it("le label UNIVERS_SOCIAL est localisé pour FR", () => {
    const matieres = getMatieresParRegion("FR");
    const us = matieres.find((m) => m.value === "UNIVERS_SOCIAL");
    expect(us?.label).toBe("Histoire-Géographie");
  });

  it("le label UNIVERS_SOCIAL est localisé pour ON (anglophone)", () => {
    const matieres = getMatieresParRegion("ON");
    const us = matieres.find((m) => m.value === "UNIVERS_SOCIAL");
    expect(us?.label).toBe("Social Studies");
  });

  it("retourne le fallback QC pour une région inconnue", () => {
    expect(getMatieresParRegion("ZZ")).toEqual(getMatieresParRegion("QC"));
  });

  it("toutes les matières ont un emoji non vide", () => {
    const matieres = getMatieresParRegion("QC");
    matieres.forEach((m) => expect(m.emoji.length).toBeGreaterThan(0));
  });
});

// ─── getCycleLabel ─────────────────────────────────────────────────────────────

describe("getCycleLabel", () => {
  it("retourne Primaire / Secondaire pour QC", () => {
    const labels = getCycleLabel("QC");
    expect(labels.primaire).toBe("Primaire");
    expect(labels.secondaire).toBe("Secondaire");
  });

  it("retourne Elementary / Secondary pour ON", () => {
    const labels = getCycleLabel("ON");
    expect(labels.primaire).toBe("Elementary");
    expect(labels.secondaire).toBe("Secondary");
  });

  it("retourne Primaire / Collège & Lycée pour FR", () => {
    const labels = getCycleLabel("FR");
    expect(labels.primaire).toBe("Primaire");
    expect(labels.secondaire).toBe("Collège / Lycée");
  });

  it("retourne Primaire / Collège & Lycée pour BJ (Bénin)", () => {
    const labels = getCycleLabel("BJ");
    expect(labels.primaire).toBe("Primaire");
    expect(labels.secondaire).toBe("Collège / Lycée");
  });

  it("retourne les labels QC pour une région inconnue", () => {
    expect(getCycleLabel("ZZ")).toEqual(getCycleLabel("QC"));
  });
});
