import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";
const DEV    = process.env.NODE_ENV !== "production";

// ─── Couleurs par type d'événement ───────────────────────────────────────────

const THEMES: Record<string, { accent: string; accentLight: string; label: string; emoji: string }> = {
  INFORMATION: { accent: "#3b82f6", accentLight: "#eff6ff", label: "Information",     emoji: "ℹ️" },
  MISE_A_JOUR: { accent: "#5b4fcf", accentLight: "#f0effe", label: "Mise à jour",     emoji: "🚀" },
  FETE:        { accent: "#c9952a", accentLight: "#fffbeb", label: "Occasion spéciale",emoji: "🎉" },
  PROMO:       { accent: "#2a7c6f", accentLight: "#f0fdf4", label: "Offre spéciale",  emoji: "🌟" },
  AUTRE:       { accent: "#0f1623", accentLight: "#f9f7f4", label: "Message",          emoji: "✉️" },
};

// ─── Template HTML professionnel ─────────────────────────────────────────────

export function buildEmailHTML(options: {
  typeEvenement: string;
  objet: string;
  contenuHtml: string; // corps principal généré par l'IA (HTML snippets ou paragraphes)
  ctaTexte?: string;
  ctaUrl?: string;
  prenomDestinataire?: string;
}): string {
  const { typeEvenement, objet, contenuHtml, ctaTexte, ctaUrl, prenomDestinataire } = options;
  const theme = THEMES[typeEvenement] ?? THEMES.AUTRE;
  const salutation = prenomDestinataire ? `Bonjour ${prenomDestinataire},` : "Bonjour,";
  const annee = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${objet}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #f5f3ef; color: #0f1623; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background: #f5f3ef; padding: 32px 16px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: ${theme.accent}; padding: 28px 36px; }
    .header-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .header-logo { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
    .header-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 36px 36px 28px; }
    .salutation { font-size: 15px; color: #5a6070; margin-bottom: 20px; }
    .content { font-size: 15px; line-height: 1.75; color: #2d3343; }
    .content p { margin-bottom: 16px; }
    .content h2 { font-size: 20px; font-weight: 700; color: #0f1623; margin: 24px 0 12px; }
    .content h3 { font-size: 16px; font-weight: 600; color: #0f1623; margin: 20px 0 8px; }
    .content ul { padding-left: 20px; margin-bottom: 16px; }
    .content li { margin-bottom: 8px; }
    .content strong { color: #0f1623; font-weight: 600; }
    .content a { color: ${theme.accent}; text-decoration: none; font-weight: 600; }
    .highlight-box { background: ${theme.accentLight}; border-left: 4px solid ${theme.accent}; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .cta-wrap { text-align: center; margin: 28px 0 8px; }
    .cta-btn { display: inline-block; background: ${theme.accent}; color: #ffffff !important; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 12px; text-decoration: none !important; letter-spacing: 0.3px; }
    .divider { border: none; border-top: 1px solid #e8e4de; margin: 24px 0; }
    .footer { background: #f9f7f4; padding: 24px 36px; text-align: center; }
    .footer-logo { font-size: 16px; font-weight: 900; color: #0f1623; margin-bottom: 8px; }
    .footer-text { font-size: 12px; color: #8a909c; line-height: 1.6; }
    .footer-links { margin-top: 12px; }
    .footer-links a { color: #8a909c; font-size: 12px; text-decoration: none; margin: 0 8px; }
    .footer-links a:hover { color: ${theme.accent}; }
    @media (max-width: 480px) {
      .body { padding: 24px 20px 20px; }
      .header { padding: 20px 24px; }
      .footer { padding: 20px 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="card">
        <!-- Header -->
        <div class="header">
          <div class="header-brand">
            <span style="font-size:24px;">✦</span>
            <span class="header-logo">ÉduRéussite QC</span>
          </div>
          <div class="header-badge">${theme.emoji} ${theme.label}</div>
        </div>

        <!-- Body -->
        <div class="body">
          <p class="salutation">${salutation}</p>
          <div class="content">
            ${contenuHtml}
          </div>
          ${ctaTexte && ctaUrl ? `
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta-btn">${ctaTexte}</a>
          </div>` : ""}
        </div>

        <hr class="divider" />

        <!-- Footer -->
        <div class="footer">
          <div class="footer-logo">✦ ÉduRéussite QC</div>
          <p class="footer-text">
            La plateforme éducative québécoise propulsée par l'IA.<br />
            © ${annee} ÉduRéussite QC — Tous droits réservés.
          </p>
          <div class="footer-links">
            <a href="https://edureussite.edevtic.com">Plateforme</a>
            <a href="https://edureussite.edevtic.com/politique-confidentialite">Confidentialité</a>
          </div>
        </div>
      </div>

      <!-- Sub-footer -->
      <p style="text-align:center;font-size:11px;color:#a0a8b8;margin-top:20px;line-height:1.6;">
        Vous recevez ce message car vous êtes utilisateur de la plateforme ÉduRéussite QC.<br />
        ÉduRéussite QC · edureussite.edevtic.com
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Envoi d'une campagne à une adresse ──────────────────────────────────────

export async function sendCampagneEmail(
  to: string,
  objet: string,
  htmlContenu: string,
  typeEvenement: string,
  prenomDestinataire?: string,
): Promise<void> {
  const html = buildEmailHTML({
    typeEvenement,
    objet,
    contenuHtml: htmlContenu,
    prenomDestinataire,
  });

  if (DEV && (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...")) {
    console.log(`\n📧 [DEV CAMPAGNE] À : ${to} | Objet : ${objet}\n`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: objet,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  logResend();
}
