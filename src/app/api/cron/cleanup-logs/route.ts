import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

// ── Cron — Nettoyage automatique des journaux de sécurité ────────────────────
// Exécuté chaque nuit à 3h UTC (23h Québec)
//
// Règles de rétention :
//   CRITICAL  → conservé indéfiniment
//   WARNING   → 7 jours sauf actions critiques (conservées indéfiniment)
//   INFO      → 7 jours
//
// Actions WARNING/INFO conservées indéfiniment (même règle que CRITICAL) :
//   FORCE_BRUTE_DETECTEE, ACCES_REFUSE, SUPER_ADMIN_CREE,
//   COMPTE_SUSPENDU, UTILISATEUR_SUPPRIME, ROLE_MODIFIE, IP_BLOQUEE

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS_PERMANENTES = [
  "FORCE_BRUTE_DETECTEE",
  "ACCES_REFUSE",
  "SUPER_ADMIN_CREE",
  "COMPTE_SUSPENDU",
  "UTILISATEUR_SUPPRIME",
  "ROLE_MODIFIE",
  "IP_BLOQUEE",
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // J-7

  // Supprimer INFO > 7 jours
  const infoResult = await prisma.securityLog.deleteMany({
    where: {
      severity: "INFO",
      createdAt: { lt: cutoff },
    },
  });

  // Supprimer WARNING > 7 jours SAUF actions permanentes
  const warningResult = await prisma.securityLog.deleteMany({
    where: {
      severity: "WARNING",
      createdAt: { lt: cutoff },
      action: { notIn: ACTIONS_PERMANENTES },
    },
  });

  const total = infoResult.count + warningResult.count;

  console.log(`[cleanup-logs] Supprimé ${infoResult.count} INFO + ${warningResult.count} WARNING = ${total} logs`);

  return NextResponse.json({
    message: `${total} log(s) supprimé(s)`,
    details: {
      info: infoResult.count,
      warning: warningResult.count,
      conserves: "CRITICAL (tous) + WARNING actions critiques (permanent)",
    },
  });
}
