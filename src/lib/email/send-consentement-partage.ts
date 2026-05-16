import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";
import type { DomaineSpecialiste } from "@/generated/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

const DOMAINE_LABELS: Record<DomaineSpecialiste, { fr: string; en: string; icon: string; description: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", en: "Neuropsychologist", icon: "🧠", description: "évalue l'attention, la mémoire, les fonctions exécutives et le traitement de l'information" },
  ORTHOPEDAGOGUE:  { fr: "Orthopédagogue",   en: "Learning Specialist", icon: "📚", description: "soutient les difficultés en lecture, écriture et mathématiques" },
  ORTHOPHONISTE:   { fr: "Orthophoniste",    en: "Speech-Language Pathologist", icon: "🗣️", description: "évalue la communication orale, la phonologie et le langage écrit" },
  ERGOTHERAPEUTE:  { fr: "Ergothérapeute",   en: "Occupational Therapist", icon: "✋", description: "évalue la motricité fine, le traitement sensoriel et l'autonomie scolaire" },
  OPTOMETRISTE:    { fr: "Optométriste",     en: "Optometrist", icon: "👁️", description: "évalue la vision fonctionnelle et le confort visuel en lecture" },
  PSYCHOEDUCATEUR: { fr: "Psychoéducateur",  en: "Psychoeducator", icon: "💬", description: "soutient la motivation, l'adaptation sociale et le comportement scolaire" },
};

interface ConsentementPartageParams {
  parentEmail: string;
  prenomEnfant: string;
  nomEnfant: string;
  specialisteActuel: DomaineSpecialiste;
  prochainSpecialiste: DomaineSpecialiste;
  tokenConsentement: string;
  appUrl: string;
}

export async function sendConsentementPartageSpecialiste(params: ConsentementPartageParams): Promise<void> {
  const { parentEmail, prenomEnfant, nomEnfant, specialisteActuel, prochainSpecialiste, tokenConsentement, appUrl } = params;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Consentement partage → ${parentEmail} | Enfant: ${prenomEnfant} ${nomEnfant} | Prochain: ${prochainSpecialiste}\n`);
    console.log(`   Lien: ${appUrl}/evaluation/consentement/${tokenConsentement}\n`);
    return;
  }

  const actuel = DOMAINE_LABELS[specialisteActuel];
  const prochain = DOMAINE_LABELS[prochainSpecialiste];
  const consentUrl = `${appUrl}/evaluation/consentement/${tokenConsentement}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #d94f2b; font-size: 13px; margin-bottom: 24px; font-weight: 600;">Votre accord est requis — Partage de rapport</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          L'évaluation initiale de <strong>${prenomEnfant} ${nomEnfant}</strong> réalisée avec un(e)
          ${actuel.icon} <strong>${actuel.fr}</strong> est terminée et le rapport a été généré.
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          Sur la base des résultats, notre système recommande une évaluation complémentaire par un(e)
          ${prochain.icon} <strong>${prochain.fr}</strong>, qui ${prochain.description}.
        </p>

        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #c2410c;">⚠️ Votre accord est nécessaire</p>
          <p style="margin: 0; font-size: 13px; color: #7c2d12;">
            Avant que ce nouveau spécialiste puisse accéder au rapport d'évaluation de ${prenomEnfant},
            nous avons besoin de votre consentement explicite. <strong>Aucune donnée ne sera partagée sans votre accord.</strong>
          </p>
        </div>

        <div style="background: #f3effe; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #7c5cbf;">Données qui seraient partagées :</p>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #4c1d95;">
            <li style="margin-bottom: 6px;">Le rapport d'évaluation de ${prenomEnfant} (résumé + observations)</li>
            <li style="margin-bottom: 6px;">Les réponses au questionnaire d'évaluation initiale</li>
            <li style="margin-bottom: 6px;">Le profil scolaire de ${prenomEnfant} (niveau, matières, historique)</li>
          </ul>
        </div>

        <p style="margin: 0 0 20px 0; font-size: 13px; color: #5a6070;">
          En cliquant sur le bouton ci-dessous, vous accéderez à une page sécurisée pour consulter les détails et donner — ou refuser — votre consentement.
        </p>

        <a href="${consentUrl}" style="display: inline-block; padding: 14px 28px; background: #d94f2b; color: white; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 700; margin-bottom: 12px;">
          Consulter et décider →
        </a>

        <p style="margin: 12px 0 0 0; font-size: 12px; color: #8a909c;">
          Ce lien est personnel et sécurisé. Il est valide pendant 14 jours.<br/>
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
    subject: `🔐 Votre accord requis — Partage du rapport de ${prenomEnfant} avec un ${prochain.fr}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
