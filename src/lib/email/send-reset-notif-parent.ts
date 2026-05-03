import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

export async function sendResetNotifParent(
  parentEmail: string,
  prenomParent: string,
  prenomEnfant: string,
  codeAcces: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://edureussite-qc.vercel.app";
  const lienDashboard = `${appUrl}/parent`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 8px;">✦ Édu-Réussite QC</h1>
      <p style="color: #5a6070; font-size: 14px; margin-bottom: 24px;">
        Bonjour ${prenomParent},
      </p>
      <p style="color: #0f1623; font-size: 15px; font-weight: bold; margin-bottom: 12px;">
        ${prenomEnfant} a oublié son mot de passe 🔑
      </p>
      <p style="color: #5a6070; font-size: 14px; margin-bottom: 24px;">
        Votre enfant a demandé une réinitialisation de son mot de passe sur Édu-Réussite QC.<br>
        Son code d'accès est : <strong style="color: #0f1623;">${codeAcces}</strong>
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${lienDashboard}" style="background: #0f1623; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">
          Réinitialiser le mot de passe →
        </a>
      </div>
      <p style="color: #8a909c; font-size: 12px; text-align: center; margin-top: 24px;">
        Connectez-vous à votre espace parent et cliquez sur le bouton « Réinitialiser le mot de passe » à côté de ${prenomEnfant}.
      </p>
    </div>
  `;

  if (DEV) {
    console.log(`\n📧 [DEV] Notif reset parent pour ${parentEmail} — enfant: ${prenomEnfant}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `${prenomEnfant} a besoin de réinitialiser son mot de passe — Édu-Réussite QC`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
