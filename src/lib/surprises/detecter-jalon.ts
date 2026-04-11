import type { PrismaClient } from "@/generated/prisma";
import { genererOptionsSurprise } from "./generer-options";
import { sendSurpriseDisponibleEmail } from "@/lib/email/send-surprise-parent";

const MAX_PAR_AN = 7;
const COOLDOWN_JOURS = 30; // Minimum entre deux surprises pour le même enfant

interface ProfilPourJalon {
  id: string;
  prenom: string;
  streakJours: number;
  centresInteret: string[];
  sportFavori: string | null;
  universMediatique: string | null;
  autresPassions: string | null;
}

interface JalonDetecte {
  declencheur: string;
  explication: string;
}

/**
 * Vérifie si un jalon de surprise est atteint après une soumission.
 * Appelé dans le bloc waitUntil de exercice.ts.
 */
export async function detecterEtCreerSurprise(
  prisma: PrismaClient,
  profil: ProfilPourJalon,
  score: number,
  matiere: string,
  nbTentativesAvant: number
): Promise<void> {
  const eleveId = profil.id;
  const maintenant = new Date();

  // 1. Vérifier le quota annuel
  const debutAnnee = new Date(maintenant.getFullYear(), 0, 1);
  const nbCetteAnnee = await prisma.surpriseParent.count({
    where: {
      eleveId,
      statut: { in: ["ACCORDE", "CONFIRME"] },
      createdAt: { gte: debutAnnee },
    },
  });
  if (nbCetteAnnee >= MAX_PAR_AN) return;

  // 2. Vérifier le cooldown (pas de surprise dans les 30 derniers jours)
  const cooldownDebut = new Date(maintenant.getTime() - COOLDOWN_JOURS * 24 * 60 * 60 * 1000);
  const recente = await prisma.surpriseParent.findFirst({
    where: { eleveId, createdAt: { gte: cooldownDebut } },
  });
  if (recente) return;

  // 3. Détection des jalons (par ordre de priorité)
  const jalon = await detecterJalon(prisma, profil, score, matiere, nbTentativesAvant, eleveId);
  if (!jalon) return;

  // 4. Trouver les parents de l'enfant
  const parents = await prisma.profilParent.findMany({
    where: { eleves: { some: { id: eleveId } } },
    include: { user: { select: { email: true } } },
  });
  if (parents.length === 0) return;

  // 5. Générer les options personnalisées
  const options = genererOptionsSurprise({
    prenom: profil.prenom,
    centresInteret: profil.centresInteret,
    sportFavori: profil.sportFavori,
    universMediatique: profil.universMediatique,
    autresPassions: profil.autresPassions,
  });

  // 6. Créer la surprise pour chaque parent
  const expireAt = new Date(maintenant.getTime() + 14 * 24 * 60 * 60 * 1000);

  for (const parent of parents) {
    await prisma.surpriseParent.create({
      data: {
        eleveId,
        parentId: parent.id,
        declencheur: jalon.declencheur,
        explication: jalon.explication,
        options,
        expireAt,
      },
    });

    // Notification in-app
    await prisma.notification.create({
      data: {
        destinataireId: parent.userId,
        type: "SURPRISE_DISPONIBLE",
        titre: `🌟 ${profil.prenom} mérite une surprise !`,
        contenu: jalon.declencheur,
        donnees: { eleveId, prenomEnfant: profil.prenom },
      },
    });

    // Courriel (best-effort — ne bloque pas si ça échoue)
    if (parent.user?.email) {
      sendSurpriseDisponibleEmail({
        parentEmail: parent.user.email,
        parentPrenom: parent.prenom,
        prenomEnfant: profil.prenom,
        declencheur: jalon.declencheur,
        explication: jalon.explication,
        options,
      }).catch((err) => console.error("[surprise:email]", err));
    }
  }
}

async function detecterJalon(
  prisma: PrismaClient,
  profil: ProfilPourJalon,
  score: number,
  matiere: string,
  nbTentativesAvant: number,
  eleveId: string
): Promise<JalonDetecte | null> {
  const { prenom, streakJours } = profil;

  // Jalon 1 : Streak 7 jours consécutifs (multiple de 7)
  if (streakJours > 0 && streakJours % 7 === 0) {
    return {
      declencheur: `${streakJours} jours consécutifs de connexion`,
      explication: `${prenom} s'est connecté·e ${streakJours} jours d'affilée sans jamais manquer une journée. C'est une discipline remarquable pour son âge — la régularité est l'une des clés les plus importantes de la réussite scolaire.`,
    };
  }

  // Jalon 2 : Score parfait après plusieurs tentatives
  if (score >= 95 && nbTentativesAvant >= 2) {
    return {
      declencheur: `Score parfait après ${nbTentativesAvant} tentatives`,
      explication: `${prenom} n'a pas abandonné. Après ${nbTentativesAvant} tentatives, il/elle a obtenu un score de ${Math.round(score)}/100. Cette persévérance face à la difficulté est exactement ce qu'on cherche à développer.`,
    };
  }

  // Jalon 3 : Amélioration de 20+ points sur une matière
  const scoresPrecedents = await prisma.exerciceAssigne.findMany({
    where: { eleveId, statut: "TERMINE", exercice: { matiere: matiere as never } },
    orderBy: { dateFin: "desc" },
    take: 5,
    select: { score: true },
  });
  if (scoresPrecedents.length >= 3) {
    const moyennePrecedente =
      scoresPrecedents.slice(1).reduce((s, e) => s + (e.score ?? 0), 0) /
      (scoresPrecedents.length - 1);
    if (score - moyennePrecedente >= 20) {
      return {
        declencheur: `Progression de +${Math.round(score - moyennePrecedente)} points en ${matiere.toLowerCase()}`,
        explication: `${prenom} vient de réaliser sa meilleure performance de la saison en ${matiere.toLowerCase()} : ${Math.round(score)}/100, soit +${Math.round(score - moyennePrecedente)} points par rapport à sa moyenne récente. C'est un progrès concret et mesurable.`,
      };
    }
  }

  // Jalon 4 : 21 jours actifs ce mois-ci
  if (streakJours === 21) {
    return {
      declencheur: "21 jours consécutifs — un mois complet d'effort",
      explication: `${prenom} vient de compléter 21 jours consécutifs de pratique. À ce stade, l'habitude d'apprendre est véritablement installée. C'est un accomplissement exceptionnel qui mérite d'être célébré.`,
    };
  }

  return null;
}
