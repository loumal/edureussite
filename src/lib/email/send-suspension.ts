import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

interface SuspensionParams {
  userEmail: string;
  userName: string;
  raison?: string | null;
}

export async function sendSuspensionEmail(params: SuspensionParams): Promise<void> {
  const { userEmail, userName, raison } = params;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Suspension → ${userEmail}\n`);
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #d94f2b; font-size: 13px; margin-bottom: 24px; font-weight: 600;">Accès temporairement suspendu</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${userName}</strong>,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          Votre accès à la plateforme Édu-Réussite QC a été <strong>temporairement suspendu</strong> par un administrateur suite à une activité inhabituelle détectée sur votre compte.
        </p>

        ${raison ? `
        <div style="background: #fef3f0; border: 1px solid #fbd5c8; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 13px; color: #d94f2b; font-weight: 600;">Motif indiqué :</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #0f1623;">${raison}</p>
        </div>
        ` : ""}

        <p style="margin: 0 0 8px 0; font-size: 14px; color: #5a6070;">
          Pour récupérer votre accès, veuillez contacter notre équipe de support :
        </p>
        <a href="mailto:support@edu-reussite.com" style="display: inline-block; padding: 10px 20px; background: #0f1623; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Contacter le support →
        </a>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Si vous pensez qu'il s'agit d'une erreur, répondez à ce courriel.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `Votre accès Édu-Réussite QC a été suspendu`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
