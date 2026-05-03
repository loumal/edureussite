import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

interface ConfirmationRdvParams {
  parentEmail: string;
  parentNom: string;
  specialisteEmail: string;
  specialisteNom: string;
  prenomEnfant?: string | null;
  debut: Date;
  fin: Date;
  lienVisio?: string | null;
}

export async function sendConfirmationRdvEmail(params: ConfirmationRdvParams): Promise<void> {
  const {
    parentEmail,
    parentNom,
    specialisteEmail,
    specialisteNom,
    prenomEnfant,
    debut,
    fin,
    lienVisio,
  } = params;

  const dateFormatee = debut.toLocaleDateString("fr-CA", { dateStyle: "full" });
  const heureDebut = debut.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
  const heureFin = fin.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Confirmation RDV → ${parentEmail} + ${specialisteEmail}\n`);
    return;
  }

  const htmlParent = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 24px;">Confirmation de rendez-vous</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${parentNom}</strong>,
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #5a6070;">
          Votre rendez-vous avec <strong>${specialisteNom}</strong> est confirmé.
        </p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Date</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${dateFormatee}</p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Heure</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${heureDebut} – ${heureFin}</p>

        ${prenomEnfant ? `
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Enfant concerné</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #0f1623;">${prenomEnfant}</p>
        ` : ""}

        ${lienVisio ? `
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Lien visioconférence</p>
        <a href="${lienVisio}" style="display: inline-block; margin-top: 4px; padding: 8px 16px; background: #0f1623; color: white; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          Rejoindre la réunion →
        </a>
        ` : ""}
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Édu-Réussite QC — Votre partenaire en réussite éducative
      </p>
    </div>
  `;

  const htmlSpecialiste = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 24px;">Rendez-vous confirmé</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Parent</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${parentNom}</p>

        ${prenomEnfant ? `
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Enfant concerné</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #0f1623;">${prenomEnfant}</p>
        ` : ""}

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Date</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${dateFormatee}</p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Heure</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${heureDebut} – ${heureFin}</p>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Édu-Réussite QC — Tableau de bord spécialiste
      </p>
    </div>
  `;

  const [r1, r2] = await Promise.all([
    resend.emails.send({
      from: FROM,
      to: parentEmail,
      subject: `Rendez-vous confirmé avec ${specialisteNom} — Édu-Réussite QC`,
      html: htmlParent,
    }),
    resend.emails.send({
      from: FROM,
      to: specialisteEmail,
      subject: `Nouveau rendez-vous confirmé — ${parentNom}`,
      html: htmlSpecialiste,
    }),
  ]);

  if (r1.error) throw new Error(`Resend error (parent): ${r1.error.message}`);
  if (r2.error) throw new Error(`Resend error (spécialiste): ${r2.error.message}`);
  logResend(); logResend(); // 2 emails envoyés
}
