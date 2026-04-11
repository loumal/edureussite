import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendStreakReminderParent } from "@/lib/email/send-streak-reminder-parent";

// ── Cron — Rappel streak aux parents (20h heure du Québec = 01h UTC) ──────────
// Appelé par Vercel Cron (vercel.json). Protégé par CRON_SECRET.
// Envoie un email aux parents dont l'enfant a une streak > 0 mais
// n'a complété aucun exercice aujourd'hui.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Vérification du secret Vercel Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const maintenant = new Date();
  const debutJour = new Date(maintenant);
  debutJour.setHours(0, 0, 0, 0);

  try {
    // Élèves avec streak > 0 et pas d'exercice complété aujourd'hui
    const elevesARelancer = await prisma.profilEleve.findMany({
      where: {
        streakJours: { gt: 0 },
        OR: [
          { derniereConnexion: null },
          { derniereConnexion: { lt: debutJour } },
        ],
      },
      select: {
        prenom: true,
        streakJours: true,
        streakBoucliers: true,
        parents: {
          select: {
            prenom: true,
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    let envoyes = 0;
    const erreurs: string[] = [];

    for (const profil of elevesARelancer) {
      for (const parent of profil.parents) {
        try {
          await sendStreakReminderParent({
            parentEmail: parent.user.email,
            parentPrenom: parent.prenom,
            prenomEnfant: profil.prenom,
            streakJours: profil.streakJours,
            streakBoucliers: profil.streakBoucliers,
          });
          envoyes++;
          // Pause entre chaque envoi pour respecter la limite Resend (5 req/s)
          await new Promise((r) => setTimeout(r, 250));
        } catch (err) {
          erreurs.push(`${parent.user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      elevesTraites: elevesARelancer.length,
      emailsEnvoyes: envoyes,
      erreurs: erreurs.length > 0 ? erreurs : undefined,
    });
  } catch (err) {
    console.error("[cron/streak-reminder]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
