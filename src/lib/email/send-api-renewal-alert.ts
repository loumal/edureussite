import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";

export async function sendApiRenewalAlert(opts: {
  adminEmail: string;
  adminPrenom: string;
  apiNom: string;
  dateRenouvellement: Date;
  heuresRestantes: number;
}): Promise<void> {
  const { adminEmail, adminPrenom, apiNom, dateRenouvellement, heuresRestantes } = opts;

  const dateStr = dateRenouvellement.toLocaleDateString("fr-CA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto",
  });

  const urgenceColor = heuresRestantes <= 24 ? "#c0392b" : "#c9952a";
  const urgenceLabel = heuresRestantes <= 24 ? "URGENT — J-1" : "Important — J-3";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="font-size: 40px; margin-bottom: 8px;">⚠️</div>
        <h1 style="font-size: 22px; font-weight: bold; color: #0f1623; margin: 0;">
          Budget API bientôt épuisé
        </h1>
        <p style="color: #3a4460; font-size: 14px; margin-top: 6px;">
          Édu-Réussite QC — Alerte système
        </p>
      </div>

      <div style="background: white; border-radius: 12px; padding: 24px; border: 2px solid ${urgenceColor}; margin-bottom: 20px;">
        <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: ${urgenceColor};">
          ${urgenceLabel}
        </p>
        <p style="font-size: 18px; font-weight: bold; color: #0f1623; margin: 0 0 12px 0;">
          ${apiNom}
        </p>
        <p style="font-size: 14px; color: #3a4460; margin: 0;">
          Épuisement prévu le <strong>${dateStr}</strong><br/>
          Il reste environ <strong style="color: ${urgenceColor};">${heuresRestantes}h</strong> de budget.
        </p>
      </div>

      <div style="background: #fff8e6; border: 1px solid #f0d060; border-radius: 10px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: #7a5c00;">
        ⚡ Si le renouvellement n'est pas effectué à temps, les fonctionnalités IA de la plateforme seront interrompues pour tous les élèves.
      </div>

      <p style="font-size: 13px; color: #3a4460; margin-bottom: 6px;">
        Bonjour ${adminPrenom},
      </p>
      <p style="font-size: 13px; color: #3a4460;">
        Ce message est automatique. Veuillez recharger le budget <strong>${apiNom}</strong> dès que possible pour éviter toute interruption de service.
      </p>

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(15,22,35,0.12); text-align: center;">
        <p style="font-size: 11px; color: #9aa3b8; margin: 0;">
          Édu-Réussite QC — Système d'alertes administratives
        </p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `⚠️ [${urgenceLabel}] Budget ${apiNom} dans ${heuresRestantes}h — Édu-Réussite QC`,
    html,
  });
}
