import { Resend } from "resend";
import { logResend } from "@/lib/api-usage/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.ca";

// ── Email J+3 : premières observations ────────────────────────────────────────

export interface ObservationsJ3 {
  prenomEnfant: string;
  exercicesCompletes: number;
  scoresMoyen: number | null;
  sessionsMira: number;
  etatEmotionnel: string | null;
}

export async function sendOnboardingJ3Email(params: {
  parentEmail: string;
  parentPrenom: string;
  enfant: ObservationsJ3;
}): Promise<void> {
  const { parentEmail, parentPrenom, enfant } = params;

  const scoreBadge = enfant.scoresMoyen !== null
    ? `<span style="background:${enfant.scoresMoyen >= 70 ? "#e6f4f1" : "#fff3e0"};color:${enfant.scoresMoyen >= 70 ? "#2a7c6f" : "#e89c00"};padding:2px 8px;border-radius:20px;font-weight:700;font-size:13px;">${Math.round(enfant.scoresMoyen)}% de réussite</span>`
    : "";

  const miraNote = enfant.sessionsMira > 0
    ? `<p style="margin:4px 0;font-size:14px;color:#444;">🤖 <strong>${enfant.prenomEnfant}</strong> a déjà eu <strong>${enfant.sessionsMira}</strong> session${enfant.sessionsMira > 1 ? "s" : ""} avec Mira — c'est un excellent départ !</p>`
    : `<p style="margin:4px 0;font-size:14px;color:#666;">💡 <strong>${enfant.prenomEnfant}</strong> n'a pas encore essayé Mira. Encouragez-le à démarrer une conversation !</p>`;

  const etatNote = enfant.etatEmotionnel === "STRESSE" || enfant.etatEmotionnel === "TRISTE" || enfant.etatEmotionnel === "FATIGUE"
    ? `<p style="margin:8px 0;background:#fff3cd;border-left:4px solid #e89c00;padding:8px 12px;border-radius:4px;font-size:13px;">⚠️ ${enfant.prenomEnfant} a signalé se sentir ${enfant.etatEmotionnel === "STRESSE" ? "stressé(e)" : enfant.etatEmotionnel === "TRISTE" ? "triste" : "fatigué(e)"} cette semaine. Un petit mot d'encouragement ce soir pourrait faire toute la différence.</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f2eb;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:32px auto;background:#faf8f4;border:1px solid #e8e4dc;border-radius:16px;overflow:hidden;">

    <div style="background:#1a1a1a;padding:24px 28px;">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">✦ Édu-Réussite QC</p>
      <p style="margin:4px 0 0;font-size:13px;color:#aaa;">3 jours déjà — premières observations</p>
    </div>

    <div style="padding:28px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 16px;">Bonjour ${parentPrenom} 👋</p>
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 20px;">
        Ça fait maintenant 3 jours que <strong>${enfant.prenomEnfant}</strong> utilise Édu-Réussite QC. Voici ce qu'on a observé :
      </p>

      <div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-size:15px;font-weight:800;color:#1a1a1a;">📊 Premiers résultats</p>
        <p style="margin:4px 0;font-size:14px;color:#444;">✏️ <strong>${enfant.exercicesCompletes}</strong> exercice${enfant.exercicesCompletes !== 1 ? "s" : ""} complété${enfant.exercicesCompletes !== 1 ? "s" : ""} ${scoreBadge}</p>
        ${miraNote}
        ${etatNote}
      </div>

      <div style="background:#e6f4f1;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#2a7c6f;">💡 Pour aider ${enfant.prenomEnfant} à progresser :</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#2a7c6f;line-height:1.8;">
          <li>Encouragez 15 minutes de pratique chaque soir</li>
          <li>Demandez-lui de vous montrer ce qu'il apprend avec Mira</li>
          <li>Consultez son plan d'accompagnement personnalisé dans l'application</li>
        </ul>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXTAUTH_URL ?? "https://edureussite.ca"}/parent"
           style="background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:20px;font-size:14px;font-weight:700;">
          Voir le tableau de bord →
        </a>
      </div>
    </div>

    <div style="padding:16px 28px;border-top:1px solid #e8e4dc;text-align:center;">
      <p style="margin:0;font-size:11px;color:#999;">© 2026 Édu-Réussite QC · <a href="${process.env.NEXTAUTH_URL ?? "https://edureussite.ca"}/politique-confidentialite" style="color:#999;">Politique de confidentialité</a></p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `3 jours avec Édu-Réussite — premiers résultats de ${enfant.prenomEnfant}`,
    html,
  });
  logResend({ userId: undefined });
}

// ── Email J+7 : rapport 1 semaine avec 3 améliorations ────────────────────────

export interface RapportJ7 {
  prenomEnfant: string;
  exercicesCompletes: number;
  tempsMinutes: number;
  ameliorations: { label: string; delta: string; emoji: string }[];
  notionfForte: string | null;
  notionATravailler: string | null;
}

export async function sendOnboardingJ7Email(params: {
  parentEmail: string;
  parentPrenom: string;
  enfant: RapportJ7;
}): Promise<void> {
  const { parentEmail, parentPrenom, enfant } = params;

  const heures = Math.floor(enfant.tempsMinutes / 60);
  const minutes = enfant.tempsMinutes % 60;
  const tempsLabel = heures > 0 ? `${heures}h${minutes > 0 ? String(minutes).padStart(2, "0") : ""}` : `${minutes} min`;

  const ameliorationsHtml = enfant.ameliorations.slice(0, 3).map((a) => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0ede6;">
      <div style="font-size:24px;flex-shrink:0;">${a.emoji}</div>
      <div>
        <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a1a;">${a.label}</p>
        <p style="margin:2px 0 0;font-size:13px;color:#2a7c6f;font-weight:600;">${a.delta}</p>
      </div>
    </div>`).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f2eb;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:32px auto;background:#faf8f4;border:1px solid #e8e4dc;border-radius:16px;overflow:hidden;">

    <div style="background:#1a1a1a;padding:24px 28px;">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">✦ Édu-Réussite QC</p>
      <p style="margin:4px 0 0;font-size:13px;color:#aaa;">1 semaine — rapport de progression</p>
    </div>

    <div style="padding:28px;">
      <p style="font-size:16px;color:#1a1a1a;margin:0 0 8px;">Bonjour ${parentPrenom} 👋</p>
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 20px;">
        <strong>${enfant.prenomEnfant}</strong> vient de terminer sa première semaine sur Édu-Réussite QC.
        Voici ses <strong>3 premières améliorations mesurées</strong> :
      </p>

      <div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:20px;margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.5px;">📈 Améliorations</p>
        ${ameliorationsHtml || '<p style="font-size:13px;color:#999;margin:8px 0;">Les données s\'accumulent — revenez dans quelques jours !</p>'}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">${enfant.exercicesCompletes}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#666;">exercices complétés</p>
        </div>
        <div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#1a1a1a;">${tempsLabel}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#666;">de pratique</p>
        </div>
      </div>

      ${enfant.notionATravailler ? `
      <div style="background:#fff8e1;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e89c00;">🎯 Notion à consolider cette semaine</p>
        <p style="margin:0;font-size:14px;color:#444;">${enfant.notionATravailler} — Mira va travailler cette notion en priorité.</p>
      </div>` : ""}

      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXTAUTH_URL ?? "https://edureussite.ca"}/parent/progression"
           style="background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:20px;font-size:14px;font-weight:700;">
          Voir la courbe de progression →
        </a>
      </div>
    </div>

    <div style="padding:16px 28px;border-top:1px solid #e8e4dc;text-align:center;">
      <p style="margin:0;font-size:11px;color:#999;">© 2026 Édu-Réussite QC · <a href="${process.env.NEXTAUTH_URL ?? "https://edureussite.ca"}/politique-confidentialite" style="color:#999;">Politique de confidentialité</a></p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: parentEmail,
    subject: `1 semaine avec Édu-Réussite — les 3 premières améliorations de ${enfant.prenomEnfant}`,
    html,
  });
  logResend({ userId: undefined });
}
