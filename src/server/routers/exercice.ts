import { createTRPCRouter, protectedProcedure, aiProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { generateExercice, genererFeedback, genererEpreuve, genererFeedbackEpreuve, type EpreuveGeneree } from "@/lib/ai/exercice";
import { genererCours } from "@/lib/ai/cours";
import { getContexteDocuments } from "@/lib/ai/contexte-documents";
import { Matiere, TypeExercice, NiveauDifficulte, StatutExercice } from "@/generated/prisma";
import { waitUntil } from "@vercel/functions";
import { detecterEtCreerSurprise } from "@/lib/surprises/detecter-jalon";

const zNotion = z.object({ label: z.string(), description: z.string() });

export const exerciceRouter = createTRPCRouter({
  // Générer un exercice IA adapté au profil
  generer: aiProcedure
    .input(
      z.object({
        matiere: z.nativeEnum(Matiere),
        type: z.nativeEnum(TypeExercice).optional(),
        competencePFEQ: z.string().optional(),
        notions: z.array(zNotion).optional(),
        difficulteChoisie: z.nativeEnum(NiveauDifficulte).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        include: {
          niveauxMatieres: { where: { matiere: input.matiere } },
          checkIns: { orderBy: { date: "desc" }, take: 1 },
        },
      });

      const niveauMatiere = profil.niveauxMatieres[0];
      const dernierCheckIn = profil.checkIns[0];

      const contexteDocuments = await getContexteDocuments(ctx.prisma, {
        matiere: input.matiere,
        niveauScolaire: profil.niveauScolaire,
      });

      let exerciceData;
      try {
        exerciceData = await generateExercice({
          profil: {
            prenom: profil.prenom,
            niveauScolaire: profil.niveauScolaire,
            styleApprentissage: profil.styleApprentissage,
            tdah: profil.tdah,
            dyslexie: profil.dyslexie,
            anxieteScolaire: profil.anxieteScolaire,
            centresInteret: profil.centresInteret as string[],
            sportFavori: profil.sportFavori,
            universMediatique: profil.universMediatique,
            autresPassions: profil.autresPassions,
            environnement: profil.environnement,
            personnalite: profil.personnalite as string[],
            objectifScolaire: profil.objectifScolaire,
          },
          matiere: input.matiere,
          type: input.type,
          niveauActuel: niveauMatiere?.niveau ?? "ATTENDU",
          etatEmotionnel: dernierCheckIn?.etat,
          competencePFEQ: input.competencePFEQ,
          notions: input.notions,
          contexteDocuments: contexteDocuments || undefined,
          difficulteChoisie: input.difficulteChoisie,
          lacunes: niveauMatiere?.lacunes?.length ? niveauMatiere.lacunes : undefined,
        });
      } catch (aiError) {
        console.error(`[generer] Échec génération exercice pour élève ${profil.id} (${profil.prenom}), matière ${input.matiere}:`, aiError);
        throw aiError;
      }

      // Sauvegarder l'exercice
      const exercice = await ctx.prisma.exercice.create({
        data: {
          titre: String(exerciceData.titre ?? "Exercice"),
          consigne: String(exerciceData.consigne ?? ""),
          contenu: exerciceData.contenu,
          type: exerciceData.type,
          matiere: input.matiere,
          niveauScolaire: profil.niveauScolaire,
          difficulte: exerciceData.difficulte,
          competencesPFEQ: (exerciceData.competencesPFEQ ?? []).map(String),
          dureeMinutes: Math.round(Number(exerciceData.dureeMinutes) || 10),
          correctionAttendue: exerciceData.correctionAttendue ?? null,
        },
      });

      // Assigner à l'élève
      const assigne = await ctx.prisma.exerciceAssigne.create({
        data: {
          eleveId: profil.id,
          exerciceId: exercice.id,
          statut: "NON_COMMENCE",
        },
        include: { exercice: true },
      });

      return assigne;
    }),

  // Soumettre une réponse
  soumettre: protectedProcedure
    .input(
      z.object({
        exerciceAssigneId: z.string().min(1).max(128),
        reponse: z.unknown(),
        tempsSecondes: z.number().min(0).max(86400).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: {
          id: true, prenom: true, niveauScolaire: true, styleApprentissage: true,
          tdah: true, dyslexie: true, anxieteScolaire: true,
          centresInteret: true, sportFavori: true, universMediatique: true,
          autresPassions: true, environnement: true, personnalite: true, objectifScolaire: true,
        },
      });

      const assignation = await ctx.prisma.exerciceAssigne.findUniqueOrThrow({
        where: { id: input.exerciceAssigneId, eleveId: profil.id },
        include: { exercice: true },
      });

      const profilCompletFeedback = {
        prenom: profil.prenom,
        niveauScolaire: profil.niveauScolaire,
        styleApprentissage: profil.styleApprentissage,
        tdah: profil.tdah,
        dyslexie: profil.dyslexie,
        anxieteScolaire: profil.anxieteScolaire,
        centresInteret: profil.centresInteret as string[],
        sportFavori: profil.sportFavori,
        universMediatique: profil.universMediatique,
        autresPassions: profil.autresPassions,
        environnement: profil.environnement,
        personnalite: profil.personnalite as string[],
        objectifScolaire: profil.objectifScolaire,
      };

      // Générer le feedback IA selon le type d'exercice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let feedback: { score: number; [key: string]: any };
      try {
        feedback = assignation.exercice.type === "EPREUVE_COMPLETE"
          ? await genererFeedbackEpreuve({
              epreuve: assignation.exercice.contenu as unknown as EpreuveGeneree,
              reponses: input.reponse as Record<string, string>,
              profil: profilCompletFeedback,
            })
          : await genererFeedback({
              exercice: assignation.exercice,
              correctionAttendue: assignation.exercice.correctionAttendue ?? undefined,
              reponseEleve: input.reponse,
              profil: profilCompletFeedback,
            });
      } catch (feedbackErr) {
        console.error("[soumettre] Échec génération feedback pour assignation", input.exerciceAssigneId, feedbackErr);
        // Fallback minimal pour ne pas bloquer la soumission
        feedback = { score: 0, correct: false, explication: "Correction temporairement indisponible. Votre réponse a bien été enregistrée." };
      }

      // Normaliser le score — protège contre NaN/undefined/null (incrément invalide en DB)
      const scoreNormalise = typeof feedback.score === "number" && isFinite(feedback.score)
        ? Math.min(100, Math.max(0, feedback.score))
        : 0;
      feedback.score = scoreNormalise;

      // ── Détection objectif atteint (avant waitUntil) ──────────────────────
      // On charge le NiveauMatiere actuel + l'objectif de note pour cette matière.
      // Si le score projeté franchit la cible → on retourne l'info au client.
      const matiereCourante = assignation.exercice.matiere;
      const [niveauPourObjectif, objectifNote] = await Promise.all([
        ctx.prisma.niveauMatiere.findUnique({
          where: { eleveId_matiere: { eleveId: profil.id, matiere: matiereCourante } },
          select: { scoreGlobal: true },
        }),
        ctx.prisma.objectifNote.findUnique({
          where: { eleveId_matiere: { eleveId: profil.id, matiere: matiereCourante } },
          select: { id: true, scoreVise: true, atteint: true },
        }),
      ]);

      const scoreGlobalActuel = niveauPourObjectif?.scoreGlobal ?? scoreNormalise;
      const scoreGlobalProjeté = scoreGlobalActuel * 0.6 + scoreNormalise * 0.4;
      const objectifVientDEtreAtteint =
        objectifNote !== null &&
        !objectifNote.atteint &&
        (
          // Cas standard : franchissement au cours de cet exercice
          (scoreGlobalActuel < objectifNote.scoreVise && scoreGlobalProjeté >= objectifNote.scoreVise) ||
          // Cas rattrapage : objectif déjà dépassé mais jamais célébré (ex: Charbel)
          scoreGlobalActuel >= objectifNote.scoreVise
        );

      // ── OPÉRATION CRITIQUE : enregistrer la soumission (~2s) ─────────────
      // C'est la SEULE opération qui bloque la réponse à l'élève.
      const updated = await ctx.prisma.exerciceAssigne.update({
        where: { id: input.exerciceAssigneId },
        data: {
          statut: "TERMINE",
          reponseEleve: input.reponse as object,
          score: feedback.score,
          tempsSecondes: input.tempsSecondes,
          feedbackIA: JSON.stringify(feedback),
          dateFin: new Date(),
          nbTentatives: { increment: 1 },
        },
      });

      // ── OPÉRATIONS SECONDAIRES : lancées en arrière-plan via waitUntil ───
      // Elles ne bloquent PAS la réponse. Si elles échouent, la soumission
      // est déjà enregistrée et l'élève voit ses résultats.
      const score = feedback.score;
      const pointsGagnes = Math.round(score);
      const eleveId = profil.id;
      const matiere = assignation.exercice.matiere;
      const dureeEstimeeSecondes = assignation.exercice.dureeMinutes * 60;

      waitUntil(
        (async () => {
          try {
            // ── SRS : calcul de la prochaine révision selon le score ────────
            const joursRevision = score < 60 ? 1 : score < 80 ? 3 : score < 90 ? 7 : 14;
            const prochaineRevision = new Date();
            prochaineRevision.setDate(prochaineRevision.getDate() + joursRevision);
            prochaineRevision.setHours(8, 0, 0, 0);

            // ── Lacunes : lire l'état actuel avant mise à jour ──────────────
            const niveauActuel = await ctx.prisma.niveauMatiere.findUnique({
              where: { eleveId_matiere: { eleveId, matiere } },
              select: { lacunes: true, scoreGlobal: true },
            });

            const lacunesActuelles = niveauActuel?.lacunes ?? [];
            let nouvellesLacunes = [...lacunesActuelles];

            const diag = (feedback as { diagnosticErreur?: { typeErreur?: string; explication?: string } }).diagnosticErreur;
            if (score < 70 && (diag?.typeErreur === "lacune_conceptuelle" || diag?.typeErreur === "erreur_de_procedure") && diag.explication) {
              // Ajouter la lacune si pas déjà présente (max 5)
              if (!nouvellesLacunes.includes(diag.explication)) {
                nouvellesLacunes = [diag.explication, ...nouvellesLacunes].slice(0, 5);
              }
            } else if (score >= 80 && nouvellesLacunes.length > 0) {
              // Bon score : retirer la lacune la plus ancienne
              nouvellesLacunes = nouvellesLacunes.slice(0, -1);
            }

            // Score global = moyenne pondérée (stable dans le temps)
            const scoreGlobalPrecedent = niveauActuel?.scoreGlobal ?? score;
            const scoreGlobal = scoreGlobalPrecedent * 0.6 + score * 0.4;

            await ctx.prisma.niveauMatiere.upsert({
              where: { eleveId_matiere: { eleveId, matiere } },
              create: {
                eleveId, matiere,
                scoreGlobal: score,
                derniereEval: new Date(),
                prochaineRevision,
                lacunes: nouvellesLacunes,
              },
              update: {
                scoreGlobal,
                derniereEval: new Date(),
                prochaineRevision,
                lacunes: nouvellesLacunes,
              },
            });

            let bonusVitesse = 0;
            if (input.tempsSecondes && input.tempsSecondes < dureeEstimeeSecondes / 2 && score >= 70) bonusVitesse = 10;
            const multiplicateur = score === 100 ? 2 : score >= 90 ? 1.5 : 1;
            const pts = Math.round(pointsGagnes * multiplicateur) + bonusVitesse;

            const updatedProfil = await ctx.prisma.profilEleve.update({
              where: { id: eleveId },
              data: { totalPoints: { increment: pts } },
              select: { totalPoints: true, niveauJeu: true, streakJours: true, streakMaxJours: true, streakBoucliers: true, derniereConnexion: true },
            });

            const niveauJeu = Math.floor(updatedProfil.totalPoints / 500) + 1;
            const maintenant = new Date();
            let streakJours = updatedProfil.streakJours;
            let bouclierConsomme = false;
            if (!updatedProfil.derniereConnexion) { streakJours = 1; }
            else {
              const diffJours = Math.floor((maintenant.getTime() - updatedProfil.derniereConnexion.getTime()) / (1000 * 60 * 60 * 24));
              if (diffJours === 1) streakJours += 1;
              else if (diffJours > 1) {
                if (updatedProfil.streakBoucliers > 0) bouclierConsomme = true;
                else streakJours = 1;
              }
            }
            await ctx.prisma.profilEleve.update({
              where: { id: eleveId },
              data: { niveauJeu, streakJours, streakMaxJours: Math.max(streakJours, updatedProfil.streakMaxJours), derniereConnexion: maintenant, ...(bouclierConsomme ? { streakBoucliers: { decrement: 1 } } : {}) },
            });
            if (streakJours > 0 && streakJours % 7 === 0) {
              await ctx.prisma.profilEleve.update({ where: { id: eleveId }, data: { streakBoucliers: { increment: 1 } } });
            }

            // ── Objectif de note atteint → +50 XP bonus + marquer atteint ───
            if (objectifVientDEtreAtteint && objectifNote) {
              await Promise.all([
                ctx.prisma.objectifNote.update({
                  where: { id: objectifNote.id },
                  data: { atteint: true },
                }),
                ctx.prisma.profilEleve.update({
                  where: { id: eleveId },
                  data: { totalPoints: { increment: 50 } },
                }),
              ]);
            }

            // ── Détection surprise parentale (max 7/an, cooldown 30j) ────────
            await detecterEtCreerSurprise(
              ctx.prisma,
              {
                id: eleveId,
                prenom: profil.prenom,
                streakJours,
                centresInteret: profil.centresInteret as string[],
                sportFavori: profil.sportFavori,
                universMediatique: profil.universMediatique,
                autresPassions: profil.autresPassions,
              },
              score,
              matiere,
              assignation.nbTentatives // nombre de tentatives AVANT cette soumission
            );

            const totalTermines = await ctx.prisma.exerciceAssigne.count({ where: { eleveId, statut: "TERMINE" } });
            if (totalTermines % 3 === 0) {
              const derniersTrois = await ctx.prisma.exerciceAssigne.findMany({ where: { eleveId, statut: "TERMINE" }, include: { exercice: true }, orderBy: { dateFin: "desc" }, take: 3 });
              const profilComplet = await ctx.prisma.profilEleve.findUnique({ where: { id: eleveId }, select: { prenom: true, niveauScolaire: true, styleApprentissage: true, tdah: true, dyslexie: true, anxieteScolaire: true, centresInteret: true, sportFavori: true, universMediatique: true, autresPassions: true, personnalite: true } });
              if (profilComplet) {
                const matieresDerniersTrois = [...new Set(derniersTrois.map((e) => e.exercice.matiere))];
                await genererCours(
                  { prenom: profilComplet.prenom, niveauScolaire: profilComplet.niveauScolaire!, styleApprentissage: profilComplet.styleApprentissage, tdah: profilComplet.tdah, dyslexie: profilComplet.dyslexie, anxieteScolaire: profilComplet.anxieteScolaire, centresInteret: profilComplet.centresInteret as string[], sportFavori: profilComplet.sportFavori, universMediatique: profilComplet.universMediatique, autresPassions: profilComplet.autresPassions, personnalite: profilComplet.personnalite as string[] },
                  derniersTrois.map((e) => ({ titre: e.exercice.titre, consigne: e.exercice.consigne, matiere: e.exercice.matiere, reponseEleve: e.reponseEleve, feedbackIA: e.feedbackIA, score: e.score }))
                ).then((coursIA) => ctx.prisma.coursRemediation.create({ data: { eleveId, matieres: matieresDerniersTrois as Matiere[], contenu: coursIA as object, exerciceIds: derniersTrois.map((e) => e.id) } }));
              }
            }
          } catch (err) {
            console.error("[soumettre:secondaires]", err);
          }
        })()
      );

      return {
        assignation: updated,
        feedback,
        pointsGagnes,
        multiplicateur: 1,
        bonusLabel: null,
        totalPoints: 0,
        niveauJeu: 1,
        streakJours: 0,
        levelUp: false,
        milestone: null,
        streakMilestone: null,
        bouclierConsomme: false,
        bouclierGagne: false,
        objectifAtteint: objectifVientDEtreAtteint
          ? { matiere: matiereCourante, scoreVise: objectifNote!.scoreVise }
          : null,
      };
    }),

  // Récupérer les exercices du jour
  getExercicesDuJour: protectedProcedure.query(async ({ ctx }) => {
    const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    return ctx.prisma.exerciceAssigne.findMany({
      where: {
        eleveId: profil.id,
        statut: { in: ["NON_COMMENCE", "EN_COURS"] },
      },
      include: { exercice: true },
      orderBy: { dateAssignation: "desc" },
      take: 5,
    });
  }),

  // Historique complet des exercices
  getHistorique: protectedProcedure
    .input(z.object({
      page:    z.number().min(1).default(1),
      matiere: z.nativeEnum(Matiere).optional(),
      statut:  z.nativeEnum(StatutExercice).optional(),
      tri:     z.enum(["date_desc", "date_asc", "score_desc", "score_asc"]).default("date_desc"),
    }).optional())
    .query(async ({ ctx, input }) => {
      const page    = input?.page ?? 1;
      const perPage = 12;
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const where = {
        eleveId: profil.id,
        ...(input?.statut  ? { statut:  input.statut }  : {}),
        ...(input?.matiere ? { exercice: { matiere: input.matiere } } : {}),
      };

      const orderBy = (() => {
        switch (input?.tri) {
          case "date_asc":   return { dateAssignation: "asc"  as const };
          case "score_desc": return { score: "desc" as const };
          case "score_asc":  return { score: "asc"  as const };
          default:           return { dateAssignation: "desc" as const };
        }
      })();

      const [total, items] = await Promise.all([
        ctx.prisma.exerciceAssigne.count({ where }),
        ctx.prisma.exerciceAssigne.findMany({
          where,
          include: { exercice: true },
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
        }),
      ]);

      return { items, total, page, totalPages: Math.ceil(total / perPage) };
    }),

  // Récupérer un exercice assigné par son id
  getAssigne: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      return ctx.prisma.exerciceAssigne.findUniqueOrThrow({
        where: { id: input.id, eleveId: profil.id },
        include: { exercice: true },
      });
    }),

  // Générer une épreuve complète style PFEQ/SAÉ
  genererEpreuve: aiProcedure
    .input(
      z.object({
        matiere: z.nativeEnum(Matiere),
        notions: z.array(zNotion).min(1),
        dureeMinutes: z.number().min(20).max(120).default(45),
        difficulteChoisie: z.nativeEnum(NiveauDifficulte).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        include: {
          niveauxMatieres: { where: { matiere: input.matiere } },
        },
      });

      const niveauMatiere = profil.niveauxMatieres[0];

      let epreuveData;
      try {
        epreuveData = await genererEpreuve({
          profil: {
            prenom: profil.prenom,
            niveauScolaire: profil.niveauScolaire,
            styleApprentissage: profil.styleApprentissage,
            tdah: profil.tdah,
            dyslexie: profil.dyslexie,
            anxieteScolaire: profil.anxieteScolaire,
            centresInteret: profil.centresInteret as string[],
            sportFavori: profil.sportFavori,
            universMediatique: profil.universMediatique,
            autresPassions: profil.autresPassions,
            environnement: profil.environnement,
            personnalite: profil.personnalite as string[],
            objectifScolaire: profil.objectifScolaire,
          },
          matiere: input.matiere,
          notions: input.notions,
          niveauActuel: niveauMatiere?.niveau ?? "ATTENDU",
          dureeMinutes: input.dureeMinutes,
          difficulteChoisie: input.difficulteChoisie,
        });
      } catch (aiError) {
        console.error(`[genererEpreuve] Échec pour élève ${profil.id} (${profil.prenom}), matière ${input.matiere}:`, aiError);
        throw aiError;
      }

      // Sauvegarder comme un exercice de type EPREUVE_COMPLETE
      const dureeInt = Math.round(Number(epreuveData.dureeMinutes) || input.dureeMinutes);
      const notionsCiblees = Array.isArray(epreuveData.notionsCiblees)
        ? epreuveData.notionsCiblees.map(String)
        : [];
      const difficulteValue: NiveauDifficulte = niveauMatiere?.niveau ?? NiveauDifficulte.ATTENDU;

      // JSON serializable — sans circular refs ni undefined
      const contenuSerialise = JSON.parse(JSON.stringify(epreuveData));

      let exercice;
      try {
        exercice = await ctx.prisma.exercice.create({
          data: {
            titre: String(epreuveData.titre ?? "Épreuve"),
            consigne: String(epreuveData.miseEnSituation ?? "").slice(0, 5000),
            contenu: contenuSerialise,
            type: TypeExercice.EPREUVE_COMPLETE,
            matiere: input.matiere,
            niveauScolaire: profil.niveauScolaire,
            difficulte: difficulteValue,
            competencesPFEQ: notionsCiblees,
            dureeMinutes: dureeInt,
            correctionType: "ia",
            baremePoints: 100,
          },
        });
      } catch (prismaErr) {
        throw prismaErr;
      }

      const assigne = await ctx.prisma.exerciceAssigne.create({
        data: {
          eleveId: profil.id,
          exerciceId: exercice.id,
          statut: "NON_COMMENCE",
        },
        include: { exercice: true },
      });

      return assigne;
    }),
});
