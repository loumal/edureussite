import { prisma } from "@/lib/prisma/client";
import { getNextSpecialist } from "./triage";
import { randomUUID } from "crypto";
import type { DomaineSpecialiste } from "@/generated/prisma";
import type { RapportDetail } from "./report-generator";

/**
 * Applique les ajustements au parcours de l'élève après validation parent.
 * Stocke un profilCognitif dans ProfilEleve et marque l'évaluation comme ajustée.
 * Détecte aussi si un deuxième cycle est nécessaire.
 */
export async function ajusterParcoursApresValidation(evaluationId: string): Promise<void> {
  try {
    const evaluation = await prisma.evaluationRequest.findUnique({
      where: { id: evaluationId },
      include: {
        rapports: {
          where: { type: "DETAIL", langue: "fr" },
        },
        eleve: {
          select: { id: true, profilCognitif: true },
        },
      },
    });

    if (!evaluation) return;

    const rapport = evaluation.rapports[0];
    if (!rapport) return;

    const contenu = rapport.contenu as unknown as RapportDetail;
    const triageScores = evaluation.triageScores as Record<DomaineSpecialiste, number>;

    // Construire le profil cognitif à partir des recommandations du rapport
    const profilCognitif = {
      domaineEvalue: evaluation.primarySpecialist,
      dateEvaluation: new Date().toISOString(),
      round: evaluation.round,
      forces: contenu.forces ?? [],
      zonesVulnerabilite: contenu.zonesVulnerabilite ?? [],
      ajustementsParcours: contenu.prochainesEtapes ?? [],
      // Flags d'ajustements spécifiques selon le domaine
      ajustements: extraireAjustements(evaluation.primarySpecialist, contenu),
    };

    // Fusionner avec le profil cognitif existant
    const profilExistant = (evaluation.eleve.profilCognitif ?? {}) as Record<string, unknown>;
    const profilMaj = {
      ...profilExistant,
      [`round_${evaluation.round}`]: profilCognitif,
      derniereDomaine: evaluation.primarySpecialist,
      derniereEvaluation: new Date().toISOString(),
    };

    // Mettre à jour le profil élève
    await prisma.profilEleve.update({
      where: { id: evaluation.eleve.id },
      data: { profilCognitif: profilMaj as object },
    });

    // Marquer l'évaluation comme ajustée
    await prisma.evaluationRequest.update({
      where: { id: evaluationId },
      data: {
        status: "PARCOURS_ADJUSTED",
        parcoursAdjustedAt: new Date(),
      },
    });

    // ── Agent de redesign de parcours (Couche 2) ───────────────────────────
    // Déclenché en fire-and-forget — génère parcoursAdapte sur ProfilEleve
    const { lancerRedesignParcours } = await import("./parcours-redesign-agent");
    void lancerRedesignParcours(evaluationId);

    // ── Détection du cycle secondaire + consentement partage ──────────────
    const nextSpecialist = getNextSpecialist(triageScores, evaluation.primarySpecialist);
    if (nextSpecialist) {
      const tokenConsentement = randomUUID();

      // Stocker nextSpecialist + token de consentement, mais PAS encore SECOND_CYCLE_PENDING
      // Le statut passera à SECOND_CYCLE_PENDING seulement après accord du parent
      await prisma.evaluationRequest.update({
        where: { id: evaluationId },
        data: {
          nextSpecialist,
          tokenConsentementPartage: tokenConsentement,
          // status reste PARCOURS_ADJUSTED jusqu'au consentement
        },
      });

      // Récupérer l'email du parent pour lui envoyer la demande de consentement
      void envoyerDemandeConsentementPartage(evaluationId, tokenConsentement, nextSpecialist);
    }
  } catch (err) {
    console.error("[parcours-adjuster] Erreur:", err);
  }
}

/**
 * Récupère l'email parent et envoie la demande de consentement de partage.
 * Fire-and-forget — ne bloque pas le flux principal.
 */
async function envoyerDemandeConsentementPartage(
  evaluationId: string,
  token: string,
  nextSpecialist: DomaineSpecialiste
): Promise<void> {
  try {
    const evaluation = await prisma.evaluationRequest.findUnique({
      where: { id: evaluationId },
      select: {
        primarySpecialist: true,
        eleve: {
          select: {
            prenom: true,
            nom: true,
            parents: {
              select: {
                user: { select: { email: true } },
              },
              take: 1,
            },
          },
        },
      },
    });

    const parentEmail = evaluation?.eleve.parents[0]?.user?.email;
    if (!parentEmail || !evaluation) return;

    const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://edureussite.ca";
    const { sendConsentementPartageSpecialiste } = await import("@/lib/email/send-consentement-partage");

    await sendConsentementPartageSpecialiste({
      parentEmail,
      prenomEnfant: evaluation.eleve.prenom,
      nomEnfant: evaluation.eleve.nom,
      specialisteActuel: evaluation.primarySpecialist,
      prochainSpecialiste: nextSpecialist,
      tokenConsentement: token,
      appUrl,
    });
  } catch (err) {
    console.error("[parcours-adjuster] Erreur envoi email consentement:", err);
  }
}

/**
 * Extrait des flags d'ajustement spécifiques selon le domaine évalué.
 * Ces flags peuvent être lus par les algorithmes de génération d'exercices.
 */
function extraireAjustements(
  domaine: DomaineSpecialiste,
  rapport: RapportDetail
): Record<string, boolean | string> {
  const ajustements: Record<string, boolean | string> = {};
  const texte = [...rapport.zonesVulnerabilite, ...rapport.recommandationsParents].join(" ").toLowerCase();

  if (domaine === "NEUROPSYCHOLOGUE") {
    ajustements.tempsSupplementaire = texte.includes("temps") || texte.includes("lenteur");
    ajustements.consignesCourtesEtClaires = texte.includes("consigne") || texte.includes("attention");
    ajustements.pausesFrequentes = texte.includes("pause") || texte.includes("fatigue");
    ajustements.supportVisuel = texte.includes("visuel") || texte.includes("image");
  } else if (domaine === "ORTHOPEDAGOGUE") {
    ajustements.soutienLecture = texte.includes("lecture") || texte.includes("lire");
    ajustements.soutienMaths = texte.includes("math") || texte.includes("calcul");
    ajustements.synthèseVocale = texte.includes("synthèse vocale") || texte.includes("oral");
  } else if (domaine === "ERGOTHERAPEUTE") {
    ajustements.exercicesMotriciteReduits = texte.includes("écriture") || texte.includes("motricité");
    ajustements.alternativeEcritureManuelle = texte.includes("clavier") || texte.includes("ordinateur");
  } else if (domaine === "ORTHOPHONISTE") {
    ajustements.supportOral = true;
    ajustements.explicationsOralPriority = texte.includes("oral") || texte.includes("écoute");
  } else if (domaine === "OPTOMETRISTE") {
    ajustements.textesAeresGrandsCaracteres = texte.includes("lisibilité") || texte.includes("taille");
    ajustements.limiterLectureEcran = texte.includes("écran") || texte.includes("fatigue visuelle");
  } else if (domaine === "PSYCHOEDUCATEUR") {
    ajustements.recompensesFrequentes = texte.includes("motivation") || texte.includes("engagement");
    ajustements.objectifsCourtsTerme = texte.includes("objectif") || texte.includes("réussite");
  }

  return ajustements;
}
