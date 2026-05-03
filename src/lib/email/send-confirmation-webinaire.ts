import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

interface ConfirmationWebinaireParams {
  parentEmail: string;
  parentNom: string;
  webinaireTitle: string;
  specialisteNom: string;
  dateHeure: Date;
  lienInscription?: string | null;
}

export async function sendConfirmationWebinaireEmail(params: ConfirmationWebinaireParams): Promise<void> {
  const { parentEmail, parentNom, webinaireTitle, specialisteNom, dateHeure, lienInscription } = params;

  const dateFormatee = dateHeure.toLocaleDateString("fr-CA", { dateStyle: "full" });
  const heureFormatee = dateHeure.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Confirmation webinaire → ${parentEmail}\n`);
    return;
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 24px;">Inscription au webinaire confirmée</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${parentNom}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #5a6070;">
          Votre inscription au webinaire est confirmée.
        </p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Webinaire</p>
        <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #0f1623;">${webinaireTitle}</p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Présenté par</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #0f1623;">${specialisteNom}</p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Date et heure</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${dateFormatee} à ${heureFormatee}</p>

        ${lienInscription ? `
        <a href="${lienInscription}" style="display: inline-block; margin-top: 8px; padding: 10px 20px; background: #0f1623; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Rejoindre le webinaire →
        </a>
        ` : ""}
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Édu-Réussite QC — Votre partenaire en réussite éducative
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `Inscription confirmée : ${webinaireTitle} — Édu-Réussite QC`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
