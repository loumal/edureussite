import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc/init";
import { TOUS_LES_ITEMS, parseCosmetiques, COSMETIQUES_DEFAUT } from "@/lib/boutique/items";
import { getJeuById } from "@/lib/jeux/catalog";
import { checkAndTriggerEvaluation } from "@/lib/evaluation/trigger";
import { anthropic } from "@/lib/ai/client";

// Retourne la date du lundi de la semaine courante (YYYY-MM-DD) — clé de reset hebdo
function getMondayKey(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dimanche
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

// Retourne minuit heure de Montréal en UTC — pour les comparaisons Prisma
function debutJourMontreal(): Date {
  const dateStrMontreal = new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  // "en-CA" donne YYYY-MM-DD — on crée minuit heure locale Montréal
  const [y, m, d] = dateStrMontreal.split("-").map(Number);
  // UTC offset de Montréal : EDT = -4h, EST = -5h
  const sondage = new Date(Date.UTC(y, m - 1, d, 5, 0, 0)); // tente minuit UTC-5
  const check = sondage.toLocaleDateString("en-CA", { timeZone: "America/Toronto" });
  const [cy, cm, cd] = check.split("-").map(Number);
  if (cy === y && cm === m && cd === d) return sondage;
  // EDT : UTC-4
  return new Date(Date.UTC(y, m - 1, d, 4, 0, 0));
}
import { z } from "zod";
import { Matiere, NiveauDifficulte, NiveauScolaire, StyleApprentissage, TypeCommentaireEleve } from "@/generated/prisma";
import { genererPlanAction } from "@/lib/ai/plan";
import { TRPCError } from "@trpc/server";

// ── Constantes partagées module Lecture ───────────────────────────────────────
const MOTS_PAR_NIVEAU: Partial<Record<NiveauScolaire, number>> = {
  PRIMAIRE_1: 110, PRIMAIRE_2: 150, PRIMAIRE_3: 200,
  PRIMAIRE_4: 260, PRIMAIRE_5: 320, PRIMAIRE_6: 380,
  SECONDAIRE_1: 430, SECONDAIRE_2: 480, SECONDAIRE_3: 530,
  SECONDAIRE_4: 580, SECONDAIRE_5: 620, SECONDAIRE_6: 650, SECONDAIRE_7: 680,
};
const NIVEAU_LABEL: Partial<Record<NiveauScolaire, string>> = {
  PRIMAIRE_1: "1re année primaire (6 ans)", PRIMAIRE_2: "2e année primaire",
  PRIMAIRE_3: "3e année primaire", PRIMAIRE_4: "4e année primaire",
  PRIMAIRE_5: "5e année primaire", PRIMAIRE_6: "6e année primaire",
  SECONDAIRE_1: "1re secondaire", SECONDAIRE_2: "2e secondaire",
  SECONDAIRE_3: "3e secondaire", SECONDAIRE_4: "4e secondaire",
  SECONDAIRE_5: "5e secondaire", SECONDAIRE_6: "6e secondaire", SECONDAIRE_7: "Terminale",
};

// Appel Claude avec retry exponentiel sur 429/529 (rate limit).
// Protège contre les pics de charge partagée sur l'API Anthropic.
async function claudeAvecRetry(
  params: Parameters<typeof anthropic.messages.create>[0],
  maxRetries = 3
): Promise<{ content: Array<{ type: string; text?: string }> }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (anthropic.messages.create(params) as Promise<any>);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const isRateLimit = status === 429 || status === 529 || status === 503;
      if (attempt === maxRetries || !isRateLimit) throw err;
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 16000); // 1s → 2s → 4s → 8s
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("claude: max retries exceeded");
}

// Extrait un JSON valide d'une réponse Claude (gère les blocs markdown).
function parseJsonClaude<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()) as T;
  } catch {
    return fallback;
  }
}

