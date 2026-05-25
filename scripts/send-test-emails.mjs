import { Resend } from "resend";
import { config as dotenv } from "dotenv";
dotenv({ path: ".env" });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "noreply@edu-reussite.com";

const TOKEN = "eval_eval_charbel_j1_1778956726770_1778956838140";
const APP_URL = "https://edu-reussite.com";
const FORM_URL = `${APP_URL}/evaluation/${TOKEN}`;

const POURQUOI =
  "L'algorithme de suivi d'Édu-Réussite a identifié des signes persistants de difficultés attentionnelles et de fonctions exécutives chez votre enfant. Une évaluation neuropsychologique permet de comprendre comment son cerveau traite, organise et mémorise l'information — et d'adapter son parcours scolaire en conséquence.";

const CE_QUE_COUVRE = [
  "Attention et concentration en contexte scolaire",
  "Impulsivité et régulation du comportement",
  "Fonctions exécutives (planification, organisation, mémoire de travail)",
  "Régulation émotionnelle et estime de soi",
  "Historique développemental (anamnèse)",
];

const PARENTS = [
  { email: "miradelletoupe@gmail.com", prenom: "Miradelle" },
];

function buildHtml(prenomParent) {
  const listItems = CE_QUE_COUVRE.map(
    (item) =>
      `<li style="margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;"><span style="color:#7c5cbf;font-weight:700;flex-shrink:0;">›</span><span>${item}</span></li>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f1ec;font-family:Georgia,'Times New Roman',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ec;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="background:#0f1623;border-radius:16px 16px 0 0;padding:28px 36px;">
    <p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;">✦ Édu-Réussite QC</p>
    <p style="margin:6px 0 0 0;font-size:12px;color:#8a909c;letter-spacing:1px;text-transform:uppercase;">Plateforme d'apprentissage adaptatif</p>
  </td></tr>

  <tr><td style="background:#7c5cbf;padding:16px 36px;">
    <p style="margin:0;font-size:13px;color:#ffffff;font-weight:600;">🧠&nbsp; Évaluation spécialisée — Neuropsychologue</p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:36px;">
    <p style="margin:0 0 20px 0;font-size:16px;color:#0f1623;">Bonjour <strong>${prenomParent}</strong>,</p>

    <p style="margin:0 0 16px 0;font-size:14px;color:#3d4554;line-height:1.7;">
      L'équipe d'Édu-Réussite vous contacte concernant le suivi scolaire de
      <strong>Charbel Loumedjinon</strong>. Suite à l'analyse de sa progression sur la plateforme,
      nous recommandons une évaluation par un(e) <strong>Neuropsychologue</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#f3effe;border-left:4px solid #7c5cbf;border-radius:0 12px 12px 0;padding:20px 24px;">
        <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#5b3fa0;text-transform:uppercase;letter-spacing:0.5px;">Pourquoi cette évaluation ?</p>
        <p style="margin:0;font-size:14px;color:#3d4554;line-height:1.7;">${POURQUOI}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;color:#0f1623;text-transform:uppercase;letter-spacing:0.5px;">Ce que le questionnaire couvre</p>
    <ul style="margin:0 0 28px 0;padding:0;list-style:none;font-size:14px;color:#3d4554;line-height:1.6;">${listItems}</ul>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;">
        <p style="margin:0;font-size:13px;color:#92400e;">
          <strong>⏱ Durée estimée : 15 à 20 minutes</strong><br/>
          <span style="color:#b45309;">Répondez selon vos observations des 30 derniers jours. Il n'existe pas de mauvaise réponse — votre regard de parent est précieux et irremplaçable.</span>
        </p>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr><td align="center">
        <a href="${FORM_URL}" style="display:inline-block;padding:16px 40px;background:#d94f2b;color:#ffffff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.3px;">
          Accéder au questionnaire →
        </a>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
      <tr><td align="center">
        <p style="margin:0;font-size:12px;color:#8a909c;">Lien sécurisé et personnel — valide 30 jours. Ne le partagez pas.</p>
      </td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #e5e2dc;margin:0 0 28px 0;"/>

    <p style="margin:0 0 14px 0;font-size:13px;font-weight:700;color:#0f1623;text-transform:uppercase;letter-spacing:0.5px;">🔒 Vos données et votre consentement</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:14px 18px;">
        <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#0f1623;">📋 Ce que nous collectons</p>
        <p style="margin:0;font-size:13px;color:#5a6070;line-height:1.6;">Vos réponses au questionnaire d'observation, le profil scolaire de Charbel (niveau, matières, progression) et les informations développementales que vous fournirez.</p>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:14px 18px;">
        <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#0f1623;">🎯 Dans quel but</p>
        <p style="margin:0;font-size:13px;color:#5a6070;line-height:1.6;">Générer un rapport personnalisé pour adapter le parcours scolaire de Charbel sur la plateforme. Ces données ne sont <strong>jamais</strong> partagées à des tiers sans votre accord explicite.</p>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:14px 18px;">
        <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#0f1623;">⚖️ Vos droits (Loi 25 — Québec &amp; RGPD)</p>
        <p style="margin:0;font-size:13px;color:#5a6070;line-height:1.6;">Vous avez le droit d'accéder à vos données, de les corriger ou d'en demander la suppression à tout moment. Votre consentement est libre, éclairé et révocable. Pour exercer vos droits : <a href="mailto:confidentialite@edureussite.ca" style="color:#7c5cbf;">confidentialite@edureussite.ca</a></p>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="background:#f9f7f4;border:1px solid #e5e2dc;border-radius:10px;padding:14px 18px;">
        <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#0f1623;">🛡️ Sécurité de vos données</p>
        <p style="margin:0;font-size:13px;color:#5a6070;line-height:1.6;">Toutes les données sont chiffrées (TLS 1.3), stockées au Canada sur des serveurs conformes à la Loi 25. Seuls les intervenants autorisés liés au dossier de Charbel y ont accès.</p>
      </td></tr>
    </table>

    <p style="margin:24px 0 0 0;font-size:13px;color:#5a6070;line-height:1.6;">
      En accédant au questionnaire, vous confirmerez votre consentement à la collecte et au traitement de ces informations dans le cadre du suivi scolaire de Charbel. Une case de consentement explicite vous sera présentée avant la soumission finale.
    </p>
  </td></tr>

  <tr><td style="background:#f4f1ec;border-radius:0 0 16px 16px;padding:24px 36px;border-top:1px solid #e5e2dc;">
    <p style="margin:0 0 8px 0;font-size:13px;color:#0f1623;font-weight:700;">Une question ? Contactez-nous.</p>
    <p style="margin:0;font-size:12px;color:#8a909c;line-height:1.6;">
      <a href="mailto:soutien@edureussite.ca" style="color:#7c5cbf;text-decoration:none;">soutien@edureussite.ca</a>
      &nbsp;·&nbsp; Ce courriel est confidentiel et destiné uniquement à ${prenomParent}.
      Si vous n'avez pas de compte Édu-Réussite lié à cet enfant, veuillez nous en informer.
    </p>
    <p style="margin:12px 0 0 0;font-size:11px;color:#b0b7c3;">
      © 2026 Édu-Réussite QC — Tous droits réservés
      &nbsp;·&nbsp; <a href="${APP_URL}/politique-confidentialite" style="color:#b0b7c3;">Politique de confidentialité</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

for (const p of PARENTS) {
  const result = await resend.emails.send({
    from: FROM,
    to: p.email,
    subject: `🧠 Questionnaire d'évaluation pour Charbel — Neuropsychologue | Édu-Réussite QC`,
    html: buildHtml(p.prenom),
  });
  if (result.error) {
    console.error("FAIL", p.email, result.error);
  } else {
    console.log("OK  ", p.email, result.data?.id);
  }
}
