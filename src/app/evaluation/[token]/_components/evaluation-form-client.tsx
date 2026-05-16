"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import type { Questionnaire } from "@/lib/evaluation/questionnaire-types";
import type { DomaineSpecialiste } from "@/generated/prisma";

interface Props {
  token: string;
  formulaireId: string;
  domaine: DomaineSpecialiste;
  langue: "fr" | "en";
  etapeInitiale: number;
  reponsesEchelleInitiales: Record<string, number>;
  reponsesOuvertesInitiales: Record<string, string>;
  reponsesAnamneseInitiales: Record<string, unknown>;
  prenomEnfant: string;
  questionnaire: Questionnaire;
  anamnese: Questionnaire;
}

const ECHELLE_LABELS_FR = ["Jamais ou rarement", "À l'occasion", "Souvent", "Très souvent"];
const ECHELLE_LABELS_EN = ["Never or rarely", "Sometimes", "Often", "Very often"];

export function EvaluationFormClient({
  token,
  domaine,
  langue: langueInitiale,
  etapeInitiale,
  reponsesEchelleInitiales,
  reponsesOuvertesInitiales,
  reponsesAnamneseInitiales,
  prenomEnfant,
  questionnaire,
  anamnese,
}: Props) {
  const [langue, setLangue] = useState<"fr" | "en">(langueInitiale);
  const [etape, setEtape] = useState(etapeInitiale);
  const [reponsesEchelle, setReponsesEchelle] = useState<Record<string, number>>(reponsesEchelleInitiales);
  const [reponsesOuvertes, setReponsesOuvertes] = useState<Record<string, string>>(reponsesOuvertesInitiales);
  const [reponsesAnamnese, setReponsesAnamnese] = useState<Record<string, unknown>>(reponsesAnamneseInitiales);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sauvegarder = trpc.evaluation.sauvegarderEtape.useMutation();
  const soumettre = trpc.evaluation.soumettreFormulaire.useMutation();

  // Sections du questionnaire principal + une section anamnèse à la fin
  const sectionsQuestionnaire = questionnaire.sections;
  const sectionsAnamnese = anamnese.sections;
  // Total étapes = sections questionnaire + sections anamnèse
  const totalEtapes = sectionsQuestionnaire.length + sectionsAnamnese.length;
  const isAnamneseEtape = etape > sectionsQuestionnaire.length;
  const sectionIndex = isAnamneseEtape
    ? etape - sectionsQuestionnaire.length - 1
    : etape - 1;
  const sectionCourante = isAnamneseEtape
    ? sectionsAnamnese[sectionIndex]
    : sectionsQuestionnaire[sectionIndex];

  const fr = langue === "fr";
  const echelleLbls = fr ? ECHELLE_LABELS_FR : ECHELLE_LABELS_EN;

  const saveProgress = useCallback(async (nextEtape: number) => {
    setSaving(true);
    try {
      await sauvegarder.mutateAsync({
        token,
        etapeActuelle: nextEtape,
        reponsesEchelle,
        reponsesOuvertes,
        reponsesAnamnese,
      });
    } catch {
      // Non-bloquant
    } finally {
      setSaving(false);
    }
  }, [token, reponsesEchelle, reponsesOuvertes, reponsesAnamnese, sauvegarder]);

  const allerEtapeSuivante = async () => {
    if (etape < totalEtapes) {
      const next = etape + 1;
      await saveProgress(next);
      setEtape(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const allerEtapePrecedente = () => {
    if (etape > 1) {
      setEtape(etape - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await soumettre.mutateAsync({
        token,
        reponsesEchelle,
        reponsesOuvertes,
        reponsesAnamnese,
        langue,
      });
      setSubmitted(true);
    } catch (err) {
      setError(fr ? "Une erreur est survenue. Veuillez réessayer." : "An error occurred. Please try again.");
    }
  };

  const setReponseEchelle = (itemId: string, valeur: number) => {
    setReponsesEchelle((prev) => ({ ...prev, [itemId]: valeur }));
  };

  const setReponseOuverte = (qId: string, texte: string) => {
    setReponsesOuvertes((prev) => ({ ...prev, [qId]: texte }));
  };

  const setReponseAnamnese = (itemId: string, valeur: number) => {
    setReponsesAnamnese((prev) => ({ ...prev, [itemId]: valeur }));
  };

  if (submitted) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-6">🎉</p>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-3">
          {fr ? "Merci pour vos réponses !" : "Thank you for your responses!"}
        </h2>
        <p className="text-[var(--color-ink-soft)] max-w-md mx-auto">
          {fr
            ? `Nous allons analyser vos réponses concernant ${prenomEnfant} et vous transmettre un rapport dans les prochains jours.`
            : `We will analyze your responses about ${prenomEnfant} and send you a report within the next few days.`}
        </p>
      </div>
    );
  }

  if (!sectionCourante) return null;

  const progression = Math.round((etape / totalEtapes) * 100);
  const isSectionEchelle = !isAnamneseEtape;

  return (
    <div>
      {/* Sélecteur de langue */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={() => setLangue("fr")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${langue === "fr" ? "bg-[var(--color-ink)] text-white border-transparent" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"}`}
        >
          Français
        </button>
        <button
          onClick={() => setLangue("en")}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${langue === "en" ? "bg-[var(--color-ink)] text-white border-transparent" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"}`}
        >
          English
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] mb-1.5">
          <span>{fr ? `Étape ${etape} sur ${totalEtapes}` : `Step ${etape} of ${totalEtapes}`}</span>
          <span>{progression}%</span>
        </div>
        <div className="h-1.5 bg-[var(--color-rule)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300"
            style={{ width: `${progression}%` }}
          />
        </div>
      </div>

      {/* Section header */}
      <div className="mb-6">
        {isAnamneseEtape && (
          <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide mb-1">
            {fr ? "Historique développemental" : "Developmental history"}
          </p>
        )}
        <h2 className="text-xl font-bold text-[var(--color-ink)]">
          {fr ? sectionCourante.titreFr : sectionCourante.titreEn}
        </h2>
        {etape === 1 && (
          <div className="mt-3 p-3 bg-[var(--color-paper-warm)] rounded-xl border border-[var(--color-rule)] text-sm text-[var(--color-ink-soft)]">
            <p className="font-medium text-[var(--color-ink)] mb-1">
              {fr ? questionnaire.titreFr : questionnaire.titreEn}
            </p>
            <p>{fr ? questionnaire.descriptionFr : questionnaire.descriptionEn}</p>
            <p className="mt-2 font-medium text-xs">
              {fr ? questionnaire.instructionEchelleFr : questionnaire.instructionEchelleEn}
            </p>
          </div>
        )}
      </div>

      {/* Items échelle */}
      {sectionCourante.items && sectionCourante.items.length > 0 && (
        <div className="space-y-4 mb-6">
          {sectionCourante.items.map((item) => {
            const valeur = isSectionEchelle
              ? (reponsesEchelle[item.id] ?? null)
              : (reponsesAnamnese[item.id] as number | null ?? null);
            return (
              <div key={item.id} className="bg-white rounded-xl border border-[var(--color-rule)] p-4">
                <p className="text-sm text-[var(--color-ink)] mb-3 leading-relaxed">
                  {fr ? item.fr : item.en}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((v) => (
                    <button
                      key={v}
                      onClick={() => isSectionEchelle ? setReponseEchelle(item.id, v) : setReponseAnamnese(item.id, v)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                        valeur === v
                          ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white font-semibold"
                          : "border-[var(--color-rule)] hover:bg-[var(--color-paper-warm)] text-[var(--color-ink-soft)]"
                      }`}
                    >
                      <span className="text-base font-bold">{v}</span>
                      <span className="text-[10px] text-center leading-tight hidden sm:block">{echelleLbls[v]}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Questions ouvertes */}
      {sectionCourante.questions && sectionCourante.questions.length > 0 && (
        <div className="space-y-4 mb-6">
          {sectionCourante.questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-[var(--color-rule)] p-4">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-2 leading-relaxed">
                {fr ? q.fr : q.en}
              </label>
              <textarea
                value={reponsesOuvertes[q.id] ?? ""}
                onChange={(e) => setReponseOuverte(q.id, e.target.value)}
                placeholder={fr ? q.placeholderFr : q.placeholderEn}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={allerEtapePrecedente}
          disabled={etape === 1}
          className="px-4 py-2 text-sm rounded-xl border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {fr ? "← Précédent" : "← Previous"}
        </button>

        <span className="text-xs text-[var(--color-ink-soft)]">
          {saving ? (fr ? "Sauvegarde..." : "Saving...") : ""}
        </span>

        {etape < totalEtapes ? (
          <button
            onClick={allerEtapeSuivante}
            disabled={saving}
            className="px-6 py-2 text-sm font-semibold rounded-xl bg-[var(--color-ink)] text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {fr ? "Suivant →" : "Next →"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={soumettre.isPending}
            className="px-6 py-2 text-sm font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {soumettre.isPending
              ? (fr ? "Envoi..." : "Submitting...")
              : (fr ? "Soumettre le questionnaire ✓" : "Submit questionnaire ✓")}
          </button>
        )}
      </div>

      {/* Note bas de page */}
      <p className="text-center text-xs text-[var(--color-ink-soft)] mt-8">
        {fr
          ? "Vos réponses sont confidentielles et utilisées uniquement pour l'évaluation de votre enfant."
          : "Your responses are confidential and used only for your child's assessment."}
      </p>
    </div>
  );
}
