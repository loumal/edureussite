import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { EvaluationFormClient } from "./_components/evaluation-form-client";
import { getQuestionnaire, QUESTIONNAIRE_ANAMNESE } from "@/lib/evaluation/questionnaires";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function EvaluationFormPage({ params }: Props) {
  const { token } = await params;

  const formulaire = await prisma.formulaireReponse.findUnique({
    where: { tokenAcces: token },
    include: {
      evaluation: {
        select: {
          id: true,
          primarySpecialist: true,
          status: true,
          eleve: { select: { prenom: true, niveauScolaire: true } },
        },
      },
    },
  });

  if (!formulaire) notFound();
  if (formulaire.completed) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Formulaire déjà soumis</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Merci d'avoir complété ce questionnaire. L'équipe d'Édu-Réussite QC va analyser vos réponses et vous transmettre un rapport sous peu.
          </p>
        </div>
      </div>
    );
  }

  const questionnaire = getQuestionnaire(formulaire.domaine);
  const anamnese = QUESTIONNAIRE_ANAMNESE;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      {/* En-tête */}
      <div className="border-b border-[var(--color-rule)] bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">✦ Édu-Réussite QC</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Questionnaire d'évaluation — {questionnaire.titreFr}</p>
          </div>
          <div className="text-xs text-[var(--color-ink-soft)] text-right hidden sm:block">
            <p>Pour : <strong>{formulaire.evaluation.eleve.prenom}</strong></p>
            <p>Confidentiel</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <EvaluationFormClient
          token={token}
          formulaireId={formulaire.id}
          domaine={formulaire.domaine}
          langue={formulaire.langue as "fr" | "en"}
          etapeInitiale={formulaire.etapeActuelle}
          reponsesEchelleInitiales={(formulaire.reponsesEchelle ?? {}) as Record<string, number>}
          reponsesOuvertesInitiales={(formulaire.reponsesOuvertes ?? {}) as Record<string, string>}
          reponsesAnamneseInitiales={(formulaire.reponsesAnamnese ?? {}) as Record<string, unknown>}
          prenomEnfant={formulaire.evaluation.eleve.prenom}
          questionnaire={questionnaire}
          anamnese={anamnese}
        />
      </main>
    </div>
  );
}
