import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

interface AlerteSecuriteParams {
  userEmail: string;
  userName: string;
  message: string;
}

export async function sendAlerteSecuriteEmail(params: AlerteSecuriteParams): Promise<void> {
  const { userEmail, userName, message } = params;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Alerte sécurité → ${userEmail}\n`);
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #d94f2b; font-size: 13px; margin-bottom: 24px; font-weight: 600;">⚠️ Alerte de sécurité</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${userName}</strong>,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          Notre équipe de sécurité a détecté une activité inhabituelle liée à votre compte. Voici le message de l'administrateur :
        </p>

        <div style="background: #fef3f0; border-left: 3px solid #d94f2b; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #0f1623; white-space: pre-wrap;">${message}</p>
        </div>

        <p style="margin: 0 0 12px 0; font-size: 14px; color: #5a6070;">
          Si vous n'êtes pas à l'origine de cette activité, nous vous recommandons de :
        </p>
        <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; color: #5a6070;">
          <li style="margin-bottom: 6px;">Changer votre mot de passe immédiatement</li>
          <li style="margin-bottom: 6px;">Vérifier si d'autres personnes ont accès à votre appareil</li>
          <li style="margin-bottom: 6px;">Contacter notre support si vous avez des questions</li>
        </ul>

        <a href="mailto:support@edu-reussite.com" style="display: inline-block; padding: 10px 20px; background: #0f1623; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Contacter le support →
        </a>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Édu-Réussite QC — Sécurité de la plateforme
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `⚠️ Alerte de sécurité — Édu-Réussite QC`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
