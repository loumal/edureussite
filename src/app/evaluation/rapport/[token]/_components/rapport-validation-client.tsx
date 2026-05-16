"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { RapportDetail } from "@/lib/evaluation/report-generator";
import type { ValidationParent } from "@/generated/prisma";

interface Props {
  token: string;
  evaluationId: string;
  rapportFr: RapportDetail;
  rapportEn: RapportDetail | null;
  alreadyValidated: boolean;
  parentValidation: ValidationParent;
  parentComment?: string;
}

export function RapportValidationClient({
  token,
  evaluationId,
  rapportFr,
  rapportEn,
  alreadyValidated,
  parentValidation,
  parentComment: commentInitial,
}: Props) {
  const [langue, setLangue] = useState<"fr" | "en">("fr");
  const [step, setStep] = useState<"lecture" | "validation">("lecture");
  const [choix, setChoix] = useState<"CONFIRMED" | "COMMENTED" | "REFUSED" | null>(null);
  const [commentaire, setCommentaire] = useState(commentInitial ?? "");
  const [done, setDone] = useState(alreadyValidated);
  const [error, setError] = useState<string | null>(null);

  const valider = trpc.evaluation.validerRapportParent.useMutation();

  const rapport = langue === "fr" ? rapportFr : (rapportEn ?? rapportFr);
  const fr = langue === "fr";

  const handleSubmit = async () => {
    if (!choix) return;
    setError(null);
    try {
      await valider.mutateAsync({ token, validation: choix, commentaire: commentaire || undefined });
      setDone(true);
    } catch {
      setError(fr ? "Une erreur est survenue. Veuillez réessayer." : "An error occurred. Please try again.");
    }
  };

  if (done && alreadyValidated && parentValidation !== "PENDING") {
    const msgs: Record<string, { fr: string; en: string; icon: string }> = {
      CONFIRMED: { fr: "Vous avez confirmé que ce rapport correspond à votre enfant. La plateforme va ajuster le parcours d'apprentissage en conséquence.", en: "You confirmed this report matches your child. The platform will adjust the learning path accordingly.", icon: "✅" },
      COMMENTED: { fr: "Votre commentaire a été enregistré. L'équipe en prendra connaissance pour affiner les recommandations.", en: "Your comment has been recorded. The team will review it to refine recommendations.", icon: "💬" },
      REFUSED: { fr: "Vous avez indiqué que ce rapport ne correspond pas à votre enfant. Aucun ajustement ne sera apporté au parcours.", en: "You indicated this report does not match your child. No adjustments will be made to the learning path.", icon: "❌" },
    };
    const msg = msgs[parentValidation] ?? msgs.CONFIRMED;
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">{msg.icon}</p>
        <p className="text-[var(--color-ink-soft)] max-w-md mx-auto text-sm">{fr ? msg.fr : msg.en}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Langue selector */}
      <div className="flex justify-end mb-4 gap-2">
        <button onClick={() => setLangue("fr")} className={`px-3 py-1 text-xs rounded-full border transition-colors ${langue === "fr" ? "bg-[var(--color-ink)] text-white border-transparent" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"}`}>Français</button>
        {rapportEn && <button onClick={() => setLangue("en")} className={`px-3 py-1 text-xs rounded-full border transition-colors ${langue === "en" ? "bg-[var(--color-ink)] text-white border-transparent" : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-warm)]"}`}>English</button>}
      </div>

      {step === "lecture" && (
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)] mb-1">
            {fr ? `Rapport d'évaluation — ${rapport.enfant.prenom}` : `Assessment Report — ${rapport.enfant.prenom}`}
          </h1>
          <p className="text-xs text-[var(--color-ink-soft)] mb-6">
            {rapport.enfant.niveauScolaire} · {new Date(rapport.dateGeneration).toLocaleDateString(fr ? "fr-CA" : "en-CA", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          {/* Introduction */}
          <div className="bg-white rounded-xl border border-[var(--color-rule)] p-5 mb-4">
            <p className="text-sm text-[var(--color-ink)] leading-relaxed">{rapport.introduction}</p>
          </div>

          {/* Analyse par section */}
          {rapport.analyseSections.length > 0 && (
            <div className="mb-4">
              <h2 className="text-base font-semibold text-[var(--color-ink)] mb-3">
                {fr ? "Observations par domaine" : "Observations by domain"}
              </h2>
              <div className="space-y-3">
                {rapport.analyseSections.map((sec, i) => (
                  <div key={i} className={`bg-white rounded-xl border p-4 ${sec.niveau === "eleve" ? "border-amber-200" : sec.niveau === "moyen" ? "border-[var(--color-rule)]" : "border-emerald-200"}`}>
                    <p className="text-sm font-semibold text-[var(--color-ink)] mb-2">{sec.section}</p>
                    <ul className="space-y-1">
                      {sec.observations.map((obs, j) => (
                        <li key={j} className="text-sm text-[var(--color-ink-soft)] flex gap-2">
                          <span className="mt-0.5 flex-shrink-0">•</span>
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forces */}
          {rapport.forces.length > 0 && (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 mb-4">
              <h2 className="text-sm font-semibold text-emerald-800 mb-2">{fr ? "Forces identifiées" : "Identified strengths"}</h2>
              <ul className="space-y-1">
                {rapport.forces.map((f, i) => <li key={i} className="text-sm text-emerald-700 flex gap-2"><span>✓</span><span>{f}</span></li>)}
              </ul>
            </div>
          )}

          {/* Zones de vulnérabilité */}
          {rapport.zonesVulnerabilite.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-2">{fr ? "Zones nécessitant un soutien" : "Areas needing support"}</h2>
              <ul className="space-y-1">
                {rapport.zonesVulnerabilite.map((z, i) => <li key={i} className="text-sm text-amber-700 flex gap-2"><span>◦</span><span>{z}</span></li>)}
              </ul>
            </div>
          )}

          {/* Recommandations parents */}
          {rapport.recommandationsParents.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-rule)] p-4 mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-2">{fr ? "Recommandations pour vous" : "Recommendations for you"}</h2>
              <ul className="space-y-1.5">
                {rapport.recommandationsParents.map((r, i) => <li key={i} className="text-sm text-[var(--color-ink-soft)] flex gap-2"><span className="flex-shrink-0">→</span><span>{r}</span></li>)}
              </ul>
            </div>
          )}

          {/* Prochaines étapes */}
          {rapport.prochainesEtapes.length > 0 && (
            <div className="bg-white rounded-xl border border-[var(--color-rule)] p-4 mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-2">{fr ? "Prochaines étapes suggérées" : "Suggested next steps"}</h2>
              <ul className="space-y-1">
                {rapport.prochainesEtapes.map((p, i) => <li key={i} className="text-sm text-[var(--color-ink-soft)] flex gap-2"><span className="flex-shrink-0">{i + 1}.</span><span>{p}</span></li>)}
              </ul>
            </div>
          )}

          {/* Mot de clôture */}
          <div className="bg-[var(--color-paper-warm)] rounded-xl border border-[var(--color-rule)] p-4 mb-4 italic">
            <p className="text-sm text-[var(--color-ink-soft)]">{rapport.motCloture}</p>
          </div>

          {/* Avertissement */}
          <p className="text-xs text-[var(--color-ink-soft)] border-t border-[var(--color-rule)] pt-3 mb-6">
            ⚠️ {rapport.avertissement}
          </p>

          <button
            onClick={() => setStep("validation")}
            className="w-full py-3 bg-[var(--color-ink)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            {fr ? "Ce rapport correspond-il à votre enfant ? →" : "Does this report match your child? →"}
          </button>
        </div>
      )}

      {step === "validation" && !done && (
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">
            {fr ? "Votre avis sur ce rapport" : "Your feedback on this report"}
          </h2>
          <p className="text-sm text-[var(--color-ink-soft)] mb-6">
            {fr
              ? "Votre validation est essentielle. Elle permet à Édu-Réussite d'ajuster le parcours de votre enfant de façon pertinente."
              : "Your validation is essential. It allows Édu-Réussite to adjust your child's learning path in a relevant way."}
          </p>

          <div className="space-y-3 mb-6">
            {[
              { val: "CONFIRMED", icon: "✅", labelFr: "Oui, ce rapport correspond bien à mon enfant", labelEn: "Yes, this report matches my child" },
              { val: "COMMENTED", icon: "💬", labelFr: "Partiellement — j'ai des précisions à ajouter", labelEn: "Partially — I have clarifications to add" },
              { val: "REFUSED", icon: "❌", labelFr: "Non, ce rapport ne correspond pas à mon enfant", labelEn: "No, this report does not match my child" },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setChoix(opt.val as typeof choix)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-colors ${choix === opt.val ? "border-[var(--color-accent)] bg-[rgba(217,79,43,0.05)] font-medium" : "border-[var(--color-rule)] hover:bg-[var(--color-paper-warm)]"}`}
              >
                <span>{opt.icon}</span>
                <span>{fr ? opt.labelFr : opt.labelEn}</span>
              </button>
            ))}
          </div>

          {(choix === "COMMENTED" || choix === "REFUSED") && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-[var(--color-ink)] mb-1.5">
                {fr ? "Vos précisions (optionnel)" : "Your clarifications (optional)"}
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                placeholder={fr ? "Ex : Mon enfant présente aussi des difficultés en…" : "E.g.: My child also has difficulties with…"}
                className="w-full rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!choix || valider.isPending}
            className="w-full py-3 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {valider.isPending
              ? (fr ? "Envoi…" : "Submitting…")
              : (fr ? "Valider ma réponse" : "Submit my response")}
          </button>

          <button onClick={() => setStep("lecture")} className="w-full mt-2 py-2 text-sm text-[var(--color-ink-soft)] hover:underline">
            {fr ? "← Relire le rapport" : "← Re-read the report"}
          </button>
        </div>
      )}
    </div>
  );
}
