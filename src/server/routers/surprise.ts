import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@/generated/prisma";

// ── Helper : vérifie que le parent est lié à cet élève ──────────────────────
async function assertParentDeEleve(
  prisma: PrismaClient,
  parentId: string,
  eleveId: string
): Promise<void> {
  const lien = await prisma.profilEleve.findFirst({
    where: { id: eleveId, parents: { some: { id: parentId } } },
    select: { id: true },
  });
  if (!lien) throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
}

export const surpriseRouter = createTRPCRouter({

  // ── Parent : liste ses surprises disponibles ─────────────────────────────
  listerParent: protectedProcedure.query(async ({ ctx }) => {
    const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    // Expirer les surprises non répondues depuis plus de 14 jours
    await ctx.prisma.surpriseParent.updateMany({
      where: {
        parentId: parent.id,
        statut: "EN_ATTENTE",
        expireAt: { lt: new Date() },
      },
      data: { statut: "EXPIRE" },
    });

    return ctx.prisma.surpriseParent.findMany({
      where: {
        parentId: parent.id,
        statut: { in: ["EN_ATTENTE", "ACCORDE"] },
      },
      include: {
        eleve: { select: { prenom: true, niveauScolaire: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Parent : accorde une surprise ────────────────────────────────────────
  accorder: protectedProcedure
    .input(z.object({
      surpriseId: z.string(),
      privilegeChoisi: z.string().min(3).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, prenom: true },
      });

      const surprise = await ctx.prisma.surpriseParent.findUniqueOrThrow({
        where: { id: input.surpriseId },
        include: { eleve: { include: { user: true } } },
      });

      if (surprise.parentId !== parent.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
      }
      if (surprise.statut !== "EN_ATTENTE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cette surprise a déjà été traitée." });
      }

      await assertParentDeEleve(ctx.prisma, parent.id, surprise.eleveId);

      const updated = await ctx.prisma.surpriseParent.update({
        where: { id: input.surpriseId },
        data: {
          statut: "ACCORDE",
          privilegeChoisi: input.privilegeChoisi,
          accordeAt: new Date(),
        },
      });

      // Notifier l'enfant in-app
      await ctx.prisma.notification.create({
        data: {
          destinataireId: surprise.eleve.userId,
          type: "SURPRISE_ACCORDEE",
          titre: "🎁 Tes parents ont une surprise pour toi !",
          contenu: "Connecte-toi pour voir ta surprise et confirmer sa réception.",
          donnees: { surpriseId: input.surpriseId },
        },
      });

      return updated;
    }),

  // ── Enfant : voit sa surprise accordée en attente de confirmation ─────────
  surpriseEnAttente: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    return ctx.prisma.surpriseParent.findFirst({
      where: {
        eleveId: profil.id,
        statut: "ACCORDE",
      },
      orderBy: { accordeAt: "desc" },
    });
  }),

  // ── Enfant : confirme la réception et laisse un souvenir ─────────────────
  confirmerReception: protectedProcedure
    .input(z.object({
      surpriseId: z.string(),
      messageEnfant: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const surprise = await ctx.prisma.surpriseParent.findUniqueOrThrow({
        where: { id: input.surpriseId },
      });

      if (surprise.eleveId !== profil.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
      }
      if (surprise.statut !== "ACCORDE") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cette surprise n'est pas en attente de confirmation." });
      }

      return ctx.prisma.surpriseParent.update({
        where: { id: input.surpriseId },
        data: {
          statut: "CONFIRME",
          messageEnfant: input.messageEnfant,
          confirmeAt: new Date(),
        },
      });
    }),

  // ── Enfant + Parent : Cahier de réussites ────────────────────────────────
  getCahier: protectedProcedure
    .input(z.object({ eleveId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Vérification : l'enfant lui-même ou un de ses parents
      if (ctx.user.role === "ELEVE") {
        const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
          where: { userId: ctx.user.id },
          select: { id: true },
        });
        if (profil.id !== input.eleveId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
        }
      } else if (ctx.user.role === "PARENT") {
        const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
          where: { userId: ctx.user.id },
          select: { id: true },
        });
        await assertParentDeEleve(ctx.prisma, parent.id, input.eleveId);
      } else {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès non autorisé." });
      }

      return ctx.prisma.surpriseParent.findMany({
        where: { eleveId: input.eleveId, statut: "CONFIRME" },
        orderBy: { confirmeAt: "desc" },
      });
    }),
});
