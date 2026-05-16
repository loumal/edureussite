import { prisma } from "@/lib/prisma/client";
import { notFound } from "next/navigation";
import { RapportValidationClient } from "./_components/rapport-validation-client";
import type { RapportDetail, RapportSommaire } from "@/lib/evaluation/report-generator";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function RapportPage({ params }: Props) {
  const { token } = await params;

  // Le token est celui du formulaire (même token d'accès)
  const formulaire = await prisma.formulaireReponse.findUnique({
    where: { tokenAcces: token },
    include: {
      evaluation: {
        include: {
          rapports: true,
          eleve: { select: { prenom: true, niveauScolaire: true } },
        },
      },
    },
  });

  if (!formulaire) notFound();

  const evaluation = formulaire.evaluation;

  if (evaluation.status === "REPORT_GENERATING") {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-4xl mb-4 animate-pulse">⚙️</p>
          <h1 className="text-xl font-bold text-[var(--color-ink)] mb-2">Génération du rapport en cours…</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Notre équipe analyse les réponses du questionnaire. Le rapport sera disponible dans quelques instants. Veuillez rafraîchir la page dans 1-2 minutes.
          </p>
        </div>
      </div>
    );
  }

  if (!["REPORT_READY", "PARENT_VALIDATED", "PARENT_COMMENTED", "PARENT_REFUSED", "PARCOURS_ADJUSTED"].includes(evaluation.status)) {
    notFound();
  }

  const rapportDetailFr = evaluation.rapports.find((r) => r.type === "DETAIL" && r.langue === "fr");
  const rapportDetailEn = evaluation.rapports.find((r) => r.type === "DETAIL" && r.langue === "en");

  if (!rapportDetailFr) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] flex items-center justify-center">
        <p className="text-[var(--color-ink-soft)]">Rapport non disponible.</p>
      </div>
    );
  }

  const alreadyValidated = ["PARENT_VALIDATED", "PARENT_COMMENTED", "PARENT_REFUSED", "PARCOURS_ADJUSTED"].includes(evaluation.status);
  const parentValidation = evaluation.parentValidation;

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <div className="border-b border-[var(--color-rule)] bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--color-ink)]">✦ Édu-Réussite QC</p>
            <p className="text-xs text-[var(--color-ink-soft)]">Rapport d'évaluation — {evaluation.eleve.prenom}</p>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)] hidden sm:block">Confidentiel</p>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <RapportValidationClient
          token={token}
          evaluationId={evaluation.id}
          rapportFr={rapportDetailFr.contenu as unknown as RapportDetail}
          rapportEn={rapportDetailEn ? rapportDetailEn.contenu as unknown as RapportDetail : null}
          alreadyValidated={alreadyValidated}
          parentValidation={parentValidation}
          parentComment={evaluation.parentComment ?? undefined}
        />
      </main>
    </div>
  );
}
