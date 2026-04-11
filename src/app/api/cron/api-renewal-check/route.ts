import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sendApiRenewalAlert } from "@/lib/email/send-api-renewal-alert";

// ── Cron — Suivi budgétaire des APIs (9h UTC = 5h Québec) ───────────────────
// Clés DB : api_budget:{nom} → JSON { montantUSD, datePaiement }
// Groupes  : ElevenLabs, Anthropic, Deepgram, Resend
// Alertes  : J-3 (72h) et J-1 (24h) avant l'épuisement prévu
// Alerte déjà envoyée : api_alert:{nom}:{seuil} → "sent"

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BUDGET_PREFIX = "api_budget:";
const ALERT_PREFIX = "api_alert:";

const GROUPES: Record<string, string[]> = {
  ElevenLabs: ["ELEVENLABS_TTS", "ELEVENLABS_STT"],
  Anthropic:  ["CLAUDE_MIRA", "CLAUDE_EXERCICE", "CLAUDE_DOCUMENT", "CLAUDE_ANALYSE"],
  Deepgram:   ["DEEPGRAM_STT", "DEEPGRAM_TTS"],
  Resend:     ["RESEND"],
};

// Fenêtres d'alerte : [seuil en heures, label]
const FENETRES: { heures: number; cle: string }[] = [
  { heures: 72, cle: "j3" },
  { heures: 24, cle: "j1" },
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // 1. Charger tous les budgets configurés
  const params = await prisma.parametreApp.findMany({
    where: { cle: { startsWith: API_BUDGET_PREFIX } },
  });

  if (params.length === 0) {
    return NextResponse.json({ message: "Aucun budget configuré", alertes: 0 });
  }

  // 2. Admins/super admins avec email vérifié
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
      emailVerified: { not: null },
      suspended: false,
    },
    select: { email: true, name: true },
  });

  if (admins.length === 0) {
    return NextResponse.json({ message: "Aucun admin trouvé", alertes: 0 });
  }

  const now = new Date();
  const alertes: string[] = [];

  for (const param of params) {
    const nom = param.cle.replace(API_BUDGET_PREFIX, "");
    let budget: { montantUSD: number; datePaiement: string };
    try {
      budget = JSON.parse(param.valeur);
    } catch {
      continue;
    }

    const datePaiement = new Date(budget.datePaiement);
    if (isNaN(datePaiement.getTime())) continue;

    // Calculer la consommation depuis le paiement
    const services = GROUPES[nom];
    if (!services) continue;

    const agg = await prisma.apiUsageLog.aggregate({
      where: {
        service: { in: services as never[] },
        createdAt: { gte: datePaiement },
      },
      _sum: { coutUSD: true },
    });
    const consomme = agg._sum.coutUSD ?? 0;
    const restant = budget.montantUSD - consomme;

    if (restant <= 0) continue; // Déjà épuisé, pas d'alerte

    const joursDepuis = Math.max(1, (now.getTime() - datePaiement.getTime()) / (1000 * 60 * 60 * 24));
    const moyenneParJour = consomme / joursDepuis;

    if (moyenneParJour <= 0) continue; // Pas encore de consommation

    const heuresRestantes = (restant / moyenneParJour) * 24;
    const dateEpuisement = new Date(now.getTime() + heuresRestantes * 60 * 60 * 1000);

    // Vérifier chaque fenêtre d'alerte
    for (const fenetre of FENETRES) {
      if (heuresRestantes > fenetre.heures) continue; // Pas encore dans la fenêtre

      // Vérifier si l'alerte a déjà été envoyée
      const alerteCle = `${ALERT_PREFIX}${nom}:${fenetre.cle}`;
      const dejaEnvoyee = await prisma.parametreApp.findUnique({ where: { cle: alerteCle } });
      if (dejaEnvoyee) continue;

      // Envoyer l'alerte à tous les admins
      for (const admin of admins) {
        const prenom = admin.name?.split(" ")[0] ?? "Administrateur";
        try {
          await sendApiRenewalAlert({
            adminEmail: admin.email,
            adminPrenom: prenom,
            apiNom: nom,
            dateRenouvellement: dateEpuisement,
            heuresRestantes: Math.round(heuresRestantes),
          });
          alertes.push(`${nom} (${fenetre.cle}) → ${admin.email}`);
        } catch (e) {
          console.error(`Erreur envoi alerte ${nom} à ${admin.email}:`, e);
        }
      }

      // Marquer l'alerte comme envoyée
      await prisma.parametreApp.upsert({
        where: { cle: alerteCle },
        create: { cle: alerteCle, valeur: "sent" },
        update: { valeur: "sent" },
      });
    }
  }

  return NextResponse.json({
    message: `${alertes.length} alerte(s) envoyée(s)`,
    alertes,
  });
}
