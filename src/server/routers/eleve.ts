import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc/init";

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
      const profileData = {
        prenom: input.prenom,
        nom: input.nom,
        niveauScolaire: input.niveauScolaire,
        ecole: input.ecole,
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
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: {
        niveauxMatieres: true,
        badges: { include: { badge: true } },
        exercicesAssignes: {
          where: { statut: { in: ["NON_COMMENCE", "EN_COURS"] } },
          include: { exercice: true },
          orderBy: { dateAssignation: "desc" },
          take: 5,
        },
        checkIns: { orderBy: { date: "desc" }, take: 1 },
        sessions: { orderBy: { dateSession: "desc" }, take: 7 },
        coursRemediation: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!profil) return { profil: null, totalExercices: 0, aFaitExerciceAujourdhui: false };

    const debutJour = debutJourMontreal();

    const [totalExercices, exerciceAujourdhui] = await Promise.all([
      ctx.prisma.exerciceAssigne.count({ where: { eleveId: profil.id, statut: "TERMINE" } }),
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
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
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
    });

    const exercicesTermines = await ctx.prisma.exerciceAssigne.findMany({
      where: { eleveId: profil.id, statut: "TERMINE" },
      include: { exercice: { select: { titre: true, matiere: true, difficulte: true } } },
      orderBy: { dateFin: "desc" },
      take: 20,
    });

    const totalExercices = await ctx.prisma.exerciceAssigne.count({
      where: { eleveId: profil.id, statut: "TERMINE" },
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
      return { success: true };
    }),
});
