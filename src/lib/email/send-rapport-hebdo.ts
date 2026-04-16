import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.ca";

export interface RapportEnfant {
  prenom: string;
  niveauLabel: string;
  streak: number;
  exercicesCompletes: number;
  tempsMinutes: number;
  progressionParMatiere: { matiere: string; score: number }[];
  alerteEmotionnelle: boolean;
  badgesGagnes: number;
}

interface RapportHebdoParams {
  parentEmail: string;
  parentPrenom: string;
  enfants: RapportEnfant[];
  semaineDu: string; // ex: "14 avril 2026"
}

export async function sendRapportHebdoEmail(params: RapportHebdoParams): Promise<void> {
  const { parentEmail, parentPrenom, enfants, semaineDu } = params;

  const lignesEnfants = enfants.map((e) => {
    const matieresSorted = [...e.progressionParMatiere].sort((a, b) => a.score - b.score);
    const pointFaible = matieresSorted[0];
    const pointFort = matieresSorted.at(-1);

    const alerteHtml = e.alerteEmotionnelle
      ? `<p style="background:#fff3cd;border-left:4px solid #e89c00;padding:8px 12px;border-radius:4px;font-size:13px;margin:8px 0;">
           ⚠️ <strong>${e.prenom}</strong> a signalé du stress ou de l'anxiété plusieurs fois cette semaine.
           Pensez à lui en parler ce soir.
         </p>`
      : "";

    const barresMatiere = e.progressionParMatiere
      .map((m) => {
        const couleur = m.score >= 80 ? "#2a7c6f" : m.score >= 60 ? "#e89c00" : "#d94f2b";
        return `<tr>
          <td style="font-size:12px;padding:3px 8px 3px 0;color:#555;white-space:nowrap;">${m.matiere}</td>
          <td style="padding:3px 0;">
            <div style="background:#eee;border-radius:4px;height:8px;width:160px;">
              <div style="background:${couleur};border-radius:4px;height:8px;width:${m.score * 1.6}px;"></div>
            </div>
          </td>
          <td style="font-size:12px;padding:3px 0 3px 8px;color:${couleur};font-weight:700;">${m.score}%</td>
        </tr>`;
      })
      .join("");

    return `
      <div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:20px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="font-size:28px;">${e.alerteEmotionnelle ? "⚠️" : "🎒"}</div>
          <div>
            <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">${e.prenom}</p>
            <p style="margin:0;font-size:12px;color:#888;">${e.niveauLabel}</p>
          </div>
          <div style="margin-left:auto;text-align:right;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a1a;">🔥 ${e.streak} jours</p>
            <p style="margin:0;font-size:11px;color:#888;">série active</p>
          </div>
        </div>

        ${alerteHtml}

        <div style="display:flex;gap:16px;margin:12px 0;flex-wrap:wrap;">
          <div style="background:#f5f3ef;border-radius:8px;padding:10px 14px;flex:1;min-width:100px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a1a;">${e.exercicesCompletes}</p>
            <p style="margin:0;font-size:11px;color:#888;">exercices</p>
          </div>
          <div style="background:#f5f3ef;border-radius:8px;padding:10px 14px;flex:1;min-width:100px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a1a;">${e.tempsMinutes} min</p>
            <p style="margin:0;font-size:11px;color:#888;">temps d'étude</p>
          </div>
          <div style="background:#f5f3ef;border-radius:8px;padding:10px 14px;flex:1;min-width:100px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:800;color:#1a1a1a;">+${e.badgesGagnes} 🏅</p>
            <p style="margin:0;font-size:11px;color:#888;">badges</p>
          </div>
        </div>

        <table style="border-collapse:collapse;width:100%;">
          <tbody>${barresMatiere}</tbody>
        </table>

        ${pointFaible && pointFaible.score < 70
          ? `<p style="margin:10px 0 0;font-size:12px;color:#d94f2b;">📌 À surveiller : <strong>${pointFaible.matiere}</strong> (${pointFaible.score}%)</p>`
          : ""}
        ${pointFort && pointFort.score >= 80
          ? `<p style="margin:6px 0 0;font-size:12px;color:#2a7c6f;">✨ Point fort : <strong>${pointFort.matiere}</strong> (${pointFort.score}%)</p>`
          : ""}
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf8f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:22px;font-weight:900;color:#1a1a1a;margin:0;">✦ ÉduRéussite</p>
      <p style="font-size:13px;color:#888;margin:4px 0 0;">Rapport de la semaine du ${semaineDu}</p>
    </div>

    <p style="font-size:15px;color:#333;margin-bottom:20px;">
      Bonjour <strong>${parentPrenom}</strong> 👋,<br>
      Voici le bilan hebdomadaire de ${enfants.length > 1 ? "vos enfants" : "votre enfant"} sur ÉduRéussite.
    </p>

    ${lignesEnfants}

    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.NEXTAUTH_URL ?? "https://edureussite.ca"}/parent"
         style="background:#1a1a1a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;display:inline-block;">
        Voir le tableau de bord complet →
      </a>
    </div>

    <p style="font-size:11px;color:#bbb;text-align:center;margin-top:24px;">
      Vous recevez cet email car vous avez un compte parent sur ÉduRéussite.<br>
      <a href="${process.env.NEXTAUTH_URL ?? "https://edureussite.ca"}/parent" style="color:#bbb;">Gérer mes préférences</a>
    </p>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `📊 Bilan hebdo — Semaine du ${semaineDu}`,
    html,
  });

  logResend({ userId: undefined });
}