export const eleveRouter = createTRPCRouter({
  // Récupérer le profil complet de l'élève connecté
  getProfil: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: {
        niveauxMatieres: true,
        planActions: {
          where: { statut: "ACTIF" },
          include: { objectifs: true },
          take: 1,
        },
        badges: { include: { badge: true } },
        checkIns: { orderBy: { date: "desc" }, take: 7 },
        exercicesAssignes: {
          where: { statut: { in: ["NON_COMMENCE", "EN_COURS"] } },
          include: { exercice: true },
          take: 5,
        },
      },
    });
    return profil;
  }),

  // Mettre à jour l'étape d'onboarding
  updateOnboardingEtape: protectedProcedure
    .input(z.object({ etape: z.number().min(0).max(10) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.profilEleve.update({
        where: { userId: ctx.user.id },
        data: { onboardingEtape: input.etape },
      });
    }),

  // Terminer l'onboarding avec toutes les données de profil
  completerOnboarding: protectedProcedure
    .input(
      z.object({
        prenom: z.string().min(1),
        nom: z.string().optional().default(""),
        niveauScolaire: z.nativeEnum(NiveauScolaire),
        ecole: z.string().optional(),
        dateRentree: z.string().optional(), // YYYY-MM-DD
        styleApprentissage: z.nativeEnum(StyleApprentissage).optional(),
        matieresPreferees: z.array(z.nativeEnum(Matiere)).optional(),
        matieresRedoutees: z.array(z.nativeEnum(Matiere)).optional(),
        tdah: z.boolean().optional(),
        dyslexie: z.boolean().optional(),
        anxieteScolaire: z.boolean().optional(),
        // Univers personnel
        centresInteret: z.array(z.string()).optional(),
        sportFavori: z.string().optional(),
        universMediatique: z.string().optional(),
        autresPassions: z.string().optional(),
        environnement: z.string().optional(),
        personnalite: z.array(z.string()).optional(),
        objectifScolaire: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Mode pré-rentrée si la date de rentrée est dans le futur
      const dateRentreeDate = input.dateRentree ? new Date(input.dateRentree) : null;
      const modePreRentree = dateRentreeDate ? dateRentreeDate > new Date() : false;

      const profileData = {
        prenom: input.prenom,
        nom: input.nom,
        niveauScolaire: input.niveauScolaire,
        ecole: input.ecole,
        dateRentree: dateRentreeDate,
        modePreRentree,
        styleApprentissage: input.styleApprentissage,
        matieresPreferees: input.matieresPreferees ?? [],
        matieresRedoutees: input.matieresRedoutees ?? [],
        tdah: input.tdah ?? false,
        dyslexie: input.dyslexie ?? false,
        anxieteScolaire: input.anxieteScolaire ?? false,
        centresInteret: input.centresInteret ?? [],
        sportFavori: input.sportFavori,
        universMediatique: input.universMediatique,
        autresPassions: input.autresPassions,
        environnement: input.environnement,
        personnalite: input.personnalite ?? [],
        objectifScolaire: input.objectifScolaire,
        onboardingComplete: true,
        onboardingEtape: 5,
      };

      return ctx.prisma.profilEleve.upsert({
        where: { userId: ctx.user.id },
        create: { userId: ctx.user.id, ...profileData },
        update: profileData,
      });
    }),

  // Enregistrer un check-in émotionnel
  checkinEmotionnel: protectedProcedure
    .input(
      z.object({
        etat: z.enum([
          "TRES_BIEN",
          "BIEN",
          "CORRECT",
          "FATIGUE",
          "STRESSE",
          "TRISTE",
        ]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      // Vérifier si 3 check-ins négatifs consécutifs
      const recents = await ctx.prisma.checkInEmotionnel.findMany({
        where: { eleveId: profil.id },
        orderBy: { date: "desc" },
        take: 3,
      });
      const etatsNegatifs = ["STRESSE", "TRISTE", "FATIGUE"];
      const modeDoux =
        recents.length >= 2 &&
        recents.every((c: { etat: string }) => etatsNegatifs.includes(c.etat)) &&
        etatsNegatifs.includes(input.etat);

      return ctx.prisma.checkInEmotionnel.create({
        data: {
          eleveId: profil.id,
          etat: input.etat,
          note: input.note,
          modeDoux,
        },
      });
    }),

  // Tableau de bord — données agrégées
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    // Date de début de l'année scolaire courante = date du dernier passage de niveau
    const dernierPassage = await ctx.prisma.historiqueNiveauEleve.findFirst({
      where: { eleve: { userId: ctx.user.id } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const debutAnneeScolaire = dernierPassage?.createdAt;

    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: { select: { province: true } },
        niveauxMatieres: true,
        badges: { include: { badge: true } },
        exercicesAssignes: {
          where: {
            statut: { in: ["NON_COMMENCE", "EN_COURS"] },
            ...(debutAnneeScolaire ? { dateAssignation: { gte: debutAnneeScolaire } } : {}),
          },
          include: { exercice: true },
          orderBy: { dateAssignation: "desc" },
          take: 5,
        },
        checkIns: { orderBy: { date: "desc" }, take: 1 },
        sessions: {
          where: debutAnneeScolaire ? { dateSession: { gte: debutAnneeScolaire } } : {},
          orderBy: { dateSession: "desc" },
          take: 7,
        },
        coursRemediation: {
          where: debutAnneeScolaire ? { createdAt: { gte: debutAnneeScolaire } } : {},
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!profil) return { profil: null, totalExercices: 0, aFaitExerciceAujourdhui: false };

    const debutJour = debutJourMontreal();

    const [totalExercices, exerciceAujourdhui] = await Promise.all([
      ctx.prisma.exerciceAssigne.count({
        where: {
          eleveId: profil.id,
          statut: "TERMINE",
          ...(debutAnneeScolaire ? { dateFin: { gte: debutAnneeScolaire } } : {}),
        },
      }),
      ctx.prisma.exerciceAssigne.count({
        where: { eleveId: profil.id, statut: "TERMINE", dateFin: { gte: debutJour } },
      }),
    ]);

    return { profil, totalExercices, aFaitExerciceAujourdhui: exerciceAujourdhui > 0 };
  }),

  // Générer le plan d'action initial (appelé après l'onboarding)
  genererPlan: protectedProcedure.mutation(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
    });

    // Ne pas regénérer si un plan actif existe déjà
    const planExistant = await ctx.prisma.planAction.findFirst({
      where: { eleveId: profil.id, statut: "ACTIF" },
    });
    if (planExistant) return planExistant;

    // Générer via Claude
    const planIA = await genererPlanAction({
      prenom: profil.prenom,
      niveauScolaire: profil.niveauScolaire,
      styleApprentissage: profil.styleApprentissage,
      matieresRedoutees: profil.matieresRedoutees as Matiere[],
      matieresPreferees: profil.matieresPreferees as Matiere[],
      tdah: profil.tdah,
      dyslexie: profil.dyslexie,
      anxieteScolaire: profil.anxieteScolaire,
    });

    // Calculer les dates d'échéance
    const maintenant = new Date();

    const plan = await ctx.prisma.planAction.create({
      data: {
        eleveId: profil.id,
        titre: planIA.titre,
        description: planIA.description,
        statut: "ACTIF",
        genereParIA: true,
        objectifs: {
          create: planIA.objectifs.map((obj) => ({
            titre: obj.titre,
            description: obj.description,
            matiere: obj.matiere as Matiere,
            competencePFEQ: obj.competencePFEQ,
            dateEcheance: new Date(
              maintenant.getTime() + obj.dateEcheanceSemaines * 7 * 24 * 60 * 60 * 1000
            ),
            scoreVise: obj.scoreVise,
          })),
        },
      },
      include: { objectifs: true },
    });

    return plan;
  }),

  // Récupérer le plan d'action actif avec objectifs
  getPlan: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    if (!profil) return null;
    return ctx.prisma.planAction.findFirst({
      where: { eleveId: profil.id, statut: "ACTIF" },
      include: { objectifs: { orderBy: { dateEcheance: "asc" } } },
    });
  }),

  // Mettre à jour le streak après une session
  mettreAJourStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true, streakJours: true, streakMaxJours: true, derniereConnexion: true },
    });

    const maintenant = new Date();
    const hier = new Date(maintenant);
    hier.setDate(hier.getDate() - 1);

    let nouveauStreak = profil.streakJours;

    if (!profil.derniereConnexion) {
      nouveauStreak = 1;
    } else {
      const derniere = new Date(profil.derniereConnexion);
      const diffJours = Math.floor(
        (maintenant.getTime() - derniere.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffJours === 0) {
        // Même jour — pas de changement
      } else if (diffJours === 1) {
        nouveauStreak += 1;
      } else {
        nouveauStreak = 1; // Streak cassé
      }
    }

    return ctx.prisma.profilEleve.update({
      where: { id: profil.id },
      data: {
        streakJours: nouveauStreak,
        streakMaxJours: Math.max(nouveauStreak, profil.streakMaxJours),
        derniereConnexion: maintenant,
      },
    });
  }),

  // Ajouter un commentaire de l'élève (difficulté, objectif, question…)
  ajouterCommentaireEleve: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(TypeCommentaireEleve),
        contenu: z.string().min(1).max(2000),
        matieres: z.array(z.nativeEnum(Matiere)).optional().default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      return ctx.prisma.commentaireEleve.create({
        data: {
          eleveId: profil.id,
          type: input.type,
          contenu: input.contenu,
          matieres: input.matieres,
        },
      });
    }),

  // Lister les commentaires de l'élève connecté
  listerCommentairesEleve: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    return ctx.prisma.commentaireEleve.findMany({
      where: { eleveId: profil.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),

  // Supprimer un commentaire de l'élève
  supprimerCommentaireEleve: protectedProcedure
    .input(z.object({ commentaireId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      const commentaire = await ctx.prisma.commentaireEleve.findUniqueOrThrow({
        where: { id: input.commentaireId },
        select: { eleveId: true },
      });
      if (commentaire.eleveId !== profil.id) throw new Error("Accès refusé.");
      await ctx.prisma.commentaireEleve.delete({ where: { id: input.commentaireId } });
      return { success: true };
    }),

  // Pour le parent : lire les commentaires d'un enfant spécifique
  listerCommentairesEleveParParent: protectedProcedure
    .input(z.object({ eleveId: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      // SÉCURITÉ : seul un parent lié à cet élève peut accéder à ses commentaires
      const parent = await ctx.prisma.profilParent.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!parent) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const lien = await ctx.prisma.profilEleve.findFirst({
        where: { id: input.eleveId, parents: { some: { id: parent.id } } },
        select: { id: true },
      });
      if (!lien) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.prisma.commentaireEleve.findMany({
        where: { eleveId: input.eleveId },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
    }),

  // Données complètes pour la page progression
  getProgression: protectedProcedure.query(async ({ ctx }) => {
    const [profil, dernierPassage] = await Promise.all([
      ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: {
          id: true,
          prenom: true,
          streakJours: true,
          streakMaxJours: true,
          niveauxMatieres: { orderBy: { scoreGlobal: "asc" } },
          badges: {
            include: { badge: true },
            orderBy: { date: "desc" },
          },
        },
      }),
      ctx.prisma.historiqueNiveauEleve.findFirst({
        where: { eleve: { userId: ctx.user.id } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const debutAnneeScolaire = dernierPassage?.createdAt;
    const filtreAnnee = debutAnneeScolaire ? { dateFin: { gte: debutAnneeScolaire } } : {};

    const exercicesTermines = await ctx.prisma.exerciceAssigne.findMany({
      where: { eleveId: profil.id, statut: "TERMINE", ...filtreAnnee },
      include: { exercice: { select: { titre: true, matiere: true, difficulte: true } } },
      orderBy: { dateFin: "desc" },
      take: 20,
    });

    const totalExercices = await ctx.prisma.exerciceAssigne.count({
      where: { eleveId: profil.id, statut: "TERMINE", ...filtreAnnee },
    });

    const scores = exercicesTermines.map((e) => e.score ?? 0).filter((s) => s > 0);
    const scoreMoyen = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      profil,
      exercicesTermines,
      totalExercices,
      scoreMoyen: Math.round(scoreMoyen),
    };
  }),

  // Récupérer le profil complet pour les paramètres
  getProfilParametres: protectedProcedure.query(async ({ ctx }) => {
    const [profil, user] = await Promise.all([
      ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        select: {
          prenom: true,
          nom: true,
          niveauScolaire: true,
          anneeScolaireActive: true,
          ecole: true,
          styleApprentissage: true,
          matieresPreferees: true,
          matieresRedoutees: true,
          tdah: true,
          dyslexie: true,
          anxieteScolaire: true,
          centresInteret: true,
          sportFavori: true,
          universMediatique: true,
          autresPassions: true,
          environnement: true,
          personnalite: true,
          objectifScolaire: true,
          dateNaissance: true,
          historiqueNiveaux: {
            orderBy: { createdAt: "desc" },
            select: { niveauScolaire: true, anneeScolaire: true, createdAt: true },
          },
        },
      }),
      ctx.prisma.user.findUnique({ where: { id: ctx.user.id }, select: { province: true } }),
    ]);
    if (!profil) return null;
    return { ...profil, province: user?.province ?? "QC" };
  }),

  // Mettre à jour le profil depuis les paramètres (sections indépendantes)
  mettreAJourProfil: protectedProcedure
    .input(
      z.object({
        prenom: z.string().min(1).optional(),
        nom: z.string().optional(),
        niveauScolaire: z.nativeEnum(NiveauScolaire).optional(),
        ecole: z.string().optional(),
        styleApprentissage: z.nativeEnum(StyleApprentissage).optional(),
        matieresPreferees: z.array(z.nativeEnum(Matiere)).optional(),
        matieresRedoutees: z.array(z.nativeEnum(Matiere)).optional(),
        tdah: z.boolean().optional(),
        dyslexie: z.boolean().optional(),
        anxieteScolaire: z.boolean().optional(),
        centresInteret: z.array(z.string()).optional(),
        sportFavori: z.string().optional(),
        universMediatique: z.string().optional(),
        autresPassions: z.string().optional(),
        environnement: z.string().optional(),
        personnalite: z.array(z.string()).optional(),
        objectifScolaire: z.string().optional(),
        dateNaissance: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dateNaissance, ...rest } = input;
      return ctx.prisma.profilEleve.update({
        where: { userId: ctx.user.id },
        data: {
          ...rest,
          ...(dateNaissance !== undefined ? { dateNaissance: dateNaissance ? new Date(dateNaissance) : null } : {}),
        },
      });
    }),

  // ─── Tracking de session ────────────────────────────────────────────────────
  demarrerSession: protectedProcedure.mutation(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    const debutJour = debutJourMontreal();

    // Fenêtre de déduplication : si une session existe déjà dans les 30 dernières
    // minutes, on la réutilise — évite les doublons sur rechargement de page.
    const il_y_a_30min = new Date(Date.now() - 30 * 60 * 1000);
    const sessionRecente = await ctx.prisma.sessionPratique.findFirst({
      where: { eleveId: profil.id, dateSession: { gte: il_y_a_30min } },
      orderBy: { dateSession: "desc" },
      select: { id: true },
    });

    if (sessionRecente) {
      // Session déjà active : on retourne son ID sans créer de doublon
      return { sessionId: sessionRecente.id, bonusConnexion: false, bonusXP: 0 };
    }

    // Bonus de connexion quotidien : +10 XP à la 1re vraie session du jour
    const sessionAujourdhui = await ctx.prisma.sessionPratique.findFirst({
      where: { eleveId: profil.id, dateSession: { gte: debutJour } },
      select: { id: true },
    });

    const bonusConnexion = !sessionAujourdhui;
    if (bonusConnexion) {
      await ctx.prisma.profilEleve.update({
        where: { id: profil.id },
        data: { totalPoints: { increment: 10 } },
      });
    }

    const session = await ctx.prisma.sessionPratique.create({
      data: { eleveId: profil.id },
    });

    return { sessionId: session.id, bonusConnexion, bonusXP: bonusConnexion ? 10 : 0 };
  }),

  // ── Quota Mira ─────────────────────────────────────────────────────────────
  getMiraQuota: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      select: { miraSecsUsedWeek: true, miraWeekOf: true, miraSecsBonus: true },
    });
    if (!profil) return { secsUsed: 0, secsMax: 30 * 60 };
    const weekKey = getMondayKey();
    const secsUsed = profil.miraWeekOf === weekKey ? profil.miraSecsUsedWeek : 0;
    return { secsUsed, secsMax: 30 * 60 + profil.miraSecsBonus };
  }),

  saveMiraUsage: protectedProcedure
    .input(z.object({ secs: z.number().int().min(0).max(7200) }))
    .mutation(async ({ ctx, input }) => {
      if (input.secs === 0) return;
      const weekKey = getMondayKey();
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        select: { miraSecsUsedWeek: true, miraWeekOf: true },
      });
      if (!profil) return;
      const currentUsed = profil.miraWeekOf === weekKey ? profil.miraSecsUsedWeek : 0;
      await ctx.prisma.profilEleve.update({
        where: { userId: ctx.user.id },
        data: { miraSecsUsedWeek: currentUsed + input.secs, miraWeekOf: weekKey },
      });
    }),

  // ── Mira — aide libre (mémoire persistante) ─────────────────────────────
  getMiraLibreContext: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        prenom: true,
        niveauScolaire: true,
        styleApprentissage: true,
        centresInteret: true,
        sportFavori: true,
        universMediatique: true,
        personnalite: true,
        tdah: true,
        dyslexie: true,
        dyscalculie: true,
        anxieteScolaire: true,
        miraSecsUsedWeek: true,
        miraWeekOf: true,
        miraSecsBonus: true,
      },
    });
    if (!profil) return null;

    const NIVEAU_LABEL: Record<string, string> = {
      PRIMAIRE_1: "1re année du primaire", PRIMAIRE_2: "2e année du primaire",
      PRIMAIRE_3: "3e année du primaire", PRIMAIRE_4: "4e année du primaire",
      PRIMAIRE_5: "5e année du primaire", PRIMAIRE_6: "6e année du primaire",
      SECONDAIRE_1: "Secondaire 1", SECONDAIRE_2: "Secondaire 2",
      SECONDAIRE_3: "Secondaire 3", SECONDAIRE_4: "Secondaire 4",
      SECONDAIRE_5: "Secondaire 5",
    };

    const MATIERE_LABEL: Record<string, string> = {
      MATHEMATIQUES: "Mathématiques", FRANCAIS: "Français", SCIENCES: "Sciences",
      HISTOIRE: "Histoire", GEOGRAPHIE: "Géographie", ANGLAIS: "Anglais",
      ART: "Arts", EDUCATION_PHYSIQUE: "Éducation physique", INFORMATIQUE: "Informatique",
      ETHIQUE: "Éthique", AUTRE: "Autre",
    };

    const extras: string[] = [];
    if (profil.styleApprentissage) extras.push(`Style d'apprentissage : ${profil.styleApprentissage}`);
    if (profil.centresInteret.length) extras.push(`Centres d'intérêt : ${profil.centresInteret.join(", ")}`);
    if (profil.sportFavori) extras.push(`Sport favori : ${profil.sportFavori}`);
    if (profil.universMediatique) extras.push(`Univers médiatique : ${profil.universMediatique}`);
    if (profil.personnalite.length) extras.push(`Personnalité : ${profil.personnalite.join(", ")}`);
    const besoins = [
      profil.tdah && "TDAH",
      profil.dyslexie && "dyslexie",
      profil.dyscalculie && "dyscalculie",
      profil.anxieteScolaire && "anxiété scolaire",
    ].filter(Boolean);
    if (besoins.length) extras.push(`Besoins particuliers : ${besoins.join(", ")}`);

    const weekKey = getMondayKey();
    const secsUsed = profil.miraWeekOf === weekKey ? profil.miraSecsUsedWeek : 0;

    // ── Diagnostic pédagogique ─────────────────────────────────────────────────
    const [niveauxMatieres, exercicesRecents, notionsUrgentes] = await Promise.all([
      // Scores et lacunes par matière (trié par score croissant = plus faibles en premier)
      ctx.prisma.niveauMatiere.findMany({
        where: { eleveId: profil.id },
        select: { matiere: true, scoreGlobal: true, lacunes: true },
        orderBy: { scoreGlobal: "asc" },
      }),
      // Exercices des 21 derniers jours (terminés)
      ctx.prisma.exerciceAssigne.findMany({
        where: {
          eleveId: profil.id,
          statut: "TERMINE",
          dateFin: { gte: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
        },
        select: {
          score: true,
          feedbackIA: true,
          dateFin: true,
          exercice: { select: { titre: true, matiere: true, competencesPFEQ: true } },
        },
        orderBy: { dateFin: "desc" },
        take: 15,
      }),
      // Notions urgentes / importantes non maîtrisées
      ctx.prisma.planifNotionEleve.findMany({
        where: {
          eleveId: profil.id,
          maitrisee: false,
          priorite: { in: ["URGENT", "IMPORTANT"] },
        },
        select: { notion: true, matiere: true, priorite: true },
        orderBy: [{ priorite: "asc" }, { ordre: "asc" }],
        take: 6,
      }),
    ]);

    // Formater le diagnostic textuel pour le system prompt
    const lignesMatieres = niveauxMatieres
      .filter((n) => n.scoreGlobal < 85 || n.lacunes.length > 0)
      .map((n) => {
        const label = MATIERE_LABEL[n.matiere] ?? n.matiere;
        const score = Math.round(n.scoreGlobal);
        const lacunesStr = n.lacunes.length
          ? `Lacunes : ${n.lacunes.slice(0, 4).join(", ")}`
          : "Aucune lacune précisée";
        return `• ${label} — Score : ${score}/100 — ${lacunesStr}`;
      });

    const lignesExercices = exercicesRecents.map((e) => {
      const label = MATIERE_LABEL[e.exercice.matiere] ?? e.exercice.matiere;
      const scoreStr = e.score != null ? `${Math.round(e.score)}/100` : "non noté";
      const dateStr = e.dateFin ? new Date(e.dateFin).toLocaleDateString("fr-CA") : "";
      const feedback = e.feedbackIA
        ? `\n  Feedback IA : "${e.feedbackIA.slice(0, 120)}${e.feedbackIA.length > 120 ? "…" : ""}"`
        : "";
      const competences = e.exercice.competencesPFEQ?.length
        ? `\n  Compétences visées : ${e.exercice.competencesPFEQ.slice(0, 3).join(", ")}`
        : "";
      return `• "${e.exercice.titre}" (${label}) — ${scoreStr} — ${dateStr}${competences}${feedback}`;
    });

    const lignesNotions = notionsUrgentes.map((n) => {
      const label = MATIERE_LABEL[n.matiere] ?? n.matiere;
      return `• ${n.notion} (${label}) — Priorité : ${n.priorite}`;
    });

    const diagnosticContext = [
      lignesMatieres.length
        ? `PERFORMANCES PAR MATIÈRE :\n${lignesMatieres.join("\n")}`
        : null,
      lignesExercices.length
        ? `EXERCICES RÉCENTS (21 derniers jours) :\n${lignesExercices.join("\n")}`
        : null,
      lignesNotions.length
        ? `NOTIONS PRIORITAIRES DU PLAN :\n${lignesNotions.join("\n")}`
        : null,
    ].filter(Boolean).join("\n\n");

    return {
      prenom: profil.prenom,
      niveauLabel: NIVEAU_LABEL[profil.niveauScolaire] ?? profil.niveauScolaire,
      profilExtra: extras.join(" · ") || undefined,
      diagnosticContext: diagnosticContext || undefined,
      secsUsed,
      secsMax: 30 * 60 + profil.miraSecsBonus,
    };
  }),

  getMiraMessages: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(60).default(40) }).optional())
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!profil) return [];
      return ctx.prisma.miraMessage.findMany({
        where: { eleveId: profil.id },
        orderBy: { createdAt: "asc" },
        take: input?.limit ?? 40,
        select: { id: true, role: true, content: true, createdAt: true },
      });
    }),

  saveMiraMessage: protectedProcedure
    .input(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!profil) return;
      // Garder max 80 messages — purger le plus ancien si dépassé
      const count = await ctx.prisma.miraMessage.count({ where: { eleveId: profil.id } });
      if (count >= 80) {
        const oldest = await ctx.prisma.miraMessage.findFirst({
          where: { eleveId: profil.id },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
        if (oldest) await ctx.prisma.miraMessage.delete({ where: { id: oldest.id } });
      }
      await ctx.prisma.miraMessage.create({
        data: { eleveId: profil.id, role: input.role, content: input.content },
      });
    }),

  mettreAJourSession: protectedProcedure
    .input(z.object({ sessionId: z.string(), dureeSecondes: z.number().int().min(0), exercicesTotal: z.number().int().min(0).optional(), exercicesReussis: z.number().int().min(0).optional() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      await ctx.prisma.sessionPratique.updateMany({
        where: { id: input.sessionId, eleveId: profil.id },
        data: {
          dureeSecondes: input.dureeSecondes,
          ...(input.exercicesTotal !== undefined ? { exercicesTotal: input.exercicesTotal } : {}),
          ...(input.exercicesReussis !== undefined ? { exercicesReussis: input.exercicesReussis } : {}),
        },
      });
      // Fire-and-forget: triage cognitif asynchrone (n'impacte pas la réponse)
      void checkAndTriggerEvaluation(profil.id);
      return { success: true };
    }),

  getBoutique: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { totalPoints: true, cosmetiques: true },
    });
    return {
      totalPoints: profil.totalPoints,
      cosmetiques: parseCosmetiques(profil.cosmetiques),
      items: TOUS_LES_ITEMS,
    };
  }),

  acheterItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = TOUS_LES_ITEMS.find((i) => i.id === input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item introuvable." });

      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, totalPoints: true, cosmetiques: true },
      });

      const cosmetiques = parseCosmetiques(profil.cosmetiques);

      if (cosmetiques.debloquesIds.includes(item.id)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Item déjà débloqué." });
      }
      if (item.prix > profil.totalPoints) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "XP insuffisants." });
      }

      const updated = {
        ...cosmetiques,
        debloquesIds: [...cosmetiques.debloquesIds, item.id],
      };

      await ctx.prisma.profilEleve.update({
        where: { id: profil.id },
        data: {
          totalPoints: profil.totalPoints - item.prix,
          cosmetiques: updated,
        },
      });

      return { success: true, cosmetiques: updated, totalPoints: profil.totalPoints - item.prix };
    }),

  equiperItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = TOUS_LES_ITEMS.find((i) => i.id === input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item introuvable." });

      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, cosmetiques: true },
      });

      const cosmetiques = parseCosmetiques(profil.cosmetiques);

      if (!cosmetiques.debloquesIds.includes(item.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Item non débloqué." });
      }

      const updated = {
        ...cosmetiques,
        ...(item.categorie === "avatar" ? { avatarEquipe: item.id } : { titreEquipe: item.id }),
      };

      await ctx.prisma.profilEleve.update({
        where: { id: profil.id },
        data: { cosmetiques: updated },
      });

      return { success: true, cosmetiques: updated };
    }),

  // ─── Jeux ────────────────────────────────────────────────────────────────────

  demanderJeu: protectedProcedure
    .input(z.object({ jeuId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const jeu = getJeuById(input.jeuId);
      if (!jeu || !jeu.disponible) throw new TRPCError({ code: "NOT_FOUND", message: "Jeu introuvable." });

      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, totalPoints: true, niveauScolaire: true, dateNaissance: true },
      });

      // ── Vérification âge / niveau ───────────────────────────────────────────
      const AGE_PAR_NIVEAU: Record<string, number> = {
        PRIMAIRE_1: 6, PRIMAIRE_2: 7, PRIMAIRE_3: 8, PRIMAIRE_4: 9, PRIMAIRE_5: 10, PRIMAIRE_6: 11,
        SECONDAIRE_1: 12, SECONDAIRE_2: 13, SECONDAIRE_3: 14, SECONDAIRE_4: 15, SECONDAIRE_5: 16,
        SECONDAIRE_6: 17, SECONDAIRE_7: 18,
      };
      const ageApprox = profil.dateNaissance
        ? Math.floor((Date.now() - profil.dateNaissance.getTime()) / (365.25 * 24 * 3600 * 1000))
        : AGE_PAR_NIVEAU[profil.niveauScolaire] ?? 10;

      if (ageApprox < jeu.ageMin) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Ce jeu est recommandé à partir de ${jeu.ageMin} ans. Continue à accumuler des XP sur d'autres jeux !` });
      }
      if (ageApprox > jeu.ageMax) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Ce jeu est conçu pour les moins de ${jeu.ageMax + 1} ans. Explore les jeux plus avancés !` });
      }

      // Reuse active request for same game
      const existing = await ctx.prisma.demandeJeu.findFirst({
        where: { eleveId: profil.id, jeuId: input.jeuId, statut: { in: ["AUTORISE", "EN_COURS"] } },
      });
      if (existing) return { demandeId: existing.id, statut: existing.statut };

      if (profil.totalPoints < jeu.xpCout) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Il te faut ${jeu.xpCout} XP pour jouer. Tu en as ${profil.totalPoints}.` });
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const demande = await ctx.prisma.demandeJeu.create({
        data: {
          eleveId: profil.id,
          jeuId: jeu.id,
          jeuNom: jeu.nom,
          jeuDescription: jeu.description,
          xpCout: jeu.xpCout,
          minutesAccordees: jeu.minutesSession,
          statut: "AUTORISE",
          expiresAt,
        },
      });

      return { demandeId: demande.id, statut: "AUTORISE" as const };
    }),

  getStatutDemande: protectedProcedure
    .input(z.object({ demandeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      const demande = await ctx.prisma.demandeJeu.findFirst({
        where: { id: input.demandeId, eleveId: profil.id },
        select: { statut: true, minutesAccordees: true, jeuId: true, debutPartieAt: true },
      });
      if (!demande) throw new TRPCError({ code: "NOT_FOUND" });
      return demande;
    }),

  demarrerJeu: protectedProcedure
    .input(z.object({ demandeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      const profilComplet = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, totalPoints: true },
      });
      const demande = await ctx.prisma.demandeJeu.findFirst({
        where: { id: input.demandeId, eleveId: profilComplet.id },
        select: { id: true, debutPartieAt: true, statut: true, xpCout: true },
      });
      if (!demande) throw new TRPCError({ code: "NOT_FOUND" });

      // Si déjà démarré, retourner le timestamp original — timer ne repart pas à zéro
      if (demande.debutPartieAt) return { debutPartieAt: demande.debutPartieAt };

      const now = new Date();
      // Déduire les XP au début de la partie (déduction garantie même si le tab est fermé)
      await ctx.prisma.$transaction([
        ctx.prisma.demandeJeu.update({
          where: { id: demande.id },
          data: { debutPartieAt: now, statut: "EN_COURS" },
        }),
        ctx.prisma.profilEleve.update({
          where: { id: profilComplet.id },
          data: { totalPoints: Math.max(0, profilComplet.totalPoints - demande.xpCout) },
        }),
      ]);
      return { debutPartieAt: now };
    }),

  terminerJeu: protectedProcedure
    .input(z.object({ demandeId: z.string(), score: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, totalPoints: true },
      });

      const demande = await ctx.prisma.demandeJeu.findFirst({
        where: { id: input.demandeId, eleveId: profil.id, statut: { in: ["AUTORISE", "EN_COURS"] } },
        select: { id: true, xpCout: true, minutesAccordees: true, debutPartieAt: true },
      });
      if (!demande) throw new TRPCError({ code: "NOT_FOUND", message: "Session introuvable." });

      const now = new Date();
      // XP déjà déduit au démarrage — juste fermer la session
      await ctx.prisma.demandeJeu.update({
        where: { id: demande.id },
        data: { statut: "TERMINE", scoreObtenu: input.score, termineAt: now },
      });

      return { success: true };
    }),

  // ─── Passage d'année scolaire ────────────────────────────────────────────────
  passageAnnee: protectedProcedure.mutation(async ({ ctx }) => {
    const NIVEAU_SUIVANT: Partial<Record<NiveauScolaire, NiveauScolaire>> = {
      PRIMAIRE_1: NiveauScolaire.PRIMAIRE_2,
      PRIMAIRE_2: NiveauScolaire.PRIMAIRE_3,
      PRIMAIRE_3: NiveauScolaire.PRIMAIRE_4,
      PRIMAIRE_4: NiveauScolaire.PRIMAIRE_5,
      PRIMAIRE_5: NiveauScolaire.PRIMAIRE_6,
      PRIMAIRE_6: NiveauScolaire.SECONDAIRE_1,
      SECONDAIRE_1: NiveauScolaire.SECONDAIRE_2,
      SECONDAIRE_2: NiveauScolaire.SECONDAIRE_3,
      SECONDAIRE_3: NiveauScolaire.SECONDAIRE_4,
      SECONDAIRE_4: NiveauScolaire.SECONDAIRE_5,
      SECONDAIRE_5: NiveauScolaire.SECONDAIRE_6,
      SECONDAIRE_6: NiveauScolaire.SECONDAIRE_7,
    };

    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true, niveauScolaire: true, anneeScolaireActive: true },
    });

    const niveauSuivant = NIVEAU_SUIVANT[profil.niveauScolaire];
    if (!niveauSuivant) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun niveau supérieur disponible." });
    }

    // Calcul de la prochaine année scolaire (ex: "2025-2026" → "2026-2027")
    const [anneeDebut] = profil.anneeScolaireActive.split("-").map(Number);
    const prochaineAnnee = `${anneeDebut + 1}-${anneeDebut + 2}`;

    await ctx.prisma.$transaction([
      // 1. Enregistrer le niveau actuel dans l'historique
      ctx.prisma.historiqueNiveauEleve.create({
        data: {
          eleveId: profil.id,
          niveauScolaire: profil.niveauScolaire,
          anneeScolaire: profil.anneeScolaireActive,
        },
      }),
      // 2. Mettre à jour le profil élève
      ctx.prisma.profilEleve.update({
        where: { id: profil.id },
        data: {
          niveauScolaire: niveauSuivant,
          anneeScolaireActive: prochaineAnnee,
        },
      }),
      // 3. Archiver les plans d'action actifs
      ctx.prisma.planAction.updateMany({
        where: { eleveId: profil.id, statut: "ACTIF" },
        data: { statut: "ARCHIVE" },
      }),
      // 4. Supprimer les objectifs de notes (spécifiques à l'année)
      ctx.prisma.objectifNote.deleteMany({ where: { eleveId: profil.id } }),
      // 5. Supprimer la planification de notions (spécifique à l'année)
      ctx.prisma.planifNotionEleve.deleteMany({ where: { eleveId: profil.id } }),
      // 6. Réinitialiser les niveaux par matière (nouveau départ académique)
      ctx.prisma.niveauMatiere.updateMany({
        where: { eleveId: profil.id },
        data: {
          scoreGlobal: 0,
          niveau: NiveauDifficulte.BASE,
          lacunes: [],
          competencesPFEQ: [],
          derniereEval: null,
          prochaineRevision: null,
        },
      }),
      // 7. Annuler les exercices incomplets (isolation des données par année scolaire)
      ctx.prisma.exerciceAssigne.updateMany({
        where: { eleveId: profil.id, statut: { in: ["NON_COMMENCE", "EN_COURS"] } },
        data: { statut: "ABANDONNE" },
      }),
    ]);

    return { niveauSuivant, prochaineAnnee };
  }),

  // ── Enregistrer la date de rentrée (passage d'année ou paramètres) ────────
  enregistrerDateRentree: protectedProcedure
    .input(z.object({ dateRentree: z.string() })) // YYYY-MM-DD
    .mutation(async ({ ctx, input }) => {
      const dateRentreeDate = new Date(input.dateRentree);
      const modePreRentree = dateRentreeDate > new Date();
      return ctx.prisma.profilEleve.update({
        where: { userId: ctx.user.id },
        data: { dateRentree: dateRentreeDate, modePreRentree },
      });
    }),

  // ── Vérifier et mettre à jour le mode pré-rentrée ─────────────────────────
  // Appelé au chargement du dashboard — désactive modePreRentree si la rentrée est passée
  verifierModePreRentree: protectedProcedure.mutation(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      select: { dateRentree: true, modePreRentree: true },
    });
    if (profil?.modePreRentree && profil.dateRentree && profil.dateRentree <= new Date()) {
      await ctx.prisma.profilEleve.update({
        where: { userId: ctx.user.id },
        data: { modePreRentree: false },
      });
      return { modePreRentree: false };
    }
    return { modePreRentree: profil?.modePreRentree ?? false };
  }),

  // ── Lecture quotidienne — soumettre ───────────────────────────────────────
  soumettreLecture: protectedProcedure
    .input(
      z.object({
        titreLivre: z.string().min(1).max(200),
        auteur: z.string().max(100).optional(),
        qui: z.string().max(1000).optional(),
        quoi: z.string().max(1000).optional(),
        ou: z.string().max(500).optional(),
        quand: z.string().max(500).optional(),
        pourquoi: z.string().max(1000).optional(),
        resumePhotoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [profil, user] = await Promise.all([
        ctx.prisma.profilEleve.findUniqueOrThrow({
          where: { userId: ctx.user.id },
          select: { id: true },
        }),
        ctx.prisma.user.findUniqueOrThrow({
          where: { id: ctx.user.id },
          select: { province: true },
        }),
      ]);

      // Générer l'analyse IA si des réponses ont été saisies
      let analyseIA: string | undefined;
      let scoreGlobal: number | undefined;

      const reponsesRemplies = [input.qui, input.quoi, input.ou, input.quand, input.pourquoi].filter(Boolean);
      if (reponsesRemplies.length > 0) {
        try {
          const enFrancais = ["QC", "NB"].includes(user.province as string);
          const langue = enFrancais ? "français québécois (tutoiement, encourageant)" : "English (Canadian, encouraging)";
          const champLabels = enFrancais
            ? { qui: "Qui", quoi: "Quoi", ou: "Où", quand: "Quand", pourquoi: "Pourquoi" }
            : { qui: "Who", quoi: "What", ou: "Where", quand: "When", pourquoi: "Why" };

          const detailsLecture = [
            `${enFrancais ? "Livre" : "Book"}: "${input.titreLivre}"${input.auteur ? ` (${input.auteur})` : ""}`,
            input.qui    ? `${champLabels.qui}: ${input.qui}`       : "",
            input.quoi   ? `${champLabels.quoi}: ${input.quoi}`     : "",
            input.ou     ? `${champLabels.ou}: ${input.ou}`         : "",
            input.quand  ? `${champLabels.quand}: ${input.quand}`   : "",
            input.pourquoi ? `${champLabels.pourquoi}: ${input.pourquoi}` : "",
          ].filter(Boolean).join("\n");

          const prompt = enFrancais
            ? `Tu es un tuteur bienveillant pour un élève canadien. Analyse ce résumé de lecture en 5W et donne un retour encourageant en ${langue}. Réponds en JSON avec deux champs : "analyse" (string, 2-3 phrases de feedback personnalisé mentionnant les points forts et une piste d'amélioration) et "score" (number entre 0 et 100, basé sur la complétude et la qualité des réponses). Voici le résumé :\n\n${detailsLecture}`
            : `You are a supportive tutor for a Canadian student. Analyze this 5W reading summary and give encouraging feedback in ${langue}. Reply in JSON with two fields: "analyse" (string, 2-3 sentences of personalized feedback mentioning strengths and one improvement tip) and "score" (number between 0 and 100, based on completeness and quality). Here is the summary:\n\n${detailsLecture}`;

          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 400,
            messages: [{ role: "user", content: prompt }],
          });

          const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as { analyse?: string; score?: number };
            analyseIA = parsed.analyse;
            scoreGlobal = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : undefined;
          }
        } catch {
          // Analyse optionnelle — ne bloque pas la sauvegarde
        }
      }

      // On remplace la lecture du jour si elle existe déjà
      const debutJour = new Date();
      debutJour.setHours(0, 0, 0, 0);
      const finJour = new Date();
      finJour.setHours(23, 59, 59, 999);

      const lectureExistante = await ctx.prisma.lectureJournaliere.findFirst({
        where: { eleveId: profil.id, date: { gte: debutJour, lte: finJour } },
        select: { id: true },
      });

      const data = { ...input, ou: input.ou, analyseIA, scoreGlobal };

      if (lectureExistante) {
        return ctx.prisma.lectureJournaliere.update({
          where: { id: lectureExistante.id },
          data,
        });
      }

      return ctx.prisma.lectureJournaliere.create({
        data: { eleveId: profil.id, ...data },
      });
    }),

  // ── Lecture quotidienne — vérifier si déjà faite aujourd'hui ──────────────
  getLectureAujourdhui: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    if (!profil) return null;

    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);

    return ctx.prisma.lectureJournaliere.findFirst({
      where: { eleveId: profil.id, date: { gte: debutJour, lte: finJour } },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Lecture quotidienne — historique ──────────────────────────────────────
  getLecturesHistorique: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!profil) return [];

      return ctx.prisma.lectureJournaliere.findMany({
        where: { eleveId: profil.id },
        orderBy: { date: "desc" },
        take: input.limit,
      });
    }),

  // ── Module Lecture Approfondie ─────────────────────────────────────────────
  //
  // Architecture scalable pour 1000+ utilisateurs simultanés :
  // 1. creerSessionLecture : sert depuis le pool pré-généré (TexteLectureCache).
  //    Zéro appel Claude si le cache est plein. Fallback vers génération live.
  // 2. terminerSessionLecture : pour TEXTE_GENERE → questions déjà dans le cache,
  //    retour immédiat (0 appel Claude). Pour LIVRE_PERSO → statut GENERANT_QUESTIONS,
  //    retour immédiat, génération lancée en tâche de fond par le client.
  // 3. soumettreReponsesLecture : 1 seul appel Claude, avec retry sur rate limit.
  // ──────────────────────────────────────────────────────────────────────────

  creerSessionLecture: protectedProcedure
    .input(z.object({
      mode: z.enum(["TEXTE_GENERE", "LIVRE_PERSO"]),
      titreLivre: z.string().min(1).max(300).optional(),
      auteurLivre: z.string().max(200).optional(),
      niveauLecture: z.enum(["FACILE", "MOYEN", "DIFFICILE"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, niveauScolaire: true, prenom: true, centresInteret: true, sportFavori: true, universMediatique: true },
      });

      // Bloquer si une session est déjà active (évite les doubles sessions)
      const sessionExistante = await ctx.prisma.sessionLecture.findFirst({
        where: { eleveId: profil.id, statut: { in: ["EN_COURS", "GENERANT_QUESTIONS", "QUESTIONS"] } },
        select: { id: true },
      });
      if (sessionExistante) {
        throw new TRPCError({ code: "CONFLICT", message: "Une session de lecture est déjà en cours." });
      }

      let texteGenere: string | null = null;
      let nbMotsTexte: number | null = null;
      let cacheTexteId: string | null = null;
      let questionsCache: object[] | null = null;

      if (input.mode === "TEXTE_GENERE") {
        // ── Étape 1 : tenter de servir depuis le pool pré-généré ────────────
        const pool = await ctx.prisma.texteLectureCache.findMany({
          where: { niveauScolaire: profil.niveauScolaire },
          orderBy: { createdAt: "asc" },
          take: 20,
          select: { id: true, texte: true, nbMots: true, questionsJson: true },
        });

        if (pool.length > 0) {
          // Distribution uniforme dans le pool selon l'ID de l'élève (pas de course critique)
          const idx = parseInt(profil.id.slice(-6), 16) % pool.length;
          const cached = pool[idx];
          texteGenere = cached.texte;
          nbMotsTexte = cached.nbMots;
          cacheTexteId = cached.id;
          questionsCache = parseJsonClaude<object[]>(cached.questionsJson, []);
        } else {
          // ── Étape 2 (fallback) : génération live si le cache est vide ────
          const nbMots = MOTS_PAR_NIVEAU[profil.niveauScolaire] ?? 300;
          const niveauLabel = NIVEAU_LABEL[profil.niveauScolaire] ?? profil.niveauScolaire;
          const interets = [profil.sportFavori, profil.universMediatique, ...(profil.centresInteret ?? [])]
            .filter(Boolean).slice(0, 3).join(", ");

          const resp = await claudeAvecRetry({
            model: "claude-sonnet-4-6",
            max_tokens: 1800,
            messages: [{
              role: "user",
              content: `Tu es un orthopédagogue. Génère un texte de lecture ET 5 questions de compréhension Giasson pour ${profil.prenom}, élève de ${niveauLabel}.

Centres d'intérêt : ${interets || "varié"}
Longueur texte : ${nbMots} mots (±15%)
Langue : français québécois, aucune violence

RÉPONDS avec ce JSON exact :
{"texte":"Le texte complet ici sans titre...","questions":[{"id":"q1","niveau":"MICROPROCESSUS","question":"..."},{"id":"q2","niveau":"INTEGRATION","question":"..."},{"id":"q3","niveau":"MACROPROCESSUS","question":"..."},{"id":"q4","niveau":"ELABORATION_CAUSAL","question":"..."},{"id":"q5","niveau":"ELABORATION_PREDICTIF","question":"..."}]}`,
            }],
          });

          const raw = resp.content[0].type === "text" ? (resp.content[0].text ?? "{}") : "{}";
          const parsed = parseJsonClaude<{ texte?: string; questions?: object[] }>(raw, {});
          texteGenere = parsed.texte?.trim() ?? "";
          nbMotsTexte = texteGenere.split(/\s+/).filter(Boolean).length;
          questionsCache = parsed.questions ?? [];
        }
      }

      return ctx.prisma.sessionLecture.create({
        data: {
          eleveId: profil.id,
          mode: input.mode,
          statut: "EN_COURS",
          texteGenere,
          nbMotsTexte,
          cacheTexteId,
          // Pour TEXTE_GENERE : on stocke déjà les questions en attente d'activation
          questions: questionsCache ? (questionsCache as never) : undefined,
          titreLivre: input.titreLivre,
          auteurLivre: input.auteurLivre,
          niveauLecture: input.niveauLecture,
          dateDebut: new Date(),
        },
      });
    }),

  terminerSessionLecture: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      dureeEffectiveSec: z.number().min(1),
      texteTranscrit: z.string().max(20000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, niveauScolaire: true },
      });
      const session = await ctx.prisma.sessionLecture.findUniqueOrThrow({
        where: { id: input.sessionId, eleveId: profil.id },
        select: { id: true, mode: true, texteGenere: true, nbMotsTexte: true, questions: true, titreLivre: true, auteurLivre: true, niveauLecture: true },
      });

      const nbMots = session.nbMotsTexte
        ?? (input.texteTranscrit ? input.texteTranscrit.split(/\s+/).filter(Boolean).length : null);
      const vitesseMots = nbMots && input.dureeEffectiveSec > 0
        ? Math.round((nbMots / (input.dureeEffectiveSec / 60)) * 10) / 10
        : null;

      if (session.mode === "TEXTE_GENERE") {
        // ── TEXTE_GENERE : questions déjà stockées depuis le cache → retour instantané
        const questionsExistantes = session.questions as object[] | null;
        return ctx.prisma.sessionLecture.update({
          where: { id: input.sessionId },
          data: {
            statut: "QUESTIONS",
            dateFin: new Date(),
            dureeEffectiveSec: input.dureeEffectiveSec,
            nbMotsTexte: nbMots,
            vitesseMots,
            questions: (questionsExistantes && questionsExistantes.length > 0)
              ? (questionsExistantes as never)
              : undefined,
          },
        });
      }

      // ── LIVRE_PERSO : questions générées en asynchrone ───────────────────
      // Retour immédiat avec statut GENERANT_QUESTIONS.
      // Le client lance /api/lecture/generer-questions en fire-and-forget
      // et poll getSessionLectureActive jusqu'au passage à QUESTIONS.
      return ctx.prisma.sessionLecture.update({
        where: { id: input.sessionId },
        data: {
          statut: "GENERANT_QUESTIONS",
          dateFin: new Date(),
          dureeEffectiveSec: input.dureeEffectiveSec,
          texteTranscrit: input.texteTranscrit,
          nbMotsTexte: nbMots,
          vitesseMots,
        },
      });
    }),

  soumettreReponsesLecture: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      reponses: z.array(z.object({
        questionId: z.string(),
        reponse: z.string().min(1).max(3000),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, niveauScolaire: true, prenom: true },
      });
      const session = await ctx.prisma.sessionLecture.findUniqueOrThrow({
        where: { id: input.sessionId, eleveId: profil.id },
      });

      const questions = (session.questions as Array<{ id: string; niveau: string; question: string }>) ?? [];
      const texteSource = session.texteGenere ?? session.texteTranscrit ?? null;
      const contexte = texteSource
        ? `Texte lu :\n${texteSource.slice(0, 2500)}`
        : `Livre : "${session.titreLivre ?? "?"}"${session.auteurLivre ? ` de ${session.auteurLivre}` : ""}`;
      const niveauLabel = NIVEAU_LABEL[profil.niveauScolaire] ?? profil.niveauScolaire;

      const qrText = questions.map((q) => {
        const rep = input.reponses.find((r) => r.questionId === q.id)?.reponse ?? "(pas de réponse)";
        return `[${q.niveau}] Q: ${q.question}\nRéponse : ${rep}`;
      }).join("\n\n");

      const evalResp = await claudeAvecRetry({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Évalue la compréhension de ${profil.prenom} (${niveauLabel}) selon Giasson.

${contexte}

QUESTIONS ET RÉPONSES :
${qrText}

RÉPONDS avec ce JSON exact :
{"evaluations":[{"questionId":"q1","score":80,"feedback":"1 phrase bienveillante"},...],"scoreGlobal":75,"niveauPrecision":"FONCTIONNEL","analyseIA":"3-4 phrases encourageantes style oral québécois","forcePrincipale":"Ce que l'élève fait bien","prochainDefi":"Piste d'amélioration"}

niveauPrecision : "INDEPENDANT" (≥90), "FONCTIONNEL" (70-89), "FRUSTRATION" (<70)`,
        }],
      });

      type EvalResult = {
        evaluations: Array<{ questionId: string; score: number; feedback: string }>;
        scoreGlobal: number; niveauPrecision: string;
        analyseIA: string; forcePrincipale: string; prochainDefi: string;
      };
      const fallbackEval: EvalResult = {
        evaluations: [], scoreGlobal: 70, niveauPrecision: "FONCTIONNEL",
        analyseIA: `${profil.prenom} a bien complété sa session. Continue !`,
        forcePrincipale: "Bonne participation", prochainDefi: "Lire régulièrement",
      };
      const raw = evalResp.content[0].type === "text" ? (evalResp.content[0].text ?? "{}") : "{}";
      const ev = parseJsonClaude<EvalResult>(raw, fallbackEval);

      const questionsFinales = questions.map((q) => ({
        ...q,
        reponseEleve: input.reponses.find((r) => r.questionId === q.id)?.reponse,
        scoreQuestion: ev.evaluations.find((e) => e.questionId === q.id)?.score,
        feedbackQuestion: ev.evaluations.find((e) => e.questionId === q.id)?.feedback,
      }));

      return ctx.prisma.sessionLecture.update({
        where: { id: input.sessionId },
        data: {
          statut: "TERMINE",
          questions: questionsFinales as never,
          scoreGlobal: ev.scoreGlobal,
          niveauPrecision: ev.niveauPrecision as "INDEPENDANT" | "FONCTIONNEL" | "FRUSTRATION",
          analyseIA: JSON.stringify({ analyse: ev.analyseIA, force: ev.forcePrincipale, defi: ev.prochainDefi }),
        },
      });
    }),

  // Polling léger — appelé toutes les 3s par le client pendant GENERANT_QUESTIONS
  getSessionLectureActive: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id }, select: { id: true },
    });
    if (!profil) return null;
    return ctx.prisma.sessionLecture.findFirst({
      where: { eleveId: profil.id, statut: { in: ["EN_COURS", "GENERANT_QUESTIONS", "QUESTIONS"] } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getHistoriqueSessionsLecture: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(10) }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id }, select: { id: true },
      });
      if (!profil) return [];
      return ctx.prisma.sessionLecture.findMany({
        where: { eleveId: profil.id, statut: "TERMINE" },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true, mode: true, titreLivre: true, auteurLivre: true,
          vitesseMots: true, scoreGlobal: true, niveauPrecision: true,
          dureeEffectiveSec: true, nbMotsTexte: true, createdAt: true, analyseIA: true,
        },
      });
    }),
});
