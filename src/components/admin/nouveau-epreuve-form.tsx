"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { Matiere, NiveauScolaire, TypeExercice, NiveauDifficulte, SourceEpreuve } from "@/generated/prisma";

const MATIERES = [
  { value: "FRANCAIS", label: "Français" },
  { value: "MATHEMATIQUES", label: "Mathématiques" },
  { value: "SCIENCES", label: "Sciences" },
  { value: "UNIVERS_SOCIAL", label: "Univers social" },
  { value: "ARTS", label: "Arts" },
  { value: "ANGLAIS", label: "Anglais" },
  { value: "EDUCATION_PHYSIQUE", label: "Éducation physique" },
  { value: "ETHIQUE", label: "Éthique" },
];

const NIVEAUX = [
  { value: "PRIMAIRE_1", label: "1re primaire" },
  { value: "PRIMAIRE_2", label: "2e primaire" },
  { value: "PRIMAIRE_3", label: "3e primaire" },
  { value: "PRIMAIRE_4", label: "4e primaire" },
  { value: "PRIMAIRE_5", label: "5e primaire" },
  { value: "PRIMAIRE_6", label: "6e primaire" },
  { value: "SECONDAIRE_1", label: "1re secondaire" },
  { value: "SECONDAIRE_2", label: "2e secondaire" },
  { value: "SECONDAIRE_3", label: "3e secondaire" },
  { value: "SECONDAIRE_4", label: "4e secondaire" },
  { value: "SECONDAIRE_5", label: "5e secondaire" },
];

const SOURCES = [
  { value: "MEES_OFFICIEL", label: "MEES Officiel" },
  { value: "COMMISSION_SCOLAIRE", label: "Commission scolaire" },
  { value: "MANUEL_SCOLAIRE", label: "Manuel scolaire" },
  { value: "AUTRE", label: "Autre" },
];

type Etape = "meta" | "contenu" | "analyse" | "sections" | "confirmation";

interface StructureAnalysee {
  titre: string;
  totalPoints: number;
  dureeMinutes: number;
  description: string;
  styleGeneral: string;
  competencesGlobales: string[];
  niveauLangue: string;
  consignesGenerales?: string;
  sections: {
    ordre: number;
    titre: string;
    typeQuestion: TypeExercice;
    nombreQuestions: number;
    pointsTotal: number;
    competencesPFEQ: string[];
    difficulte: NiveauDifficulte;
    instructions?: string;
    exempleQuestion?: object;
  }[];
}

