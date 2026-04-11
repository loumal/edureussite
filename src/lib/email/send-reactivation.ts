import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";
const DEV = process.env.NODE_ENV !== "production";

interface ReactivationParams {
  userEmail: string;
  userName: string;
  forcePasswordReset: boolean;
}

export async function sendReactivationEmail(params: ReactivationParams): Promise<void> {
  const { userEmail, userName, forcePasswordReset } = params;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Réactivation → ${userEmail}\n`);
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ ÉduRéussite QC</h1>
      <p style="color: #2e7d32; font-size: 13px; margin-bottom: 24px; font-weight: 600;">Accès rétabli</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${userName}</strong>,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          Bonne nouvelle : votre compte ÉduRéussite QC a été <strong>réactivé</strong>. Vous pouvez à nouveau vous connecter à la plateforme.
        </p>

        ${forcePasswordReset ? `
        <div style="background: #fffbea; border: 1px solid #f5d76e; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 13px; color: #7c6200; font-weight: 600;">⚠️ Action requise — Nouveau mot de passe</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #5a6070;">
            Pour des raisons de sécurité, vous devrez définir un nouveau mot de passe lors de votre prochaine connexion.
          </p>
        </div>
        ` : ""}

        <a href="https://edureussite.edevtic.com/login" style="display: inline-block; padding: 10px 20px; background: #0f1623; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Se connecter →
        </a>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        ÉduRéussite QC — Votre partenaire en réussite éducative
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `Votre accès ÉduRéussite QC a été rétabli`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
