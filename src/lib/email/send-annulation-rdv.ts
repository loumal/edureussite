import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

interface AnnulationRdvParams {
  parentEmail: string;
  parentNom: string;
  specialisteEmail: string;
  specialisteNom: string;
  prenomEnfant?: string | null;
  debut: Date;
  annulePar: "parent" | "specialiste";
}

export async function sendAnnulationRdvEmail(params: AnnulationRdvParams): Promise<void> {
  const { parentEmail, parentNom, specialisteEmail, specialisteNom, prenomEnfant, debut, annulePar } = params;

  const dateFormatee = debut.toLocaleDateString("fr-CA", { dateStyle: "full" });
  const heureDebut = debut.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Annulation RDV → ${parentEmail} + ${specialisteEmail}\n`);
    return;
  }

  const htmlCommun = (destinataire: "parent" | "specialiste") => `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #d94f2b; font-size: 13px; margin-bottom: 24px; font-weight: 600;">Rendez-vous annulé</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          Le rendez-vous suivant a été annulé par ${annulePar === "parent" ? "le parent" : "le spécialiste"}.
        </p>

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">
          ${destinataire === "parent" ? "Spécialiste" : "Parent"}
        </p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0f1623;">
          ${destinataire === "parent" ? specialisteNom : parentNom}
        </p>

        ${prenomEnfant ? `
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Enfant concerné</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #0f1623;">${prenomEnfant}</p>
        ` : ""}

        <p style="margin: 0 0 4px 0; font-size: 13px; color: #8a909c; text-transform: uppercase; letter-spacing: 1px;">Date annulée</p>
        <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #0f1623;">${dateFormatee} à ${heureDebut}</p>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Vous pouvez planifier un nouveau rendez-vous depuis la plateforme Édu-Réussite QC.
      </p>
    </div>
  `;

  const [r1, r2] = await Promise.all([
    resend.emails.send({
      from: FROM,
      to: parentEmail,
      subject: `Rendez-vous annulé — Édu-Réussite QC`,
      html: htmlCommun("parent"),
    }),
    resend.emails.send({
      from: FROM,
      to: specialisteEmail,
      subject: `Rendez-vous annulé — ${parentNom}`,
      html: htmlCommun("specialiste"),
    }),
  ]);

  if (r1.error) throw new Error(`Resend error (parent): ${r1.error.message}`);
  if (r2.error) throw new Error(`Resend error (spécialiste): ${r2.error.message}`);
  logResend(); logResend(); // 2 emails envoyés
}
