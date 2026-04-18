import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendOnboardingJ3Email, sendOnboardingJ7Email } from "@/lib/email/send-onboarding-emails";
import { differenceInDays, subDays, startOfDay } from "date-fns";

// Sécurisé par CRON_SECRET — appelé quotidiennement à 9h05
// Envoie les emails J+3 et J+7 aux parents des nouveaux élèves
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maintenant = new Date();
  const il30j = subDays(startOfDay(maintenant), 30);

  // Récupérer les élèves créés depuis 30 jours dont l'onboarding est complet
  const eleves = await prisma.profilEleve.findMany({
    where: {
      createdAt: { gte: il30j },
      onboardingComplete: true,
    },
    select: {
      id: true,
      prenom: true,
      createdAt: true,
      parents: {
        select: {
          user: { select: { id: true, email: true, name: true } },
          prenom: true,
        },
      },
      exercicesAssignes: {
        where: { statut: "TERMINE" },
        select: { id: true, score: true, tempsSecondes: true, dateFin: true, exercice: { select: { matiere: true } } },
        orderBy: { dateFin: "asc" },
      },
      checkIns: {
        orderBy: { date: "desc" },
        take: 3,
        select: { etat: true },
      },
      sessions: {
        select: { id: true, dureeSecondes: true, dateSession: true },
        orderBy: { dateSession: "asc" },
      },
    },
  });

  let envojesJ3 = 0;
  let envojesJ7 = 0;
  let erreurs = 0;

  for (const eleve of eleves) {
    const joursDepuis = differenceInDays(maintenant, eleve.createdAt);
    const hasParents = eleve.parents.length > 0;
    if (!hasParents) continue;

    // ── J+3 ─────────────────────────────────────────────────────────────────
    if (joursDepuis >= 3 && joursDepuis < 30) {
      const cleJ3 = `onboarding_sent:j3:${eleve.id}`;
      const dejaEnvoye = await prisma.parametreApp.findUnique({ where: { cle: cleJ3 } });

      if (!dejaEnvoye) {
        const exercicesJ3 = eleve.exercicesAssignes.filter(
          (e) => e.dateFin && differenceInDays(maintenant, e.dateFin) <= 3
        );
        const scores = exercicesJ3.filter((e) => e.score !== null).map((e) => e.score as number);
        const scoresMoyen = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        const sessionsMira = eleve.sessions.filter(
          (s) => differenceInDays(maintenant, s.dateSession) <= 3
        ).length;
        const dernierEtat = eleve.checkIns[0]?.etat ?? null;

        for (const parent of eleve.parents) {
          const email = parent.user.email;
          if (!email) continue;
          try {
            await sendOnboardingJ3Email({
              parentEmail: email,
              parentPrenom: parent.prenom ?? parent.user.name?.split(" ")[0] ?? "Parent",
              enfant: {
                prenomEnfant: eleve.prenom,
                exercicesCompletes: exercicesJ3.length,
                scoresMoyen: scoresMoyen !== null ? Math.round(scoresMoyen) : null,
                sessionsMira,
                etatEmotionnel: dernierEtat ?? null,
              },
            });
            envojesJ3++;
          } catch (err) {
            console.error(`[onboarding-j3] Erreur email parent ${email}:`, err);
            erreurs++;
          }
        }

        // Marquer comme envoyé
        await prisma.parametreApp.create({ data: { cle: cleJ3, valeur: "1" } }).catch(() => {});
      }
    }

    // ── J+7 ─────────────────────────────────────────────────────────────────
    if (joursDepuis >= 7 && joursDepuis < 30) {
      const cleJ7 = `onboarding_sent:j7:${eleve.id}`;
      const dejaEnvoye = await prisma.parametreApp.findUnique({ where: { cle: cleJ7 } });

      if (!dejaEnvoye) {
        const tousExercices = eleve.exercicesAssignes;
        const tempsMinutes = Math.round(
          tousExercices.reduce((acc, e) => acc + (e.tempsSecondes ?? 0), 0) / 60
        );

        // Calculer les améliorations : 3 premières améliorations mesurées
        const ameliorations: { label: string; delta: string; emoji: string }[] = [];

        // 1. Score global
        const scoresAll = tousExercices.filter((e) => e.score !== null).map((e) => e.score as number);
        if (scoresAll.length >= 4) {
          const premiereMotie = scoresAll.slice(0, Math.floor(scoresAll.length / 2));
          const deuxiemeMotie = scoresAll.slice(Math.floor(scoresAll.length / 2));
          const moyAvant = premiereMotie.reduce((a, b) => a + b, 0) / premiereMotie.length;
          const moyApres = deuxiemeMotie.reduce((a, b) => a + b, 0) / deuxiemeMotie.length;
          const delta = Math.round(moyApres - moyAvant);
          if (delta > 0) {
            ameliorations.push({ label: "Score global", delta: `+${delta}% par rapport au début`, emoji: "📈" });
          }
        }

        // 2. Par matière : trouver la plus grande progression
        const parMatiere: Record<string, number[]> = {};
        for (const ex of tousExercices) {
          if (ex.score === null) continue;
          const m = ex.exercice.matiere;
          if (!parMatiere[m]) parMatiere[m] = [];
          parMatiere[m].push(ex.score);
        }
        const MATIERES_LABELS: Record<string, string> = {
          FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
          UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ANGLAIS: "Anglais",
          EDUCATION_PHYSIQUE: "Éducation physique", ETHIQUE: "Éthique",
        };
        for (const [matiere, scores] of Object.entries(parMatiere)) {
          if (scores.length < 3) continue;
          const avant = scores[0];
          const apres = scores[scores.length - 1];
          const delta = Math.round(apres - avant);
          if (delta > 5) {
            ameliorations.push({
              label: MATIERES_LABELS[matiere] ?? matiere,
              delta: `+${delta}% depuis le début`,
              emoji: "⭐",
            });
          }
        }

        // 3. Régularité (sessions cette semaine)
        const sessionsJ7 = eleve.sessions.filter(
          (s) => differenceInDays(maintenant, s.dateSession) <= 7
        ).length;
        if (sessionsJ7 >= 3) {
          ameliorations.push({
            label: "Régularité",
            delta: `${sessionsJ7} sessions en 7 jours — excellente habitude !`,
            emoji: "🔥",
          });
        }

        // Meilleure et moins bonne matière
        const matieresSorted = Object.entries(parMatiere)
          .filter(([, s]) => s.length >= 2)
          .map(([m, s]) => ({ matiere: m, moy: s.reduce((a, b) => a + b, 0) / s.length }))
          .sort((a, b) => b.moy - a.moy);
        const notionForte = matieresSorted[0] ? MATIERES_LABELS[matieresSorted[0].matiere] ?? matieresSorted[0].matiere : null;
        const notionFaible = matieresSorted.at(-1) ? MATIERES_LABELS[matieresSorted.at(-1)!.matiere] ?? matieresSorted.at(-1)!.matiere : null;

        for (const parent of eleve.parents) {
          const email = parent.user.email;
          if (!email) continue;
          try {
            await sendOnboardingJ7Email({
              parentEmail: email,
              parentPrenom: parent.prenom ?? parent.user.name?.split(" ")[0] ?? "Parent",
              enfant: {
                prenomEnfant: eleve.prenom,
                exercicesCompletes: tousExercices.length,
                tempsMinutes,
                ameliorations: ameliorations.slice(0, 3),
                notionfForte: notionForte,
                notionATravailler: notionFaible !== notionForte ? notionFaible : null,
              },
            });
            envojesJ7++;
          } catch (err) {
            console.error(`[onboarding-j7] Erreur email parent ${email}:`, err);
            erreurs++;
          }
        }

        await prisma.parametreApp.create({ data: { cle: cleJ7, valeur: "1" } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    ok: true,
    envojesJ3,
    envojesJ7,
    erreurs,
    elevesTraites: eleves.length,
  });
}
