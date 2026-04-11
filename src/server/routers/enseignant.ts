import { createTRPCRouter, enseignantProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { Matiere } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";

export const enseignantRouter = createTRPCRouter({
  // Tableau de bord : liste des élèves scopée à l'école de l'enseignant (paginée)
  getDashboard: enseignantProcedure
    .input(z.object({ page: z.number().int().min(1).default(1) }).optional())
    .query(async ({ ctx, input }) => {
      const PAGE_SIZE = 50;
      const page = input?.page ?? 1;
      const skip = (page - 1) * PAGE_SIZE;

      const profil = await ctx.prisma.profilEnseignant.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profil) return { profil, eleves: [], total: 0, page, pageSize: PAGE_SIZE };

      // Élèves explicitement liés à cet enseignant
      const where = { enseignantId: profil.id };

      const [eleves, total] = await ctx.prisma.$transaction([
        ctx.prisma.profilEleve.findMany({
          where,
          include: {
            niveauxMatieres: true,
            badges: { select: { id: true } },
            checkIns: {
              orderBy: { date: "desc" },
              take: 3,
              select: { id: true, etat: true, modeDoux: true, date: true },
            },
            exercicesAssignes: {
              where: { statut: "TERMINE" },
              select: { score: true, dateFin: true },
              orderBy: { dateFin: "desc" },
              take: 7,
            },
            planActions: {
              where: { statut: "ACTIF" },
              select: { id: true, titre: true },
              take: 1,
            },
          },
          orderBy: { prenom: "asc" },
          skip,
          take: PAGE_SIZE,
        }),
        ctx.prisma.profilEleve.count({ where }),
      ]);

      return { profil, eleves, total, page, pageSize: PAGE_SIZE };
    }),

  // Ajouter un élève par son code d'accès
  ajouterEleve: enseignantProcedure
    .input(z.object({ codeAcces: z.string().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const enseignant = await ctx.prisma.profilEnseignant.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const eleve = await ctx.prisma.profilEleve.findUnique({
        where: { codeAcces: input.codeAcces.trim() },
        select: { id: true, prenom: true, nom: true, niveauScolaire: true, enseignantId: true },
      });

      if (!eleve) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun élève trouvé avec ce code d'accès. Vérifiez l'orthographe.",
        });
      }
      if (eleve.enseignantId === enseignant.id) {
        throw new TRPCError({ code: "CONFLICT", message: "Cet élève est déjà dans votre liste." });
      }
      if (eleve.enseignantId && eleve.enseignantId !== enseignant.id) {
        throw new TRPCError({ code: "CONFLICT", message: "Cet élève est déjà suivi par un autre enseignant." });
      }

      await ctx.prisma.profilEleve.update({
        where: { id: eleve.id },
        data: { enseignantId: enseignant.id },
      });

      return { prenom: eleve.prenom, nom: eleve.nom, niveauScolaire: eleve.niveauScolaire };
    }),

  // Retirer un élève de la liste
  retirerEleve: enseignantProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const enseignant = await ctx.prisma.profilEnseignant.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      const eleve = await ctx.prisma.profilEleve.findFirst({
        where: { id: input.eleveId, enseignantId: enseignant.id },
        select: { id: true },
      });
      if (!eleve) throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.prisma.profilEleve.update({
        where: { id: input.eleveId },
        data: { enseignantId: null },
      });
      return { ok: true };
    }),

  // Détail d'un élève — vérifie que l'enseignant est de la même école
  getEleve: enseignantProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEnseignant.findUnique({
        where: { userId: ctx.user.id },
        select: { ecole: true },
      });

      // SÉCURITÉ : vérifier que l'élève est dans la même école
      const eleveCheck = await ctx.prisma.profilEleve.findUnique({
        where: { id: input.eleveId },
        select: { ecole: true },
      });

      if (!eleveCheck) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (profil?.ecole && eleveCheck.ecole && profil.ecole !== eleveCheck.ecole) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const eleve = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { id: input.eleveId },
        include: {
          niveauxMatieres: true,
          badges: { include: { badge: true } },
          checkIns: { orderBy: { date: "desc" }, take: 10 },
          exercicesAssignes: {
            include: { exercice: true },
            orderBy: { dateAssignation: "desc" },
            take: 20,
          },
          planActions: {
            where: { statut: "ACTIF" },
            include: { objectifs: true },
            take: 1,
          },
        },
      });
      return eleve;
    }),

  // Analyse de classe : lacunes agrégées par matière pour toute l'école
  getAnalyseClasse: enseignantProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEnseignant.findUnique({
      where: { userId: ctx.user.id },
      select: { ecole: true },
    });

    if (!profil?.ecole) return { ecole: null, analyses: [] };

    const niveaux = await ctx.prisma.niveauMatiere.findMany({
      where: {
        eleve: { ecole: profil.ecole },
        lacunes: { isEmpty: false },
      },
      select: {
        matiere: true,
        lacunes: true,
        scoreGlobal: true,
        eleve: { select: { id: true } },
      },
    });

    // Agrégation par matière
    const map = new Map<
      string,
      { totalEleves: Set<string>; lacuneCounts: Map<string, number>; scores: number[] }
    >();

    for (const n of niveaux) {
      if (!map.has(n.matiere)) {
        map.set(n.matiere, { totalEleves: new Set(), lacuneCounts: new Map(), scores: [] });
      }
      const entry = map.get(n.matiere)!;
      entry.totalEleves.add(n.eleve.id);
      entry.scores.push(n.scoreGlobal);
      for (const lacune of n.lacunes as string[]) {
        entry.lacuneCounts.set(lacune, (entry.lacuneCounts.get(lacune) ?? 0) + 1);
      }
    }

    const analyses = Array.from(map.entries()).map(([matiere, data]) => ({
      matiere,
      nbEleves: data.totalEleves.size,
      scoreMoyen: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      topLacunes: Array.from(data.lacuneCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lacune, count]) => ({ lacune, count })),
    }));

    analyses.sort((a, b) => a.scoreMoyen - b.scoreMoyen);
    return { ecole: profil.ecole, analyses };
  }),

  // Ajouter un commentaire pédagogique — vérifie la même école
  ajouterCommentaire: enseignantProcedure
    .input(
      z.object({
        eleveId: z.string().min(1).max(128),
        contenu: z.string().min(10).max(500),
        matiere: z.nativeEnum(Matiere).optional(),
        visible: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const enseignant = await ctx.prisma.profilEnseignant.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, ecole: true },
      });

      // SÉCURITÉ : vérifier que l'élève est dans la même école que l'enseignant
      if (enseignant.ecole) {
        const eleve = await ctx.prisma.profilEleve.findUnique({
          where: { id: input.eleveId },
          select: { ecole: true },
        });
        if (!eleve || eleve.ecole !== enseignant.ecole) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      }

      return ctx.prisma.commentairePedagogique.create({
        data: {
          eleveId: input.eleveId,
          enseignantId: enseignant.id,
          contenu: input.contenu,
          matiere: input.matiere,
          visibleParents: input.visible,
        },
      });
    }),
});
