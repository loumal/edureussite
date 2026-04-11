import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { Matiere, TypeMission } from "@/generated/prisma";
import { z } from "zod";

// Semaine ISO "YYYY-WNN"
function semaineISO(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Date du jour à minuit UTC
function debutJourUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Génère 3 missions hebdomadaires pour un élève
function genererMissions(
  semaine: string,
  eleveId: string,
  matierePrincipale: Matiere | null
): { semaine: string; eleveId: string; titre: string; description: string; type: TypeMission; matiere?: Matiere; cible: number; xpBonus: number }[] {
  const missions = [];

  // Mission 1 : Exercices de la semaine (toujours présente)
  missions.push({
    semaine, eleveId,
    titre: "Persévérance",
    description: "Complète 5 exercices cette semaine",
    type: TypeMission.EXERCICES_COUNT,
    cible: 5,
    xpBonus: 150,
  });

  // Mission 2 : Score élevé
  missions.push({
    semaine, eleveId,
    titre: "Vise l'excellence",
    description: "Obtiens un score de 85% ou plus sur un exercice",
    type: TypeMission.SCORE_MINIMUM,
    cible: 85,
    xpBonus: 100,
  });

  // Mission 3 : Dans la matière principale ou score parfait
  if (matierePrincipale) {
    const labels: Record<string, string> = {
      FRANCAIS: "Français", MATHEMATIQUES: "Maths", SCIENCES: "Sciences",
      UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais", ARTS: "Arts",
      ETHIQUE: "Éthique", EDUCATION_PHYSIQUE: "Éd. physique",
    };
    missions.push({
      semaine, eleveId,
      titre: `Sprint ${labels[matierePrincipale] ?? matierePrincipale}`,
      description: `Complète 3 exercices de ${labels[matierePrincipale] ?? matierePrincipale}`,
      type: TypeMission.MATIERE_EXERCICES,
      matiere: matierePrincipale,
      cible: 3,
      xpBonus: 120,
    });
  } else {
    missions.push({
      semaine, eleveId,
      titre: "Perfection",
      description: "Obtiens un score parfait (100%) sur un exercice",
      type: TypeMission.PERFECT_SCORE,
      cible: 1,
      xpBonus: 200,
    });
  }

  return missions;
}

export const gamificationRouter = createTRPCRouter({

  // ── Défi du jour ───────────────────────────────────────────────────────────
  getDefJour: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true, matieresPreferees: true, matieresRedoutees: true, niveauxMatieres: true },
    });

    const aujourd = debutJourUTC();

    // Chercher le défi du jour existant
    let def = await ctx.prisma.defJour.findFirst({
      where: { date: aujourd },
      include: { completions: { where: { eleveId: profil.id } } },
    });

    // Créer le défi du jour si inexistant (généré à la volée)
    if (!def) {
      const matieres = Object.values(Matiere);
      // Utiliser les matières préférées en priorité, sinon aléatoire
      const prefees = profil.matieresPreferees as Matiere[];
      const pool = prefees.length > 0 ? prefees : matieres;
      const matiere = pool[Math.floor(Math.random() * pool.length)] as Matiere;

      const notions: Record<string, string[]> = {
        FRANCAIS: ["la ponctuation", "les accords du participe passé", "la lecture inférentielle", "les connecteurs logiques"],
        MATHEMATIQUES: ["les fractions", "les équations du 1er degré", "les probabilités", "la géométrie"],
        SCIENCES: ["le cycle de l'eau", "la photosynthèse", "les forces et l'énergie", "les systèmes du corps"],
        UNIVERS_SOCIAL: ["la Nouvelle-France", "les droits et libertés", "l'espace géographique", "la démocratie"],
        ANGLAIS: ["the simple past", "reading comprehension", "vocabulary in context", "asking questions"],
        ARTS: ["les éléments du langage visuel", "la composition", "les techniques mixtes", "l'art abstrait"],
        ETHIQUE: ["le respect des différences", "la coopération", "les valeurs morales", "les droits humains"],
        EDUCATION_PHYSIQUE: ["les règles du jeu", "les habiletés motrices", "la condition physique", "l'esprit sportif"],
      };
      const notionsList = notions[matiere] ?? ["les concepts de base"];
      const notion = notionsList[Math.floor(Math.random() * notionsList.length)];

      def = await ctx.prisma.defJour.create({
        data: { date: aujourd, matiere, notion, xpBonus: 50 },
        include: { completions: { where: { eleveId: profil.id } } },
      });
    }

    return {
      id: def.id,
      matiere: def.matiere,
      notion: def.notion,
      xpBonus: def.xpBonus,
      complete: def.completions.length > 0,
      score: def.completions[0]?.score ?? null,
    };
  }),

  // ── Missions hebdomadaires ─────────────────────────────────────────────────
  getMissions: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true, matieresPreferees: true, matieresRedoutees: true },
    });

    const semaine = semaineISO();

    // Vérifier si les missions de cette semaine existent
    let missions = await ctx.prisma.missionHebdo.findMany({
      where: { eleveId: profil.id, semaine },
      orderBy: { createdAt: "asc" },
    });

    // Générer les missions si absentes
    if (missions.length === 0) {
      const prefees = profil.matieresPreferees as Matiere[];
      const matierePrincipale = prefees.length > 0 ? prefees[0] as Matiere : null;
      const missionData = genererMissions(semaine, profil.id, matierePrincipale);

      await ctx.prisma.missionHebdo.createMany({ data: missionData });
      missions = await ctx.prisma.missionHebdo.findMany({
        where: { eleveId: profil.id, semaine },
        orderBy: { createdAt: "asc" },
      });
    }

    return missions;
  }),

  // Mettre à jour la progression des missions après un exercice
  mettreAJourMissions: protectedProcedure
    .input(z.object({
      score: z.number().min(0).max(100),
      matiere: z.nativeEnum(Matiere),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const semaine = semaineISO();
      const missions = await ctx.prisma.missionHebdo.findMany({
        where: { eleveId: profil.id, semaine, completee: false },
      });

      let xpBonusTotal = 0;
      const missionsCompletees: string[] = [];

      for (const mission of missions) {
        let nouvelleProgression = mission.progres;

        switch (mission.type) {
          case TypeMission.EXERCICES_COUNT:
            nouvelleProgression += 1;
            break;
          case TypeMission.MATIERE_EXERCICES:
            if (mission.matiere === input.matiere) nouvelleProgression += 1;
            break;
          case TypeMission.SCORE_MINIMUM:
            if (input.score >= mission.cible) nouvelleProgression = mission.cible;
            break;
          case TypeMission.PERFECT_SCORE:
            if (input.score === 100) nouvelleProgression = 1;
            break;
          case TypeMission.STREAK_MAINTENU:
            // Géré séparément
            break;
        }

        const completee = nouvelleProgression >= mission.cible;
        await ctx.prisma.missionHebdo.update({
          where: { id: mission.id },
          data: {
            progres: Math.min(nouvelleProgression, mission.cible),
            completee,
            completeeAt: completee ? new Date() : null,
          },
        });

        if (completee && !mission.completee) {
          xpBonusTotal += mission.xpBonus;
          missionsCompletees.push(mission.titre);
        }
      }

      // Ajouter les XP bonus des missions complétées
      if (xpBonusTotal > 0) {
        await ctx.prisma.profilEleve.update({
          where: { id: profil.id },
          data: { totalPoints: { increment: xpBonusTotal } },
        });
      }

      return { xpBonusTotal, missionsCompletees };
    }),

  // ── Classement hebdomadaire anonyme ───────────────────────────────────────
  getClassement: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true, niveauScolaire: true },
    });

    // XP de la semaine = somme des scores des exercices terminés cette semaine
    const debutSemaine = new Date();
    debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay() + (debutSemaine.getDay() === 0 ? -6 : 1));
    debutSemaine.setHours(0, 0, 0, 0);

    // Si l'élève n'a pas de niveau scolaire défini, pas de classement
    if (!profil.niveauScolaire) {
      return { classement: [], monRang: null, debutSemaine, niveauScolaire: null };
    }

    // Agréger par élève du même niveau scolaire
    const resultats = await ctx.prisma.exerciceAssigne.groupBy({
      by: ["eleveId"],
      where: {
        statut: "TERMINE",
        dateFin: { gte: debutSemaine },
        eleve: { niveauScolaire: profil.niveauScolaire },
      },
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 20,
    });

    const classement = resultats.map((r, i) => ({
      rang: i + 1,
      estMoi: r.eleveId === profil.id,
      xp: Math.round(r._sum.score ?? 0),
      // Anonymisation : on n'expose pas l'eleveId
    }));

    const monRang = classement.find((c) => c.estMoi)?.rang ?? null;

    return { classement, monRang, debutSemaine, niveauScolaire: profil.niveauScolaire };
  }),

  // ── Marquer le défi du jour comme complété ─────────────────────────────────
  completerDefJour: protectedProcedure
    .input(z.object({ defId: z.string(), score: z.number().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const def = await ctx.prisma.defJour.findUniqueOrThrow({ where: { id: input.defId } });

      // Idempotent — upsert
      await ctx.prisma.defJourCompletion.upsert({
        where: { defId_eleveId: { defId: input.defId, eleveId: profil.id } },
        create: { defId: input.defId, eleveId: profil.id, score: input.score },
        update: { score: input.score },
      });

      // Ajouter XP bonus
      await ctx.prisma.profilEleve.update({
        where: { id: profil.id },
        data: { totalPoints: { increment: def.xpBonus } },
      });

      return { xpBonus: def.xpBonus };
    }),
});
