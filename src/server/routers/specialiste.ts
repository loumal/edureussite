import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
  specialisteProcedure,
  aiProcedure,
} from "@/lib/trpc/init";
import { isFeatureActive, FEATURE_KEYS } from "@/lib/features";
import { sendDemandeRencontreEmail } from "@/lib/email/send-demande-rencontre";
import { sendInvitationSpecialiste } from "@/lib/email/send-invitation-specialiste";
import { sendConfirmationRdvEmail } from "@/lib/email/send-confirmation-rdv";
import { sendAnnulationRdvEmail } from "@/lib/email/send-annulation-rdv";
import { sendConfirmationWebinaireEmail } from "@/lib/email/send-confirmation-webinaire";
import { genererRecommandationSpecialiste } from "@/lib/ai/recommandation-specialiste";
import { getContexteDocuments } from "@/lib/ai/contexte-documents";
import type { PrismaClient } from "@/generated/prisma";
import { TRPCError } from "@trpc/server";

export const specialisteRouter = createTRPCRouter({
  // ── Feature flag visible côté client ─────────────────────────────────────
  isActive: protectedProcedure.query(async ({ ctx }) => {
    const param = await ctx.prisma.parametreApp.findUnique({
      where: { cle: "feature_specialistes" },
    });
    return param ? param.valeur === "true" : true;
  }),

  // ── Liste publique des spécialistes actifs ────────────────────────────────
  lister: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.specialiste.findMany({
      where: { actif: true },
      include: {
        webinaires: {
          where: { actif: true, dateHeure: { gte: new Date() } },
          orderBy: { dateHeure: "asc" },
          take: 3,
          include: {
            inscriptions: { select: { id: true } },
          },
        },
      },
      orderBy: { nom: "asc" },
    });
  }),

  // ── Admin : liste complète (actifs + inactifs) ────────────────────────────
  listerAdmin: superAdminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.specialiste.findMany({
      include: {
        webinaires: {
          where: { actif: true, dateHeure: { gte: new Date() } },
          orderBy: { dateHeure: "asc" },
          take: 3,
          include: {
            inscriptions: { select: { id: true } },
          },
        },
      },
      orderBy: { nom: "asc" },
    });
  }),

  // ── Webinaires à venir (tous spécialistes) ───────────────────────────────
  prochainWebinaires: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.webinaire.findMany({
      where: { actif: true, dateHeure: { gte: new Date() } },
      include: {
        specialiste: { select: { prenom: true, nom: true, specialite: true, photo: true } },
        inscriptions: { select: { id: true, parentId: true } },
      },
      orderBy: { dateHeure: "asc" },
      take: 10,
    });
  }),

  // ── Demande de rencontre (parent → spécialiste) ──────────────────────────
  demanderRencontre: protectedProcedure
    .input(
      z.object({
        specialisteId: z.string(),
        eleveId: z.string().optional(),
        prenomEnfant: z.string().optional(),
        message: z.string().min(10).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!await isFeatureActive(FEATURE_KEYS.SPECIALISTES)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cette fonctionnalité est actuellement désactivée." });
      }

      const specialiste = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { id: input.specialisteId },
      });

      const demande = await ctx.prisma.demandeRencontre.create({
        data: {
          specialisteId: input.specialisteId,
          parentId: ctx.user.id,
          eleveId: input.eleveId,
          prenomEnfant: input.prenomEnfant,
          message: input.message,
        },
      });

      await sendDemandeRencontreEmail({
        specialisteEmail: specialiste.email,
        specialisteNom: `${specialiste.prenom} ${specialiste.nom}`,
        parentEmail: ctx.user.email!,
        parentNom: ctx.user.name ?? ctx.user.email!,
        prenomEnfant: input.prenomEnfant,
        message: input.message,
      });

      return demande;
    }),

  // ════════════════════════════════════════════════════════════════════════════
  // PROCÉDURES SPÉCIALISTE
  // ════════════════════════════════════════════════════════════════════════════

  // ── Mon profil ────────────────────────────────────────────────────────────
  monProfil: specialisteProcedure.query(async ({ ctx }) => {
    return ctx.prisma.specialiste.findUniqueOrThrow({
      where: { userId: ctx.user.id },
    });
  }),

  // ── Mes créneaux disponibles ──────────────────────────────────────────────
  mesCreneaux: specialisteProcedure.query(async ({ ctx }) => {
    const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
      where: { userId: ctx.user.id },
    });
    return ctx.prisma.creneauDisponible.findMany({
      where: { specialisteId: spec.id, actif: true },
      include: { rendezVous: { select: { id: true, statut: true } } },
      orderBy: { debut: "asc" },
    });
  }),

  // ── Ajouter un créneau ────────────────────────────────────────────────────
  ajouterCreneau: specialisteProcedure
    .input(z.object({ debut: z.string(), fin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { userId: ctx.user.id },
      });
      return ctx.prisma.creneauDisponible.create({
        data: {
          specialisteId: spec.id,
          debut: new Date(input.debut),
          fin: new Date(input.fin),
        },
      });
    }),

  // ── Supprimer un créneau ──────────────────────────────────────────────────
  supprimerCreneau: specialisteProcedure
    .input(z.object({ creneauId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { userId: ctx.user.id },
      });
      const creneau = await ctx.prisma.creneauDisponible.findFirstOrThrow({
        where: { id: input.creneauId, specialisteId: spec.id },
        include: { rendezVous: true },
      });
      if (creneau.rendezVous) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ce créneau est déjà associé à un rendez-vous.",
        });
      }
      await ctx.prisma.creneauDisponible.delete({ where: { id: input.creneauId } });
      return { success: true };
    }),

  // ── Mes demandes de rencontre ─────────────────────────────────────────────
  mesDemandes: specialisteProcedure.query(async ({ ctx }) => {
    const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
      where: { userId: ctx.user.id },
    });
    return ctx.prisma.demandeRencontre.findMany({
      where: { specialisteId: spec.id },
      include: {
        eleve: { select: { id: true, prenom: true, nom: true, niveauScolaire: true } },
        rendezVous: {
          select: { id: true, statut: true, debut: true, fin: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Proposer un rendez-vous ───────────────────────────────────────────────
  proposerRendezVous: specialisteProcedure
    .input(z.object({ demandeId: z.string(), creneauId: z.string(), lienVisio: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { userId: ctx.user.id },
      });

      const demande = await ctx.prisma.demandeRencontre.findFirstOrThrow({
        where: { id: input.demandeId, specialisteId: spec.id },
      });

      const creneau = await ctx.prisma.creneauDisponible.findFirstOrThrow({
        where: { id: input.creneauId, specialisteId: spec.id, actif: true },
        include: { rendezVous: true },
      });

      if (creneau.rendezVous) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce créneau est déjà réservé." });
      }

      const rdv = await ctx.prisma.rendezVous.create({
        data: {
          demandeId: demande.id,
          creneauId: creneau.id,
          specialisteId: spec.id,
          parentId: demande.parentId,
          eleveId: demande.eleveId,
          debut: creneau.debut,
          fin: creneau.fin,
          lienVisio: input.lienVisio,
        },
      });

      await ctx.prisma.demandeRencontre.update({
        where: { id: demande.id },
        data: { statut: "CONFIRME" },
      });

      // Récupérer les emails
      const [parent, eleve] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { id: demande.parentId }, select: { email: true, name: true } }),
        demande.eleveId
          ? ctx.prisma.profilEleve.findUnique({ where: { id: demande.eleveId }, select: { prenom: true } })
          : null,
      ]);

      if (parent?.email) {
        await sendConfirmationRdvEmail({
          parentEmail: parent.email,
          parentNom: parent.name ?? parent.email,
          specialisteEmail: spec.email,
          specialisteNom: `${spec.prenom} ${spec.nom}`,
          prenomEnfant: eleve?.prenom ?? demande.prenomEnfant,
          debut: creneau.debut,
          fin: creneau.fin,
          lienVisio: input.lienVisio,
        }).catch(console.error);
      }

      return rdv;
    }),

  // ── Terminer un rendez-vous ───────────────────────────────────────────────
  terminerRendezVous: specialisteProcedure
    .input(z.object({ rdvId: z.string(), noteSpecialiste: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { userId: ctx.user.id },
      });
      return ctx.prisma.rendezVous.update({
        where: { id: input.rdvId, specialisteId: spec.id },
        data: { statut: "TERMINE", noteSpecialiste: input.noteSpecialiste },
      });
    }),

  // ── Annuler un rendez-vous (par le spécialiste) ───────────────────────────
  annulerRendezVous: specialisteProcedure
    .input(z.object({ rdvId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { userId: ctx.user.id },
      });

      const rdv = await ctx.prisma.rendezVous.findFirstOrThrow({
        where: { id: input.rdvId, specialisteId: spec.id },
        include: { demande: true },
      });

      await ctx.prisma.$transaction([
        ctx.prisma.rendezVous.update({
          where: { id: rdv.id },
          data: { statut: "ANNULE" },
        }),
        ctx.prisma.demandeRencontre.update({
          where: { id: rdv.demandeId },
          data: { statut: "ANNULE" },
        }),
      ]);

      const parent = await ctx.prisma.user.findUnique({
        where: { id: rdv.parentId },
        select: { email: true, name: true },
      });

      const eleve = rdv.eleveId
        ? await ctx.prisma.profilEleve.findUnique({
            where: { id: rdv.eleveId },
            select: { prenom: true },
          })
        : null;

      if (parent?.email) {
        await sendAnnulationRdvEmail({
          parentEmail: parent.email,
          parentNom: parent.name ?? parent.email,
          specialisteEmail: spec.email,
          specialisteNom: `${spec.prenom} ${spec.nom}`,
          prenomEnfant: eleve?.prenom ?? rdv.demande.prenomEnfant,
          debut: rdv.debut,
          annulePar: "specialiste",
        }).catch(console.error);
      }

      return { success: true };
    }),

  // ── Mes rendez-vous ───────────────────────────────────────────────────────
  mesRendezVous: specialisteProcedure.query(async ({ ctx }) => {
    const spec = await ctx.prisma.specialiste.findUniqueOrThrow({
      where: { userId: ctx.user.id },
    });

    const now = new Date();
    const [aVenir, passes] = await Promise.all([
      ctx.prisma.rendezVous.findMany({
        where: { specialisteId: spec.id, debut: { gte: now }, statut: "CONFIRME" },
        include: {
          demande: { select: { prenomEnfant: true, message: true } },
          eleve: { select: { prenom: true, nom: true } },
        },
        orderBy: { debut: "asc" },
      }),
      ctx.prisma.rendezVous.findMany({
        where: {
          specialisteId: spec.id,
          OR: [{ debut: { lt: now } }, { statut: { in: ["TERMINE", "ANNULE"] } }],
        },
        include: {
          demande: { select: { prenomEnfant: true, message: true } },
          eleve: { select: { prenom: true, nom: true } },
        },
        orderBy: { debut: "desc" },
        take: 20,
      }),
    ]);

    return { aVenir, passes };
  }),

  // ════════════════════════════════════════════════════════════════════════════
  // PROCÉDURES PARENT
  // ════════════════════════════════════════════════════════════════════════════

  // ── Rendez-vous du parent ─────────────────────────────────────────────────
  mesRendezVousParent: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.rendezVous.findMany({
      where: { parentId: ctx.user.id },
      include: {
        specialiste: { select: { prenom: true, nom: true, specialite: true, email: true, photo: true } },
        demande: { select: { prenomEnfant: true, message: true } },
        eleve: { select: { prenom: true, nom: true } },
      },
      orderBy: { debut: "asc" },
    });
  }),

  // ── Annuler un rendez-vous (par le parent, >24h avant) ────────────────────
  annulerRendezVousParent: protectedProcedure
    .input(z.object({ rdvId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rdv = await ctx.prisma.rendezVous.findFirstOrThrow({
        where: { id: input.rdvId, parentId: ctx.user.id },
        include: {
          specialiste: true,
          demande: { select: { prenomEnfant: true } },
          eleve: { select: { prenom: true } },
        },
      });

      if (rdv.statut !== "CONFIRME") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce rendez-vous ne peut pas être annulé." });
      }

      const msAvant = rdv.debut.getTime() - Date.now();
      if (msAvant < 24 * 60 * 60 * 1000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'annulation doit être faite au moins 24 heures à l'avance.",
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.rendezVous.update({ where: { id: rdv.id }, data: { statut: "ANNULE" } }),
        ctx.prisma.demandeRencontre.update({ where: { id: rdv.demandeId }, data: { statut: "ANNULE" } }),
      ]);

      await sendAnnulationRdvEmail({
        parentEmail: ctx.user.email!,
        parentNom: ctx.user.name ?? ctx.user.email!,
        specialisteEmail: rdv.specialiste.email,
        specialisteNom: `${rdv.specialiste.prenom} ${rdv.specialiste.nom}`,
        prenomEnfant: rdv.eleve?.prenom ?? rdv.demande.prenomEnfant,
        debut: rdv.debut,
        annulePar: "parent",
      }).catch(console.error);

      return { success: true };
    }),

  // ── S'inscrire à un webinaire ─────────────────────────────────────────────
  sInscrireWebinaire: protectedProcedure
    .input(z.object({ webinaireId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!await isFeatureActive(FEATURE_KEYS.SPECIALISTES)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cette fonctionnalité est actuellement désactivée." });
      }

      const webinaire = await ctx.prisma.webinaire.findUniqueOrThrow({
        where: { id: input.webinaireId },
        include: {
          inscriptions: { select: { id: true } },
          specialiste: { select: { prenom: true, nom: true } },
        },
      });

      if (webinaire.maxParticipants && webinaire.inscriptions.length >= webinaire.maxParticipants) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ce webinaire est complet." });
      }

      const inscription = await ctx.prisma.inscriptionWebinaire.create({
        data: { webinaireId: input.webinaireId, parentId: ctx.user.id },
      });

      await sendConfirmationWebinaireEmail({
        parentEmail: ctx.user.email!,
        parentNom: ctx.user.name ?? ctx.user.email!,
        webinaireTitle: webinaire.titre,
        specialisteNom: `${webinaire.specialiste.prenom} ${webinaire.specialiste.nom}`,
        dateHeure: webinaire.dateHeure,
        lienInscription: webinaire.lienInscription,
      }).catch(console.error);

      return inscription;
    }),

  // ── Se désinscrire d'un webinaire ─────────────────────────────────────────
  seDesinscrireWebinaire: protectedProcedure
    .input(z.object({ webinaireId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!await isFeatureActive(FEATURE_KEYS.SPECIALISTES)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cette fonctionnalité est actuellement désactivée." });
      }

      await ctx.prisma.inscriptionWebinaire.delete({
        where: { webinaireId_parentId: { webinaireId: input.webinaireId, parentId: ctx.user.id } },
      });
      return { success: true };
    }),

  // ── Mes inscriptions webinaires ───────────────────────────────────────────
  mesInscriptions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.inscriptionWebinaire.findMany({
      where: { parentId: ctx.user.id },
      include: {
        webinaire: {
          include: {
            specialiste: { select: { prenom: true, nom: true, specialite: true } },
            inscriptions: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Recommandation IA ─────────────────────────────────────────────────────
  recommandationIA: aiProcedure
    .input(z.object({ eleveId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Vérifier cache DB (valide si expiresAt > now)
      const cached = await ctx.prisma.recommandationIA.findFirst({
        where: { eleveId: input.eleveId, parentId: ctx.user.id, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });

      if (cached) {
        return {
          recommande: cached.recommande,
          urgence: cached.urgence as "faible" | "moderee" | "haute",
          specialites: cached.specialites,
          raisonnement: cached.raisonnement,
          declencheurs: cached.declencheurs,
          messageParent: cached.messageParent,
        };
      }

      // Construire le profil pour l'IA
      const [eleve, specialistesDispos, nbDemandes] = await Promise.all([
        ctx.prisma.profilEleve.findUniqueOrThrow({
          where: { id: input.eleveId },
          include: {
            niveauxMatieres: { select: { matiere: true, scoreGlobal: true, niveau: true } },
            checkIns: { orderBy: { date: "desc" }, take: 5, select: { etat: true } },
          },
        }),
        ctx.prisma.specialiste.findMany({
          where: { actif: true },
          select: { specialite: true },
          distinct: ["specialite"],
        }),
        ctx.prisma.demandeRencontre.count({
          where: { eleveId: input.eleveId, parentId: ctx.user.id },
        }),
      ]);

      const docs = await getContexteDocuments(ctx.prisma as unknown as PrismaClient);
      const recommandation = await genererRecommandationSpecialiste({
        prenom: eleve.prenom,
        niveauScolaire: eleve.niveauScolaire,
        tdah: eleve.tdah,
        dyslexie: eleve.dyslexie,
        dyscalculie: eleve.dyscalculie,
        anxieteScolaire: eleve.anxieteScolaire,
        autresBesoins: eleve.autresBesoins,
        niveauxMatieres: eleve.niveauxMatieres.map((n) => ({
          matiere: n.matiere,
          scoreGlobal: n.scoreGlobal,
          niveau: n.niveau,
        })),
        derniersCheckIns: eleve.checkIns.map((c) => ({ etat: c.etat })),
        nbDemandesExistantes: nbDemandes,
        specialitesDisponibles: specialistesDispos.map((s) => s.specialite),
      }, docs);

      // Persister avec expiration de 7 jours
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await ctx.prisma.recommandationIA.create({
        data: {
          parentId: ctx.user.id,
          eleveId: input.eleveId,
          recommande: recommandation.recommande,
          urgence: recommandation.urgence,
          specialites: recommandation.specialites,
          raisonnement: recommandation.raisonnement,
          declencheurs: recommandation.declencheurs,
          messageParent: recommandation.messageParent,
          expiresAt,
        },
      });

      return recommandation;
    }),

  // ════════════════════════════════════════════════════════════════════════════
  // PROCÉDURES ADMIN
  // ════════════════════════════════════════════════════════════════════════════

  // ── Admin : créer un spécialiste ─────────────────────────────────────────
  creer: superAdminProcedure
    .input(
      z.object({
        prenom: z.string().min(1).max(50),
        nom: z.string().min(1).max(50),
        specialite: z.enum([
          "ORTHOPEDAGOGUE", "PSYCHONEUROLOGUE", "PSYCHOEDUCATEUR",
          "ORTHOPHONISTE", "TRAVAILLEUR_SOCIAL", "PSYCHOLOGUE", "AUTRE",
        ]),
        bio: z.string().min(10).max(1000),
        email: z.string().email(),
        telephone: z.string().optional(),
        photo: z.string().url().optional(),
        langues: z.array(z.string()).default(["Français"]),
        disponibilites: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.specialiste.create({ data: input });
    }),

  // ── Admin : modifier un spécialiste ──────────────────────────────────────
  modifier: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        prenom: z.string().min(1).max(50).optional(),
        nom: z.string().min(1).max(50).optional(),
        bio: z.string().min(10).max(1000).optional(),
        email: z.string().email().optional(),
        telephone: z.string().optional(),
        photo: z.string().url().optional(),
        disponibilites: z.string().optional(),
        actif: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.specialiste.update({ where: { id }, data });
    }),

  // ── Admin : supprimer un spécialiste ─────────────────────────────────────
  supprimer: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.specialiste.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ── Admin : envoyer (ou renvoyer) le lien d'invitation ───────────────────
  envoyerInvitation: superAdminProcedure
    .input(z.object({ specialisteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const specialiste = await ctx.prisma.specialiste.findUniqueOrThrow({
        where: { id: input.specialisteId },
      });

      if (specialiste.userId) {
        throw new Error("Ce spécialiste a déjà activé son compte.");
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      await ctx.prisma.specialiste.update({
        where: { id: input.specialisteId },
        data: { invitationToken: token, invitationExpiresAt: expiresAt },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const lienActivation = `${appUrl}/invitation/specialiste/${token}`;

      await sendInvitationSpecialiste({
        email: specialiste.email,
        prenom: specialiste.prenom,
        nom: specialiste.nom,
        lienActivation,
      });

      return { success: true, lienActivation };
    }),

  // ── Public : valider le token d'invitation ────────────────────────────────
  validerTokenInvitation: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const specialiste = await ctx.prisma.specialiste.findUnique({
        where: { invitationToken: input.token },
        select: { prenom: true, nom: true, email: true, invitationExpiresAt: true, userId: true },
      });
      if (!specialiste) return { valide: false, raison: "Lien invalide." };
      if (specialiste.userId) return { valide: false, raison: "Ce compte est déjà activé." };
      if (specialiste.invitationExpiresAt && specialiste.invitationExpiresAt < new Date()) {
        return { valide: false, raison: "Ce lien a expiré. Demandez un nouvel envoi à l'administrateur." };
      }
      return { valide: true, prenom: specialiste.prenom, nom: specialiste.nom, email: specialiste.email };
    }),

  // ── Public : activer le compte avec mot de passe ──────────────────────────
  activerCompte: publicProcedure
    .input(z.object({ token: z.string(), motDePasse: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const specialiste = await ctx.prisma.specialiste.findUnique({
        where: { invitationToken: input.token },
      });
      if (!specialiste) throw new Error("Lien invalide.");
      if (specialiste.userId) throw new Error("Ce compte est déjà activé.");
      if (specialiste.invitationExpiresAt && specialiste.invitationExpiresAt < new Date()) {
        throw new Error("Ce lien a expiré.");
      }

      const hashed = await bcrypt.hash(input.motDePasse, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email: specialiste.email,
          name: `${specialiste.prenom} ${specialiste.nom}`,
          password: hashed,
          emailVerified: new Date(),
          role: "SPECIALISTE",
        },
      });

      await ctx.prisma.specialiste.update({
        where: { id: specialiste.id },
        data: { userId: user.id, invitationToken: null, invitationExpiresAt: null },
      });

      return { success: true, email: user.email };
    }),

  // ── Admin : ajouter un webinaire ─────────────────────────────────────────
  ajouterWebinaire: superAdminProcedure
    .input(
      z.object({
        specialisteId: z.string(),
        titre: z.string().min(1).max(200),
        description: z.string().optional(),
        dateHeure: z.string(),
        dureeMinutes: z.number().default(60),
        lienInscription: z.string().url().optional(),
        gratuit: z.boolean().default(true),
        maxParticipants: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.webinaire.create({
        data: {
          ...input,
          dateHeure: new Date(input.dateHeure),
        },
      });
    }),

  // ── Admin : modifier un webinaire ─────────────────────────────────────────
  modifierWebinaire: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        titre: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        dateHeure: z.string().optional(),
        dureeMinutes: z.number().optional(),
        lienInscription: z.string().url().optional(),
        gratuit: z.boolean().optional(),
        actif: z.boolean().optional(),
        maxParticipants: z.number().int().positive().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dateHeure, ...rest } = input;
      return ctx.prisma.webinaire.update({
        where: { id },
        data: {
          ...rest,
          ...(dateHeure ? { dateHeure: new Date(dateHeure) } : {}),
        },
      });
    }),

  // ── Admin : supprimer un webinaire ────────────────────────────────────────
  supprimerWebinaire: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.webinaire.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // ── Admin : liste des inscrits à un webinaire ─────────────────────────────
  listerInscriptionsWebinaire: superAdminProcedure
    .input(z.object({ webinaireId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.inscriptionWebinaire.findMany({
        where: { webinaireId: input.webinaireId },
        include: {
          webinaire: { select: { titre: true, dateHeure: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // ── Admin : liste des demandes de rencontre ───────────────────────────────
  listerDemandes: superAdminProcedure.query(async ({ ctx }) => {
    const demandes = await ctx.prisma.demandeRencontre.findMany({
      include: { specialiste: { select: { prenom: true, nom: true, specialite: true } } },
      orderBy: { createdAt: "desc" },
    });

    const parentIds = [...new Set(demandes.map((d) => d.parentId))];
    const parents = await ctx.prisma.user.findMany({
      where: { id: { in: parentIds } },
      select: { id: true, email: true, name: true },
    });
    const parentMap = Object.fromEntries(parents.map((p) => [p.id, p]));

    return demandes.map((d) => ({ ...d, parent: parentMap[d.parentId] ?? null }));
  }),
});
