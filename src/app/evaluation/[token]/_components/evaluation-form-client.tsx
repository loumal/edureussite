"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import type { Questionnaire } from "@/lib/evaluation/questionnaire-types";
import type { DomaineSpecialiste } from "@/generated/prisma";

const CONSENT_VERSION = "v1.0-2025";

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

type Ecran = "questionnaire" | "consentement" | "done";

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
  const [ecran, setEcran] = useState<Ecran>("questionnaire");
  const [etape, setEtape] = useState(etapeInitiale);
  const [reponsesEchelle, setReponsesEchelle] = useState<Record<string, number>>(reponsesEchelleInitiales);
  const [reponsesOuvertes, setReponsesOuvertes] = useState<Record<string, string>>(reponsesOuvertesInitiales);
  const [reponsesAnamnese, setReponsesAnamnese] = useState<Record<string, unknown>>(reponsesAnamneseInitiales);
  const [consentCollecte, setConsentCollecte] = useState(false);
  const [consentConditions, setConsentConditions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sauvegarder = trpc.evaluation.sauvegarderEtape.useMutation();
  const soumettre = trpc.evaluation.soumettreFormulaire.useMutation();

  const sectionsQuestionnaire = questionnaire.sections;
  const sectionsAnamnese = anamnese.sections;
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
    } catch { /* Non-bloquant */ } finally {
      setSaving(false);
    }
  }, [token, reponsesEchelle, reponsesOuvertes, reponsesAnamnese, sauvegarder]);

  const allerEtapeSuivante = async () => {
    if (etape < totalEtapes) {
      const next = etape + 1;
      await saveProgress(next);
      setEtape(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Dernière étape questionnaire → passer à l'écran de consentement
      await saveProgress(totalEtapes);
      setEcran("consentement");
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
    if (!consentCollecte || !consentConditions) return;
    setError(null);
    try {
      await soumettre.mutateAsync({
        token,
        reponsesEchelle,
        reponsesOuvertes,
        reponsesAnamnese,
        langue,
        consentDonne: true,
        consentVersion: CONSENT_VERSION,
      });
      setEcran("done");
    } catch {
      setError(fr
        ? "Une erreur est survenue. Veuillez réessayer."
        : "An error occurred. Please try again.");
    }
  };

  const setReponseEchelle = (itemId: string, valeur: number) =>
    setReponsesEchelle((prev) => ({ ...prev, [itemId]: valeur }));
  const setReponseOuverte = (qId: string, texte: string) =>
    setReponsesOuvertes((prev) => ({ ...prev, [qId]: texte }));
  const setReponseAnamnese = (itemId: string, valeur: number) =>
    setReponsesAnamnese((prev) => ({ ...prev, [itemId]: valeur }));

  // ── Écran : soumis avec succès ─────────────────────────────────────────────
  if (ecran === "done") {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-6">🎉</p>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-3">
          {fr ? "Merci pour vos réponses !" : "Thank you for your responses!"}
        </h2>
        <p className="text-[var(--color-ink-soft)] max-w-md mx-auto text-sm">
          {fr
            ? `Nous allons analyser vos réponses concernant ${prenomEnfant} et vous transmettre un rapport dans les prochains jours.`
            : `We will analyze your responses about ${prenomEnfant} and send you a report within the next few days.`}
        </p>
        <p className="mt-4 text-xs text-[var(--color-ink-soft)] max-w-sm mx-auto">
          {fr
            ? `Votre consentement a été enregistré (version ${CONSENT_VERSION}). Vous pouvez demander la suppression de vos données à tout moment en nous contactant.`
            : `Your consent has been recorded (version ${CONSENT_VERSION}). You can request data deletion at any time by contacting us.`}
        </p>
      </div>
    );
  }

  // ── Écran : consentement ───────────────────────────────────────────────────
  if (ecran === "consentement") {
    const peutSoumettre = consentCollecte && consentConditions;
    return (
      <div>
        {/* Sélecteur langue */}
        <LanguageToggle langue={langue} setLangue={setLangue} />

        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide mb-1">
            {fr ? "Étape finale" : "Final step"}
          </p>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">
            {fr ? "Consentement et confidentialité" : "Consent and confidentiality"}
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {fr
              ? `Avant de soumettre le questionnaire de ${prenomEnfant}, veuillez lire attentivement les informations suivantes.`
              : `Before submitting ${prenomEnfant}'s questionnaire, please read the following information carefully.`}
          </p>
        </div>

        {/* Bloc informations collecte */}
        <div className="space-y-4 mb-6">

          {/* Quelles données */}
          <ConsentBlock
            icone="📋"
            titre={fr ? "Données collectées" : "Data collected"}
            couleur="border-blue-200 bg-blue-50"
          >
            <ul className="space-y-1 text-sm text-blue-900">
              {(fr ? [
                "Vos réponses au questionnaire d'observation comportementale",
                "L'historique développemental de votre enfant (prénatal, langage, motricité)",
                "Vos observations personnelles en questions ouvertes",
                "Les métadonnées de session (date, langue choisie)",
              ] : [
                "Your responses to the behavioral observation questionnaire",
                "Your child's developmental history (prenatal, language, motor skills)",
                "Your personal observations in open-ended questions",
                "Session metadata (date, chosen language)",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-blue-500 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ConsentBlock>

          {/* Pourquoi */}
          <ConsentBlock
            icone="🎯"
            titre={fr ? "Finalité de la collecte" : "Purpose of collection"}
            couleur="border-emerald-200 bg-emerald-50"
          >
            <ul className="space-y-1 text-sm text-emerald-900">
              {(fr ? [
                "Générer un rapport d'évaluation personnalisé pour votre enfant",
                "Adapter le parcours d'apprentissage sur la plateforme Édu-Réussite",
                "Fournir des recommandations à votre équipe pédagogique (avec votre accord)",
                "Améliorer la qualité des évaluations futures (données anonymisées)",
              ] : [
                "Generate a personalized assessment report for your child",
                "Adapt the learning path on the Édu-Réussite platform",
                "Provide recommendations to your educational team (with your agreement)",
                "Improve the quality of future assessments (anonymized data)",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-emerald-500 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ConsentBlock>

          {/* Qui y a accès */}
          <ConsentBlock
            icone="🔒"
            titre={fr ? "Accès aux données" : "Data access"}
            couleur="border-amber-200 bg-amber-50"
          >
            <ul className="space-y-1 text-sm text-amber-900">
              {(fr ? [
                "Vous-même — accès complet au rapport via ce lien sécurisé",
                "L'administrateur scolaire ayant initié l'évaluation",
                "Le système IA d'Édu-Réussite (traitement interne sécurisé)",
                "Aucun tiers commercial — vos données ne sont pas vendues",
                "Un spécialiste supplémentaire uniquement avec votre consentement explicite",
              ] : [
                "You — full access to the report via this secure link",
                "The school administrator who initiated the assessment",
                "The Édu-Réussite AI system (secure internal processing)",
                "No commercial third parties — your data is not sold",
                "An additional specialist only with your explicit consent",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-amber-600 mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ConsentBlock>

          {/* Droits */}
          <ConsentBlock
            icone="⚖️"
            titre={fr ? "Vos droits (Loi 25 / RGPD)" : "Your rights (Law 25 / GDPR)"}
            couleur="border-purple-200 bg-purple-50"
          >
            <p className="text-sm text-purple-900">
              {fr
                ? "Conformément à la Loi modernisant des dispositions législatives en matière de protection des renseignements personnels (Loi 25, Québec) et au RGPD, vous avez le droit d'accéder, de corriger et de supprimer vos données à tout moment. Durée de conservation : tant que le compte de votre enfant est actif. Pour exercer vos droits : "
                : "In accordance with Quebec's Act to Modernize Legislative Provisions as regards the Protection of Personal Information (Law 25) and GDPR, you have the right to access, correct and delete your data at any time. Retention period: as long as your child's account is active. To exercise your rights: "}
              <span className="font-semibold">confidentialite@edureussite.ca</span>
            </p>
          </ConsentBlock>
        </div>

        {/* Cases à cocher */}
        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-rule)] bg-white cursor-pointer hover:bg-[var(--color-paper-warm)] transition-colors">
            <input
              type="checkbox"
              checked={consentCollecte}
              onChange={(e) => setConsentCollecte(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-[var(--color-ink)] leading-relaxed">
              {fr
                ? `J'autorise Édu-Réussite à collecter et traiter les informations fournies dans ce questionnaire concernant ${prenomEnfant}, dans le but de générer un rapport d'évaluation et d'adapter son parcours d'apprentissage.`
                : `I authorize Édu-Réussite to collect and process the information provided in this questionnaire about ${prenomEnfant}, for the purpose of generating an assessment report and adapting their learning path.`}
              <span className="text-[var(--color-accent)] font-semibold"> *</span>
            </span>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-[var(--color-rule)] bg-white cursor-pointer hover:bg-[var(--color-paper-warm)] transition-colors">
            <input
              type="checkbox"
              checked={consentConditions}
              onChange={(e) => setConsentConditions(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-[var(--color-ink)] leading-relaxed">
              {fr
                ? "J'ai lu et j'accepte la politique de confidentialité d'Édu-Réussite. Je comprends que je peux retirer mon consentement à tout moment."
                : "I have read and accept Édu-Réussite's privacy policy. I understand that I can withdraw my consent at any time."}
              <span className="text-[var(--color-accent)] font-semibold"> *</span>
            </span>
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {!peutSoumettre && (
          <p className="text-xs text-[var(--color-ink-soft)] mb-4 text-center">
            {fr
              ? "Veuillez accepter les deux conditions ci-dessus pour soumettre."
              : "Please accept both conditions above to submit."}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setEcran("questionnaire")}
            className="px-4 py-2 text-sm rounded-xl border border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)] transition-colors"
          >
            {fr ? "← Modifier mes réponses" : "← Edit my responses"}
          </button>

          <button
            onClick={handleSubmit}
            disabled={!peutSoumettre || soumettre.isPending}
            className="px-6 py-3 text-sm font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {soumettre.isPending
              ? (fr ? "Envoi en cours…" : "Submitting…")
              : (fr ? "Soumettre le questionnaire ✓" : "Submit questionnaire ✓")}
          </button>
        </div>

        <p className="text-center text-xs text-[var(--color-ink-soft)] mt-6">
          {fr
            ? `Version du consentement : ${CONSENT_VERSION} · Édu-Réussite QC`
            : `Consent version: ${CONSENT_VERSION} · Édu-Réussite QC`}
        </p>
      </div>
    );
  }

  // ── Écran : questionnaire ──────────────────────────────────────────────────
  if (!sectionCourante) return null;

  const progression = Math.round((etape / (totalEtapes + 1)) * 100); // +1 pour l'étape consentement
  const isSectionEchelle = !isAnamneseEtape;
  const estDerniereEtape = etape === totalEtapes;

  return (
    <div>
      <LanguageToggle langue={langue} setLangue={setLangue} />

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-[var(--color-ink-soft)] mb-1.5">
          <span>{fr ? `Étape ${etape} sur ${totalEtapes + 1}` : `Step ${etape} of ${totalEtapes + 1}`}</span>
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
          {saving ? (fr ? "Sauvegarde…" : "Saving…") : ""}
        </span>

        <button
          onClick={allerEtapeSuivante}
          disabled={saving}
          className={`px-6 py-2 text-sm font-semibold rounded-xl text-white hover:opacity-90 disabled:opacity-60 transition-opacity ${
            estDerniereEtape ? "bg-[var(--color-accent)]" : "bg-[var(--color-ink)]"
          }`}
        >
          {estDerniereEtape
            ? (fr ? "Continuer vers le consentement →" : "Continue to consent →")
            : (fr ? "Suivant →" : "Next →")}
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-ink-soft)] mt-8">
        {fr
          ? "Vos réponses sont sauvegardées automatiquement à chaque étape."
          : "Your responses are automatically saved at each step."}
      </p>
    </div>
  );
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function LanguageToggle({ langue, setLangue }: { langue: "fr" | "en"; setLangue: (l: "fr" | "en") => void }) {
  return (
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
  );
}

function ConsentBlock({
  icone, titre, couleur, children,
}: {
  icone: string;
  titre: string;
  couleur: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 ${couleur}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icone}</span>
        <p className="text-sm font-bold text-[var(--color-ink)]">{titre}</p>
      </div>
      {children}
    </div>
  );
}
