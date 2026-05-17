import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";
import type { DomaineSpecialiste } from "@/generated/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";

const DOMAINE_CONFIG: Record<DomaineSpecialiste, { fr: string; icon: string }> = {
  NEUROPSYCHOLOGUE:  { fr: "Neuropsychologue",         icon: "🧠" },
  ORTHOPEDAGOGUE:    { fr: "Orthopédagogue",            icon: "📚" },
  ORTHOPHONISTE:     { fr: "Orthophoniste",             icon: "🗣️" },
  ERGOTHERAPEUTE:    { fr: "Ergothérapeute",            icon: "✋" },
  OPTOMETRISTE:      { fr: "Optométriste",              icon: "👁️" },
  PSYCHOEDUCATEUR:   { fr: "Psychoéducateur",           icon: "💬" },
};

export interface RapportNotificationParams {
  parentEmail: string;
  prenomParent: string;
  prenomEnfant: string;
  nomEnfant: string;
  specialist: DomaineSpecialiste;
  tokenAcces: string;
  appUrl: string;
}

export async function sendRapportNotification(params: RapportNotificationParams): Promise<void> {
  const { parentEmail, prenomParent, prenomEnfant, nomEnfant, specialist, tokenAcces, appUrl } = params;

  const config = DOMAINE_CONFIG[specialist];
  const rapportUrl = `${appUrl}/evaluation/rapport/${tokenAcces}`;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ec;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- En-tête -->
  <tr>
    <td style="background:#0f1623;border-radius:16px 16px 0 0;padding:28px 36px;">
      <p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">✦ Édu-Réussite QC</p>
      <p style="margin:6px 0 0 0;font-size:12px;color:#8a909c;letter-spacing:1px;text-transform:uppercase;">Plateforme d'apprentissage adaptatif</p>
    </td>
  </tr>

  <!-- Bandeau spécialiste -->
  <tr>
    <td style="background:#7c5cbf;padding:16px 36px;">
      <p style="margin:0;font-size:13px;color:#ffffff;font-weight:600;">
        ${config.icon}&nbsp; Rapport d'évaluation disponible — ${config.fr}
      </p>
    </td>
  </tr>

  <!-- Corps -->
  <tr>
    <td style="background:#ffffff;padding:36px;">

      <p style="margin:0 0 20px 0;font-size:16px;color:#0f1623;">
        Bonjour <strong>${prenomParent}</strong>,
      </p>

      <!-- Annonce principale -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#f3effe;border-left:4px solid #7c5cbf;border-radius:0 12px 12px 0;padding:20px 24px;">
            <p style="margin:0 0 8px 0;font-size:22px;">📋</p>
            <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#0f1623;">
              Le rapport de <strong>${prenomEnfant}</strong> est prêt
            </p>
            <p style="margin:0;font-size:13px;color:#5b3fa0;line-height:1.6;">
              Notre équipe a analysé vos réponses au questionnaire et généré un rapport
              personnalisé avec des observations, des forces identifiées et des recommandations
              adaptées au profil de <strong>${prenomEnfant} ${nomEnfant}</strong>.
            </p>
          </td>
        </tr>
      </table>

      <!-- Ce que contient le rapport -->
      <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#0f1623;text-transform:uppercase;letter-spacing:0.5px;">
        Ce que vous trouverez dans ce rapport
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td>
            ${[
              ["📊", "Profil radar des domaines évalués", "Visualisation graphique de chaque axe analysé"],
              ["✨", "Forces identifiées", "Les points forts observés chez votre enfant"],
              ["⚡", "Zones nécessitant un soutien", "Les domaines à accompagner en priorité"],
              ["💡", "Recommandations pratiques", "Des conseils concrets à mettre en place à la maison"],
              ["🗺️", "Prochaines étapes", "Les actions suggérées pour la suite du parcours"],
            ].map(([icon, title, desc]) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                <tr>
                  <td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#0f1623;">
                      <strong>${icon} ${title}</strong><br/>
                      <span style="color:#5a6070;font-size:12px;">${desc}</span>
                    </p>
                  </td>
                </tr>
              </table>`).join("")}
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
        <tr>
          <td align="center">
            <a href="${rapportUrl}"
               style="display:inline-block;padding:18px 44px;background:#d94f2b;color:#ffffff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;">
              Consulter le rapport →
            </a>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <p style="margin:0;font-size:12px;color:#8a909c;">Lien sécurisé et confidentiel — accès réservé aux parents de ${prenomEnfant}.</p>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e2dc;margin:0 0 20px 0;"/>

      <!-- Note sur la validation -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
              <strong>📝 Votre avis compte</strong><br/>
              Après lecture, vous serez invité(e) à indiquer si ce rapport correspond bien à
              votre enfant. Votre validation permet à la plateforme d'ajuster son parcours de
              façon précise.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Pied de page -->
  <tr>
    <td style="background:#f4f1ec;border-radius:0 0 16px 16px;padding:24px 36px;border-top:1px solid #e5e2dc;">
      <p style="margin:0 0 8px 0;font-size:13px;color:#0f1623;font-weight:700;">Une question ? Contactez-nous.</p>
      <p style="margin:0;font-size:12px;color:#8a909c;line-height:1.6;">
        <a href="mailto:soutien@edureussite.ca" style="color:#7c5cbf;text-decoration:none;">soutien@edureussite.ca</a>
        &nbsp;·&nbsp; Ce courriel est confidentiel et destiné uniquement à ${prenomParent}.
      </p>
      <p style="margin:12px 0 0 0;font-size:11px;color:#b0b7c3;">
        © ${year} Édu-Réussite QC — Tous droits réservés
        &nbsp;·&nbsp;
        <a href="${appUrl}/politique-confidentialite" style="color:#b0b7c3;">Politique de confidentialité</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `${config.icon} Le rapport de ${prenomEnfant} est disponible — ${config.fr} | Édu-Réussite QC`,
    html,
  });

  if (error) throw new Error(`Resend error (${parentEmail}): ${error.message}`);
  logResend();
}
