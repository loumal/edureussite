import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";
const DEV = process.env.NODE_ENV !== "production";

export async function sendOtpEmail(
  email: string,
  otp: string,
  purpose: "verification" | "login" | "reset"
): Promise<void> {
  const isVerif = purpose === "verification";
  const subject = isVerif
    ? "Confirmez votre adresse courriel — ÉduRéussite QC"
    : purpose === "reset"
    ? "Réinitialisation de votre mot de passe — ÉduRéussite QC"
    : "Votre code de connexion — ÉduRéussite QC";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 8px;">✦ ÉduRéussite QC</h1>
      <p style="color: #5a6070; font-size: 14px; margin-bottom: 24px;">
        ${isVerif
          ? "Merci de créer votre compte. Veuillez confirmer votre adresse courriel avec le code ci-dessous."
          : purpose === "reset"
          ? "Utilisez ce code pour réinitialiser votre mot de passe."
          : "Voici votre code de connexion à usage unique."}
      </p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 12px; color: #8a909c; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">Votre code</p>
        <p style="font-size: 40px; font-weight: 900; color: #0f1623; letter-spacing: 12px; margin: 0;">${otp}</p>
        <p style="font-size: 12px; color: #8a909c; margin: 12px 0 0 0;">Valide pendant 15 minutes</p>
      </div>

      <p style="color: #8a909c; font-size: 12px; text-align: center;">
        Si vous n'avez pas demandé ce code, ignorez ce message.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] OTP pour ${email}: ${otp}\n`);
    return;
  }

  const { error } = await resend.emails.send({ from: FROM, to: email, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
