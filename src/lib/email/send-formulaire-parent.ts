import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";
import type { DomaineSpecialiste } from "@/generated/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

const DOMAINE_LABELS: Record<DomaineSpecialiste, { fr: string; icon: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", icon: "🧠" },
  ORTHOPEDAGOGUE:   { fr: "Orthopédagogue",   icon: "📚" },
  ORTHOPHONISTE:    { fr: "Orthophoniste",     icon: "🗣️" },
  ERGOTHERAPEUTE:   { fr: "Ergothérapeute",    icon: "✋" },
  OPTOMETRISTE:     { fr: "Optométriste",      icon: "👁️" },
  PSYCHOEDUCATEUR:  { fr: "Psychoéducateur",   icon: "💬" },
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
    console.log(`\n📧 [DEV] Formulaire parent → ${parentEmail} | Enfant: ${prenomEnfant} ${nomEnfant} | ${specialist}\n`);
    console.log(`   Lien: ${appUrl}/evaluation/${tokenAcces}\n`);
    return;
  }

  const { fr: specialistLabel, icon } = DOMAINE_LABELS[specialist];
  const formUrl = `${appUrl}/evaluation/${tokenAcces}`;
  const titre = isSecondCycle ? "Évaluation complémentaire" : "Questionnaire d'évaluation";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #d94f2b; font-size: 13px; margin-bottom: 24px; font-weight: 600;">${titre} — Action requise</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${prenomParent}</strong>,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          ${isSecondCycle
            ? `Suite au rapport d'évaluation initial de <strong>${prenomEnfant} ${nomEnfant}</strong>, une évaluation complémentaire avec un(e) ${icon} <strong>${specialistLabel}</strong> a été préparée.`
            : `Un questionnaire d'observation comportementale a été préparé pour <strong>${prenomEnfant} ${nomEnfant}</strong>. Il permettra à un(e) ${icon} <strong>${specialistLabel}</strong> d'analyser la situation de votre enfant.`}
        </p>

        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #c2410c;">⏱ Durée estimée : 10–15 minutes</p>
          <p style="margin: 0; font-size: 13px; color: #7c2d12;">
            Répondez selon vos observations quotidiennes de ${prenomEnfant}. Il n'y a pas de mauvaises réponses.
          </p>
        </div>

        <p style="margin: 0 0 20px 0; font-size: 13px; color: #5a6070;">
          Vos réponses serviront uniquement à générer un rapport personnalisé pour accompagner ${prenomEnfant}. Aucune donnée n'est partagée sans votre accord explicite.
        </p>

        <a href="${formUrl}" style="display: inline-block; padding: 14px 28px; background: #d94f2b; color: white; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-bottom: 12px;">
          Accéder au questionnaire →
        </a>

        <p style="margin: 12px 0 0 0; font-size: 12px; color: #8a909c;">
          Ce lien est personnel et sécurisé. Il est valide pendant 30 jours.<br/>
          Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.
        </p>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center; margin: 0;">
        Édu-Réussite QC — Vos données, votre contrôle.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `📋 ${titre} à compléter — ${prenomEnfant} ${nomEnfant}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
