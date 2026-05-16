import { prisma } from "@/lib/prisma/client";
import { sendAlerteEvaluationAdmin } from "@/lib/email/send-alerte-evaluation";
import type { DomaineSpecialiste } from "@/generated/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://edu-reussite.com";

/**
 * Crée un nouvel EvaluationRequest pour le second cycle et notifie les super admins.
 * Appelé en fire-and-forget après consentement parental accordé.
 */
export async function lancerSecondCycle(
  evaluationSourceId: string,
  nextSpecialist: DomaineSpecialiste
): Promise<void> {
  try {
    const source = await prisma.evaluationRequest.findUnique({
      where: { id: evaluationSourceId },
      select: {
        eleveId: true,
        round: true,
        triageScores: true,
        primarySpecialist: true,
        eleve: { select: { prenom: true, nom: true } },
      },
    });
    if (!source) return;

    // Vérifier qu'aucun cycle avec ce spécialiste n'est déjà actif
    const existant = await prisma.evaluationRequest.findFirst({
      where: {
        eleveId: source.eleveId,
        primarySpecialist: nextSpecialist,
        status: { notIn: ["CLOSED", "PARENT_REFUSED"] },
      },
    });
    if (existant) return;

    // Créer le nouvel EvaluationRequest
    const nouvelleEvaluation = await prisma.evaluationRequest.create({
      data: {
        eleveId: source.eleveId,
        primarySpecialist: nextSpecialist,
        round: source.round + 1,
        triageScores: source.triageScores ?? {},
        triageEvidence: {},
        status: "DETECTED",
        adminNotifiedAt: new Date(),
      },
    });

    // Notifier tous les super admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { email: true, name: true },
    });

    const signals = [
      `Évaluation secondaire — Round ${nouvelleEvaluation.round}`,
      `Spécialiste recommandé : ${nextSpecialist}`,
      `Suite au cycle 1 (${source.primarySpecialist}) — consentement parental accordé`,
    ];

    for (const admin of superAdmins) {
      await sendAlerteEvaluationAdmin({
        adminEmail: admin.email,
        adminPrenom: admin.name ?? "Administrateur",
        prenomEleve: source.eleve.prenom,
        nomEleve: source.eleve.nom ?? "",
        evaluationId: nouvelleEvaluation.id,
        primarySpecialist: nextSpecialist,
        signals,
        appUrl: APP_URL,
      }).catch((err) => {
        console.error("[second-cycle] Email admin failed:", err);
      });
    }
  } catch (err) {
    console.error("[second-cycle] Erreur:", err);
  }
}
