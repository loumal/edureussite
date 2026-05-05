import { createTRPCRouter, superAdminProcedure, adminProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";

function getMondayKey(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Matiere, NiveauScolaire, TypeExercice, NiveauDifficulte, SourceEpreuve, TypeDocument, Province, TypeModeleEpreuve } from "@/generated/prisma";
import { analyserStructureEpreuve } from "@/lib/ai/epreuve";
import { logSecurityEvent } from "@/lib/security/log";
import { ApiService } from "@/generated/prisma";
import { addBlockedIp, removeBlockedIp } from "@/lib/redis/blocked-ips";
import { sendSuspensionEmail } from "@/lib/email/send-suspension";
import { sendReactivationEmail } from "@/lib/email/send-reactivation";
import { sendAlerteSecuriteEmail } from "@/lib/email/send-alerte-securite";

export const PROVINCES_INFO: Record<string, { nom: string; langue: string; curriculum: string }> = {
  QC: { nom: "Québec",                        langue: "FR",    curriculum: "PFEQ" },
  ON: { nom: "Ontario",                        langue: "EN",    curriculum: "Ontario Curriculum" },
  BC: { nom: "Colombie-Britannique",           langue: "EN",    curriculum: "BC Curriculum" },
  AB: { nom: "Alberta",                        langue: "EN",    curriculum: "Alberta Program of Studies" },
  SK: { nom: "Saskatchewan",                   langue: "EN",    curriculum: "SK Curriculum" },
  MB: { nom: "Manitoba",                       langue: "EN",    curriculum: "Manitoba Curriculum" },
  NB: { nom: "Nouveau-Brunswick",              langue: "FR/EN", curriculum: "NB Curriculum (bilingue)" },
  NS: { nom: "Nouvelle-Écosse",                langue: "EN",    curriculum: "NS Curriculum" },
  PE: { nom: "Île-du-Prince-Édouard",          langue: "EN",    curriculum: "PEI Curriculum" },
  NL: { nom: "Terre-Neuve-et-Labrador",        langue: "EN",    curriculum: "NL Curriculum" },
  YT: { nom: "Yukon",                          langue: "EN",    curriculum: "Yukon Curriculum" },
  NT: { nom: "Territoires du Nord-Ouest",      langue: "EN",    curriculum: "NWT Curriculum" },
  NU: { nom: "Nunavut",                        langue: "EN",    curriculum: "Nunavut Curriculum" },
};

export const adminRouter = createTRPCRouter({
  // ── Tableau de bord super admin ──────────────────────────────────────────
  getDashboard: adminProcedure.query(async ({ ctx }) => {
    const isSuperAdmin = ctx.user.role === "SUPER_ADMIN";

    const semaineDerniere = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalEleves, totalEnseignants, totalParents, totalEpreuves, totalConsolidations, epreuvesRecentes, totalSpecialistes, totalDocuments, totalAdmins, nouveauxCetteSemaine] =
      await Promise.all([
        ctx.prisma.user.count({ where: { role: "ELEVE" } }),
        ctx.prisma.user.count({ where: { role: "ENSEIGNANT" } }),
        ctx.prisma.user.count({ where: { role: "PARENT" } }),
        ctx.prisma.modeleEpreuve.count({ where: { typeModele: "EPREUVE_COMPLETE" } }),
        ctx.prisma.modeleEpreuve.count({ where: { typeModele: "CONSOLIDATION" } }),
        ctx.prisma.modeleEpreuve.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { sections: true },
        }),
        isSuperAdmin ? ctx.prisma.specialiste.count() : Promise.resolve(0),
        isSuperAdmin ? ctx.prisma.documentPedagogique.count({ where: { actif: true } }) : Promise.resolve(0),
        isSuperAdmin ? ctx.prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } }) : Promise.resolve(0),
        isSuperAdmin ? ctx.prisma.user.count({ where: { createdAt: { gte: semaineDerniere } } }) : Promise.resolve(0),
      ]);

    return { totalEleves, totalEnseignants, totalParents, totalEpreuves, totalConsolidations, epreuvesRecentes, totalSpecialistes, totalDocuments, totalAdmins, nouveauxCetteSemaine };
  }),

  // ── Lister les modèles d'épreuves ────────────────────────────────────────
  listerEpreuves: adminProcedure
    .input(
      z.object({
        matiere: z.nativeEnum(Matiere).optional(),
        niveauScolaire: z.nativeEnum(NiveauScolaire).optional(),
        valide: z.boolean().optional(),
        typeModele: z.nativeEnum(TypeModeleEpreuve).optional(),
        page: z.number().min(1).default(1),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const perPage = 15;

      const where = {
        ...(input?.matiere ? { matiere: input.matiere } : {}),
        ...(input?.niveauScolaire ? { niveauScolaire: input.niveauScolaire } : {}),
        ...(input?.valide !== undefined ? { valide: input.valide } : {}),
        ...(input?.typeModele ? { typeModele: input.typeModele } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.modeleEpreuve.findMany({
          where,
          include: { sections: { orderBy: { ordre: "asc" } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        ctx.prisma.modeleEpreuve.count({ where }),
      ]);

      return { items, total, page, totalPages: Math.ceil(total / perPage) };
    }),

  // ── Obtenir un modèle d'épreuve ──────────────────────────────────────────
  getEpreuve: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.modeleEpreuve.findUniqueOrThrow({
        where: { id: input.id },
        include: { sections: { orderBy: { ordre: "asc" } } },
      });
    }),

  // ── Analyser la structure d'une épreuve via Claude ───────────────────────
  analyserEpreuve: superAdminProcedure
    .input(
      z.object({
        contenu: z.string().min(50, "Le contenu doit faire au moins 50 caractères"),
        matiere: z.nativeEnum(Matiere),
        niveauScolaire: z.nativeEnum(NiveauScolaire),
        typeModele: z.nativeEnum(TypeModeleEpreuve).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return analyserStructureEpreuve({
        contenu: input.contenu,
        matiere: input.matiere,
        niveauScolaire: input.niveauScolaire,
        typeModele: input.typeModele,
      });
    }),

  // ── Créer un modèle d'épreuve ────────────────────────────────────────────
  creerEpreuve: superAdminProcedure
    .input(
      z.object({
        titre: z.string().min(3),
        matiere: z.nativeEnum(Matiere),
        niveauScolaire: z.nativeEnum(NiveauScolaire),
        source: z.nativeEnum(SourceEpreuve).default("MEES_OFFICIEL"),
        annee: z.number().min(2000).max(2030).optional(),
        description: z.string().optional(),
        contenuOriginal: z.string().optional(),
        structureAnalysee: z.any().optional(),
        totalPoints: z.number().optional(),
        dureeMinutes: z.number().optional(),
        typeModele: z.nativeEnum(TypeModeleEpreuve).default("EPREUVE_COMPLETE"),
        notion: z.string().optional(),
        sections: z.array(
          z.object({
            ordre: z.number(),
            titre: z.string(),
            typeQuestion: z.nativeEnum(TypeExercice),
            nombreQuestions: z.number().min(1),
            pointsTotal: z.number().min(0),
            competencesPFEQ: z.array(z.string()).default([]),
            difficulte: z.nativeEnum(NiveauDifficulte).default("ATTENDU"),
            instructions: z.string().optional(),
            exempleQuestion: z.any().optional(),
          })
        ).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { sections, ...epreuveData } = input;

      return ctx.prisma.modeleEpreuve.create({
        data: {
          ...epreuveData,
          uploadePar: ctx.user.id,
          sections: {
            create: sections,
          },
        },
        include: { sections: { orderBy: { ordre: "asc" } } },
      });
    }),

  // ── Valider / invalider un modèle ────────────────────────────────────────
  validerEpreuve: superAdminProcedure
    .input(z.object({ id: z.string(), valide: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.modeleEpreuve.update({
        where: { id: input.id },
        data: { valide: input.valide },
      });
    }),

  // ── Supprimer un modèle ──────────────────────────────────────────────────
  supprimerEpreuve: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const epreuve = await ctx.prisma.modeleEpreuve.findUnique({ where: { id: input.id }, select: { titre: true, matiere: true, niveauScolaire: true } });
      await ctx.prisma.modeleEpreuve.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ── Lister les modèles validés (pour génération d'exercices) ────────────
  getModelesValides: adminProcedure
    .input(
      z.object({
        matiere: z.nativeEnum(Matiere).optional(),
        niveauScolaire: z.nativeEnum(NiveauScolaire).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.modeleEpreuve.findMany({
        where: {
          valide: true,
          ...(input?.matiere ? { matiere: input.matiere } : {}),
          ...(input?.niveauScolaire ? { niveauScolaire: input.niveauScolaire } : {}),
        },
        include: { sections: { orderBy: { ordre: "asc" } } },
        orderBy: [{ matiere: "asc" }, { annee: "desc" }],
      });
    }),

  // ── Gestion des utilisateurs (vue super admin) ───────────────────────────
  listerUtilisateurs: superAdminProcedure
    .input(
      z.object({
        role: z.enum(["ELEVE", "PARENT", "ENSEIGNANT", "ADMIN", "SUPER_ADMIN"]).optional(),
        page: z.number().min(1).default(1),
        search: z.string().max(100).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const perPage = 20;
      const search = input?.search?.trim();

      const where = {
        ...(input?.role ? { role: input.role as never } : {}),
        ...(search ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            suspended: true,
            createdAt: true,
            profilEleve: { select: { id: true, prenom: true, nom: true, niveauScolaire: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return { items, total, page, totalPages: Math.ceil(total / perPage) };
    }),

  // ── Promouvoir un utilisateur en super admin ─────────────────────────────
  changerRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["ELEVE", "PARENT", "ENSEIGNANT", "ADMIN", "SUPER_ADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cible = await ctx.prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, role: true } });
      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role as never },
        select: { id: true, email: true, role: true },
      });
      await logSecurityEvent({
        action: "ROLE_MODIFIE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible?.email,
        details: { ancienRole: cible?.role, nouveauRole: input.role },
      });
      return updated;
    }),

  // ── Supprimer un compte utilisateur ──────────────────────────────────────
  supprimerUtilisateur: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
      }
      const cible = await ctx.prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, role: true } });
      await ctx.prisma.user.delete({ where: { id: input.userId } });
      await logSecurityEvent({
        action: "UTILISATEUR_SUPPRIME",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible?.email,
        details: { roleSuprime: cible?.role },
      });
      return { success: true };
    }),

  // ── Feature flags ─────────────────────────────────────────────────────────
  getFeatureFlags: superAdminProcedure.query(async ({ ctx }) => {
    const params = await ctx.prisma.parametreApp.findMany({
      where: { cle: { startsWith: "feature_" } },
    });
    const flags: Record<string, boolean> = {};
    for (const p of params) flags[p.cle] = p.valeur === "true";
    // Valeurs par défaut : activé
    if (!("feature_specialistes" in flags)) flags["feature_specialistes"] = true;
    if (!("feature_recommandation_ia" in flags)) flags["feature_recommandation_ia"] = true;
    return flags;
  }),

  toggleFeature: superAdminProcedure
    .input(z.object({ cle: z.string(), actif: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.parametreApp.upsert({
        where: { cle: input.cle },
        update: { valeur: input.actif ? "true" : "false" },
        create: { cle: input.cle, valeur: input.actif ? "true" : "false" },
      });
      return { success: true };
    }),

  // ── Créer un compte Super Admin ──────────────────────────────────────────
  creerSuperAdmin: superAdminProcedure
    .input(
      z.object({
        prenom: z.string().min(1).max(50),
        nom: z.string().min(1).max(50),
        email: z.string().email(),
        motDePasse: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bcrypt = await import("bcryptjs");
      const existant = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (existant) throw new Error("Un compte avec ce courriel existe déjà.");
      const hashed = await bcrypt.hash(input.motDePasse, 12);
      const created = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: `${input.prenom} ${input.nom}`,
          password: hashed,
          emailVerified: new Date(),
          role: "SUPER_ADMIN",
        },
        select: { id: true, email: true, name: true, role: true },
      });
      await logSecurityEvent({
        action: "SUPER_ADMIN_CREE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: created.id,
        cibleEmail: created.email,
      });
      return created;
    }),

  // ── Lister les documents pédagogiques ────────────────────────────────────
  listerDocuments: superAdminProcedure
    .input(z.object({
      type: z.enum(["RECHERCHE_SCIENTIFIQUE","GUIDE_PEDAGOGIQUE","STRATEGIE_INTERVENTION","RESULTAT_ETUDE","RESSOURCE_PARENTALE","AUTRE"]).optional(),
      actif: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.documentPedagogique.findMany({
        where: {
          ...(input?.type ? { type: input.type } : {}),
          ...(input?.actif !== undefined ? { actif: input.actif } : {}),
        },
        orderBy: [{ type: "asc" }, { createdAt: "desc" }],
      });
    }),

  // ── Ajouter un document pédagogique ──────────────────────────────────────
  ajouterDocument: superAdminProcedure
    .input(z.object({
      titre: z.string().min(3).max(300),
      type: z.nativeEnum(TypeDocument),
      contenu: z.string().min(50),
      source: z.string().optional(),
      auteurs: z.string().optional(),
      annee: z.number().int().min(1900).max(2030).optional(),
      motsCles: z.array(z.string()).default([]),
      matieres: z.array(z.nativeEnum(Matiere)).default([]),
      niveaux: z.array(z.nativeEnum(NiveauScolaire)).default([]),
      province: z.nativeEnum(Province).default("QC"),
      matiereLibre: z.string().max(100).optional(),
      niveauLibre: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.documentPedagogique.create({ data: input });
    }),

  // ── Modifier un document pédagogique ─────────────────────────────────────
  modifierDocument: superAdminProcedure
    .input(z.object({
      id: z.string(),
      titre: z.string().min(3).max(300).optional(),
      contenu: z.string().min(50).optional(),
      source: z.string().optional(),
      auteurs: z.string().optional(),
      annee: z.number().int().min(1900).max(2030).nullable().optional(),
      motsCles: z.array(z.string()).optional(),
      matieres: z.array(z.nativeEnum(Matiere)).optional(),
      niveaux: z.array(z.nativeEnum(NiveauScolaire)).optional(),
      actif: z.boolean().optional(),
      province: z.nativeEnum(Province).optional(),
      matiereLibre: z.string().max(100).nullable().optional(),
      niveauLibre: z.string().max(100).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.documentPedagogique.update({ where: { id }, data });
    }),

  // ── Supprimer un document pédagogique ────────────────────────────────────
  supprimerDocument: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.documentPedagogique.findUnique({ where: { id: input.id }, select: { titre: true, type: true } });
      await ctx.prisma.documentPedagogique.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ── Réinitialiser le mot de passe d'un utilisateur ───────────────────────
  resetUserPassword: superAdminProcedure
    .input(z.object({ userId: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const cible = await ctx.prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, role: true } });
      const hashed = await bcrypt.hash(input.newPassword, 12);
      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { password: hashed },
      });
      await logSecurityEvent({
        action: "MOT_DE_PASSE_REINITIALISE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible?.email,
      });
      return { success: true };
    }),

  // ── Journaux de sécurité ─────────────────────────────────────────────────
  getSecurityLogs: superAdminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(75) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.securityLog.findMany({
        where: { severity: { in: ["CRITICAL", "WARNING"] } },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 75,
        select: {
          id: true,
          createdAt: true,
          action: true,
          severity: true,
          userId: true,
          userEmail: true,
          userRole: true,
          cibleId: true,
          cibleEmail: true,
          ip: true,
          details: true,
        },
      });
    }),

  exportSecurityLogs: superAdminProcedure
    .input(z.object({
      severity: z.enum(["ALL", "CRITICAL", "WARNING", "INFO"]).default("ALL"),
      depuis: z.string().datetime().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input?.severity && input.severity !== "ALL"
          ? { severity: input.severity as never }
          : {}),
        ...(input?.depuis ? { createdAt: { gte: new Date(input.depuis) } } : {}),
      };
      return ctx.prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: {
          id: true,
          createdAt: true,
          action: true,
          severity: true,
          userEmail: true,
          userRole: true,
          cibleEmail: true,
          ip: true,
          details: true,
        },
      });
    }),

  // ── Suivi des coûts API ───────────────────────────────────────────────────
  getApiCouts: superAdminProcedure.query(async ({ ctx }) => {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const debut30j = new Date(maintenant.getTime() - 30 * 24 * 3600 * 1000);

    // Agrégats globaux du mois en cours
    const [totalMois, parService, par30Jours] = await Promise.all([
      ctx.prisma.apiUsageLog.aggregate({
        where: { createdAt: { gte: debutMois } },
        _sum: { coutUSD: true, inputTokens: true, outputTokens: true, characters: true, emails: true },
        _count: true,
      }),

      // Par service ce mois-ci
      ctx.prisma.apiUsageLog.groupBy({
        by: ["service"],
        where: { createdAt: { gte: debutMois } },
        _sum: { coutUSD: true, inputTokens: true, outputTokens: true, characters: true, audioSecs: true, emails: true },
        _count: true,
        orderBy: { _sum: { coutUSD: "desc" } },
      }),

      // Coût par jour sur 30 jours (pour le graphique)
      ctx.prisma.$queryRaw<{ jour: Date; cout: number }[]>`
        SELECT
          DATE_TRUNC('day', "createdAt") AS jour,
          SUM("coutUSD") AS cout
        FROM api_usage_logs
        WHERE "createdAt" >= ${debut30j}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY jour ASC
      `,
    ]);

    // Calcul totaux de toujours
    const totalGeneral = await ctx.prisma.apiUsageLog.aggregate({
      _sum: { coutUSD: true },
      _count: true,
    });

    return {
      totalMoisUSD: totalMois._sum.coutUSD ?? 0,
      totalGeneralUSD: totalGeneral._sum.coutUSD ?? 0,
      totalAppels: totalGeneral._count,
      parService: parService.map((s) => ({
        service: s.service,
        appels: s._count,
        coutUSD: s._sum.coutUSD ?? 0,
        inputTokens: s._sum.inputTokens ?? 0,
        outputTokens: s._sum.outputTokens ?? 0,
        characters: s._sum.characters ?? 0,
        audioSecs: s._sum.audioSecs ?? 0,
        emails: s._sum.emails ?? 0,
      })),
      par30Jours: par30Jours.map((d) => ({
        jour: d.jour.toISOString().split("T")[0],
        coutUSD: Number(d.cout),
      })),
    };
  }),

  // ── Suspendre un compte ───────────────────────────────────────────────────
  suspendreCompte: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      raison: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new Error("Vous ne pouvez pas suspendre votre propre compte.");
      const cible = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          email: true,
          name: true,
          role: true,
          suspended: true,
          profilEleve: {
            select: {
              prenom: true,
              nom: true,
              parents: { select: { user: { select: { email: true } } }, take: 1 },
            },
          },
        },
      });
      if (!cible) throw new Error("Utilisateur introuvable.");
      if (cible.suspended) throw new Error("Ce compte est déjà suspendu.");
      if (["ADMIN", "SUPER_ADMIN"].includes(cible.role)) throw new Error("Impossible de suspendre un compte admin.");

      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { suspended: true, suspendedAt: new Date(), suspendedRaison: input.raison ?? null },
      });

      await logSecurityEvent({
        action: "COMPTE_SUSPENDU",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible.email,
        details: { raison: input.raison },
      });

      // Pour les élèves : email interne (@edureussite.internal) → notifier le parent
      if (cible.role === "ELEVE") {
        const parentEmail = cible.profilEleve?.parents[0]?.user?.email;
        const prenomEleve = cible.profilEleve?.prenom ?? cible.name ?? "votre enfant";
        if (parentEmail) {
          sendSuspensionEmail({
            userEmail: parentEmail,
            userName: `${prenomEleve} (votre enfant)`,
            raison: input.raison,
          }).catch((e) => console.error("[suspension email parent]", e));
        }
      } else if (cible.email && !cible.email.endsWith("@edureussite.internal") && cible.name) {
        sendSuspensionEmail({ userEmail: cible.email, userName: cible.name, raison: input.raison })
          .catch((e) => console.error("[suspension email]", e));
      }

      return { success: true };
    }),

  // ── Réactiver un compte ───────────────────────────────────────────────────
  reactiverCompte: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      forcerResetMdp: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const cible = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          email: true,
          name: true,
          role: true,
          suspended: true,
          profilEleve: {
            select: {
              prenom: true,
              parents: { select: { user: { select: { email: true } } }, take: 1 },
            },
          },
        },
      });
      if (!cible) throw new Error("Utilisateur introuvable.");
      if (!cible.suspended) throw new Error("Ce compte n'est pas suspendu.");

      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          suspended: false,
          suspendedAt: null,
          suspendedRaison: null,
          forcePasswordReset: input.forcerResetMdp,
        },
      });

      await logSecurityEvent({
        action: "COMPTE_REACTIVE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible.email,
        details: { forcerResetMdp: input.forcerResetMdp },
      });

      // Pour les élèves : notifier le parent
      if (cible.role === "ELEVE") {
        const parentEmail = cible.profilEleve?.parents[0]?.user?.email;
        const prenomEleve = cible.profilEleve?.prenom ?? cible.name ?? "votre enfant";
        if (parentEmail) {
          sendReactivationEmail({
            userEmail: parentEmail,
            userName: `${prenomEleve} (votre enfant)`,
            forcePasswordReset: input.forcerResetMdp,
          }).catch((e) => console.error("[reactivation email parent]", e));
        }
      } else if (cible.email && !cible.email.endsWith("@edureussite.internal") && cible.name) {
        sendReactivationEmail({ userEmail: cible.email, userName: cible.name, forcePasswordReset: input.forcerResetMdp })
          .catch((e) => console.error("[reactivation email]", e));
      }

      return { success: true };
    }),

  // ── Forcer la réinitialisation du mot de passe ────────────────────────────
  forcerResetMdp: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) throw new Error("Vous ne pouvez pas forcer la réinitialisation de votre propre compte.");
      const cible = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true, role: true },
      });
      if (!cible) throw new Error("Utilisateur introuvable.");

      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { forcePasswordReset: true },
      });

      await logSecurityEvent({
        action: "RESET_MDP_FORCE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible.email,
      });

      return { success: true };
    }),

  // ── Envoyer une alerte de sécurité ────────────────────────────────────────
  envoyerAlerteSecurite: superAdminProcedure
    .input(z.object({
      userId: z.string(),
      message: z.string().min(10).max(1000),
    }))
    .mutation(async ({ ctx, input }) => {
      const cible = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true, name: true },
      });
      if (!cible?.email || !cible?.name) throw new Error("Utilisateur introuvable.");

      await sendAlerteSecuriteEmail({ userEmail: cible.email, userName: cible.name, message: input.message });

      await logSecurityEvent({
        action: "ALERTE_SECURITE_ENVOYEE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        cibleId: input.userId,
        cibleEmail: cible.email,
        details: { message: input.message.slice(0, 100) },
      });

      return { success: true };
    }),

  // ── Bloquer une IP ────────────────────────────────────────────────────────
  bloquerIP: superAdminProcedure
    .input(z.object({
      ip: z.string().min(1),
      raison: z.string().max(300).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.blockedIp.upsert({
        where: { ip: input.ip },
        update: { raison: input.raison ?? null, blockedBy: ctx.user.id },
        create: { ip: input.ip, raison: input.raison ?? null, blockedBy: ctx.user.id },
      });

      await addBlockedIp(input.ip);

      await logSecurityEvent({
        action: "IP_BLOQUEE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        ip: input.ip,
        details: { raison: input.raison },
      });

      return { success: true };
    }),

  // ── Débloquer une IP ──────────────────────────────────────────────────────
  debloquerIP: superAdminProcedure
    .input(z.object({ ip: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.blockedIp.delete({ where: { ip: input.ip } }).catch(() => {});
      await removeBlockedIp(input.ip);

      await logSecurityEvent({
        action: "IP_DEBLOQUEE",
        userId: ctx.user.id,
        userEmail: ctx.user.email,
        userRole: ctx.user.role,
        ip: input.ip,
      });

      return { success: true };
    }),

  // ── Comptes suspendus ─────────────────────────────────────────────────────
  getComptesSuspendus: superAdminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      where: { suspended: true },
      select: { id: true, email: true, name: true, role: true, suspendedAt: true, suspendedRaison: true },
      orderBy: { suspendedAt: "desc" },
    });
  }),

  // ── IPs bloquées ──────────────────────────────────────────────────────────
  getIPsBloquees: superAdminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.blockedIp.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Quota Mira IA ────────────────────────────────────────────────────────
  getMiraQuotaEleve: superAdminProcedure
    .input(z.object({ eleveId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { id: input.eleveId },
        select: { miraSecsUsedWeek: true, miraWeekOf: true, miraSecsBonus: true, prenom: true },
      });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });
      const weekKey = getMondayKey();
      const secsUsed = profil.miraWeekOf === weekKey ? profil.miraSecsUsedWeek : 0;
      return {
        prenom: profil.prenom,
        secsUsed,
        secsMax: 30 * 60 + profil.miraSecsBonus,
        bonusMinutes: Math.round(profil.miraSecsBonus / 60),
      };
    }),

  setMiraBonus: superAdminProcedure
    .input(z.object({
      eleveId: z.string(),
      bonusMinutes: z.number().int().min(0).max(480),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.profilEleve.update({
        where: { id: input.eleveId },
        data: { miraSecsBonus: input.bonusMinutes * 60 },
      });
      return { success: true };
    }),

  getSttProvider: superAdminProcedure.query(async ({ ctx }) => {
    const param = await ctx.prisma.parametreApp.findUnique({ where: { cle: "config_stt_provider" } });
    return { provider: (param?.valeur === "DEEPGRAM" ? "DEEPGRAM" : "ELEVENLABS") as "ELEVENLABS" | "DEEPGRAM" };
  }),

  setSttProvider: superAdminProcedure
    .input(z.object({ provider: z.enum(["ELEVENLABS", "DEEPGRAM"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.parametreApp.upsert({
        where: { cle: "config_stt_provider" },
        create: { cle: "config_stt_provider", valeur: input.provider },
        update: { valeur: input.provider },
      });
      return { success: true };
    }),

  getTtsProvider: superAdminProcedure.query(async ({ ctx }) => {
    const param = await ctx.prisma.parametreApp.findUnique({ where: { cle: "config_tts_provider" } });
    const v = param?.valeur;
    return {
      provider: (v === "OPENAI" ? "OPENAI" : v === "EDUREUSSITE_RUNPOD" ? "EDUREUSSITE_RUNPOD" : v === "EDGE_GRATUIT" ? "EDGE_GRATUIT" : v === "FISH_AUDIO" ? "FISH_AUDIO" : "ELEVENLABS") as "ELEVENLABS" | "OPENAI" | "EDUREUSSITE_RUNPOD" | "EDGE_GRATUIT" | "FISH_AUDIO",
    };
  }),

  setTtsProvider: superAdminProcedure
    .input(z.object({ provider: z.enum(["ELEVENLABS", "OPENAI", "EDUREUSSITE_RUNPOD", "EDGE_GRATUIT", "FISH_AUDIO"]) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.parametreApp.upsert({
        where: { cle: "config_tts_provider" },
        create: { cle: "config_tts_provider", valeur: input.provider },
        update: { valeur: input.provider },
      });
      return { success: true };
    }),

  // ── Feature flags & expansion pan-canadienne ─────────────────────────────
  // Clés DB :
  //   feature:multi_province        → "true" | "false"
  //   feature:province_active:{P}   → "true" | "false"  (ex: ON, BC, AB…)

  getProvinceFlags: adminProcedure.query(async ({ ctx }) => {
    const params = await ctx.prisma.parametreApp.findMany({
      where: { cle: { startsWith: "feature:" } },
    });
    const flags: Record<string, string> = {};
    for (const p of params) flags[p.cle] = p.valeur;

    const multiProvince = flags["feature:multi_province"] === "true";

    const provincesActives: Record<string, boolean> = {};
    for (const code of Object.values(Province)) {
      const key = `feature:province_active:${code}`;
      // QC toujours actif, les autres selon le flag
      provincesActives[code] = code === "QC" ? true : (flags[key] === "true");
    }

    return { multiProvince, provincesActives };
  }),

  setMultiProvince: superAdminProcedure
    .input(z.object({ actif: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.parametreApp.upsert({
        where: { cle: "feature:multi_province" },
        create: { cle: "feature:multi_province", valeur: String(input.actif) },
        update: { valeur: String(input.actif) },
      });
      return { success: true };
    }),

  setProvinceActive: superAdminProcedure
    .input(z.object({
      province: z.nativeEnum(Province),
      actif: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.province === "QC") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La province QC ne peut pas être désactivée." });
      }
      const cle = `feature:province_active:${input.province}`;
      await ctx.prisma.parametreApp.upsert({
        where: { cle },
        create: { cle, valeur: String(input.actif) },
        update: { valeur: String(input.actif) },
      });
      return { success: true };
    }),

  // ── Suivi budgétaire des APIs ─────────────────────────────────────────────
  // Clé DB : api_budget:{nom} → JSON { montantUSD, datePaiement, creditsTotal? }
  // Quand creditsTotal est défini (ex: ElevenLabs 500 000 crédits) :
  //   consomme = (chars_TTS / creditsTotal) × montantUSD  ← calcul exact par crédits
  // Sinon : consomme = sum(coutUSD) des logs (fallback estimation par taux)

  getApiBudgets: adminProcedure.query(async ({ ctx }) => {
    // services[] + creditsService = service dont on lit les `characters` pour calcul crédits
    const GROUPES: Record<string, { services: string[]; creditsService?: string }> = {
      ElevenLabs: { services: ["ELEVENLABS_TTS", "ELEVENLABS_STT"], creditsService: "ELEVENLABS_TTS" },
      Anthropic:  { services: ["CLAUDE_MIRA", "CLAUDE_EXERCICE", "CLAUDE_DOCUMENT", "CLAUDE_ANALYSE"] },
      Deepgram:   { services: ["DEEPGRAM_STT", "DEEPGRAM_TTS"] },
      OpenAI:     { services: ["OPENAI_TTS"] },
      Resend:     { services: ["RESEND"] },
    };

    // Lire les budgets configurés
    const params = await ctx.prisma.parametreApp.findMany({
      where: { cle: { startsWith: "api_budget:" } },
    });
    const budgetMap: Record<string, { montantUSD: number; datePaiement: string; creditsTotal?: number }> = {};
    for (const p of params) {
      const nom = p.cle.replace("api_budget:", "");
      try { budgetMap[nom] = JSON.parse(p.valeur); } catch { /* skip */ }
    }

    // Compter les élèves actifs (au moins 1 session)
    const elevesActifs = await ctx.prisma.profilEleve.count({
      where: { sessions: { some: {} } },
    });

    const now = new Date();
    const resultats = await Promise.all(
      Object.entries(GROUPES).map(async ([nom, groupe]) => {
        const budget = budgetMap[nom];
        const datePaiement = budget ? new Date(budget.datePaiement) : null;
        const montantUSD = budget?.montantUSD ?? null;
        const creditsTotal = budget?.creditsTotal ?? null;

        const whereDate = datePaiement ? { gte: datePaiement } : { gte: new Date(0) };

        let consomme: number;
        let creditsUtilises: number | null = null;

        if (creditsTotal && montantUSD && groupe.creditsService) {
          // ── Calcul basé sur les crédits : exact, indépendant du taux estimé ──
          // TTS : (crédits consommés / crédits total) × montant payé
          const ttsAgg = await ctx.prisma.apiUsageLog.aggregate({
            where: { service: groupe.creditsService as never, createdAt: whereDate },
            _sum: { characters: true },
          });
          const ttsChars = ttsAgg._sum.characters ?? 0;
          creditsUtilises = ttsChars;
          const ttsCost = (ttsChars / creditsTotal) * montantUSD;

          // Services hors-crédits du même groupe (ex: STT facturé séparément)
          const autresServices = groupe.services.filter((s) => s !== groupe.creditsService);
          let autresCout = 0;
          if (autresServices.length > 0) {
            const autresAgg = await ctx.prisma.apiUsageLog.aggregate({
              where: { service: { in: autresServices as never[] }, createdAt: whereDate },
              _sum: { coutUSD: true },
            });
            autresCout = autresAgg._sum.coutUSD ?? 0;
          }
          consomme = ttsCost + autresCout;
        } else {
          // ── Calcul par somme des coûts estimés (comportement original) ──
          const agg = await ctx.prisma.apiUsageLog.aggregate({
            where: { service: { in: groupe.services as never[] }, createdAt: whereDate },
            _sum: { coutUSD: true },
          });
          consomme = agg._sum.coutUSD ?? 0;
        }

        const coutParEleve = elevesActifs > 0 ? consomme / elevesActifs : 0;

        let joursRestants: number | null = null;
        let dateEpuisement: string | null = null;
        let moyenneParJour: number | null = null;

        if (datePaiement && montantUSD !== null) {
          const joursDepuisPaiement = Math.max(1,
            (now.getTime() - datePaiement.getTime()) / (1000 * 60 * 60 * 24)
          );
          moyenneParJour = consomme / joursDepuisPaiement;
          const restant = montantUSD - consomme;

          if (moyenneParJour > 0 && restant > 0) {
            joursRestants = restant / moyenneParJour;
            const epuisement = new Date(now.getTime() + joursRestants * 24 * 60 * 60 * 1000);
            dateEpuisement = epuisement.toISOString();
          } else if (restant <= 0) {
            joursRestants = 0;
          }
        }

        return {
          nom,
          montantUSD,
          datePaiement: datePaiement?.toISOString() ?? null,
          creditsTotal,
          creditsUtilises,
          consommeUSD: Math.round(consomme * 100) / 100,
          moyenneParJourUSD: moyenneParJour !== null ? Math.round(moyenneParJour * 10000) / 10000 : null,
          joursRestants: joursRestants !== null ? Math.round(joursRestants * 10) / 10 : null,
          dateEpuisement,
          coutParEleveUSD: Math.round(coutParEleve * 10000) / 10000,
        };
      })
    );

    return { resultats, elevesActifs };
  }),

  setApiBudget: adminProcedure
    .input(z.object({
      nom: z.string().min(1).max(50),
      montantUSD: z.number().positive(),
      datePaiement: z.string().datetime(),
      creditsTotal: z.number().positive().optional(), // ex: 500000 pour ElevenLabs Indie
    }))
    .mutation(async ({ ctx, input }) => {
      const cle = `api_budget:${input.nom}`;
      const valeur = JSON.stringify({
        montantUSD: input.montantUSD,
        datePaiement: input.datePaiement,
        ...(input.creditsTotal ? { creditsTotal: input.creditsTotal } : {}),
      });
      await ctx.prisma.parametreApp.upsert({
        where: { cle },
        create: { cle, valeur },
        update: { valeur },
      });
      // Réinitialiser les alertes déjà envoyées pour ce budget
      await ctx.prisma.parametreApp.deleteMany({
        where: { cle: { startsWith: `api_alert:${input.nom}:` } },
      });
      return { success: true };
    }),
});
