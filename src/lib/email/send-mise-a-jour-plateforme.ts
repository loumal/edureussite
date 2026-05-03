import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edu-reussite.com";
const DEV = process.env.NODE_ENV !== "production";

export async function sendMiseAJourPlateforme(opts: {
  parentEmail: string;
  parentPrenom: string;
  message?: string;
  version?: string;
}): Promise<void> {
  const { parentEmail, parentPrenom, message, version } = opts;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.edu-reussite.com";
  const dateStr = new Date().toLocaleDateString("fr-CA", {
    day: "numeric", month: "long", year: "numeric",
  });

  const contenuMessage = message
    ? message
    : "Nous avons amélioré l'expérience d'apprentissage de votre enfant avec de nouvelles fonctionnalités et des optimisations de performance.";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f7f4; border-radius: 16px;">
      <h1 style="font-size: 20px; color: #0f1623; margin-bottom: 4px;">✦ Édu-Réussite QC</h1>
      <p style="color: #8a909c; font-size: 13px; margin-bottom: 28px;">Mise à jour de la plateforme · ${dateStr}</p>

      <div style="background: linear-gradient(135deg, #f0eeff 0%, #fff 100%); border: 1px solid rgba(91,79,207,0.2); border-radius: 14px; padding: 28px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 40px; margin: 0 0 10px 0;">🚀</p>
        <h2 style="font-size: 18px; color: #0f1623; margin: 0 0 8px 0;">
          La plateforme a été mise à jour !
        </h2>
        ${version ? `<p style="font-size: 12px; color: #8a909c; margin: 0;">Version ${version}</p>` : ""}
      </div>

      <p style="font-size: 14px; color: #3a4050; line-height: 1.7; margin-bottom: 20px;">
        Bonjour ${parentPrenom},<br><br>
        ${contenuMessage}
      </p>

      <div style="background: white; border: 1px solid rgba(91,79,207,0.15); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #8a909c; margin: 0 0 10px 0;">
          POURQUOI CES MISES À JOUR ?
        </p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #3a4050; line-height: 1.9;">
          <li>Améliorer l'expérience d'apprentissage de votre enfant</li>
          <li>Ajouter de nouvelles fonctionnalités pédagogiques</li>
          <li>Renforcer la sécurité et les performances</li>
          <li>Corriger les problèmes signalés par la communauté</li>
        </ul>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${appUrl}/parent"
          style="display: inline-block; background: #5b4fcf; color: white; font-size: 14px; font-weight: bold; padding: 14px 28px; border-radius: 50px; text-decoration: none;">
          Découvrir les nouveautés →
        </a>
      </div>

      <p style="font-size: 11px; color: #aab0bc; text-align: center; line-height: 1.7;">
        Ce message vous est envoyé automatiquement par Édu-Réussite QC.<br>
        Vous recevez ce courriel car vous êtes parent inscrit sur la plateforme.
      </p>
    </div>
  `;

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV] Mise à jour plateforme → ${parentEmail} (${parentPrenom})\n`);
    return;
  }

  const subject = version
    ? `🚀 Édu-Réussite QC v${version} — Nouvelle mise à jour disponible`
    : `🚀 Édu-Réussite QC — Nouvelle mise à jour pour une meilleure expérience`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
