import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getRandomQuestions } from "@/lib/jeux/quiz-questions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Joueur = { eleveId: string; prenom: string; pret: boolean; score: number };

// Puissance 4
type EtatP4 = {
  grille: number[][];       // 6 rows × 7 cols, 0=vide 1=j1 2=j2
  tourIndex: 0 | 1;
  gagnant: number | null;   // 1 or 2
  dernierCoup: { row: number; col: number } | null;
  ligneGagnante: [number, number][] | null;
};

// Bataille navale
type Navire = { cases: [number, number][]; coule: boolean };
type EtatBN = {
  phase: "placement" | "combat";
  navires: Record<string, Navire[]>;
  tirs: Record<string, [number, number][]>;
  tourIndex: 0 | 1;
};

// Quiz Duel
type EtatQD = {
  questions: { q: string; options: [string, string, string, string]; correct: number; categorie: string }[];
  qIndex: number;
  debutQ: number;
  reponses: Record<string, { rep: number; ms: number }>;
  scores: Record<string, number>;
  fini: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkP4(grille: number[][]): { gagnant: number | null; ligne: [number, number][] | null } {
  const ROWS = 6, COLS = 7;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grille[r][c];
      if (!v) continue;
      for (const [dr, dc] of dirs) {
        const ligne: [number, number][] = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr*k, nc = c + dc*k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grille[nr][nc] !== v) break;
          ligne.push([nr, nc]);
        }
        if (ligne.length === 4) return { gagnant: v, ligne };
      }
    }
  }
  return { gagnant: null, ligne: null };
}

function dropP4(grille: number[][], col: number, joueur: number): { row: number; ok: boolean } {
  for (let r = 5; r >= 0; r--) {
    if (grille[r][col] === 0) { grille[r][col] = joueur; return { row: r, ok: true }; }
  }
  return { row: -1, ok: false };
}

const TAILLES_NAVIRES = [4, 3, 3, 2, 2]; // 5 navires

function touche(navires: Navire[], r: number, c: number): { hit: boolean; coule: boolean } {
  for (const n of navires) {
    if (n.cases.some(([nr, nc]) => nr === r && nc === c)) {
      n.coule = n.cases.every(([nr, nc]) =>
        [r, c].toString() === [nr, nc].toString() || n.cases.filter(cas => cas.toString() !== [nr,nc].toString()).every(() => false)
      );
      // Recalculate properly
      const allHit = (tirs: [number,number][]) =>
        n.cases.every(([nr, nc]) => tirs.some(([tr, tc]) => tr === nr && tc === nc));
      return { hit: true, coule: false }; // coule computed later with tirs
    }
  }
  return { hit: false, coule: false };
}

function navireCoulé(navire: Navire, tirs: [number, number][]): boolean {
  return navire.cases.every(([r, c]) => tirs.some(([tr, tc]) => tr === r && tc === c));
}

function tousCoules(navires: Navire[], tirs: [number, number][]): boolean {
  return navires.every(n => navireCoulé(n, tirs));
}

// ── Coûts XP par jeu multijoueur ──────────────────────────────────────────────

const XP_MULTI: Record<string, number> = {
  puissance4: 15,
  bataille_navale: 25,
  quiz_duel: 20,
};

// ── Router ────────────────────────────────────────────────────────────────────

