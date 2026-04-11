import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { z } from "zod";

export const coursRouter = createTRPCRouter({
  // Cours en attente pour l'élève
  getMesCours: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    return ctx.prisma.coursRemediation.findMany({
      where: { eleveId: profil.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }),

  // Cours non lus (badge sur le dashboard)
  countNonLus: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    return ctx.prisma.coursRemediation.count({
      where: { eleveId: profil.id, statut: "NON_LU" },
    });
  }),

  // Récupérer un cours par ID
  getCours: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      return ctx.prisma.coursRemediation.findUniqueOrThrow({
        where: { id: input.id, eleveId: profil.id },
      });
    }),

  // Marquer en cours / terminé
  majStatut: protectedProcedure
    .input(z.object({ id: z.string(), statut: z.enum(["EN_COURS", "TERMINE"]) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      return ctx.prisma.coursRemediation.update({
        where: { id: input.id, eleveId: profil.id },
        data: { statut: input.statut },
      });
    }),
});
