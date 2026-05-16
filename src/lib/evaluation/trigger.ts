import { prisma } from "@/lib/prisma/client";
import { runTriage } from "./triage";
import { sendAlerteEvaluationAdmin } from "@/lib/email/send-alerte-evaluation";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://edu-reussite.com";

/**
 * À appeler de façon asynchrone (fire-and-forget) après chaque mise à jour de session.
 * Si le seuil de déclenchement est atteint et qu'aucune évaluation n'est déjà en cours,
 * crée une EvaluationRequest et notifie le super admin.
 */
export async function checkAndTriggerEvaluation(eleveId: string): Promise<void> {
  try {
    // 1. Vérifier si une évaluation est déjà active pour cet élève
    const evaluationExistante = await prisma.evaluationRequest.findFirst({
      where: {
        eleveId,
        status: {
          notIn: ["CLOSED", "PARENT_REFUSED"],
        },
      },
    });
    if (evaluationExistante) return;

    // 2. Lancer le triage
    const result = await runTriage(eleveId);
    if (!result.shouldTrigger) return;

    // 3. Créer l'EvaluationRequest
    const evaluation = await prisma.evaluationRequest.create({
      data: {
        eleveId,
        primarySpecialist: result.primarySpecialist,
        triageScores: result.scores as object,
        triageEvidence: result.evidence as object,
        status: "DETECTED",
        adminNotifiedAt: new Date(),
      },
    });

    // 4. Récupérer l'élève et les super admins pour la notification
    const [profil, superAdmins] = await Promise.all([
      prisma.profilEleve.findUnique({
        where: { id: eleveId },
        select: { prenom: true, nom: true },
      }),
      prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { email: true, name: true },
      }),
    ]);

    if (!profil || superAdmins.length === 0) return;

    // 5. Notifier tous les super admins
    const signals = (result.evidence.signals ?? []) as string[];
    for (const admin of superAdmins) {
      await sendAlerteEvaluationAdmin({
        adminEmail: admin.email,
        adminPrenom: admin.name ?? "Administrateur",
        prenomEleve: profil.prenom,
        nomEleve: profil.nom ?? "",
        evaluationId: evaluation.id,
        primarySpecialist: result.primarySpecialist,
        signals,
        appUrl: APP_URL,
      }).catch((err) => {
        console.error(`[evaluation/trigger] Email super admin failed: ${err}`);
      });
    }
  } catch (err) {
    // Fire-and-forget — on ne remonte jamais d'erreur au caller
    console.error("[evaluation/trigger] checkAndTriggerEvaluation error:", err);
  }
}
