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

    // Passer en génération
    await prisma.evaluationRequest.update({
      where: { id: evaluationId },
      data: { status: "REPORT_GENERATING" },
    });

    // 2. Générer sommaire + détail (chacun produit EN + FR via traduction interne)
    const sharedParams = {
      domaine: evaluation.primarySpecialist,
      prenomEnfant: evaluation.eleve.prenom,
      niveauScolaire: evaluation.eleve.niveauScolaire,
      reponsesEchelle,
      reponsesOuvertes,
    };
    const [sommaire, detail] = await Promise.all([
      genererRapportSommaire(sharedParams),
      genererRapportDetail(sharedParams),
    ]);
    const { en: sommaireEn, fr: sommaireFr } = sommaire;
    const { en: detailEn, fr: detailFr } = detail;

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
