import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";
const DEV = process.env.NODE_ENV !== "production";

interface InvitationParams {
  email: string;
  prenom: string;
  nom: string;
  lienActivation: string;
}

export async function sendInvitationSpecialiste(params: InvitationParams): Promise<void> {
  const { email, prenom, lienActivation } = params;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ ÉduRéussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 24px;">Invitation à rejoindre l'équipe</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${prenom}</strong>,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070; line-height: 1.6;">
          Vous avez été invité(e) à rejoindre la plateforme <strong>ÉduRéussite QC</strong> en tant que spécialiste.
          Cliquez sur le bouton ci-dessous pour activer votre compte et définir votre mot de passe.
        </p>
        <a
          href="${lienActivation}"
          style="display: inline-block; background: #0f1623; color: white; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none;"
        >
          Activer mon compte →
        </a>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #8a909c;">
          Ce lien est valide pendant 72 heures.
        </p>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Si vous n'attendiez pas cette invitation, ignorez ce message.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Invitation spécialiste → ${email}\n${lienActivation}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Votre invitation ÉduRéussite QC — Activez votre compte",
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
