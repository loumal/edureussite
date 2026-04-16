import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepMatieres } from "@/components/onboarding/steps/step-matieres";

// Stub OnboardingData minimal
const baseData = {
  prenom: "Emma",
  nom: "Tremblay",
  niveauScolaire: "SECONDAIRE_3" as never,
  ecole: "",
  styleApprentissage: "" as never,
  matieresPreferees: [],
  matieresRedoutees: [],
  tdah: false,
  dyslexie: false,
  anxieteScolaire: false,
  centresInteret: [],
  sportFavori: "",
  universMediatique: "",
  autresPassions: "",
  environnement: "",
  personnalite: [],
  objectifScolaire: "",
};

describe("StepMatieres — QC", () => {
  it("affiche les matières québécoises par défaut", () => {
    render(
      <StepMatieres data={baseData} onNext={vi.fn()} onBack={vi.fn()} province="QC" />
    );
    expect(screen.getAllByText(/Français/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mathématiques/).length).toBeGreaterThan(0);
  });

  it("affiche 8 boutons matières dans la section préférées", () => {
    render(
      <StepMatieres data={baseData} onNext={vi.fn()} onBack={vi.fn()} province="QC" />
    );
    // 8 matières × 2 sections (préférées + difficiles) = 16 boutons
    const boutons = screen.getAllByRole("button", { name: /Français|Mathématiques|Sciences|Arts/i });
    expect(boutons.length).toBeGreaterThanOrEqual(8);
  });
});

describe("StepMatieres — Bénin (BJ)", () => {
  it("affiche 'Histoire-Géographie' au lieu de 'Univers social'", () => {
    render(
      <StepMatieres data={baseData} onNext={vi.fn()} onBack={vi.fn()} province="BJ" />
    );
    expect(screen.queryByText(/Univers social/)).toBeNull();
    expect(screen.getAllByText(/Histoire-Géographie/).length).toBeGreaterThan(0);
  });
});

describe("StepMatieres — interactions", () => {
  it("sélectionner une matière préférée la met en surbrillance et appelle onNext avec la valeur", () => {
    const onNext = vi.fn();
    render(
      <StepMatieres data={baseData} onNext={onNext} onBack={vi.fn()} province="QC" />
    );

    // Cliquer sur "Arts" dans la section préférées (premier bouton Arts)
    const artsBtns = screen.getAllByText(/🎨 Arts/);
    fireEvent.click(artsBtns[0]);

    // Cliquer sur Continuer
    fireEvent.click(screen.getByText(/Continuer/));

    expect(onNext).toHaveBeenCalledWith(
      expect.objectContaining({ matieresPreferees: ["ARTS"] })
    );
  });

  it("sélectionner une matière comme difficile la retire des préférées", () => {
    const onNext = vi.fn();
    const dataAvecArts = { ...baseData, matieresPreferees: ["ARTS" as never] };
    render(
      <StepMatieres data={dataAvecArts} onNext={onNext} onBack={vi.fn()} province="QC" />
    );

    // Cliquer sur Arts dans la section difficile (deuxième bouton)
    const artsBtns = screen.getAllByText(/🎨 Arts/);
    fireEvent.click(artsBtns[1]); // section difficile

    fireEvent.click(screen.getByText(/Continuer/));

    const call = onNext.mock.calls[0][0];
    expect(call.matieresPreferees).not.toContain("ARTS");
    expect(call.matieresRedoutees).toContain("ARTS");
  });

  it("le bouton Retour appelle onBack", () => {
    const onBack = vi.fn();
    render(
      <StepMatieres data={baseData} onNext={vi.fn()} onBack={onBack} province="QC" />
    );
    fireEvent.click(screen.getByText(/Retour/));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
