import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";
import type { DomaineSpecialiste } from "@/generated/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

const DOMAINE_CONFIG: Record<DomaineSpecialiste, {
  fr: string; en: string; icon: string;
  pourquoi: string;
  ceQueCouvre: string[];
}> = {
  NEUROPSYCHOLOGUE: {
    fr: "Neuropsychologue", en: "Neuropsychologist", icon: "🧠",
    pourquoi: "L'algorithme de suivi d'Édu-Réussite a identifié des signes persistants de difficultés attentionnelles et de fonctions exécutives chez votre enfant. Une évaluation neuropsychologique permet de comprendre comment son cerveau traite, organise et mémorise l'information — et d'adapter son parcours scolaire en conséquence.",
    ceQueCouvre: [
      "Attention et concentration en contexte scolaire",
      "Impulsivité et régulation du comportement",
      "Fonctions exécutives (planification, organisation, mémoire de travail)",
      "Régulation émotionnelle et estime de soi",
      "Historique développemental (anamnèse)",
    ],
  },
  ORTHOPEDAGOGUE: {
    fr: "Orthopédagogue", en: "Learning Specialist", icon: "📚",
    pourquoi: "Des difficultés persistantes en lecture, écriture ou mathématiques ont été détectées malgré les interventions en cours. Un bilan orthopédagogique permettra de cibler précisément les lacunes et de mettre en place des stratégies d'apprentissage adaptées.",
    ceQueCouvre: [
      "Compétences en lecture (décodage, compréhension)",
      "Production écrite et orthographe",
      "Raisonnement mathématique et numération",
      "Stratégies d'apprentissage et méthodes de travail",
      "Contexte scolaire et historique des apprentissages",
    ],
  },
  ORTHOPHONISTE: {
    fr: "Orthophoniste", en: "Speech-Language Pathologist", icon: "🗣️",
    pourquoi: "Des indicateurs concernant la communication orale, la compréhension du langage ou l'expression écrite ont été relevés. Un bilan en orthophonie permettra d'évaluer les compétences langagières de votre enfant et de proposer un accompagnement ciblé.",
    ceQueCouvre: [
      "Compréhension et expression orale",
      "Développement du vocabulaire et du langage",
      "Phonologie et conscience phonologique",
      "Langage écrit et liens lecture-orthographe",
      "Communication et interactions sociales",
    ],
  },
  ERGOTHERAPEUTE: {
    fr: "Ergothérapeute", en: "Occupational Therapist", icon: "✋",
    pourquoi: "Des difficultés liées à la motricité fine, à l'écriture manuscrite ou au traitement sensoriel ont été observées. Un bilan en ergothérapie permettra d'évaluer l'impact de ces difficultés sur les activités scolaires et d'identifier des adaptations concrètes.",
    ceQueCouvre: [
      "Motricité fine et habiletés graphomotrices",
      "Traitement sensoriel et tolérances sensorielles",
      "Autonomie dans les tâches scolaires",
      "Organisation et planification des gestes",
      "Environnement et adaptations ergonomiques",
    ],
  },
  OPTOMETRISTE: {
    fr: "Optométriste", en: "Optometrist", icon: "👁️",
    pourquoi: "Des difficultés pouvant être liées à la vision fonctionnelle ont été identifiées — notamment en lecture et en copie. Un bilan optométrique permettra d'évaluer si des facteurs visuels contribuent aux difficultés scolaires de votre enfant.",
    ceQueCouvre: [
      "Acuité visuelle et vision binoculaire",
      "Confort visuel lors de la lecture",
      "Mouvements oculaires et vergence",
      "Traitement visuo-spatial",
      "Fatigue visuelle et posture de lecture",
    ],
  },
  PSYCHOEDUCATEUR: {
    fr: "Psychoéducateur", en: "Psychoeducator", icon: "💬",
    pourquoi: "Des signes de désengagement scolaire, de difficultés comportementales ou d'adaptation sociale ont été observés. Un bilan psychoéducatif permettra de mieux comprendre les besoins émotionnels et comportementaux de votre enfant pour l'accompagner efficacement.",
    ceQueCouvre: [
      "Motivation et engagement scolaire",
      "Comportements et adaptation sociale",
      "Gestion des émotions et du stress",
      "Relations avec les pairs et les adultes",
      "Contexte familial et facteurs de résilience",
    ],
  },
};

