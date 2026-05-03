import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

export async function sendDemandeJeuParentEmail(opts: {
  parentEmail: string;
  parentPrenom: string;
  prenomEnfant: string;
  jeuNom: string;
  jeuEmoji: string;
  jeuDescription: string;
  jeuCategorie: string;
  jeuDuree: number;
  jeuXpCout: number;
  jeuDifficulte: string;
  token: string;
}): Promise<void> {
  const {
    parentEmail, parentPrenom, prenomEnfant,
    jeuNom, jeuEmoji, jeuDescription, jeuCategorie,
    jeuDuree, jeuXpCout, jeuDifficulte, token,
  } = opts;

  const urlAutoriser = `${BASE_URL}/api/jeux/autoriser/${token}`;
  const urlRefuser   = `${BASE_URL}/api/jeux/refuser/${token}`;

  const difficulteLabelFr: Record<string, string> = {
    facile: "Facile", moyen: "Moyen", difficile: "Difficile",
  };

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin: 0 0 4px 0;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin: 0 0 28px 0;">Demande d'accès à un jeu éducatif</p>

      <div style="background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%); border: 1px solid #c4b5fd; border-radius: 14px; padding: 28px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 48px; margin: 0 0 8px 0;">${jeuEmoji}</p>
        <h2 style="font-size: 20px; color: #3730a3; margin: 0 0 8px 0;">${jeuNom}</h2>
        <p style="font-size: 14px; color: #5a6070; margin: 0 0 16px 0;">
          <strong>${prenomEnfant}</strong> veut jouer à ce jeu éducatif.
        </p>
        <div style="display: inline-flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
          <span style="background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #3730a3; font-weight: 600;">
            📂 ${jeuCategorie}
          </span>
          <span style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #c2410c; font-weight: 600;">
            ⏱ ${jeuDuree} minutes
          </span>
          <span style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 20px; padding: 4px 12px; font-size: 12px; color: #065f46; font-weight: 600;">
            🎯 ${difficulteLabelFr[jeuDifficulte] ?? jeuDifficulte}
          </span>
        </div>
      </div>

      <p style="font-size: 14px; color: #3a4050; line-height: 1.7; margin-bottom: 20px;">
        Bonjour ${parentPrenom},<br><br>
        ${prenomEnfant} souhaite jouer à <strong>${jeuNom}</strong> sur Édu-Réussite QC.
        La session durera <strong>${jeuDuree} minutes</strong> et lui coûtera <strong>${jeuXpCout} XP</strong>
        (des points gagnés grâce à ses exercices scolaires).
      </p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #8a909c; margin: 0 0 10px 0;">
          À propos de ce jeu
        </p>
        <p style="font-size: 14px; color: #3a4050; line-height: 1.6; margin: 0;">
          ${jeuDescription}
        </p>
        <p style="font-size: 12px; color: #8a909c; margin: 12px 0 0 0;">
          💡 Ce jeu est approuvé par notre équipe pédagogique. Il renforce des notions du programme scolaire
          tout en offrant une expérience de jeu engageante et sans publicité.
        </p>
      </div>

      <p style="font-size: 14px; font-weight: 700; color: #0f1623; text-align: center; margin-bottom: 16px;">
        Autorisez-vous ${prenomEnfant} à jouer ?
      </p>

      <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 28px;">
        <a href="${urlAutoriser}"
          style="display: inline-block; background: #16a34a; color: #fff; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; text-align: center;">
          ✅ Oui, autoriser
        </a>
        <a href="${urlRefuser}"
          style="display: inline-block; background: #dc2626; color: #fff; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; text-align: center;">
          ❌ Non, refuser
        </a>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center; line-height: 1.5; margin-bottom: 12px;">
        Cette demande expire dans <strong>24 heures</strong>. Si vous ne répondez pas, la demande sera annulée automatiquement.
      </p>
      <p style="font-size: 11px; color: #aab0bc; text-align: center;">
        Édu-Réussite QC — Plateforme éducative québécoise<br>
        Vous recevez ce courriel car votre enfant utilise Édu-Réussite QC.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Demande jeu pour ${parentEmail}\n  Jeu: ${jeuNom}\n  Autoriser: ${urlAutoriser}\n  Refuser: ${urlRefuser}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `🎮 ${prenomEnfant} demande à jouer à "${jeuNom}" — Édu-Réussite QC`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
