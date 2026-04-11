import { createTRPCRouter, protectedProcedure, aiProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { Matiere, NiveauScolaire, TypeCommentaireParent } from "@/generated/prisma";
import { getNotionById } from "@/lib/pfeq/notions";
import bcrypt from "bcryptjs";
import { genererPlanAccompagnement } from "@/lib/ai/accompagnement";
import { getContexteDocuments } from "@/lib/ai/contexte-documents";
import { TRPCError } from "@trpc/server";
import { motDePasseSchema } from "@/lib/auth/utils";
import type { PrismaClient } from "@/generated/prisma";

// ── Helper : vérifie que le parent est bien lié à cet élève ──────────────────
// Toute procédure parent agissant sur un eleveId DOIT appeler cette fonction.
async function assertParentDeEleve(
  prisma: PrismaClient,
  parentId: string,
  eleveId: string
): Promise<void> {
  const lien = await prisma.profilEleve.findFirst({
    where: { id: eleveId, parents: { some: { id: parentId } } },
    select: { id: true },
  });
  if (!lien) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès non autorisé à cet élève.",
    });
  }
}

export const parentRouter = createTRPCRouter({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const profilParent = await ctx.prisma.profilParent.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      include: {
        eleves: {
          include: {
            niveauxMatieres: true,
            badges: { include: { badge: true } },
            planActions: {
              where: { statut: "ACTIF" },
              include: { objectifs: true },
              take: 1,
            },
            sessions: {
              where: {
                dateSession: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              select: {
                id: true,
                dateSession: true,
                dureeSecondes: true,
                exercicesTotal: true,
                exercicesReussis: true,
              },
              orderBy: { dateSession: "desc" },
            },
            checkIns: {
              orderBy: { date: "desc" },
              take: 3,
              // La note libre est privée (promise à l'élève dans l'UI) — on ne la retourne pas au parent
              select: { id: true, etat: true, modeDoux: true, date: true },
            },
          },
        },
      },
    });

    return profilParent;
  }),

  // Créer un compte enfant directement (le parent en est propriétaire immédiatement)
  ajouterEnfant: protectedProcedure
    .input(
      z.object({
        prenom: z.string().min(1).max(50),
        nom: z.string().min(1).max(50),
        niveauScolaire: z.nativeEnum(NiveauScolaire),
        ecole: z.string().max(100).optional(),
        motDePasse: motDePasseSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // Email interne non devinable : UUID au lieu de prénom+nom+timestamp
      const { randomUUID } = await import("crypto");
      const email = `eleve.${randomUUID()}@edureussite.internal`;
      const hashed = await bcrypt.hash(input.motDePasse, 12);

      // Code d'accès élève : Prénom + 6 chiffres aléatoires (ex: "Emma-483921")
      // 1 000 000 combinaisons par prénom — protégé en plus par le mot de passe fort
      const suffixe = (await import("crypto")).randomInt(100000, 999999).toString();
      const codeAcces = `${input.prenom}-${suffixe}`;

      const user = await ctx.prisma.user.create({
        data: {
          email,
          password: hashed,
          name: `${input.prenom} ${input.nom}`,
          role: "ELEVE",
          emailVerified: new Date(), // pas de vérification email pour les élèves
        },
      });

      await ctx.prisma.profilEleve.create({
        data: {
          userId: user.id,
          codeAcces,
          prenom: input.prenom,
          nom: input.nom,
          niveauScolaire: input.niveauScolaire,
          ecole: input.ecole,
          onboardingComplete: false, // l'élève complétera son profil à la première connexion
          onboardingEtape: 0,
          parents: { connect: { id: parent.id } },
        },
      });

      return { success: true, codeAcces };
    }),

  // Lier un enfant existant par code d'accès (max 2 parents par enfant)
  lierEnfantParCode: protectedProcedure
    .input(z.object({ codeAcces: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const profilEnfant = await ctx.prisma.profilEleve.findFirst({
        where: { codeAcces: input.codeAcces.trim() },
        include: { parents: { select: { id: true } } },
      });

      if (!profilEnfant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun compte élève trouvé avec ce code d'accès.",
        });
      }

      const parentIds = profilEnfant.parents.map((p) => p.id);
      if (parentIds.includes(parent.id)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cet enfant est déjà lié à votre compte.",
        });
      }
      if (parentIds.length >= 2) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cet enfant est déjà lié à deux parents. Limite atteinte.",
        });
      }

      await ctx.prisma.profilEleve.update({
        where: { id: profilEnfant.id },
        data: { parents: { connect: { id: parent.id } } },
      });

      return { success: true, prenom: profilEnfant.prenom };
    }),

  // Ajouter un commentaire (observation, note d'enseignant, PIE…)
  ajouterCommentaire: protectedProcedure
    .input(
      z.object({
        eleveId: z.string().min(1).max(128),
        type: z.nativeEnum(TypeCommentaireParent),
        contenu: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // SÉCURITÉ : vérifier que ce parent est bien lié à cet élève
      await assertParentDeEleve(ctx.prisma as unknown as PrismaClient, parent.id, input.eleveId);

      return ctx.prisma.commentaireParent.create({
        data: {
          parentId: parent.id,
          eleveId: input.eleveId,
          type: input.type,
          contenu: input.contenu,
        },
      });
    }),

  // Lister les commentaires pour un enfant
  listerCommentaires: protectedProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // SÉCURITÉ : vérifier la relation avant d'exposer les données
      await assertParentDeEleve(ctx.prisma as unknown as PrismaClient, parent.id, input.eleveId);

      return ctx.prisma.commentaireParent.findMany({
        where: { eleveId: input.eleveId, parentId: parent.id },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Supprimer un commentaire
  supprimerCommentaire: protectedProcedure
    .input(z.object({ commentaireId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const commentaire = await ctx.prisma.commentaireParent.findUniqueOrThrow({
        where: { id: input.commentaireId },
        select: { parentId: true },
      });

      if (commentaire.parentId !== parent.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.prisma.commentaireParent.delete({ where: { id: input.commentaireId } });
      return { success: true };
    }),

  // Générer (ou régénérer) le plan d'accompagnement pour un enfant
  genererPlanAccompagnement: aiProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // SÉCURITÉ : vérifier que ce parent est bien lié à cet élève
      await assertParentDeEleve(ctx.prisma as unknown as PrismaClient, parent.id, input.eleveId);

      const eleve = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { id: input.eleveId },
        include: {
          niveauxMatieres: true,
          checkIns: { orderBy: { date: "desc" }, take: 5 },
          exercicesAssignes: {
            where: { statut: "TERMINE" },
            include: { exercice: { select: { matiere: true } } },
            orderBy: { dateFin: "desc" },
            take: 10,
          },
          planActions: {
            where: { statut: "ACTIF" },
            include: { objectifs: true },
            take: 1,
          },
          commentairesParents: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          commentairesEleve: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      const docs = await getContexteDocuments(ctx.prisma as unknown as PrismaClient);
      const planIA = await genererPlanAccompagnement({
        prenom: eleve.prenom,
        nom: eleve.nom,
        niveauScolaire: eleve.niveauScolaire,
        styleApprentissage: eleve.styleApprentissage,
        matieresPreferees: eleve.matieresPreferees as Matiere[],
        matieresRedoutees: eleve.matieresRedoutees as Matiere[],
        tdah: eleve.tdah,
        dyslexie: eleve.dyslexie,
        anxieteScolaire: eleve.anxieteScolaire,
        autresBesoins: eleve.autresBesoins,
        streakJours: eleve.streakJours,
        niveauxMatieres: eleve.niveauxMatieres.map((n) => ({
          matiere: n.matiere as Matiere,
          scoreGlobal: n.scoreGlobal,
          niveau: n.niveau,
        })),
        derniersCheckIns: eleve.checkIns.map((c) => ({ etat: c.etat })),
        exercicesRecents: eleve.exercicesAssignes.map((e) => ({
          score: e.score,
          matiere: e.exercice.matiere,
        })),
        planActif: eleve.planActions[0]
          ? {
              titre: eleve.planActions[0].titre,
              objectifs: eleve.planActions[0].objectifs.map((o) => ({
                titre: o.titre,
                atteint: o.atteint,
                matiere: o.matiere,
              })),
            }
          : null,
        commentairesParent: eleve.commentairesParents.map((c) => ({
          type: c.type,
          contenu: c.contenu,
          date: c.createdAt.toISOString().split("T")[0],
        })),
        commentairesEleve: eleve.commentairesEleve.map((c) => ({
          type: c.type,
          contenu: c.contenu,
          matieres: c.matieres as string[],
          date: c.createdAt.toISOString().split("T")[0],
        })),
      }, docs);

      const plan = await ctx.prisma.planAccompagnementParent.upsert({
        where: { parentId_eleveId: { parentId: parent.id, eleveId: input.eleveId } },
        create: {
          parentId: parent.id,
          eleveId: input.eleveId,
          contenu: planIA as object,
        },
        update: {
          contenu: planIA as object,
          genereLeAt: new Date(),
        },
      });

      return plan;
    }),

  // Récupérer le plan existant sans le régénérer
  getPlanAccompagnement: protectedProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // SÉCURITÉ : vérifier la relation
      await assertParentDeEleve(ctx.prisma as unknown as PrismaClient, parent.id, input.eleveId);

      return ctx.prisma.planAccompagnementParent.findUnique({
        where: { parentId_eleveId: { parentId: parent.id, eleveId: input.eleveId } },
        include: { eleve: { select: { prenom: true, nom: true, niveauScolaire: true } } },
      });
    }),

  // Activer/récupérer le lien de partage pour un plan
  getOuCreerLienPartage: protectedProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // SÉCURITÉ : vérifier la relation avant de générer un token de partage
      await assertParentDeEleve(ctx.prisma as unknown as PrismaClient, parent.id, input.eleveId);

      const plan = await ctx.prisma.planAccompagnementParent.findUnique({
        where: { parentId_eleveId: { parentId: parent.id, eleveId: input.eleveId } },
        select: { tokenPartage: true },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun plan à partager. Générez le plan d'abord.",
        });
      }

      return { token: plan.tokenPartage };
    }),

  getProgression: protectedProcedure.query(async ({ ctx }) => {
    const profilParent = await ctx.prisma.profilParent.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { eleves: { select: { id: true } } },
    });

    const eleveIds = profilParent.eleves.map((e: { id: string }) => e.id);

    const sessions = await ctx.prisma.sessionPratique.findMany({
      where: { eleveId: { in: eleveIds } },
      orderBy: { dateSession: "desc" },
      take: 30,
    });

    return sessions;
  }),

  // Rapport complet — uniquement les enfants liés à CE parent
  getRapports: protectedProcedure.query(async ({ ctx }) => {
    const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      include: {
        eleves: {
          include: {
            niveauxMatieres: true,
            badges: { include: { badge: true }, orderBy: { date: "desc" } },
            planActions: {
              where: { statut: "ACTIF" },
              include: { objectifs: true },
            },
            sessions: {
              orderBy: { dateSession: "desc" },
              take: 56,
            },
            checkIns: {
              orderBy: { date: "desc" },
              take: 14,
            },
            exercicesAssignes: {
              where: { statut: "TERMINE" },
              include: { exercice: { select: { matiere: true, titre: true } } },
              orderBy: { dateFin: "desc" },
              take: 60,
            },
            commentairesEleve: {
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        },
      },
    });

    return parent.eleves;
  }),

  // Notifications du parent
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.findMany({
      where: { destinataireId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  countNotificationsNonLues: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.count({
      where: { destinataireId: ctx.user.id, lue: false },
    });
  }),

  // SÉCURITÉ : scope sur destinataireId pour empêcher de marquer les notifs d'autrui
  marquerNotificationLue: protectedProcedure
    .input(z.object({ notificationId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.notification.updateMany({
        where: { id: input.notificationId, destinataireId: ctx.user.id },
        data: { lue: true },
      });
      if (result.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return { success: true };
    }),

  marquerToutesNotificationsLues: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { destinataireId: ctx.user.id, lue: false },
      data: { lue: true },
    });
    return { success: true };
  }),

  // ── Réinitialiser le mot de passe d'un enfant ────────────────────────────
  resetMotDePasseEnfant: protectedProcedure
    .input(z.object({ eleveId: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED" });

      const eleve = await ctx.prisma.profilEleve.findFirst({
        where: { id: input.eleveId, parents: { some: { id: parent.id } } },
        include: { user: true },
      });
      if (!eleve) throw new TRPCError({ code: "NOT_FOUND", message: "Enfant introuvable." });

      const hashed = await bcrypt.hash(input.newPassword, 12);
      await ctx.prisma.user.update({
        where: { id: eleve.user.id },
        data: { password: hashed },
      });
      return { success: true };
    }),

  // ── Générer un mot de passe mémorable pour un enfant ─────────────────────
  // Retourne le mot de passe EN CLAIR une seule fois — il est immédiatement hashé en DB.
  genererMdpTemporaire: protectedProcedure
    .input(z.object({ eleveId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!parent) throw new TRPCError({ code: "UNAUTHORIZED" });

      const eleve = await ctx.prisma.profilEleve.findFirst({
        where: { id: input.eleveId, parents: { some: { id: parent.id } } },
        include: { user: true },
      });
      if (!eleve) throw new TRPCError({ code: "NOT_FOUND", message: "Enfant introuvable." });

      // Génère un mot de passe mémorable pour enfant : Mot + 4 chiffres
      // IMPORTANT : aucun accent — les enfants doivent pouvoir le taper facilement
      const MOTS = ["Soleil","Tigre","Dauphin","Aigle","Renard","Lune","Nuage",
                    "Jaguar","Colibri","Panda","Lynx","Faucon","Koala","Requin","Dragon","Castor"];
      const mot = MOTS[Math.floor(Math.random() * MOTS.length)];
      const chiffres = String(Math.floor(1000 + Math.random() * 9000));
      const mdpClair = `${mot}${chiffres}`;

      const hashed = await bcrypt.hash(mdpClair, 12);
      await ctx.prisma.user.update({
        where: { id: eleve.user.id },
        data: { password: hashed },
      });

      return { motDePasse: mdpClair, codeAcces: eleve.codeAcces };
    }),

  // ── Plan de travail de l'enfant (visible par tous les parents) ────────────
  getEnfantPlanification: protectedProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      const parent = await ctx.prisma.profilParent.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // SÉCURITÉ : vérifier le lien parent-enfant
      await assertParentDeEleve(ctx.prisma as unknown as PrismaClient, parent.id, input.eleveId);

      const eleve = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { id: input.eleveId },
        select: {
          prenom: true,
          nom: true,
          niveauScolaire: true,
          planifNotions: {
            orderBy: { ordre: "asc" },
          },
          objectifsNotes: {
            where: { actif: true },
            select: { matiere: true, scoreVise: true, dateEcheance: true },
          },
        },
      });

      // Enrichir avec les labels PFEQ
      const notionsEnrichies = eleve.planifNotions.map((n) => {
        const pfeq = getNotionById(n.notion);
        return { ...n, label: pfeq?.label ?? n.notion, description: pfeq?.description ?? "" };
      });

      const notionsTotal = notionsEnrichies.length;
      const notionsMaitrisees = notionsEnrichies.filter((n) => n.maitrisee).length;
      const notionActive = notionsEnrichies.find((n) => !n.maitrisee) ?? null;

      // Grouper par semaine
      const parSemaine: Record<string, typeof notionsEnrichies> = {};
      for (const n of notionsEnrichies) {
        const cle = n.semaineDebut ?? "non-planifie";
        if (!parSemaine[cle]) parSemaine[cle] = [];
        parSemaine[cle].push(n);
      }

      return {
        prenom: eleve.prenom,
        niveauScolaire: eleve.niveauScolaire,
        notions: notionsEnrichies,
        notionActive,
        notionsTotal,
        notionsMaitrisees,
        progressionPct: notionsTotal > 0 ? Math.round((notionsMaitrisees / notionsTotal) * 100) : 0,
        parSemaine,
        objectifs: eleve.objectifsNotes,
        aUnPlan: notionsTotal > 0,
      };
    }),
});
