import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";
const DEV = process.env.NODE_ENV !== "production";

export async function sendStreakReminderParent(opts: {
  parentEmail: string;
  parentPrenom: string;
  prenomEnfant: string;
  streakJours: number;
  streakBoucliers: number;
}): Promise<void> {
  const { parentEmail, parentPrenom, prenomEnfant, streakJours, streakBoucliers } = opts;

  const perdraBouclier = streakBoucliers > 0;
  const urgenceClass = streakJours >= 7 ? "#e05c2e" : "#c9952a";
  const flamme = streakJours >= 7 ? "🔥" : "⚡";

  const bouclierWarning = perdraBouclier
    ? `<div style="background: #fffbe6; border: 1px solid #f0d060; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #7a5c00;">
        🛡️ <strong>${prenomEnfant} possède ${streakBoucliers} bouclier${streakBoucliers > 1 ? "s" : ""} de protection.</strong> Si aucun exercice n'est fait ce soir, un bouclier sera consommé automatiquement — mais la série sera sauvée !
      </div>`
    : `<div style="background: #fff4f0; border: 1px solid #f5b8a0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #8a3010;">
        ⚠️ Sans bouclier de protection, la série sera <strong>perdue à minuit</strong> si aucun exercice n'est complété ce soir.
      </div>`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ ÉduRéussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 28px;">Rappel de série — ce soir</p>

      <div style="background: linear-gradient(135deg, #fff8f0 0%, #fff 100%); border: 1px solid #e5e2dc; border-radius: 14px; padding: 28px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 36px; margin: 0 0 8px 0;">${flamme}</p>
        <h2 style="font-size: 18px; color: #0f1623; margin: 0 0 6px 0;">
          ${prenomEnfant} est à <span style="color: ${urgenceClass}; font-weight: 900;">${streakJours} jour${streakJours > 1 ? "s" : ""}</span> de série !
        </h2>
        <p style="font-size: 13px; color: #5a6070; margin: 0;">
          Aucun exercice n'a encore été complété aujourd'hui.
        </p>
      </div>

      <p style="font-size: 14px; color: #3a4050; line-height: 1.7; margin-bottom: 20px;">
        Bonjour ${parentPrenom},<br><br>
        ${prenomEnfant} n'a pas encore fait d'exercice aujourd'hui. Un simple rappel ce soir pourrait suffire pour maintenir sa belle série de <strong>${streakJours} jour${streakJours > 1 ? "s" : ""}</strong> consécutifs !
      </p>

      ${bouclierWarning}

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://edureussite.qc.ca"}/eleve/exercices/nouveau"
          style="display: inline-block; background: #5b4fcf; color: white; font-size: 14px; font-weight: bold; padding: 14px 28px; border-radius: 50px; text-decoration: none;">
          Faire 1 exercice ce soir →
        </a>
      </div>

      <p style="font-size: 11px; color: #aab0bc; text-align: center;">
        Ce message est envoyé automatiquement par ÉduRéussite QC.<br>
        Vous recevez ce rappel car ${prenomEnfant} n'a pas encore été actif aujourd'hui.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Rappel streak → ${parentEmail} — enfant: ${prenomEnfant}, ${streakJours} jours\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `${flamme} ${prenomEnfant} — série de ${streakJours} jours à protéger ce soir !`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
