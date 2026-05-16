import { prisma } from "@/lib/prisma/client";
import { genererRapportSommaire, genererRapportDetail } from "./report-generator";

/**
 * Orchestre la génération des deux rapports (sommaire + détaillé)
 * en FR et EN, les sauvegarde en DB et met à jour le statut.
 * Appelé en fire-and-forget après la soumission du formulaire parent.
 */
export async function genererEtSauvegarderRapports(evaluationId: string): Promise<void> {
  try {
    // 1. Récupérer l'évaluation et le formulaire complété
    const evaluation = await prisma.evaluationRequest.findUnique({
      where: { id: evaluationId },
      include: {
        formulaire: true,
        eleve: {
          select: { prenom: true, niveauScolaire: true },
        },
      },
    });

    if (!evaluation?.formulaire?.completed) return;

    const reponsesEchelle = (evaluation.formulaire.reponsesEchelle ?? {}) as Record<string, number>;
    const reponsesOuvertes = (evaluation.formulaire.reponsesOuvertes ?? {}) as Record<string, string>;
    const langue = (evaluation.formulaire.langue ?? "fr") as "fr" | "en";

    // Passer en génération
    await prisma.evaluationRequest.update({
      where: { id: evaluationId },
      data: { status: "REPORT_GENERATING" },
    });

    // 2. Générer les 4 rapports en parallèle (sommaire FR + EN, détaillé FR + EN)
    const [sommaireFr, sommaireEn, detailFr, detailEn] = await Promise.all([
      genererRapportSommaire({
        domaine: evaluation.primarySpecialist,
        langue: "fr",
        prenomEnfant: evaluation.eleve.prenom,
        niveauScolaire: evaluation.eleve.niveauScolaire,
        reponsesEchelle,
        reponsesOuvertes,
      }),
      genererRapportSommaire({
        domaine: evaluation.primarySpecialist,
        langue: "en",
        prenomEnfant: evaluation.eleve.prenom,
        niveauScolaire: evaluation.eleve.niveauScolaire,
        reponsesEchelle,
        reponsesOuvertes,
      }),
      genererRapportDetail({
        domaine: evaluation.primarySpecialist,
        langue: "fr",
        prenomEnfant: evaluation.eleve.prenom,
        niveauScolaire: evaluation.eleve.niveauScolaire,
        reponsesEchelle,
        reponsesOuvertes,
      }),
      genererRapportDetail({
        domaine: evaluation.primarySpecialist,
        langue: "en",
        prenomEnfant: evaluation.eleve.prenom,
        niveauScolaire: evaluation.eleve.niveauScolaire,
        reponsesEchelle,
        reponsesOuvertes,
      }),
    ]);

    // 3. Sauvegarder les 4 rapports
    await prisma.rapportEvaluation.createMany({
      data: [
        {
          evaluationId,
          type: "SOMMAIRE",
          langue: "fr",
          domaine: evaluation.primarySpecialist,
          contenu: sommaireFr as object,
        },
        {
          evaluationId,
          type: "SOMMAIRE",
          langue: "en",
          domaine: evaluation.primarySpecialist,
          contenu: sommaireEn as object,
        },
        {
          evaluationId,
          type: "DETAIL",
          langue: "fr",
          domaine: evaluation.primarySpecialist,
          contenu: detailFr as object,
        },
        {
          evaluationId,
          type: "DETAIL",
          langue: "en",
          domaine: evaluation.primarySpecialist,
          contenu: detailEn as object,
        },
      ],
    });

    // 4. Mettre à jour le statut
    await prisma.evaluationRequest.update({
      where: { id: evaluationId },
      data: {
        status: "REPORT_READY",
        reportGeneratedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[report-service] Erreur génération rapports:", err);
    // Régresser au statut précédent pour permettre une relance
    await prisma.evaluationRequest.update({
      where: { id: evaluationId },
      data: { status: "FORM_COMPLETED" },
    }).catch(() => {});
  }
}