interface FormulaireParentParams {
  parentEmail: string;
  prenomParent: string;
  prenomEnfant: string;
  nomEnfant: string;
  specialist: DomaineSpecialiste;
  tokenAcces: string;
  appUrl: string;
  isSecondCycle?: boolean;
}

export async function sendFormulaireParent(params: FormulaireParentParams): Promise<void> {
  const { parentEmail, prenomParent, prenomEnfant, nomEnfant, specialist, tokenAcces, appUrl, isSecondCycle } = params;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Formulaire parent → ${parentEmail}`);
    console.log(`   Enfant: ${prenomEnfant} ${nomEnfant} | Spécialiste: ${specialist}`);
    console.log(`   Lien: ${appUrl}/evaluation/${tokenAcces}\n`);
    return;
  }

  const config = DOMAINE_CONFIG[specialist];
  const formUrl = `${appUrl}/evaluation/${tokenAcces}`;
  const titreCycle = isSecondCycle ? "Évaluation complémentaire" : "Évaluation spécialisée";

  const ceQueCouvreHtml = config.ceQueCouvre
    .map(item => `
      <li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: #7c5cbf; font-weight: 700; flex-shrink: 0;">›</span>
        <span>${item}</span>
      </li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f1ec; font-family: Georgia, 'Times New Roman', serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1ec; padding: 32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

  <!-- En-tête -->
  <tr>
    <td style="background: #0f1623; border-radius: 16px 16px 0 0; padding: 28px 36px;">
      <p style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">✦ Édu-Réussite QC</p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #8a909c; letter-spacing: 1px; text-transform: uppercase;">Plateforme d'apprentissage adaptatif</p>
    </td>
  </tr>

  <!-- Bandeau spécialiste -->
  <tr>
    <td style="background: #7c5cbf; padding: 16px 36px;">
      <p style="margin: 0; font-size: 13px; color: #ffffff; font-weight: 600;">
        ${config.icon}&nbsp; ${titreCycle} — ${config.fr}${isSecondCycle ? " (2ᵉ cycle)" : ""}
      </p>
    </td>
  </tr>

  <!-- Corps principal -->
  <tr>
    <td style="background: #ffffff; padding: 36px;">

      <!-- Salutation -->
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #0f1623;">
        Bonjour <strong>${prenomParent}</strong>,
      </p>

      <!-- Intro -->
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #3d4554; line-height: 1.7;">
        L'équipe d'Édu-Réussite vous contacte concernant le suivi scolaire de
        <strong>${prenomEnfant} ${nomEnfant}</strong>. Suite à l'analyse de sa progression sur la plateforme,
        nous recommandons une évaluation par un(e) <strong>${config.fr}</strong>.
      </p>

      <!-- Pourquoi cette évaluation -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td style="background: #f3effe; border-left: 4px solid #7c5cbf; border-radius: 0 12px 12px 0; padding: 20px 24px;">
            <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #5b3fa0; text-transform: uppercase; letter-spacing: 0.5px;">
              Pourquoi cette évaluation ?
            </p>
            <p style="margin: 0; font-size: 14px; color: #3d4554; line-height: 1.7;">
              ${config.pourquoi}
            </p>
          </td>
        </tr>
      </table>

      <!-- Ce que le questionnaire couvre -->
      <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #0f1623; text-transform: uppercase; letter-spacing: 0.5px;">
        Ce que le questionnaire couvre
      </p>
      <ul style="margin: 0 0 28px 0; padding: 0; list-style: none; font-size: 14px; color: #3d4554; line-height: 1.6;">
        ${ceQueCouvreHtml}
      </ul>

      <!-- Durée -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
        <tr>
          <td style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              <strong>⏱ Durée estimée : 15 à 20 minutes</strong><br/>
              <span style="color: #b45309;">Répondez selon vos observations des 30 derniers jours. Il n'existe pas de mauvaise réponse — votre regard de parent est précieux et irremplaçable.</span>
            </p>
          </td>
        </tr>
      </table>

      <!-- Bouton CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
        <tr>
          <td align="center">
            <a href="${formUrl}"
               style="display: inline-block; padding: 16px 40px; background: #d94f2b; color: #ffffff; border-radius: 12px; text-decoration: none; font-size: 15px; font-weight: 700; letter-spacing: 0.3px;">
              Accéder au questionnaire →
            </a>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <p style="margin: 0; font-size: 12px; color: #8a909c;">
              Lien sécurisé et personnel — valide 30 jours. Ne le partagez pas.
            </p>
          </td>
        </tr>
      </table>

      <!-- Séparateur -->
      <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 0 0 28px 0;"/>

      <!-- Section consentement -->
      <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; color: #0f1623; text-transform: uppercase; letter-spacing: 0.5px;">
        🔒 Vos données et votre consentement
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px; border-collapse: separate; border-spacing: 0 8px;">

        <tr>
          <td style="background: #f9f7f4; border: 1px solid #e5e2dc; border-radius: 10px; padding: 14px 18px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f1623;">📋 Ce que nous collectons</p>
            <p style="margin: 0; font-size: 13px; color: #5a6070; line-height: 1.6;">
              Vos réponses au questionnaire d'observation, le profil scolaire de ${prenomEnfant}
              (niveau, matières, progression) et les informations développementales que vous fournirez.
            </p>
          </td>
        </tr>

        <tr><td style="height: 8px;"></td></tr>

        <tr>
          <td style="background: #f9f7f4; border: 1px solid #e5e2dc; border-radius: 10px; padding: 14px 18px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f1623;">🎯 Dans quel but</p>
            <p style="margin: 0; font-size: 13px; color: #5a6070; line-height: 1.6;">
              Générer un rapport personnalisé pour adapter le parcours scolaire de ${prenomEnfant}
              sur la plateforme. Ces données ne sont <strong>jamais</strong> partagées à des tiers
              sans votre accord explicite.
            </p>
          </td>
        </tr>

        <tr><td style="height: 8px;"></td></tr>

        <tr>
          <td style="background: #f9f7f4; border: 1px solid #e5e2dc; border-radius: 10px; padding: 14px 18px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f1623;">⚖️ Vos droits (Loi 25 — Québec &amp; RGPD)</p>
            <p style="margin: 0; font-size: 13px; color: #5a6070; line-height: 1.6;">
              Vous avez le droit d'accéder à vos données, de les corriger ou d'en demander la
              suppression à tout moment. Votre consentement est libre, éclairé et révocable.
              Pour exercer vos droits : <a href="mailto:confidentialite@edureussite.ca" style="color: #7c5cbf;">confidentialite@edureussite.ca</a>
            </p>
          </td>
        </tr>

        <tr><td style="height: 8px;"></td></tr>

        <tr>
          <td style="background: #f9f7f4; border: 1px solid #e5e2dc; border-radius: 10px; padding: 14px 18px;">
            <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #0f1623;">🛡️ Sécurité de vos données</p>
            <p style="margin: 0; font-size: 13px; color: #5a6070; line-height: 1.6;">
              Toutes les données sont chiffrées (TLS 1.3), stockées au Canada sur des serveurs
              conformes à la Loi 25. Seuls les intervenants autorisés liés au dossier de
              ${prenomEnfant} y ont accès.
            </p>
          </td>
        </tr>

      </table>

      <p style="margin: 24px 0 0 0; font-size: 13px; color: #5a6070; line-height: 1.6;">
        En accédant au questionnaire, vous confirmerez votre consentement à la collecte et
        au traitement de ces informations dans le cadre du suivi scolaire de ${prenomEnfant}.
        Une case de consentement explicite vous sera présentée avant la soumission finale.
      </p>

    </td>
  </tr>

  <!-- Pied de page -->
  <tr>
    <td style="background: #f4f1ec; border-radius: 0 0 16px 16px; padding: 24px 36px; border-top: 1px solid #e5e2dc;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #0f1623; font-weight: 700;">
        Une question ? Contactez-nous.
      </p>
      <p style="margin: 0; font-size: 12px; color: #8a909c; line-height: 1.6;">
        <a href="mailto:soutien@edureussite.ca" style="color: #7c5cbf; text-decoration: none;">soutien@edureussite.ca</a>
        &nbsp;·&nbsp; Ce courriel est confidentiel et destiné uniquement à ${prenomParent}.
        Si vous n'avez pas de compte Édu-Réussite lié à cet enfant, veuillez nous en informer.
      </p>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #b0b7c3;">
        © ${new Date().getFullYear()} Édu-Réussite QC — Tous droits réservés
        &nbsp;·&nbsp; <a href="${appUrl}/politique-confidentialite" style="color: #b0b7c3;">Politique de confidentialité</a>
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
    subject: `${config.icon} Questionnaire d'évaluation pour ${prenomEnfant} — ${config.fr} | Édu-Réussite QC`,
    html,
  });

  if (error) throw new Error(`Resend error (${parentEmail}): ${error.message}`);
  logResend();
}
