import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";
const DEV = process.env.NODE_ENV !== "production";

export async function sendAidePlanificationParent(opts: {
  parentEmail: string;
  parentPrenom: string;
  prenomEnfant: string;
  niveauScolaire: string;
  eleveId: string;
  nbNotions: number;
}): Promise<void> {
  const { parentEmail, parentPrenom, prenomEnfant, niveauScolaire, eleveId, nbNotions } = opts;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://edureussite.qc.ca";
  const lienPlan = `${appUrl}/parent/accompagnement/${eleveId}`;

  const niveauxLabels: Record<string, string> = {
    PRIMAIRE_1: "1re année", PRIMAIRE_2: "2e année", PRIMAIRE_3: "3e année",
    PRIMAIRE_4: "4e année", PRIMAIRE_5: "5e année", PRIMAIRE_6: "6e année",
    SECONDAIRE_1: "Secondaire 1", SECONDAIRE_2: "Secondaire 2",
    SECONDAIRE_3: "Secondaire 3", SECONDAIRE_4: "Secondaire 4", SECONDAIRE_5: "Secondaire 5",
  };
  const niveauLabel = niveauxLabels[niveauScolaire] ?? niveauScolaire;

  const estJeuneEnfant = ["PRIMAIRE_1", "PRIMAIRE_2", "PRIMAIRE_3"].includes(niveauScolaire);

  const messagePersonnalise = estJeuneEnfant
    ? `En ${niveauLabel}, votre enfant a besoin de votre aide pour planifier ses apprentissages. Quelques minutes ensemble suffiront pour l'aider à organiser son travail de façon concrète et motivante.`
    : `${prenomEnfant} vient de mettre à jour son plan de travail sur ÉduRéussite QC. Vous pouvez consulter ses objectifs et suivre sa progression depuis votre espace parent.`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ ÉduRéussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 28px;">Plan de travail — action requise${estJeuneEnfant ? " 👨‍👩‍👧" : ""}</p>

      <div style="background: linear-gradient(135deg, #f0eeff 0%, #fff 100%); border: 1px solid rgba(91,79,207,0.2); border-radius: 14px; padding: 28px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 36px; margin: 0 0 8px 0;">🗺️</p>
        <h2 style="font-size: 18px; color: #0f1623; margin: 0 0 6px 0;">
          ${prenomEnfant} a planifié <span style="color: #5b4fcf; font-weight: 900;">${nbNotions} notion${nbNotions > 1 ? "s" : ""}</span> à travailler
        </h2>
        <p style="font-size: 13px; color: #5a6070; margin: 0;">
          ${niveauLabel} · Plan de travail actif
        </p>
      </div>

      <p style="font-size: 14px; color: #3a4050; line-height: 1.7; margin-bottom: 20px;">
        Bonjour ${parentPrenom},<br><br>
        ${messagePersonnalise}
      </p>

      ${estJeuneEnfant ? `
      <div style="background: #fff8e6; border: 1px solid #f0d060; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; font-size: 13px; color: #7a5c00;">
        <strong>💡 Comment aider ${prenomEnfant} ?</strong><br>
        <ul style="margin: 8px 0 0 0; padding-left: 18px; line-height: 1.8;">
          <li>Consultez le plan ensemble sur l'écran</li>
          <li>Demandez-lui ce qu'il/elle aimerait apprendre en premier</li>
          <li>Encouragez-le/la à choisir ses jours d'étude préférés</li>
        </ul>
      </div>
      ` : ""}

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${lienPlan}"
          style="display: inline-block; background: #5b4fcf; color: white; font-size: 14px; font-weight: bold; padding: 14px 28px; border-radius: 50px; text-decoration: none;">
          Voir le plan de ${prenomEnfant} →
        </a>
      </div>

      <p style="font-size: 11px; color: #aab0bc; text-align: center;">
        Ce message est envoyé automatiquement par ÉduRéussite QC.<br>
        ${prenomEnfant} vient d'enregistrer ou de modifier son plan de travail.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Aide planification → ${parentEmail} — enfant: ${prenomEnfant} (${niveauLabel}), ${nbNotions} notions\n`);
    return;
  }

  const subject = estJeuneEnfant
    ? `🗺️ Aidez ${prenomEnfant} à planifier ses apprentissages — ÉduRéussite QC`
    : `🗺️ ${prenomEnfant} a mis à jour son plan de travail — ÉduRéussite QC`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
