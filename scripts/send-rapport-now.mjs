import { Resend } from "resend";
import { config as dotenv } from "dotenv";
dotenv({ path: ".env" });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "noreply@edu-reussite.com";
const APP_URL = "https://edu-reussite.com";

const TOKEN = "eval_eval_charbel_j1_1778956726770_1778956838140";
const RAPPORT_URL = `${APP_URL}/evaluation/rapport/${TOKEN}`;
const PRENOM_ENFANT = "Charbel";
const NOM_ENFANT = "Loumedjinon";

const PARENTS = [
  { email: "loumalex.al@gmail.com", prenom: "Alex" },
  { email: "miradelletoupe@gmail.com", prenom: "Miradelle" },
];

function buildHtml(prenomParent) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ec;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="background:#0f1623;border-radius:16px 16px 0 0;padding:28px 36px;">
    <p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">✦ Édu-Réussite QC</p>
    <p style="margin:6px 0 0 0;font-size:12px;color:#8a909c;letter-spacing:1px;text-transform:uppercase;">Plateforme d'apprentissage adaptatif</p>
  </td></tr>

  <tr><td style="background:#7c5cbf;padding:16px 36px;">
    <p style="margin:0;font-size:13px;color:#ffffff;font-weight:600;">🧠&nbsp; Rapport d'évaluation disponible — Neuropsychologue</p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:36px;">
    <p style="margin:0 0 20px 0;font-size:16px;color:#0f1623;">Bonjour <strong>${prenomParent}</strong>,</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#f3effe;border-left:4px solid #7c5cbf;border-radius:0 12px 12px 0;padding:20px 24px;">
        <p style="margin:0 0 8px 0;font-size:22px;">📋</p>
        <p style="margin:0 0 8px 0;font-size:16px;font-weight:700;color:#0f1623;">Le rapport de <strong>Charbel</strong> est prêt</p>
        <p style="margin:0;font-size:13px;color:#5b3fa0;line-height:1.6;">
          Notre équipe a analysé vos réponses au questionnaire et généré un rapport personnalisé
          avec des observations, des forces identifiées et des recommandations adaptées au profil
          de <strong>Charbel Loumedjinon</strong>.
        </p>
      </td></tr>
    </table>

    <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#0f1623;text-transform:uppercase;letter-spacing:0.5px;">Ce que vous trouverez dans ce rapport</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:12px 16px;margin-bottom:8px;">
        <p style="margin:0;font-size:13px;color:#0f1623;"><strong>📊 Profil radar des domaines évalués</strong><br/><span style="color:#5a6070;font-size:12px;">Visualisation graphique de chaque axe analysé</span></p>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:12px 16px;">
        <p style="margin:0;font-size:13px;color:#0f1623;"><strong>✨ Forces identifiées</strong><br/><span style="color:#5a6070;font-size:12px;">Les points forts observés chez votre enfant</span></p>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:12px 16px;">
        <p style="margin:0;font-size:13px;color:#0f1623;"><strong>⚡ Zones nécessitant un soutien</strong><br/><span style="color:#5a6070;font-size:12px;">Les domaines à accompagner en priorité</span></p>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:12px 16px;">
        <p style="margin:0;font-size:13px;color:#0f1623;"><strong>💡 Recommandations pratiques</strong><br/><span style="color:#5a6070;font-size:12px;">Des conseils concrets à mettre en place à la maison</span></p>
      </td></tr>
      <tr><td style="height:6px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:12px 16px;">
        <p style="margin:0;font-size:13px;color:#0f1623;"><strong>🗺️ Prochaines étapes</strong><br/><span style="color:#5a6070;font-size:12px;">Les actions suggérées pour la suite du parcours</span></p>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr><td align="center">
        <a href="${RAPPORT_URL}" style="display:inline-block;padding:18px 44px;background:#d94f2b;color:#ffffff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          Consulter le rapport →
        </a>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <p style="margin:0;font-size:12px;color:#8a909c;">Lien sécurisé et confidentiel — accès réservé aux parents de Charbel.</p>
      </td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e2dc;margin:0 0 20px 0;"/>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          <strong>📝 Votre avis compte</strong><br/>
          Après lecture, vous serez invité(e) à indiquer si ce rapport correspond bien à votre enfant.
          Votre validation permet à la plateforme d'ajuster son parcours de façon précise.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="background:#f4f1ec;border-radius:0 0 16px 16px;padding:24px 36px;border-top:1px solid #e5e2dc;">
    <p style="margin:0 0 8px 0;font-size:13px;color:#0f1623;font-weight:700;">Une question ? Contactez-nous.</p>
    <p style="margin:0;font-size:12px;color:#8a909c;line-height:1.6;">
      <a href="mailto:soutien@edureussite.ca" style="color:#7c5cbf;text-decoration:none;">soutien@edureussite.ca</a>
      &nbsp;·&nbsp; Ce courriel est confidentiel et destiné uniquement à ${prenomParent}.
    </p>
    <p style="margin:12px 0 0 0;font-size:11px;color:#b0b7c3;">© 2026 Édu-Réussite QC — Tous droits réservés</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

for (const p of PARENTS) {
  const result = await resend.emails.send({
    from: FROM,
    to: p.email,
    subject: "🧠 Le rapport de Charbel est disponible — Neuropsychologue | Édu-Réussite QC",
    html: buildHtml(p.prenom),
  });
  if (result.error) {
    console.error("FAIL", p.email, result.error);
  } else {
    console.log("OK  ", p.email, result.data?.id);
  }
}
