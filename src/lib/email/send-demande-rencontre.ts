import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

interface DemandeParams {
  specialisteEmail: string;
  specialisteNom: string;
  parentEmail: string;
  parentNom: string;
  prenomEnfant?: string;
  message: string;
}

export async function sendDemandeRencontreEmail(params: DemandeParams): Promise<void> {
  const { specialisteEmail, specialisteNom, parentEmail, parentNom, prenomEnfant, message } = params;

  const subject = `Nouvelle demande de rencontre — Édu-Réussite QC`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 24px;">Nouvelle demande de rencontre</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Spécialiste</p>
        <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 700; color: #0f1623;">${specialisteNom}</p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Parent</p>
        <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 600; color: #0f1623;">${parentNom}</p>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: #5a6070;">${parentEmail}</p>

        ${prenomEnfant ? `
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Enfant concerné</p>
        <p style="margin: 0 0 20px 0; font-size: 15px; font-weight: 600; color: #0f1623;">${prenomEnfant}</p>
        ` : ""}

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Message</p>
        <p style="margin: 0; font-size: 14px; color: #0f1623; white-space: pre-wrap;">${message}</p>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Répondez directement à ce courriel pour contacter le parent.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Demande de rencontre → ${specialisteEmail}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: specialisteEmail,
    replyTo: parentEmail,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
