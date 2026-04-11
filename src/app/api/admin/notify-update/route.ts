import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendMiseAJourPlateforme } from "@/lib/email/send-mise-a-jour-plateforme";

// ── POST /api/admin/notify-update ─────────────────────────────────────────────
// Envoie un email de mise à jour à tous les parents actifs.
// Protégé par CRON_SECRET (même secret que les crons Vercel).
//
// Body JSON (optionnel) :
//   { message?: string, version?: string }
//
// Exemple d'appel :
//   curl -X POST https://edureussite.edevtic.com/api/admin/notify-update \
//     -H "Authorization: Bearer $CRON_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"message":"Nouvelles fonctionnalités pour les jeunes élèves."}'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resend free plan : ~5 req/s → 4 envois par batch + 1.1s de pause entre chaque batch
const BATCH_SIZE = 4;
const INTER_BATCH_MS = 1100;

export async function POST(req: Request) {
  // ── Authentification ────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // ── Paramètres optionnels ───────────────────────────────────────────────────
  let message: string | undefined;
  let version: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    message = typeof body.message === "string" ? body.message : undefined;
    version = typeof body.version === "string" ? body.version : undefined;
  } catch {
    // body non-JSON → on continue avec les valeurs par défaut
  }

  try {
    // ── Charger tous les parents avec email ────────────────────────────────────
    const parents = await prisma.profilParent.findMany({
      select: {
        prenom: true,
        user: { select: { email: true } },
      },
    });

    // ── Charger aussi les admins/super-admins avec email (pour tests internes) ─
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { email: true, name: true },
    });

    const parentsAvecEmail: { prenom: string; user: { email: string } }[] = [
      ...parents.filter((p) => p.user.email).map((p) => ({ prenom: p.prenom, user: { email: p.user.email! } })),
      // Admins reçoivent la notif avec prénom générique si non présent comme parent
      ...admins
        .filter((a): a is typeof a & { email: string } => !!a.email && !parents.some((p) => p.user.email === a.email))
        .map((a) => ({ prenom: a.name?.split(" ")[0] ?? "Admin", user: { email: a.email! } })),
    ];

    let envoyes = 0;
    const erreurs: string[] = [];

    // Envoi par batchs pour respecter les limites Resend
    for (let i = 0; i < parentsAvecEmail.length; i += BATCH_SIZE) {
      const batch = parentsAvecEmail.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (parent) => {
          try {
            await sendMiseAJourPlateforme({
              parentEmail: parent.user.email,
              parentPrenom: parent.prenom,
              message,
              version,
            });
            envoyes++;
          } catch (err) {
            erreurs.push(
              `${parent.user.email}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        })
      );
      // Pause entre les batchs pour respecter la limite Resend (5 req/s)
      if (i + BATCH_SIZE < parentsAvecEmail.length) {
        await new Promise((r) => setTimeout(r, INTER_BATCH_MS));
      }
    }

    console.log(`[notify-update] ${envoyes}/${parentsAvecEmail.length} emails envoyés`);

    return NextResponse.json({
      ok: true,
      parentsTotal: parentsAvecEmail.length,
      emailsEnvoyes: envoyes,
      erreurs: erreurs.length > 0 ? erreurs : undefined,
    });
  } catch (err) {
    console.error("[notify-update]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
