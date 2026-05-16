import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";
import type { DomaineSpecialiste } from "@/generated/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

const DOMAINE_LABELS: Record<DomaineSpecialiste, { fr: string; icon: string }> = {
  NEUROPSYCHOLOGUE: { fr: "Neuropsychologue", icon: "🧠" },
  ORTHOPEDAGOGUE: { fr: "Orthopédagogue", icon: "📚" },
  ORTHOPHONISTE: { fr: "Orthophoniste", icon: "🗣️" },
  ERGOTHERAPEUTE: { fr: "Ergothérapeute", icon: "✋" },
  OPTOMETRISTE: { fr: "Optométriste", icon: "👁️" },
  PSYCHOEDUCATEUR: { fr: "Psychoéducateur", icon: "💬" },
};

interface AlerteEvaluationParams {
  adminEmail: string;
  adminPrenom: string;
  prenomEleve: string;
  nomEleve: string;
  evaluationId: string;
  primarySpecialist: DomaineSpecialiste;
  signals: string[];
  appUrl: string;
}

export async function sendAlerteEvaluationAdmin(params: AlerteEvaluationParams): Promise<void> {
  const { adminEmail, adminPrenom, prenomEleve, nomEleve, evaluationId, primarySpecialist, signals, appUrl } = params;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Alerte évaluation → ${adminEmail} | Élève: ${prenomEleve} ${nomEleve} | ${primarySpecialist}\n`);
    return;
  }

  const { fr: specialistLabel, icon } = DOMAINE_LABELS[primarySpecialist];
  const signalList = signals.map((s) => `<li style="margin-bottom:6px;">${s}</li>`).join("");
  const dashboardUrl = `${appUrl}/admin/evaluations/${evaluationId}`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #7c5cbf; font-size: 13px; margin-bottom: 24px; font-weight: 600;">Alerte — Évaluation cognitive recommandée</p>

      <div style="background: #fff; border: 1px solid #e5e2dc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f1623;">
          Bonjour <strong>${adminPrenom}</strong>,
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          L'algorithme de triage a détecté un blocage persistant chez l'élève
          <strong>${prenomEleve} ${nomEleve}</strong> malgré plusieurs semaines d'interventions IA.
        </p>

        <div style="background: #f3effe; border-left: 3px solid #7c5cbf; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #7c5cbf;">
            ${icon} Spécialiste recommandé : ${specialistLabel}
          </p>
          <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #0f1623;">
            ${signalList}
          </ul>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 14px; color: #5a6070;">
          Aucune action n'est prise sans votre validation. Consultez le tableau de bord pour approuver ou rejeter cette recommandation.
        </p>

        <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #7c5cbf; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Voir l'alerte et valider →
        </a>
      </div>

      <p style="font-size: 12px; color: #8a909c; text-align: center;">
        Édu-Réussite QC — Système d'évaluation cognitive adaptative
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `🔔 Évaluation recommandée — ${prenomEleve} ${nomEleve} (${specialistLabel})`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
