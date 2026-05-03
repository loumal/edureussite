import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

export async function sendSurpriseDisponibleEmail(opts: {
  parentEmail: string;
  parentPrenom: string;
  prenomEnfant: string;
  declencheur: string;
  explication: string;
  options: string[];
}): Promise<void> {
  const { parentEmail, parentPrenom, prenomEnfant, declencheur, explication, options } = opts;

  const optionsHtml = options
    .map((o) => `<li style="margin-bottom: 6px;">🎁 ${o}</li>`)
    .join("");

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 28px;">Message pour les parents</p>

      <div style="background: linear-gradient(135deg, #fef9ec 0%, #fff 100%); border: 1px solid #e5e2dc; border-radius: 14px; padding: 28px; margin-bottom: 24px;">
        <p style="font-size: 22px; text-align: center; margin: 0 0 8px 0;">🌟</p>
        <h2 style="font-size: 17px; color: #0f1623; text-align: center; margin: 0 0 8px 0;">
          ${prenomEnfant} mérite une surprise !
        </h2>
        <p style="font-size: 13px; color: #5a6070; text-align: center; margin: 0;">
          ${declencheur}
        </p>
      </div>

      <p style="font-size: 14px; color: #3a4050; line-height: 1.7; margin-bottom: 20px;">
        Bonjour ${parentPrenom},<br><br>
        ${explication}
      </p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #8a909c; margin: 0 0 12px 0;">
          Idées de surprise selon ses intérêts
        </p>
        <ul style="margin: 0; padding-left: 4px; list-style: none; font-size: 14px; color: #0f1623;">
          ${optionsHtml}
        </ul>
      </div>

      <p style="font-size: 13px; color: #5a6070; line-height: 1.6; margin-bottom: 24px;">
        Connectez-vous à votre tableau de bord pour choisir et accorder la surprise — ou définissez la vôtre. <strong>Vous gardez le contrôle total.</strong>
      </p>

      <p style="font-size: 11px; color: #aab0bc; text-align: center;">
        Ce message a été généré automatiquement par Édu-Réussite QC.<br>
        La surprise restera disponible pendant 14 jours.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Surprise pour ${parentEmail} — enfant: ${prenomEnfant}, déclencheur: ${declencheur}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `🌟 ${prenomEnfant} mérite une surprise — Édu-Réussite QC`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
