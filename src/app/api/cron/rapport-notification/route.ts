import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendRapportNotification } from "@/lib/email/send-rapport-notification";

// ── Cron — Notification rapport prêt aux parents (toutes les heures) ──────────
// Envoie le lien du rapport à tous les parents 24h après la soumission
// du formulaire, une seule fois (rapportEmailSentAt IS NULL).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://edu-reussite.com";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const delai24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Évaluations prêtes depuis >= 24h, rapport pas encore envoyé
  const evaluations = await prisma.evaluationRequest.findMany({
    where: {
      status: "REPORT_READY",
      rapportEmailSentAt: null,
      formCompletedAt: { lte: delai24h },
    },
    include: {
      eleve: {
        select: {
          prenom: true,
          nom: true,
          parents: {
            select: {
              prenom: true,
              user: { select: { email: true } },
            },
          },
        },
      },
      formulaire: {
        select: { tokenAcces: true },
      },
    },
  });

  let envois = 0;
  const erreurs: string[] = [];

  for (const ev of evaluations) {
    if (!ev.formulaire?.tokenAcces) continue;

    for (const parent of ev.eleve.parents) {
      const email = parent.user?.email;
      if (!email) continue;

      try {
        await sendRapportNotification({
          parentEmail: email,
          prenomParent: parent.prenom ?? "Parent",
          prenomEnfant: ev.eleve.prenom,
          nomEnfant: ev.eleve.nom ?? "",
          specialist: ev.primarySpecialist,
          tokenAcces: ev.formulaire.tokenAcces,
          appUrl: APP_URL,
        });
        envois++;
      } catch (err) {
        erreurs.push(`${ev.id} → ${email}: ${String(err)}`);
      }
    }

    // Marquer comme envoyé même si certains parents ont échoué (on ne re-spamme pas)
    await prisma.evaluationRequest.update({
      where: { id: ev.id },
      data: { rapportEmailSentAt: new Date() },
    });
  }

  return NextResponse.json({
    evaluationsTraitees: evaluations.length,
    envois,
    erreurs,
  });
}
