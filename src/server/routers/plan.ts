import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { Matiere, PrioriteNotion } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";
import { getNotionsPourNiveau, NIVEAU_TO_CYCLE } from "@/lib/pfeq/notions";
import { sendAidePlanificationParent } from "@/lib/email/send-aide-planification-parent";

const NIVEAUX_JEUNES = ["PRIMAIRE_1", "PRIMAIRE_2", "PRIMAIRE_3"] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Retourne le lundi de la semaine ISO contenant `date` */
function getLundiSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = d.getDay(); // 0=dim
  const diff = jour === 0 ? -6 : 1 - jour;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retourne la semaine ISO au format "YYYY-Www" */
function getSemaineISO(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Ajoute n semaines à une date */
function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

/** Jour de la semaine 0=dim..6=sam → clé DB */
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;

function minutesDispoAujourdhui(dispo: Record<string, number>): number {
  const jour = JOURS[new Date().getDay()];
  return (dispo as Record<string, number>)[jour] ?? 15;
}

/** Calcule le score actuel d'une matière depuis NiveauMatiere */
function scoreMatiere(niveaux: { matiere: string; scoreGlobal: number }[], matiere: string): number {
  return niveaux.find((n) => n.matiere === matiere)?.scoreGlobal ?? 0;
}

/** Détermine la priorité automatique selon le score */
function prioriteAuto(score: number): PrioriteNotion {
  if (score < 60) return "URGENT";
  if (score < 80) return "IMPORTANT";
  if (score >= 85) return "MAITRISE";
  return "PLUS_TARD";
}

// ── Router ──────────────────────────────────────────────────────────────────

export const planRouter = createTRPCRouter({

  // ── Objectifs de note ──────────────────────────────────────────────────────

  getObjectifs: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: { niveauxMatieres: true },
    });
    if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

    const objectifs = await ctx.prisma.objectifNote.findMany({
      where: { eleveId: profil.id, actif: true },
      orderBy: { dateEcheance: "asc" },
    });

    // Enrichir avec le score actuel
    return objectifs.map((obj) => {
      const scoreActuel = scoreMatiere(profil.niveauxMatieres, obj.matiere);
      const progression = obj.scoreVise > obj.scoreDepart
        ? Math.round(((scoreActuel - obj.scoreDepart) / (obj.scoreVise - obj.scoreDepart)) * 100)
        : 100;
      const joursRestants = Math.ceil((new Date(obj.dateEcheance).getTime() - Date.now()) / 86400000);
      return { ...obj, scoreActuel, progressionPct: Math.min(100, Math.max(0, progression)), joursRestants };
    });
  }),

  upsertObjectif: protectedProcedure
    .input(z.object({
      matiere:      z.nativeEnum(Matiere),
      scoreVise:    z.number().min(50).max(100),
      dateEcheance: z.string(), // ISO date
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        include: { niveauxMatieres: true },
      });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

      const scoreDepart = scoreMatiere(profil.niveauxMatieres, input.matiere);

      return ctx.prisma.objectifNote.upsert({
        where: { eleveId_matiere: { eleveId: profil.id, matiere: input.matiere } },
        create: {
          eleveId: profil.id,
          matiere: input.matiere,
          scoreVise: input.scoreVise,
          scoreDepart,
          dateEcheance: new Date(input.dateEcheance),
        },
        update: {
          scoreVise: input.scoreVise,
          dateEcheance: new Date(input.dateEcheance),
        },
      });
    }),

  supprimerObjectif: protectedProcedure
    .input(z.object({ matiere: z.nativeEnum(Matiere) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.objectifNote.updateMany({
        where: { eleveId: profil.id, matiere: input.matiere },
        data: { actif: false },
      });
      return { success: true };
    }),

  // ── Disponibilité ──────────────────────────────────────────────────────────

  getDisponibilite: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
    if (!profil) throw new TRPCError({ code: "NOT_FOUND" });
    const dispo = await ctx.prisma.disponibiliteEleve.findUnique({ where: { eleveId: profil.id } });
    return dispo ?? { lundi: 15, mardi: 15, mercredi: 20, jeudi: 15, vendredi: 15, samedi: 30, dimanche: 20 };
  }),

  saveDisponibilite: protectedProcedure
    .input(z.object({
      lundi:    z.number().min(5).max(120),
      mardi:    z.number().min(5).max(120),
      mercredi: z.number().min(5).max(120),
      jeudi:    z.number().min(5).max(120),
      vendredi: z.number().min(5).max(120),
      samedi:   z.number().min(5).max(120),
      dimanche: z.number().min(5).max(120),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.disponibiliteEleve.upsert({
        where: { eleveId: profil.id },
        create: { eleveId: profil.id, ...input },
        update: input,
      });
    }),

  // ── Notions planifiées ─────────────────────────────────────────────────────

  getPlanifNotions: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: { niveauxMatieres: true, planifNotions: true },
    });
    if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

    return profil.planifNotions.map((pn) => {
      const scoreActuel = scoreMatiere(profil.niveauxMatieres, pn.matiere);
      return { ...pn, scoreActuel };
    });
  }),

  upsertPlanifNotion: protectedProcedure
    .input(z.object({
      notion:   z.string(),
      matiere:  z.nativeEnum(Matiere),
      priorite: z.nativeEnum(PrioriteNotion),
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.planifNotionEleve.upsert({
        where: { eleveId_notion: { eleveId: profil.id, notion: input.notion } },
        create: { eleveId: profil.id, ...input },
        update: { priorite: input.priorite },
      });
    }),

  supprimerPlanifNotion: protectedProcedure
    .input(z.object({ notion: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.planifNotionEleve.deleteMany({
        where: { eleveId: profil.id, notion: input.notion },
      });
      return { success: true };
    }),

  // ── Réordonner les notions ─────────────────────────────────────────────────
  // Reçoit un tableau d'IDs dans le nouvel ordre voulu
  reorderNotions: protectedProcedure
    .input(z.object({
      ordreIds: z.array(z.string()), // IDs PlanifNotionEleve dans le nouvel ordre
    }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

      // Recalculer semaineDebut à partir du lundi courant (ISO week)
      const lundi = getLundiSemaine(new Date());

      await ctx.prisma.$transaction(
        input.ordreIds.map((id, i) => {
          const semaineDebut = getSemaineISO(addWeeks(lundi, i));
          return ctx.prisma.planifNotionEleve.updateMany({
            where: { id, eleveId: profil.id },
            data: { ordre: i, semaineDebut },
          });
        })
      );
      return { success: true };
    }),

  // ── Notion active (celle en cours, non maîtrisée) ─────────────────────────
  getNotionActive: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
    if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

    const notion = await ctx.prisma.planifNotionEleve.findFirst({
      where: { eleveId: profil.id, maitrisee: false, priorite: { not: "MAITRISE" } },
      orderBy: { ordre: "asc" },
    });
    return notion ?? null;
  }),

  // ── Marquer une notion comme maîtrisée ────────────────────────────────────
  markNotionMaitrisee: protectedProcedure
    .input(z.object({ notionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({ where: { userId: ctx.user.id } });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.planifNotionEleve.updateMany({
        where: { id: input.notionId, eleveId: profil.id },
        data: { maitrisee: true, priorite: "MAITRISE" },
      });

      // Retourner la prochaine notion
      const prochaine = await ctx.prisma.planifNotionEleve.findFirst({
        where: { eleveId: profil.id, maitrisee: false },
        orderBy: { ordre: "asc" },
      });
      return { success: true, prochaineNotion: prochaine ?? null };
    }),

  // ── Recalculer l'ordre + planification adaptative ────────────────────────
  // Algorithme de bin-packing glouton :
  //   1. Trie les notions par priorité (URGENT → IMPORTANT → PLUS_TARD)
  //   2. Calcule la capacité hebdomadaire (somme des minutes dispo)
  //   3. Estime la durée de chaque notion selon sa priorité
  //   4. Pack les notions semaine par semaine sans déborder la capacité
  //   5. Assigne les jours de travail réels à l'intérieur de chaque semaine
  recalculerOrdre: protectedProcedure.mutation(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: {
        parents: { include: { user: { select: { id: true, email: true } } } },
        disponibilite: true,
      },
    });
    if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

    const notions = await ctx.prisma.planifNotionEleve.findMany({
      where: { eleveId: profil.id, maitrisee: false },
    });

    // ── Tri par priorité ──────────────────────────────────────────────────
    const ORDRE_PRIORITE: Record<string, number> = { URGENT: 0, IMPORTANT: 1, PLUS_TARD: 2, MAITRISE: 3 };
    const sorted = [...notions].sort((a, b) => {
      const diff = (ORDRE_PRIORITE[a.priorite] ?? 1) - (ORDRE_PRIORITE[b.priorite] ?? 1);
      return diff !== 0 ? diff : a.createdAt.getTime() - b.createdAt.getTime();
    });

    // ── Durée estimée par priorité (minutes) ─────────────────────────────
    const DUREE_NOTION: Record<string, number> = { URGENT: 90, IMPORTANT: 60, PLUS_TARD: 30, MAITRISE: 0 };

    // ── Capacité hebdomadaire (minutes disponibles / semaine) ─────────────
    const dispo = profil.disponibilite as Record<string, number> | null;
    const capaciteSemaine = dispo
      ? Object.values(dispo as Record<string, number>)
          .filter((v) => typeof v === "number" && v > 0)
          .reduce((s: number, v: number) => s + v, 0)
      : 5 * 15; // fallback : 5j × 15 min si aucune dispo définie
    const capaciteEffective = Math.max(capaciteSemaine, 30); // plancher 30 min/sem

    // ── Bin-packing glouton semaine par semaine ───────────────────────────
    const lundi = getLundiSemaine(new Date());
    let semaineIdx = 0;
    let minutesUseesSemaine = 0;
    const updates: Array<{ id: string; ordre: number; semaineDebut: string }> = [];

    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i];
      const duree = DUREE_NOTION[n.priorite] ?? 60;

      // Si cette notion ne rentre plus dans la semaine courante → semaine suivante
      if (minutesUseesSemaine + duree > capaciteEffective && minutesUseesSemaine > 0) {
        semaineIdx += 1;
        minutesUseesSemaine = 0;
      }

      updates.push({
        id: n.id,
        ordre: i,
        semaineDebut: getSemaineISO(addWeeks(lundi, semaineIdx)),
      });
      minutesUseesSemaine += duree;
    }

    await ctx.prisma.$transaction(
      updates.map(({ id, ordre, semaineDebut }) =>
        ctx.prisma.planifNotionEleve.update({
          where: { id },
          data: { ordre, semaineDebut },
        })
      )
    );

    // ── Notifier les parents ───────────────────────────────────────────────
    const estJeuneEnfant = (NIVEAUX_JEUNES as readonly string[]).includes(profil.niveauScolaire);
    const nbNotions = sorted.length;
    const nbSemaines = semaineIdx + 1;

    if (nbNotions > 0 && profil.parents.length > 0) {
      const titreNotif = estJeuneEnfant
        ? `Aidez ${profil.prenom} à planifier ses apprentissages 🗺️`
        : `${profil.prenom} a mis à jour son plan de travail 🗺️`;
      const contenuNotif = estJeuneEnfant
        ? `${profil.prenom} vient de sauvegarder un plan avec ${nbNotions} notion${nbNotions > 1 ? "s" : ""} sur ${nbSemaines} semaine${nbSemaines > 1 ? "s" : ""}. À cet âge, un coup de main parental fait toute la différence !`
        : `${profil.prenom} a planifié ${nbNotions} notion${nbNotions > 1 ? "s" : ""} réparties sur ${nbSemaines} semaine${nbSemaines > 1 ? "s" : ""} selon sa disponibilité. Consultez son plan dans votre espace.`;

      await Promise.allSettled(
        profil.parents.map(async (parent) => {
          await ctx.prisma.notification.create({
            data: {
              destinataireId: parent.user.id,
              type: "AIDE_PLANIFICATION",
              titre: titreNotif,
              contenu: contenuNotif,
              donnees: { eleveId: profil.id, nbNotions, nbSemaines, estJeuneEnfant },
            },
          });
          if (parent.user.email) {
            await sendAidePlanificationParent({
              parentEmail: parent.user.email,
              parentPrenom: parent.prenom,
              prenomEnfant: profil.prenom,
              niveauScolaire: profil.niveauScolaire,
              eleveId: profil.id,
              nbNotions,
            }).catch((err) => console.error("[plan] sendAidePlanificationParent error:", err));
          }
        })
      );
    }

    return { success: true, nbSemaines, capaciteHebdo: capaciteEffective };
  }),

  // ── Plan du jour (moteur de planification) ─────────────────────────────────

  getPlanDuJour: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUnique({
      where: { userId: ctx.user.id },
      include: {
        niveauxMatieres: true,
        planifNotions: { orderBy: { updatedAt: "desc" } },
        objectifsNotes: { where: { actif: true } },
        disponibilite: true,
      },
    });
    if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

    const dispoRaw = (profil.disponibilite as Record<string, number> | null) ?? {};
    const minutesDispo = minutesDispoAujourdhui(dispoRaw);

    // ── Notions actives triées par ordre du plan (comme la page plan) ──────────
    const notionsActives = [...profil.planifNotions]
      .filter((n) => n.priorite !== "MAITRISE" && !n.maitrisee)
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

    // ── Algorithme d'assignation bin-packing (identique à la page plan) ────────
    // Détermine quelles notions sont travaillées AUJOURD'HUI selon la dispo hebdo.
    const DUREE_NOTION: Record<string, number> = { URGENT: 90, IMPORTANT: 60, PLUS_TARD: 30 };
    const JOURS_ORDRE = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
    const now = new Date();
    const jourAujourdhuiKey = JOURS[now.getDay()]; // ex: "dimanche"

    const joursAvecDispo = JOURS_ORDRE
      .map((key) => ({ key, mins: dispoRaw[key] ?? 0 }))
      .filter((j) => j.mins > 0);

    // Reconstruire semaineDebut manquantes (legacy) puis assigner les jours
    const capaciteSemaine = Math.max(JOURS_ORDRE.reduce((s, j) => s + (dispoRaw[j] ?? 0), 0), 30);
    let semAutoIdx = 0;
    let minsAutoSemaine = 0;
    const notionsAvecSemaine = notionsActives.map((n) => {
      if (n.semaineDebut) return n;
      const duree = DUREE_NOTION[n.priorite] ?? 60;
      if (minsAutoSemaine + duree > capaciteSemaine && minsAutoSemaine > 0) {
        semAutoIdx++;
        minsAutoSemaine = 0;
      }
      minsAutoSemaine += duree;
      return { ...n, semaineDebut: getSemaineISO(addWeeks(now, semAutoIdx)) };
    });

    // Notions de la semaine courante seulement
    const semaineActuelle = getSemaineISO(now);
    const notionsCetteSemaine = notionsAvecSemaine.filter(
      (n) => n.semaineDebut === semaineActuelle
    );

    // Bin-packing → map notionId → jours assignés
    let dayIdx = 0;
    let minRestants = joursAvecDispo[0]?.mins ?? 0;
    const assignationJours: Record<string, string[]> = {};
    for (const notion of notionsCetteSemaine) {
      let restant = DUREE_NOTION[notion.priorite] ?? 60;
      const joursOccupes = new Set<string>();
      while (restant > 0 && dayIdx < joursAvecDispo.length) {
        const consomme = Math.min(restant, minRestants);
        joursOccupes.add(joursAvecDispo[dayIdx].key);
        restant -= consomme;
        minRestants -= consomme;
        if (minRestants <= 0) {
          dayIdx++;
          if (dayIdx < joursAvecDispo.length) minRestants = joursAvecDispo[dayIdx].mins;
        }
      }
      assignationJours[notion.id] = [...joursOccupes];
    }

    // Notions assignées à aujourd'hui (prioritaires dans le défi)
    const notionsDuJour = notionsCetteSemaine.filter(
      (n) => assignationJours[n.id]?.includes(jourAujourdhuiKey)
    );

    // Toutes les notions planifiées (pour la sidebar / pills) — notions du jour en tête
    const ORDRE: PrioriteNotion[] = ["URGENT", "IMPORTANT", "PLUS_TARD"];
    const notionsRestantes = notionsActives.filter(
      (n) => !notionsDuJour.some((d) => d.id === n.id)
    ).sort((a, b) => ORDRE.indexOf(a.priorite) - ORDRE.indexOf(b.priorite));

    // notionsPlanifiees = notions du jour en premier, puis les autres
    const notionsPlanifiees = [...notionsDuJour, ...notionsRestantes];

    // Notions SRS dues aujourd'hui (prochaineRevision <= now)
    const notionsSRS = profil.niveauxMatieres
      .filter((nm) => nm.prochaineRevision && new Date(nm.prochaineRevision) <= now)
      .map((nm) => nm.matiere);

    // Exercices en attente déjà générés (non-commencés ou en cours)
    const exercicesEnAttente = await ctx.prisma.exerciceAssigne.findMany({
      where: {
        eleveId: profil.id,
        statut: { in: ["NON_COMMENCE", "EN_COURS"] },
      },
      include: { exercice: true },
      orderBy: { dateAssignation: "desc" },
      take: 10,
    });

    // Séparer : exercices liés au plan vs libres
    // (pour l'instant tous sont "libres" — la distinction se fera à la génération)
    const exercicesPlan = exercicesEnAttente.filter((e) =>
      notionsPlanifiees.some((n) => {
        const contenu = e.exercice.contenu as Record<string, unknown>;
        return contenu?.notion === n.notion || contenu?.notions?.toString().includes(n.notion);
      })
    );
    const exercicesLibres = exercicesEnAttente.filter(
      (e) => !exercicesPlan.some((ep) => ep.id === e.id)
    );

    // Calcul des objectifs avec sous-objectifs déclinés
    const objectifsAvecSousObjectifs = profil.objectifsNotes.map((obj) => {
      const scoreActuel = scoreMatiere(profil.niveauxMatieres, obj.matiere);
      const gap = Math.max(0, obj.scoreVise - scoreActuel);
      const joursRestants = Math.max(1, Math.ceil((new Date(obj.dateEcheance).getTime() - now.getTime()) / 86400000));
      const semainesRestantes = Math.max(1, Math.ceil(joursRestants / 7));
      const moisRestants = Math.max(1, Math.ceil(joursRestants / 30));

      // Sous-objectifs déclinés
      const gainParMois = gap / moisRestants;
      const gainParSemaine = gap / semainesRestantes;
      const notionsUrgentes = notionsPlanifiees
        .filter((n) => n.matiere === obj.matiere && n.priorite === "URGENT")
        .length;

      return {
        ...obj,
        scoreActuel,
        joursRestants,
        progressionPct: obj.scoreVise > obj.scoreDepart
          ? Math.min(100, Math.round(((scoreActuel - obj.scoreDepart) / (obj.scoreVise - obj.scoreDepart)) * 100))
          : 100,
        sousObjectifs: {
          mensuel:  { scoreVise: Math.min(100, Math.round(scoreActuel + gainParMois)),   label: `+${Math.round(gainParMois)} pts ce mois-ci` },
          hebdo:    { scoreVise: Math.min(100, Math.round(scoreActuel + gainParSemaine)), label: `+${Math.round(gainParSemaine)} pts cette semaine` },
          journalier: { minutesCibles: minutesDispo, label: `${minutesDispo} min d'exercices aujourd'hui` },
          notionsUrgentes,
        },
      };
    });

    // Titre motivant du jour
    const joursNoms = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const jourNom = joursNoms[now.getDay()];
    const premierObjectifMatiere = objectifsAvecSousObjectifs[0];
    const titreDuJour = premierObjectifMatiere
      ? getTitreDuJour(jourNom, premierObjectifMatiere.matiere, notionsPlanifiees[0]?.notion)
      : `C'est ${jourNom} — en avant ! ⚡`;

    return {
      titreDuJour,
      minutesDispo,
      exercicesPlan,
      exercicesLibres,
      notionsPlanifiees: notionsPlanifiees.slice(0, 6),
      notionsSRSDues: notionsSRS,
      objectifs: objectifsAvecSousObjectifs,
      aUnPlan: notionsPlanifiees.length > 0 || objectifsAvecSousObjectifs.length > 0,
    };
  }),

  // ── Notions disponibles pour la matière + niveau de l'élève ───────────────

  getNotionsPourMatiere: protectedProcedure
    .input(z.object({ matiere: z.nativeEnum(Matiere) }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUnique({
        where: { userId: ctx.user.id },
        include: {
          niveauxMatieres: true,
          planifNotions: true,
        },
      });
      if (!profil) throw new TRPCError({ code: "NOT_FOUND" });

      const cycle = NIVEAU_TO_CYCLE[profil.niveauScolaire] ?? "PRIMAIRE_C2";
      const sequences = getNotionsPourNiveau(input.matiere, profil.niveauScolaire);

      const scoreGlobal = scoreMatiere(profil.niveauxMatieres, input.matiere);
      const planifMap = new Map(profil.planifNotions.map((p) => [p.notion, p.priorite]));

      return sequences.map((seq) => ({
        ...seq,
        notions: seq.notions
          .filter((n) => n.cycles.includes(cycle))
          .map((n) => ({
            ...n,
            priorite: planifMap.get(n.id) ?? prioriteAuto(scoreGlobal) as PrioriteNotion,
            dansPlan: planifMap.has(n.id),
          })),
      })).filter((seq) => seq.notions.length > 0);
    }),
});

// ── Titres motivants ──────────────────────────────────────────────────────────

const MATIERES_FR: Record<string, string> = {
  MATHEMATIQUES: "les maths",
  FRANCAIS: "le français",
  SCIENCES: "les sciences",
  UNIVERS_SOCIAL: "l'univers social",
  ANGLAIS: "l'anglais",
  ARTS: "les arts",
  ETHIQUE: "l'éthique",
  EDUCATION_PHYSIQUE: "l'éducation physique",
};

function getTitreDuJour(jour: string, matiere: string, notion?: string): string {
  const mat = MATIERES_FR[matiere] ?? "tes matières";
  const titres = [
    `C'est ${jour} — attaquons ${mat} ! ⚔️`,
    `${jour.charAt(0).toUpperCase() + jour.slice(1)} : on conquiert ${mat} ! 🏆`,
    `Aujourd'hui on progresse en ${mat} ! 🚀`,
    `${jour.charAt(0).toUpperCase() + jour.slice(1)} de champion${notion ? ` — cap sur les ${notion.toLowerCase()}` : ""} ! 🔥`,
  ];
  return titres[new Date().getDate() % titres.length];
}
