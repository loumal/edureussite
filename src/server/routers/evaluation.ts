import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getQuestionnaire, QUESTIONNAIRE_ANAMNESE } from "@/lib/evaluation/questionnaires";
import { genererEtSauvegarderRapports } from "@/lib/evaluation/report-service";

export const evaluationRouter = createTRPCRouter({
  // ── Accès public par token — charge le formulaire ────────────────────────
  getFormulaireParToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const formulaire = await ctx.prisma.formulaireReponse.findUnique({
        where: { tokenAcces: input.token },
        include: {
          evaluation: {
            select: {
              id: true,
              primarySpecialist: true,
              status: true,
              eleve: {
                select: { prenom: true, niveauScolaire: true },
              },
            },
          },
        },
      });

      if (!formulaire) throw new TRPCError({ code: "NOT_FOUND", message: "Formulaire introuvable ou lien expiré." });
      if (formulaire.completed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce formulaire a déjà été complété." });

      const questionnaire = getQuestionnaire(formulaire.domaine);
      const anamnese = QUESTIONNAIRE_ANAMNESE;

      return {
        formulaireId: formulaire.id,
        domaine: formulaire.domaine,
        langue: formulaire.langue,
        etapeActuelle: formulaire.etapeActuelle,
        reponsesEchelle: formulaire.reponsesEchelle as Record<string, number> | null,
        reponsesOuvertes: formulaire.reponsesOuvertes as Record<string, string> | null,
        reponsesAnamnese: formulaire.reponsesAnamnese as Record<string, unknown> | null,
        prenomEnfant: formulaire.evaluation.eleve.prenom,
        niveauScolaire: formulaire.evaluation.eleve.niveauScolaire,
        questionnaire,
        anamnese,
      };
    }),

  // ── Sauvegarde progressive ────────────────────────────────────────────────
  sauvegarderEtape: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      etapeActuelle: z.number().int().min(1),
      reponsesEchelle: z.record(z.string(), z.number().int().min(0).max(3)).optional(),
      reponsesOuvertes: z.record(z.string(), z.string().max(2000)).optional(),
      reponsesAnamnese: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const formulaire = await ctx.prisma.formulaireReponse.findUnique({
        where: { tokenAcces: input.token },
        select: { id: true, completed: true },
      });
      if (!formulaire) throw new TRPCError({ code: "NOT_FOUND" });
      if (formulaire.completed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Formulaire déjà soumis." });

      await ctx.prisma.formulaireReponse.update({
        where: { id: formulaire.id },
        data: {
          etapeActuelle: input.etapeActuelle,
          ...(input.reponsesEchelle !== undefined ? { reponsesEchelle: input.reponsesEchelle as object } : {}),
          ...(input.reponsesOuvertes !== undefined ? { reponsesOuvertes: input.reponsesOuvertes as object } : {}),
          ...(input.reponsesAnamnese !== undefined ? { reponsesAnamnese: input.reponsesAnamnese as object } : {}),
        },
      });

      return { success: true };
    }),

  // ── Soumission finale ─────────────────────────────────────────────────────
  soumettreFormulaire: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      reponsesEchelle: z.record(z.string(), z.number().int().min(0).max(3)),
      reponsesOuvertes: z.record(z.string(), z.string().max(2000)).optional(),
      reponsesAnamnese: z.record(z.string(), z.unknown()).optional(),
      langue: z.enum(["fr", "en"]).default("fr"),
    }))
    .mutation(async ({ ctx, input }) => {
      const formulaire = await ctx.prisma.formulaireReponse.findUnique({
        where: { tokenAcces: input.token },
        select: { id: true, evaluationId: true, completed: true },
      });
      if (!formulaire) throw new TRPCError({ code: "NOT_FOUND" });
      if (formulaire.completed) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Formulaire déjà soumis." });

      // Marquer comme complété
      await ctx.prisma.formulaireReponse.update({
        where: { id: formulaire.id },
        data: {
          completed: true,
          langue: input.langue,
          reponsesEchelle: input.reponsesEchelle as object,
          ...(input.reponsesOuvertes ? { reponsesOuvertes: input.reponsesOuvertes as object } : {}),
          ...(input.reponsesAnamnese ? { reponsesAnamnese: input.reponsesAnamnese as object } : {}),
        },
      });

      // Mettre à jour le statut de l'évaluation
      await ctx.prisma.evaluationRequest.update({
        where: { id: formulaire.evaluationId },
        data: {
          status: "FORM_COMPLETED",
          formCompletedAt: new Date(),
        },
      });

      // Fire-and-forget : génération des rapports IA
      void genererEtSauvegarderRapports(formulaire.evaluationId);

      return { success: true };
    }),

  // ── Validation du rapport par le parent ──────────────────────────────────
  validerRapportParent: publicProcedure
    .input(z.object({
      token: z.string().min(1),
      validation: z.enum(["CONFIRMED", "COMMENTED", "REFUSED"]),
      commentaire: z.string().max(3000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const formulaire = await ctx.prisma.formulaireReponse.findUnique({
        where: { tokenAcces: input.token },
        select: { evaluationId: true },
      });
      if (!formulaire) throw new TRPCError({ code: "NOT_FOUND" });

      const statusMap = {
        CONFIRMED: "PARENT_VALIDATED",
        COMMENTED: "PARENT_COMMENTED",
        REFUSED: "PARENT_REFUSED",
      } as const;

      await ctx.prisma.evaluationRequest.update({
        where: { id: formulaire.evaluationId },
        data: {
          status: statusMap[input.validation],
          parentValidation: input.validation,
          parentComment: input.commentaire ?? null,
          parentValidatedAt: new Date(),
        },
      });

      // Si confirmé ou commenté : déclencher l'ajustement du parcours
      if (input.validation !== "REFUSED") {
        const { ajusterParcoursApresValidation } = await import("@/lib/evaluation/parcours-adjuster");
        void ajusterParcoursApresValidation(formulaire.evaluationId);
      }

      return { success: true };
    }),
});