export function NouveauEpreuveForm() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("meta");
  const [erreur, setErreur] = useState<string | null>(null);

  // Champs méta
  const [matiere, setMatiere] = useState<Matiere | "">("");
  const [niveauScolaire, setNiveauScolaire] = useState<NiveauScolaire | "">("");
  const [source, setSource] = useState<SourceEpreuve>("MEES_OFFICIEL");
  const [annee, setAnnee] = useState("");

  // Contenu brut
  const [contenu, setContenu] = useState("");

  // Structure analysée
  const [structure, setStructure] = useState<StructureAnalysee | null>(null);
  const [titreOverride, setTitreOverride] = useState("");

  const analyser = trpc.admin.analyserEpreuve.useMutation({
    onSuccess: (data) => {
      setStructure(data as StructureAnalysee);
      setTitreOverride(data.titre);
      setEtape("sections");
      setErreur(null);
    },
    onError: (err) => setErreur(err.message),
  });

  const creer = trpc.admin.creerEpreuve.useMutation({
    onSuccess: (data) => router.push(`/admin/epreuves/${data.id}`),
    onError: (err) => setErreur(err.message),
  });

  const handleAnalyser = () => {
    if (!matiere || !niveauScolaire) {
      setErreur("Sélectionne la matière et le niveau avant d'analyser.");
      return;
    }
    if (contenu.trim().length < 50) {
      setErreur("Le contenu doit faire au moins 50 caractères.");
      return;
    }
    setErreur(null);
    analyser.mutate({ contenu, matiere, niveauScolaire });
  };

  const handleCreer = () => {
    if (!structure || !matiere || !niveauScolaire) return;
    creer.mutate({
      titre: titreOverride || structure.titre,
      matiere,
      niveauScolaire,
      source,
      annee: annee ? parseInt(annee) : undefined,
      description: structure.description,
      contenuOriginal: contenu,
      structureAnalysee: structure as never,
      totalPoints: structure.totalPoints,
      dureeMinutes: structure.dureeMinutes,
      sections: structure.sections,
    });
  };

  return (
    <div className="space-y-6">
      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2">
        {(["meta", "contenu", "sections", "confirmation"] as Etape[]).map((e, i) => {
          const labels = ["Métadonnées", "Contenu", "Structure", "Confirmation"];
          const current = ["meta", "contenu", "sections", "confirmation"].indexOf(etape);
          return (
            <div key={e} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i < current
                    ? "bg-[var(--color-success)] text-white"
                    : i === current
                    ? "bg-[var(--color-ink)] text-white"
                    : "bg-[var(--color-rule)] text-[var(--color-ink-soft)]"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === current ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"}`}>
                {labels[i]}
              </span>
              {i < 3 && <div className="h-0.5 w-6 bg-[var(--color-rule)]" />}
            </div>
          );
        })}
      </div>

      {erreur && (
        <div className="rounded-xl bg-[rgba(217,79,43,0.08)] border border-[rgba(217,79,43,0.3)] px-4 py-3 text-sm text-[var(--color-accent)]">
          {erreur}
        </div>
      )}

      {/* Étape 1 — Métadonnées */}
      {etape === "meta" && (
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6 space-y-4">
          <h2 className="font-bold text-[var(--color-ink)]">1. Informations sur l'épreuve</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                Matière *
              </label>
              <select
                value={matiere}
                onChange={(e) => setMatiere(e.target.value as Matiere)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              >
                <option value="">Sélectionner…</option>
                {MATIERES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                Niveau scolaire *
              </label>
              <select
                value={niveauScolaire}
                onChange={(e) => setNiveauScolaire(e.target.value as NiveauScolaire)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              >
                <option value="">Sélectionner…</option>
                {NIVEAUX.map((n) => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as SourceEpreuve)}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
                Année (optionnel)
              </label>
              <input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                placeholder="2024"
                min={2000}
                max={2030}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
              />
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              if (!matiere || !niveauScolaire) {
                setErreur("Matière et niveau requis.");
                return;
              }
              setErreur(null);
              setEtape("contenu");
            }}
          >
            Suivant →
          </Button>
        </div>
      )}

      {/* Étape 2 — Contenu brut */}
      {etape === "contenu" && (
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6 space-y-4">
          <h2 className="font-bold text-[var(--color-ink)]">2. Contenu de l'épreuve</h2>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Collez le texte de l'épreuve. Claude extraira uniquement la structure — les questions
            originales ne seront pas stockées dans les exercices générés.
          </p>

          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Collez ici le contenu de l'épreuve (texte, sections, consignes, barème…)"
            rows={16}
            className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)] font-mono resize-y"
          />

          <p className="text-xs text-[var(--color-ink-soft)]">
            {contenu.length} caractère{contenu.length > 1 ? "s" : ""}
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEtape("meta")}>
              ← Retour
            </Button>
            <Button
              variant="primary"
              onClick={handleAnalyser}
              disabled={analyser.isPending}
            >
              {analyser.isPending ? "Analyse en cours…" : "✨ Analyser la structure"}
            </Button>
          </div>

          {analyser.isPending && (
            <div className="rounded-xl bg-[rgba(42,124,111,0.06)] border border-[rgba(42,124,111,0.2)] p-4 text-center">
              <div className="text-2xl mb-2 animate-pulse">🔬</div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Claude analyse la structure…
              </p>
              <p className="text-xs text-[var(--color-ink-soft)] mt-1">
                Identification des sections, types de questions, barème, compétences PFEQ
              </p>
            </div>
          )}
        </div>
      )}

      {/* Étape 3 — Structure analysée */}
      {etape === "sections" && structure && (
        <div className="rounded-2xl border border-[var(--color-rule)] bg-white p-6 space-y-5">
          <div className="flex items-start justify-between">
            <h2 className="font-bold text-[var(--color-ink)]">3. Structure extraite par Claude</h2>
            <span className="rounded-full bg-[rgba(42,124,111,0.1)] px-2 py-0.5 text-xs font-semibold text-[var(--color-success)]">
              ✓ Aucun contenu copié
            </span>
          </div>

          {/* Titre éditable */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-soft)] mb-1">
              Titre du modèle
            </label>
            <input
              type="text"
              value={titreOverride}
              onChange={(e) => setTitreOverride(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]"
            />
          </div>

          {/* Infos générales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Total points</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{structure.totalPoints}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Durée</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{structure.dureeMinutes} min</p>
            </div>
            <div className="rounded-xl bg-[var(--color-paper-warm)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-soft)]">Sections</p>
              <p className="text-xl font-black text-[var(--color-ink)]">{structure.sections.length}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Description</p>
            <p className="text-sm text-[var(--color-ink)]">{structure.description}</p>
          </div>

          {/* Style */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-1">Style général</p>
            <p className="text-sm text-[var(--color-ink)]">{structure.styleGeneral}</p>
          </div>

          {/* Sections */}
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-soft)] mb-2">Sections détectées</p>
            <div className="space-y-3">
              {structure.sections.map((s, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-rule)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {s.ordre}. {s.titre}
                    </p>
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      {s.nombreQuestions} q. · {s.pointsTotal} pts
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                    {s.typeQuestion} · {s.difficulte}
                  </p>
                  {s.competencesPFEQ.length > 0 && (
                    <p className="text-xs text-[var(--color-success)] mt-1">
                      PFEQ : {s.competencesPFEQ.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEtape("contenu")}>
              ← Modifier le contenu
            </Button>
            <Button
              variant="primary"
              onClick={handleCreer}
              disabled={creer.isPending}
            >
              {creer.isPending ? "Sauvegarde…" : "✅ Sauvegarder le modèle"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
