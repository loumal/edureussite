import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendRapportHebdoEmail, type RapportEnfant } from "@/lib/email/send-rapport-hebdo";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

// Sécurisé par CRON_SECRET — appelé par Vercel Cron (chaque lundi 8h00)
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maintenant = new Date();
  const il7Jours = startOfDay(subDays(maintenant, 7));
  const semaineDu = format(il7Jours, "d MMMM yyyy", { locale: fr });

  // Récupérer tous les parents avec profil et enfants
  const parents = await prisma.user.findMany({
    where: { role: "PARENT" },
    select: {
      id: true,
      email: true,
      name: true,
      profilParent: {
        select: {
          eleves: {
            select: {
              prenom: true,
              niveauScolaire: true,
              streakJours: true,
              checkIns: {
                where: { date: { gte: il7Jours } },
                select: { etat: true },
              },
              exercicesAssignes: {
                where: {
                  dateFin: { gte: il7Jours },
                  statut: "TERMINE",
                },
                select: {
                  id: true,
                  tempsSecondes: true,
                  score: true,
                  exercice: { select: { matiere: true } },
                },
              },
              badges: {
                where: { date: { gte: il7Jours } },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  let envoyes = 0;
  let erreurs = 0;

  for (const parent of parents) {
    if (!parent.email || !parent.profilParent) continue;

    const enfants: RapportEnfant[] = [];

    for (const eleve of parent.profilParent.eleves) {
      // Calcul temps total d'étude
      const tempsSecondes = eleve.exercicesAssignes.reduce(
        (acc: number, ex) => acc + (ex.tempsSecondes ?? 0),
        0
      );

      // Détection alerte émotionnelle (stress/tristesse/fatigue 2+ fois / semaine)
      const etatsNegatifs = eleve.checkIns.filter((c) =>
        ["STRESSE", "TRISTE", "FATIGUE"].includes(c.etat)
      );
      const alerteEmotionnelle = etatsNegatifs.length >= 2;

      // Progression par matière (score moyen sur la semaine)
      const parMatiere: Record<string, { total: number; count: number }> = {};
      for (const ex of eleve.exercicesAssignes) {
        const matiere = ex.exercice.matiere;
        if (ex.score === null) continue;
        if (!parMatiere[matiere]) parMatiere[matiere] = { total: 0, count: 0 };
        parMatiere[matiere].total += ex.score;
        parMatiere[matiere].count += 1;
      }

      const MATIERE_LABELS: Record<string, string> = {
        FRANCAIS: "Français", MATHEMATIQUES: "Maths", SCIENCES: "Sciences",
        UNIVERS_SOCIAL: "Univers social", ANGLAIS: "Anglais", ARTS: "Arts",
        ETHIQUE: "Éthique", EDUCATION_PHYSIQUE: "Éd. physique",
      };

      const progressionParMatiere = Object.entries(parMatiere).map(([matiere, { total, count }]) => ({
        matiere: MATIERE_LABELS[matiere] ?? matiere,
        score: Math.round(total / count),
      }));

      enfants.push({
        prenom: eleve.prenom,
        niveauLabel: eleve.niveauScolaire ?? "",
        streak: eleve.streakJours,
        exercicesCompletes: eleve.exercicesAssignes.length,
        tempsMinutes: Math.round(tempsSecondes / 60),
        progressionParMatiere,
        alerteEmotionnelle,
        badgesGagnes: eleve.badges.length,
      });
    }

    if (enfants.length === 0) continue;

    try {
      await sendRapportHebdoEmail({
        parentEmail: parent.email,
        parentPrenom: parent.name?.split(" ")[0] ?? "Parent",
        enfants,
        semaineDu,
      });
      envoyes++;
    } catch (err) {
      console.error(`[rapport-hebdo] Erreur envoi à ${parent.email}:`, err);
      erreurs++;
    }
  }

  return NextResponse.json({ ok: true, envoyes, erreurs, semaineDu });
}
