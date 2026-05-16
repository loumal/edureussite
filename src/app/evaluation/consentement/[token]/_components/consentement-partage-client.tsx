"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface DomaineInfo {
  code: string;
  fr: string;
  en: string;
  icon: string;
  description: string;
}

interface Props {
  token: string;
  prenomEnfant: string;
  nomEnfant: string;
  niveauScolaire: string;
  domaineActuel: DomaineInfo;
  prochainDomaine: DomaineInfo;
  alreadyDecided: boolean;
  decisionPrise: "ACCEPTED" | "REFUSED" | null;
  rapportDate: string | null;
}

export function ConsentementPartageClient({
  token,
  prenomEnfant,
  nomEnfant,
  domaineActuel,
  prochainDomaine,
  alreadyDecided,
  decisionPrise,
  rapportDate,
}: Props) {
  const [langue, setLangue] = useState<"fr" | "en">("fr");
  const [done, setDone] = useState(alreadyDecided);
  const [decision, setDecision] = useState<"ACCEPTED" | "REFUSED" | null>(decisionPrise);
  const [error, setError] = useState<string | null>(null);

  const consentir = trpc.evaluation.consentirPartageSpecialiste.useMutation();

  const fr = langue === "fr";

  const handleDecision = async (choix: "ACCEPTED" | "REFUSED") => {
    setError(null);
    try {
      await consentir.mutateAsync({ token, decision: choix });
      setDecision(choix);
      setDone(true);
    } catch {
      setError(fr
        ? "Une erreur est survenue. Veuillez réessayer."
        : "An error occurred. Please try again.");
    }
  };

  // ── Décision déjà prise ────────────────────────────────────────────────────
  if (done && decision) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-6">{decision === "ACCEPTED" ? "✅" : "🔒"}</p>
        <h2 className="text-xl font-bold text-[var(--color-ink)] mb-3">
          {fr
            ? (decision === "ACCEPTED" ? "Consentement accordé" : "Partage refusé")
            : (decision === "ACCEPTED" ? "Consent granted" : "Sharing refused")}
        </h2>
        <p className="text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
          {fr
            ? (decision === "ACCEPTED"
              ? `Vous avez autorisé le partage du rapport de ${prenomEnfant} avec un(e) ${prochainDomaine.fr}. L'équipe Édu-Réussite préparera la prochaine évaluation.`
              : `Vous avez refusé le partage du rapport de ${prenomEnfant}. Aucune donnée ne sera transmise à un autre spécialiste. Vous pouvez revenir sur cette décision en contactant l'équipe.`)
            : (decision === "ACCEPTED"
              ? `You authorized sharing ${prenomEnfant}'s report with a ${prochainDomaine.en}. The Édu-Réussite team will prepare the next assessment.`
              : `You refused to share ${prenomEnfant}'s report. No data will be transmitted to another specialist. You can reverse this decision by contacting the team.`)}
        </p>
        <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
          {fr ? "Votre décision a été enregistrée." : "Your decision has been recorded."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Langue */}
      <div className="flex justify-end mb-6 gap-2">
        {(["fr", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLangue(l)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${langue === l ? "bg-[var(--color-ink)] text-white border-transparent" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"}`}
          >
            {l === "fr" ? "Français" : "English"}
          </button>
        ))}
      </div>

      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[var(--color-ink)] mb-2">
          {fr ? "Votre accord est requis" : "Your consent is required"}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {fr
            ? `Concernant le partage du rapport d'évaluation de ${prenomEnfant} ${nomEnfant}`
            : `Regarding the sharing of ${prenomEnfant} ${nomEnfant}'s assessment report`}
        </p>
      </div>

      {/* Contexte */}
      <div className="bg-white rounded-2xl border border-[var(--color-rule)] p-6 mb-6">
        <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
          {fr ? "Contexte de la demande" : "Context of the request"}
        </h2>

        <div className="flex items-start gap-4 mb-4 p-4 rounded-xl bg-[var(--color-paper-warm)] border border-[var(--color-rule)]">
          <span className="text-3xl flex-shrink-0">{domaineActuel.icon}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {fr ? "Évaluation réalisée" : "Completed assessment"} — {domaineActuel.fr}
            </p>
            {rapportDate && (
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                {fr ? "Rapport généré le " : "Report generated on "}
                {new Date(rapportDate).toLocaleDateString(fr ? "fr-CA" : "en-CA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              {fr ? "✓ Rapport validé par vous" : "✓ Report validated by you"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-[var(--color-rule)]" />
          <span className="text-xs text-[var(--color-ink-soft)] px-2">
            {fr ? "résultats indiquent" : "results indicate"}
          </span>
          <div className="h-px flex-1 bg-[var(--color-rule)]" />
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-[rgba(217,79,43,0.05)] border border-[rgba(217,79,43,0.2)]">
          <span className="text-3xl flex-shrink-0">{prochainDomaine.icon}</span>
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">
              {fr ? "Évaluation complémentaire recommandée" : "Complementary assessment recommended"} — {prochainDomaine.fr}
            </p>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              {fr
                ? `Un(e) ${prochainDomaine.fr} ${prochainDomaine.description}.`
                : `A ${prochainDomaine.en} assesses ${prochainDomaine.description}.`}
            </p>
          </div>
        </div>
      </div>

      {/* Ce qui serait partagé */}
      <div className="bg-white rounded-2xl border border-[var(--color-rule)] p-6 mb-6">
        <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
          {fr ? "Données qui seraient partagées" : "Data that would be shared"}
        </h2>
        <ul className="space-y-3">
          {(fr ? [
            { icon: "📄", text: `Le rapport d'évaluation de ${prenomEnfant} généré par le ${domaineActuel.fr}` },
            { icon: "📋", text: "Les réponses au questionnaire d'observation comportementale" },
            { icon: "📊", text: "Le profil scolaire (niveau, matières, historique de progression)" },
            { icon: "🚫", text: "PAS partagé : coordonnées personnelles, dossier médical complet, données financières" },
          ] : [
            { icon: "📄", text: `${prenomEnfant}'s assessment report generated by the ${domaineActuel.en}` },
            { icon: "📋", text: "Responses to the behavioral observation questionnaire" },
            { icon: "📊", text: "Academic profile (level, subjects, progress history)" },
            { icon: "🚫", text: "NOT shared: personal contact information, full medical file, financial data" },
          ]).map((item, i) => (
            <li key={i} className={`flex items-start gap-3 text-sm ${i === 3 ? "text-[var(--color-success)]" : "text-[var(--color-ink)]"}`}>
              <span className="flex-shrink-0 text-base">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Droits */}
      <div className="bg-[var(--color-paper-warm)] rounded-2xl border border-[var(--color-rule)] p-5 mb-8">
        <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
          {fr
            ? `⚖️ Conformément à la Loi 25 (Québec) et au RGPD, votre consentement est libre, éclairé et révocable à tout moment. Un refus n'affecte pas le parcours d'apprentissage actuel de ${prenomEnfant} sur Édu-Réussite. Pour toute question : confidentialite@edureussite.ca`
            : `⚖️ Under Law 25 (Quebec) and GDPR, your consent is free, informed and revocable at any time. A refusal does not affect ${prenomEnfant}'s current learning path on Édu-Réussite. Questions: confidentialite@edureussite.ca`}
        </p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {/* Boutons de décision */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => handleDecision("REFUSED")}
          disabled={consentir.isPending}
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl border-2 border-[var(--color-rule)] bg-white text-[var(--color-ink)] text-sm font-semibold hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          <span>🔒</span>
          <span>{fr ? "Non, je refuse ce partage" : "No, I refuse this sharing"}</span>
        </button>

        <button
          onClick={() => handleDecision("ACCEPTED")}
          disabled={consentir.isPending}
          className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[var(--color-accent)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {consentir.isPending ? (
            <span>{fr ? "Enregistrement…" : "Saving…"}</span>
          ) : (
            <>
              <span>✅</span>
              <span>{fr ? "Oui, j'autorise ce partage" : "Yes, I authorize this sharing"}</span>
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-ink-soft)] mt-6">
        {fr
          ? "Cette page est sécurisée et accessible uniquement via le lien envoyé par courriel."
          : "This page is secure and accessible only via the link sent by email."}
      </p>
    </div>
  );
}
