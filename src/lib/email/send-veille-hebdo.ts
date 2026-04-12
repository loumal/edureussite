import { Resend } from "resend";
import type { TavilyResult } from "@/lib/tavily/client";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "noreply@edureussite.qc.ca";

// ── Convertisseur Markdown → HTML inline-styled pour emails ──────────────────

function mdToHtml(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let inList = false;
  let inOrderedList = false;

  const applyInline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em style='color:#5a6480;'>$1</em>")
      .replace(/🔴/g, '<span style="color:#c0392b;">🔴</span>')
      .replace(/🟡/g, '<span style="color:#c9952a;">🟡</span>')
      .replace(/🟢/g, '<span style="color:#2a7c6f;">🟢</span>');

  const closeLists = () => {
    if (inList) { output.push("</ul>"); inList = false; }
    if (inOrderedList) { output.push("</ol>"); inOrderedList = false; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^### (.+)/.test(line)) {
      closeLists();
      const content = applyInline(line.replace(/^### /, ""));
      output.push(
        `<h3 style="font-size:12px;font-weight:700;color:#0f1623;margin:18px 0 5px;text-transform:uppercase;letter-spacing:0.08em;border-left:3px solid #2a7c6f;padding-left:8px;">${content}</h3>`
      );
    } else if (/^## (.+)/.test(line)) {
      closeLists();
      const content = applyInline(line.replace(/^## /, ""));
      output.push(
        `<h2 style="font-size:15px;font-weight:800;color:#0f1623;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid rgba(42,124,111,0.18);">${content}</h2>`
      );
    } else if (/^# (.+)/.test(line)) {
      closeLists();
      const content = applyInline(line.replace(/^# /, ""));
      output.push(
        `<h2 style="font-size:17px;font-weight:800;color:#0f1623;margin:20px 0 8px;">${content}</h2>`
      );
    } else if (/^---+$/.test(line.trim())) {
      closeLists();
      output.push(
        `<hr style="border:none;border-top:1px solid rgba(15,22,35,0.08);margin:14px 0;">`
      );
    } else if (/^[-*] (.+)/.test(line)) {
      if (inOrderedList) { output.push("</ol>"); inOrderedList = false; }
      if (!inList) {
        output.push(
          `<ul style="margin:6px 0 10px 0;padding:0;list-style:none;">`
        );
        inList = true;
      }
      const content = applyInline(line.replace(/^[-*] /, ""));
      output.push(
        `<li style="display:flex;gap:8px;font-size:13px;color:#3a4460;line-height:1.65;padding:4px 0;align-items:flex-start;"><span style="color:#2a7c6f;font-weight:700;flex-shrink:0;margin-top:1px;">›</span><span>${content}</span></li>`
      );
    } else if (/^\d+\. (.+)/.test(line)) {
      if (inList) { output.push("</ul>"); inList = false; }
      if (!inOrderedList) {
        output.push(
          `<ol style="margin:6px 0 10px 0;padding-left:20px;">`
        );
        inOrderedList = true;
      }
      const content = applyInline(line.replace(/^\d+\. /, ""));
      output.push(
        `<li style="font-size:13px;color:#3a4460;line-height:1.65;padding:3px 0;">${content}</li>`
      );
    } else if (line.trim() === "") {
      closeLists();
      output.push(`<div style="height:6px;"></div>`);
    } else {
      closeLists();
      const content = applyInline(line);
      output.push(
        `<p style="font-size:13px;color:#3a4460;line-height:1.7;margin:5px 0;">${content}</p>`
      );
    }
  }

  closeLists();
  return output.join("\n");
}

// ── Numéro de semaine ISO ─────────────────────────────────────────────────────

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Envoi ─────────────────────────────────────────────────────────────────────

export async function sendVeilleHebdo(opts: {
  adminEmail: string;
  adminNom: string;
  date: Date;
  veilleEdtech: string;
  veilleIA: string;
  opportunites: string;
  sources: TavilyResult[];
}): Promise<void> {
  const { adminEmail, adminNom, date, veilleEdtech, veilleIA, opportunites, sources } = opts;

  const dateStr = date.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Toronto",
  });

  const semaine = getWeekNumber(date);
  const appUrl = process.env.NEXTAUTH_URL ?? "https://edureussite-qc.vercel.app";

  const sourcesHtml =
    sources.length > 0
      ? sources
          .slice(0, 10)
          .map(
            (s) =>
              `<a href="${s.url}" style="display:inline-block;background:#f0f4f8;border:1px solid #dde3ee;border-radius:20px;padding:4px 10px;font-size:11px;color:#3a4460;text-decoration:none;margin:3px 2px;line-height:1.4;">${s.title.slice(0, 55)}${s.title.length > 55 ? "…" : ""}</a>`
          )
          .join("")
      : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Hebdomadaire — ÉduRéussite QC</title>
</head>
<body style="margin:0;padding:0;background:#edeae4;font-family:Georgia,'Times New Roman',serif;">

<div style="max-width:660px;margin:0 auto;padding:28px 16px 40px;">

  <!-- ══ HEADER ══ -->
  <div style="background:linear-gradient(140deg,#0c1420 0%,#132135 40%,#0d2018 100%);border-radius:20px;padding:36px 32px 30px;margin-bottom:18px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-30px;right:-30px;width:220px;height:220px;background:radial-gradient(circle,rgba(42,124,111,0.2) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="position:absolute;bottom:-50px;left:-10px;width:160px;height:160px;background:radial-gradient(circle,rgba(42,124,111,0.1) 0%,transparent 70%);pointer-events:none;"></div>
    <div style="position:relative;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#2a7c6f;">✦ ÉduRéussite QC — Intelligence Stratégique</p>
      <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">Rapport Hebdomadaire</h1>
      <p style="margin:0 0 16px;font-size:16px;font-weight:400;color:rgba(255,255,255,0.55);">Veille &amp; Opportunités</p>
      <div style="display:inline-block;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:30px;padding:6px 14px;">
        <span style="font-size:12px;color:rgba(255,255,255,0.7);">Semaine ${semaine} &nbsp;·&nbsp; ${dateStr}</span>
      </div>
    </div>
  </div>

  <!-- ══ SALUTATION ══ -->
  <div style="background:white;border-radius:14px;padding:16px 22px;margin-bottom:14px;border-left:4px solid #2a7c6f;">
    <p style="margin:0;font-size:14px;color:#3a4460;line-height:1.65;">
      Bonjour <strong style="color:#0f1623;">${adminNom}</strong>,<br>
      Voici votre rapport de veille stratégique et d'opportunités compilé automatiquement par les agents IA d'ÉduRéussite QC pour la semaine du ${dateStr}.
    </p>
  </div>

  <!-- ══ TABLE DES MATIÈRES ══ -->
  <div style="background:#f8f7f4;border-radius:12px;padding:14px 18px;margin-bottom:18px;border:1px solid rgba(15,22,35,0.08);">
    <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#9aa3b8;">Au sommaire</p>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">
      <span style="background:#e8f4f2;border-radius:20px;padding:4px 12px;font-size:12px;color:#2a7c6f;font-weight:600;">📊 Veille EdTech QC</span>
      <span style="background:#eeecf8;border-radius:20px;padding:4px 12px;font-size:12px;color:#5b67c9;font-weight:600;">🤖 IA en Éducation</span>
      <span style="background:#fdf0ec;border-radius:20px;padding:4px 12px;font-size:12px;color:#d9572b;font-weight:600;">🎯 Opportunités &amp; Financements</span>
    </div>
  </div>

  <!-- ══ SECTION 1 : VEILLE EDTECH ══ -->
  <div style="background:white;border-radius:16px;padding:26px 24px;margin-bottom:14px;box-shadow:0 2px 16px rgba(0,0,0,0.05);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f0ede8;">
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#2a7c6f,#1a5c52);border-radius:12px;text-align:center;line-height:40px;font-size:20px;flex-shrink:0;">📊</div>
      <div>
        <h2 style="margin:0 0 2px;font-size:17px;font-weight:800;color:#0f1623;">Veille EdTech — Québec &amp; Canada</h2>
        <p style="margin:0;font-size:11px;color:#9aa3b8;font-family:Arial,sans-serif;">Tendances · Innovations · Actualités du secteur</p>
      </div>
    </div>
    <div style="font-family:Georgia,serif;color:#3a4460;">
      ${mdToHtml(veilleEdtech)}
    </div>
  </div>

  <!-- ══ SECTION 2 : IA EN ÉDUCATION ══ -->
  <div style="background:white;border-radius:16px;padding:26px 24px;margin-bottom:14px;box-shadow:0 2px 16px rgba(0,0,0,0.05);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f0ede8;">
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#5b67c9,#3d4b9e);border-radius:12px;text-align:center;line-height:40px;font-size:20px;flex-shrink:0;">🤖</div>
      <div>
        <h2 style="margin:0 0 2px;font-size:17px;font-weight:800;color:#0f1623;">IA en Éducation</h2>
        <p style="margin:0;font-size:11px;color:#9aa3b8;font-family:Arial,sans-serif;">Innovations · Débats · Implications pour ÉduRéussite QC</p>
      </div>
    </div>
    <div style="font-family:Georgia,serif;color:#3a4460;">
      ${mdToHtml(veilleIA)}
    </div>
  </div>

  <!-- ══ SECTION 3 : OPPORTUNITÉS ══ -->
  <div style="background:white;border-radius:16px;padding:26px 24px;margin-bottom:14px;box-shadow:0 2px 16px rgba(0,0,0,0.05);border-top:3px solid #d9572b;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f0ede8;">
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#d9572b,#b5411f);border-radius:12px;text-align:center;line-height:40px;font-size:20px;flex-shrink:0;">🎯</div>
      <div>
        <h2 style="margin:0 0 2px;font-size:17px;font-weight:800;color:#0f1623;">Opportunités Détectées</h2>
        <p style="margin:0;font-size:11px;color:#9aa3b8;font-family:Arial,sans-serif;">Financements · Appels à candidature · Partenariats stratégiques</p>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,#fff8f5,#fff3ee);border-radius:10px;padding:12px 16px;margin-bottom:16px;border:1px solid rgba(217,87,43,0.2);">
      <p style="margin:0;font-size:12px;color:#8a3a1f;font-family:Arial,sans-serif;line-height:1.5;">
        ⚡ <strong>Action requise :</strong> Consultez le portail admin pour créer des dossiers de candidature et suivre l'avancement de chaque opportunité.
      </p>
    </div>
    <div style="font-family:Georgia,serif;color:#3a4460;">
      ${mdToHtml(opportunites)}
    </div>
  </div>

  <!-- ══ SOURCES WEB ══ -->
  ${
    sources.length > 0
      ? `<div style="background:#f8f9fc;border-radius:12px;padding:16px 18px;margin-bottom:14px;border:1px solid #e2e6f0;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;color:#9aa3b8;font-family:Arial,sans-serif;">🌐 Sources web analysées — ${sources.length} résultats</p>
    <div style="line-height:2;">${sourcesHtml}</div>
  </div>`
      : ""
  }

  <!-- ══ CTA ══ -->
  <div style="background:linear-gradient(135deg,#0c1420,#132135);border-radius:16px;padding:24px 28px;margin-bottom:18px;text-align:center;">
    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.55);font-family:Arial,sans-serif;">Accédez au portail pour approfondir les analyses et gérer vos candidatures</p>
    <h3 style="margin:0 0 18px;font-size:16px;font-weight:700;color:#ffffff;">Portail Agents IA</h3>
    <a href="${appUrl}/admin/agents" style="display:inline-block;background:linear-gradient(135deg,#2a7c6f,#1e5e54);color:white;text-decoration:none;padding:13px 30px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:0.02em;font-family:Arial,sans-serif;">
      Ouvrir les Agents IA &nbsp;→
    </a>
  </div>

  <!-- ══ FOOTER ══ -->
  <div style="text-align:center;padding-top:4px;">
    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#0f1623;">✦ ÉduRéussite QC</p>
    <p style="margin:0;font-size:11px;color:#9aa3b8;font-family:Arial,sans-serif;">
      Rapport généré automatiquement chaque vendredi à 23h58 · Agents IA stratégiques<br>
      Pour gérer vos préférences, accédez à votre <a href="${appUrl}/admin" style="color:#2a7c6f;text-decoration:none;">portail administrateur</a>.
    </p>
  </div>

</div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `📊 Veille Sem. ${semaine} — ${sources.length > 0 ? `${sources.length} sources web` : "Analyse IA"} · ÉduRéussite QC`,
    html,
  });
}
