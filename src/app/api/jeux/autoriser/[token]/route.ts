import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const demande = await prisma.demandeJeu.findUnique({ where: { token } });

  if (!demande) {
    return new NextResponse(htmlPage("Demande introuvable", "❌", "Ce lien est invalide ou a déjà expiré.", "#ef4444"), { headers: { "Content-Type": "text/html" } });
  }

  if (demande.expiresAt < new Date()) {
    await prisma.demandeJeu.update({ where: { token }, data: { statut: "EXPIRE" } });
    return new NextResponse(htmlPage("Demande expirée", "⏰", "Cette demande a expiré après 24 heures.", "#f97316"), { headers: { "Content-Type": "text/html" } });
  }

  if (demande.statut !== "EN_ATTENTE") {
    const msg = demande.statut === "AUTORISE" ? "Vous avez déjà autorisé ce jeu." : "Vous avez déjà refusé ce jeu.";
    return new NextResponse(htmlPage("Déjà traité", "ℹ️", msg, "#3b82f6"), { headers: { "Content-Type": "text/html" } });
  }

  await prisma.demandeJeu.update({ where: { token }, data: { statut: "AUTORISE" } });

  return new NextResponse(
    htmlPage("Jeu autorisé ✅", "✅",
      `Vous avez autorisé <strong>${demande.jeuNom}</strong>.<br>Votre enfant peut maintenant jouer pendant <strong>${demande.minutesAccordees} minutes</strong> !`,
      "#22c55e"),
    { headers: { "Content-Type": "text/html" } }
  );
}

function htmlPage(title: string, icon: string, message: string, color: string) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title} — Édu-Réussite QC</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:Georgia,serif;background:#f9f7f4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;}
.card{background:#fff;border-radius:20px;padding:40px;max-width:460px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.icon{font-size:64px;margin-bottom:16px;}.title{font-size:24px;font-weight:900;color:#0f1623;margin-bottom:12px;}
.msg{font-size:15px;color:#5a6070;line-height:1.7;margin-bottom:24px;}.badge{display:inline-block;background:${color}22;border:1px solid ${color}66;border-radius:12px;padding:10px 20px;font-size:14px;font-weight:700;color:${color};}
.footer{margin-top:24px;font-size:12px;color:#aab0bc;}</style></head>
<body><div class="card"><div class="icon">${icon}</div><h1 class="title">${title}</h1><p class="msg">${message}</p>
<div class="badge">✦ Édu-Réussite QC</div><p class="footer">Vous pouvez fermer cette fenêtre.</p></div></body></html>`;
}
