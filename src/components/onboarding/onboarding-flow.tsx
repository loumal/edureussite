"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { StepIdentite } from "./steps/step-identite";
import { StepStyleApprentissage } from "./steps/step-style";
import { StepMatieres } from "./steps/step-matieres";
import { StepBesoins } from "./steps/step-besoins";
import { StepUnivers } from "./steps/step-univers";
import { StepComplete } from "./steps/step-complete";
import type {
  Matiere,
  NiveauScolaire,
  StyleApprentissage,
} from "@/generated/prisma";

export interface OnboardingData {
  prenom: string;
  nom: string;
  niveauScolaire: NiveauScolaire | "";
  ecole: string;
  styleApprentissage: StyleApprentissage | "";
  matieresPreferees: Matiere[];
  matieresRedoutees: Matiere[];
  tdah: boolean;
  dyslexie: boolean;
  anxieteScolaire: boolean;
  // Univers personnel
  centresInteret: string[];
  sportFavori: string;
  universMediatique: string;
  autresPassions: string;
  environnement: string;
  personnalite: string[];
  objectifScolaire: string;
}

const ETAPES = [
  { id: 0, label: "Qui es-tu ?", emoji: "👋" },
  { id: 1, label: "Comment tu apprends ?", emoji: "🧠" },
  { id: 2, label: "Tes matières", emoji: "📚" },
  { id: 3, label: "Tes besoins", emoji: "💙" },
  { id: 4, label: "Ton univers", emoji: "🌍" },
  { id: 5, label: "C'est parti !", emoji: "🚀" },
];

interface ProfilExistant {
  prenom: string;
  nom: string;
  niveauScolaire: NiveauScolaire | null;
  ecole: string;
  compteParParent: boolean;
}

interface OnboardingFlowProps {
  etapeInitiale: number;
  profilExistant?: ProfilExistant;
  province?: string;
}

export function OnboardingFlow({ etapeInitiale, profilExistant, province = "QC" }: OnboardingFlowProps) {
  const [etape, setEtape] = useState(Math.min(etapeInitiale, 4)); // max step 4 on load
  const [erreur, setErreur] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    prenom: profilExistant?.prenom ?? "",
    nom: profilExistant?.nom ?? "",
    niveauScolaire: profilExistant?.niveauScolaire ?? "",
    ecole: profilExistant?.ecole ?? "",
    styleApprentissage: "",
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
  });

  const completerOnboarding = trpc.eleve.completerOnboarding.useMutation({
    onSuccess: () => {
      setErreur(null);
      setEtape(5); // → StepComplete génère le plan puis redirige vers /eleve
    },
    onError: (err) => {
      // Traduire les erreurs Zod en messages lisibles
      try {
        const zodErrors = JSON.parse(err.message) as { path: string[]; message: string }[];
        if (Array.isArray(zodErrors) && zodErrors.length > 0) {
          const msgs = zodErrors.map((e) => {
            const champ = e.path[0];
            if (champ === "prenom") return "Ton prénom est requis.";
            if (champ === "niveauScolaire") return "Ton niveau scolaire est requis.";
            return e.message;
          });
          setErreur(msgs.join(" "));
          return;
        }
      } catch {}
      setErreur(err.message ?? "Une erreur s'est produite. Réessaie.");
    },
  });

  const handleNext = (partialData: Partial<OnboardingData>) => {
    const newData = { ...data, ...partialData };
    setData(newData);
    setErreur(null);
    if (etape < ETAPES.length - 1) {
      setEtape(etape + 1);
    }
  };

  const handleSubmit = (partialData: Partial<OnboardingData>) => {
    const finalData = { ...data, ...partialData };
    setData(finalData);
    setErreur(null);

    if (!finalData.niveauScolaire) {
      setErreur("Retourne à l'étape 1 pour choisir ton niveau scolaire.");
      return;
    }

    completerOnboarding.mutate({
      prenom: finalData.prenom,
      nom: finalData.nom,
      niveauScolaire: finalData.niveauScolaire,
      ecole: finalData.ecole || undefined,
      styleApprentissage: finalData.styleApprentissage || undefined,
      matieresPreferees: finalData.matieresPreferees,
      matieresRedoutees: finalData.matieresRedoutees,
      tdah: finalData.tdah,
      dyslexie: finalData.dyslexie,
      anxieteScolaire: finalData.anxieteScolaire,
      centresInteret: finalData.centresInteret,
      sportFavori: finalData.sportFavori || undefined,
      universMediatique: finalData.universMediatique || undefined,
      autresPassions: finalData.autresPassions || undefined,
      environnement: finalData.environnement || undefined,
      personnalite: finalData.personnalite,
      objectifScolaire: finalData.objectifScolaire || undefined,
    });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      {/* En-tête */}
      <div className="mb-8 text-center">
        <div className="mb-3 text-3xl font-black text-[var(--color-ink)]">
          ✦ ÉduRéussite
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Créons ton profil d'apprentissage personnalisé
        </p>
      </div>

      {/* Bannière compte créé par les parents */}
      {profilExistant?.compteParParent && etape < 5 && (
        <div className="mb-6 w-full max-w-lg rounded-2xl bg-[rgba(42,124,111,0.08)] border border-[rgba(42,124,111,0.2)] px-5 py-4 text-center animate-fade-in">
          <p className="text-sm font-semibold text-[var(--color-success)] mb-0.5">
            👋 Bienvenue, {profilExistant.prenom} !
          </p>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Ton compte a été créé par tes parents. Prends 2 minutes pour personnaliser ton profil — ça permettra à l'IA de créer des exercices faits juste pour toi !
          </p>
        </div>
      )}

      {/* Indicateur de progression */}
      <div className="mb-8 flex items-center gap-2">
        {ETAPES.map((e, i) => (
          <div key={e.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                i < etape
                  ? "bg-[var(--color-success)] text-white"
                  : i === etape
                  ? "bg-[var(--color-ink)] text-white scale-110"
                  : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
              }`}
            >
              {i < etape ? "✓" : e.emoji}
            </div>
            {i < ETAPES.length - 1 && (
              <div
                className={`h-0.5 w-8 rounded transition-all duration-500 ${
                  i < etape
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-rule)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Étape active */}
      <div className="w-full max-w-lg animate-fade-in">
        {etape === 0 && (
          <StepIdentite data={data} onNext={handleNext} province={province} />
        )}
        {etape === 1 && (
          <StepStyleApprentissage
            data={data}
            onNext={handleNext}
            onBack={() => setEtape(0)}
          />
        )}
        {etape === 2 && (
          <StepMatieres
            data={data}
            onNext={handleNext}
            onBack={() => setEtape(1)}
            province={province}
          />
        )}
        {etape === 3 && (
          <StepBesoins
            data={data}
            onNext={handleNext}
            onBack={() => setEtape(2)}
          />
        )}
        {etape === 4 && (
          <>
            <StepUnivers
              data={data}
              onSubmit={handleSubmit}
              onBack={() => setEtape(3)}
              loading={completerOnboarding.isPending}
            />
            {erreur && (
              <div className="mt-3 rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.3)] px-4 py-3 text-sm text-[var(--color-accent)] text-center">
                {erreur}
              </div>
            )}
          </>
        )}
        {etape === 5 && <StepComplete prenom={data.prenom} />}
      </div>
    </div>
  );
}