export const multijoueurRouter = createTRPCRouter({

  creerPartie: protectedProcedure
    .input(z.object({ jeuId: z.enum(["puissance4", "bataille_navale", "quiz_duel"]) }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, prenom: true },
      });

      // Build initial game state
      let etat: EtatP4 | EtatBN | EtatQD;
      if (input.jeuId === "puissance4") {
        etat = {
          grille: Array.from({ length: 6 }, () => Array(7).fill(0)),
          tourIndex: 0, gagnant: null, dernierCoup: null, ligneGagnante: null,
        } satisfies EtatP4;
      } else if (input.jeuId === "bataille_navale") {
        etat = {
          phase: "placement",
          navires: { [profil.id]: [] },
          tirs: { [profil.id]: [] },
          tourIndex: 0,
        } satisfies EtatBN;
      } else {
        etat = {
          questions: getRandomQuestions(10),
          qIndex: 0,
          debutQ: Date.now(),
          reponses: {},
          scores: { [profil.id]: 0 },
          fini: false,
        } satisfies EtatQD;
      }

      let code = genCode();
      // Ensure uniqueness
      while (await ctx.prisma.partieMultijoueur.findUnique({ where: { code } })) {
        code = genCode();
      }

      const partie = await ctx.prisma.partieMultijoueur.create({
        data: {
          code,
          jeuId: input.jeuId,
          createurId: profil.id,
          joueurs: [{ eleveId: profil.id, prenom: profil.prenom, pret: false, score: 0 }] as unknown as never,
          etat: etat as unknown as never,
          statut: "EN_ATTENTE",
          maxJoueurs: 2,
        },
      });

      return { code: partie.code, partieId: partie.id };
    }),

  rejoindrePartie: protectedProcedure
    .input(z.object({ code: z.string().toUpperCase() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true, prenom: true },
      });

      const partie = await ctx.prisma.partieMultijoueur.findUnique({ where: { code: input.code } });
      if (!partie) throw new TRPCError({ code: "NOT_FOUND", message: "Code introuvable." });
      if (partie.statut !== "EN_ATTENTE") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette partie est déjà commencée ou terminée." });

      const joueurs = partie.joueurs as Joueur[];
      if (joueurs.length >= partie.maxJoueurs) throw new TRPCError({ code: "BAD_REQUEST", message: "La partie est complète." });
      if (joueurs.some(j => j.eleveId === profil.id)) return { code: partie.code }; // already in

      // Add player and update game state with their data
      const newJoueurs: Joueur[] = [...joueurs, { eleveId: profil.id, prenom: profil.prenom, pret: false, score: 0 }];
      const etat = partie.etat as Record<string, unknown>;

      // Inject new player into state
      if (partie.jeuId === "bataille_navale") {
        const bn = etat as unknown as EtatBN;
        bn.navires[profil.id] = [];
        bn.tirs[profil.id] = [];
      } else if (partie.jeuId === "quiz_duel") {
        const qd = etat as unknown as EtatQD;
        qd.scores[profil.id] = 0;
      }

      const partieComplete = newJoueurs.length >= partie.maxJoueurs;
      const xpCout = XP_MULTI[partie.jeuId] ?? 20;

      if (partieComplete) {
        // Validate and deduct XP from both players simultaneously
        const [profilJoiner, profilCreateur] = await Promise.all([
          ctx.prisma.profilEleve.findUniqueOrThrow({ where: { id: profil.id }, select: { id: true, totalPoints: true } }),
          ctx.prisma.profilEleve.findUniqueOrThrow({ where: { id: partie.createurId }, select: { id: true, totalPoints: true } }),
        ]);

        if (profilJoiner.totalPoints < xpCout) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Tu n'as pas assez de XP pour jouer. Il te faut ${xpCout} XP.` });
        }
        if (profilCreateur.totalPoints < xpCout) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Ton ami n'a pas assez de XP pour jouer (${xpCout} XP requis).` });
        }

        await ctx.prisma.$transaction([
          ctx.prisma.profilEleve.update({
            where: { id: profilJoiner.id },
            data: { totalPoints: Math.max(0, profilJoiner.totalPoints - xpCout) },
          }),
          ctx.prisma.profilEleve.update({
            where: { id: profilCreateur.id },
            data: { totalPoints: Math.max(0, profilCreateur.totalPoints - xpCout) },
          }),
          ctx.prisma.partieMultijoueur.update({
            where: { code: input.code },
            data: {
              joueurs: newJoueurs as unknown as never,
              etat: etat as unknown as never,
              statut: "EN_COURS",
            },
          }),
        ]);
      } else {
        await ctx.prisma.partieMultijoueur.update({
          where: { code: input.code },
          data: {
            joueurs: newJoueurs as unknown as never,
            etat: etat as unknown as never,
            statut: "EN_ATTENTE",
          },
        });
      }

      return { code: input.code };
    }),

  getPartie: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const partie = await ctx.prisma.partieMultijoueur.findUnique({ where: { code: input.code } });
      if (!partie) throw new TRPCError({ code: "NOT_FOUND" });

      const joueurs = partie.joueurs as Joueur[];
      if (!joueurs.some(j => j.eleveId === profil.id)) throw new TRPCError({ code: "FORBIDDEN" });

      return {
        id: partie.id,
        code: partie.code,
        jeuId: partie.jeuId,
        joueurs,
        etat: partie.etat,
        statut: partie.statut,
        gagnantId: partie.gagnantId,
        monEleveId: profil.id,
        updatedAt: partie.updatedAt,
      };
    }),

  jouerCoup: protectedProcedure
    .input(z.object({ code: z.string(), coup: z.any() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      const partie = await ctx.prisma.partieMultijoueur.findUnique({ where: { code: input.code } });
      if (!partie || partie.statut !== "EN_COURS") throw new TRPCError({ code: "BAD_REQUEST", message: "Partie non active." });

      const joueurs = partie.joueurs as Joueur[];
      const monIndex = joueurs.findIndex(j => j.eleveId === profil.id);
      if (monIndex === -1) throw new TRPCError({ code: "FORBIDDEN" });

      let gagnantId: string | null = null;

      // ── Puissance 4 ──────────────────────────────────────────────────────────
      if (partie.jeuId === "puissance4") {
        const etat = partie.etat as unknown as EtatP4;
        if (etat.gagnant) throw new TRPCError({ code: "BAD_REQUEST", message: "Partie déjà terminée." });
        if (etat.tourIndex !== monIndex) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce n'est pas ton tour." });

        const col = input.coup.col as number;
        const { row, ok } = dropP4(etat.grille, col, monIndex + 1);
        if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Colonne pleine." });

        etat.dernierCoup = { row, col };
        const { gagnant, ligne } = checkP4(etat.grille);
        etat.gagnant = gagnant;
        etat.ligneGagnante = ligne;

        if (gagnant) {
          const gagnantJoueur = joueurs[gagnant - 1];
          gagnantId = gagnantJoueur.eleveId;
          joueurs[gagnant - 1].score += 100;
        } else {
          etat.tourIndex = etat.tourIndex === 0 ? 1 : 0;
        }

        const estFini = !!gagnant || etat.grille[0].every(c => c !== 0);
        await ctx.prisma.partieMultijoueur.update({
          where: { code: input.code },
          data: {
            etat: etat as unknown as never,
            joueurs: joueurs as unknown as never,
            statut: estFini ? "TERMINEE" : "EN_COURS",
            gagnantId: gagnantId ?? undefined,
          },
        });
      }

      // ── Bataille navale ──────────────────────────────────────────────────────
      else if (partie.jeuId === "bataille_navale") {
        const etat = partie.etat as unknown as EtatBN;
        const adversaireId = joueurs.find(j => j.eleveId !== profil.id)?.eleveId;
        if (!adversaireId) throw new TRPCError({ code: "BAD_REQUEST" });

        if (etat.phase === "placement") {
          // coup = { navires: Navire[] }
          etat.navires[profil.id] = input.coup.navires;
          const tousPlaces = joueurs.every(j => etat.navires[j.eleveId]?.length === TAILLES_NAVIRES.length);
          if (tousPlaces) etat.phase = "combat";

        } else {
          // coup = { row, col }
          if (etat.tourIndex !== monIndex) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce n'est pas ton tour." });

          const { row, col } = input.coup as { row: number; col: number };
          if (!etat.tirs[profil.id]) etat.tirs[profil.id] = [];
          etat.tirs[profil.id].push([row, col]);

          // Mark coulé
          const navAdv = etat.navires[adversaireId];
          for (const n of navAdv) {
            if (!n.coule && navireCoulé(n, etat.tirs[profil.id])) n.coule = true;
          }

          const victoire = tousCoules(navAdv, etat.tirs[profil.id]);
          if (victoire) {
            gagnantId = profil.id;
            joueurs[monIndex].score += 200;
          } else {
            etat.tourIndex = etat.tourIndex === 0 ? 1 : 0;
          }

          await ctx.prisma.partieMultijoueur.update({
            where: { code: input.code },
            data: {
              etat: etat as unknown as never,
              joueurs: joueurs as unknown as never,
              statut: victoire ? "TERMINEE" : "EN_COURS",
              gagnantId: gagnantId ?? undefined,
            },
          });
        }

        if (etat.phase === "placement") {
          await ctx.prisma.partieMultijoueur.update({
            where: { code: input.code },
            data: { etat: etat as unknown as never },
          });
        }
      }

      // ── Quiz Duel ────────────────────────────────────────────────────────────
      else if (partie.jeuId === "quiz_duel") {
        const etat = partie.etat as unknown as EtatQD;
        if (etat.fini) throw new TRPCError({ code: "BAD_REQUEST" });

        const { rep } = input.coup as { rep: number };
        const ms = Date.now() - etat.debutQ;
        if (!etat.reponses) etat.reponses = {};
        etat.reponses[profil.id] = { rep, ms };

        const q = etat.questions[etat.qIndex];
        const correct = rep === q.correct;
        if (correct) {
          const bonus = Math.max(0, Math.floor((15000 - ms) / 100)); // speed bonus
          etat.scores[profil.id] = (etat.scores[profil.id] ?? 0) + 100 + bonus;
          joueurs[monIndex].score = etat.scores[profil.id];
        }

        // Advance if all players answered
        const allAnswered = joueurs.every(j => etat.reponses[j.eleveId] !== undefined);
        if (allAnswered) {
          if (etat.qIndex >= etat.questions.length - 1) {
            etat.fini = true;
            // determine winner
            const maxScore = Math.max(...joueurs.map(j => etat.scores[j.eleveId] ?? 0));
            const winner = joueurs.find(j => (etat.scores[j.eleveId] ?? 0) === maxScore);
            gagnantId = winner?.eleveId ?? null;
          } else {
            etat.qIndex++;
            etat.debutQ = Date.now();
            etat.reponses = {};
          }
        }

        await ctx.prisma.partieMultijoueur.update({
          where: { code: input.code },
          data: {
            etat: etat as unknown as never,
            joueurs: joueurs as unknown as never,
            statut: etat.fini ? "TERMINEE" : "EN_COURS",
            gagnantId: gagnantId ?? undefined,
          },
        });
      }

      return { ok: true, gagnantId };
    }),

  quitterPartie: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      const partie = await ctx.prisma.partieMultijoueur.findUnique({ where: { code: input.code } });
      if (!partie) return { ok: true };
      if (partie.createurId === profil.id || partie.statut === "EN_ATTENTE") {
        await ctx.prisma.partieMultijoueur.update({
          where: { code: input.code },
          data: { statut: "ANNULEE" },
        });
      }
      return { ok: true };
    }),

  rechercherEleve: protectedProcedure
    .input(z.object({ recherche: z.string().min(2).max(50) }))
    .query(async ({ ctx, input }) => {
      const profil = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      const eleves = await ctx.prisma.profilEleve.findMany({
        where: {
          id: { not: profil.id },
          prenom: { contains: input.recherche, mode: "insensitive" },
        },
        select: { id: true, prenom: true, niveauScolaire: true },
        take: 8,
      });
      // Derive a stable 4-digit anonymous code from the DB id (no personal data exposed)
      return eleves.map((e) => {
        const hash = e.id.replace(/-/g, "");
        const code = parseInt(hash.slice(-6), 16) % 10000;
        return {
          id: e.id,
          prenom: e.prenom,
          niveauScolaire: e.niveauScolaire,
          codeAnonyme: String(code).padStart(4, "0"),
        };
      });
    }),

  envoyerInvitation: protectedProcedure
    .input(z.object({ eleveId: z.string(), partieCode: z.string(), jeuNom: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expediteur = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { userId: ctx.user.id },
        select: { prenom: true, userId: true },
      });
      const destinataire = await ctx.prisma.profilEleve.findUniqueOrThrow({
        where: { id: input.eleveId },
        select: { userId: true },
      });
      await ctx.prisma.notification.create({
        data: {
          expediteurId: expediteur.userId,
          destinataireId: destinataire.userId,
          type: "INVITATION_JEU",
          titre: `${expediteur.prenom} t'invite à jouer !`,
          contenu: `Rejoins la partie de ${input.jeuNom} avec le code ${input.partieCode}`,
          donnees: { partieCode: input.partieCode, jeuNom: input.jeuNom, expediteurPrenom: expediteur.prenom },
        },
      });
      return { ok: true };
    }),

  getMesInvitations: protectedProcedure
    .query(async ({ ctx }) => {
      const invitations = await ctx.prisma.notification.findMany({
        where: {
          destinataire: { id: { not: undefined } },
          destinataireId: (await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { id: true } })).id,
          type: "INVITATION_JEU",
          lue: false,
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          titre: true,
          contenu: true,
          donnees: true,
          createdAt: true,
        },
      });
      return invitations;
    }),

  marquerInvitationLue: protectedProcedure
    .input(z.object({ notifId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.update({
        where: { id: input.notifId },
        data: { lue: true },
      });
      return { ok: true };
    }),
});
