import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MATIERES_LABELS: Record<string, string> = {
  FRANCAIS: "Français", MATHEMATIQUES: "Mathématiques", SCIENCES: "Sciences",
  UNIVERS_SOCIAL: "Univers social", ARTS: "Arts", ETHIQUE: "Éthique",
  ANGLAIS: "Anglais", EDUCATION_PHYSIQUE: "Éducation physique",
};

const MATIERES_EMOJI: Record<string, string> = {
  FRANCAIS: "📖", MATHEMATIQUES: "🔢", SCIENCES: "🔬",
  UNIVERS_SOCIAL: "🌍", ARTS: "🎨", ETHIQUE: "🤝",
  ANGLAIS: "🇨🇦", EDUCATION_PHYSIQUE: "⚽",
};

const MATIERES_COLOR: Record<string, string> = {
  MATHEMATIQUES:     "#5b4fcf",
  FRANCAIS:          "#2a7c6f",
  SCIENCES:          "#3b82f6",
  UNIVERS_SOCIAL:    "#f97316",
  ARTS:              "#ec4899",
  ANGLAIS:           "#14b8a6",
  ETHIQUE:           "#a855f7",
  EDUCATION_PHYSIQUE:"#22c55e",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ notionId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notionId } = await params;

  // Récupérer le profil élève et la notion maîtrisée
  const profil = await prisma.profilEleve.findUnique({
    where: { userId: session.user.id },
    select: { id: true, prenom: true, niveauScolaire: true },
  });

  if (!profil) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const notion = await prisma.planifNotionEleve.findFirst({
    where: { id: notionId, eleveId: profil.id, maitrisee: true },
    select: { notion: true, matiere: true, updatedAt: true },
  });

  if (!notion) {
    return NextResponse.json({ error: "Notion introuvable ou non maîtrisée" }, { status: 404 });
  }

  const notionLabel = notion.notion.replace(/_/g, " ");
  const matiereLabel = MATIERES_LABELS[notion.matiere] ?? notion.matiere;
  const matiereEmoji = MATIERES_EMOJI[notion.matiere] ?? "📚";
  const couleur = MATIERES_COLOR[notion.matiere] ?? "#5b4fcf";
  const dateStr = format(notion.updatedAt, "d MMMM yyyy", { locale: fr });
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://edureussite.ca";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Certificat — ${notionLabel}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #faf8f5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 48px;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 28px;
      align-items: center;
    }

    .btn {
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary { background: #1a1a1a; color: #fff; }
    .btn-secondary { background: #e8e4dc; color: #1a1a1a; }
    .btn:hover { opacity: 0.88; }

    /* ── Certificat ── */
    .cert {
      width: 100%;
      max-width: 700px;
      background: #fff;
      border-radius: 20px;
      border: 2px solid ${couleur}40;
      box-shadow: 0 8px 48px rgba(0,0,0,0.10);
      overflow: hidden;
      position: relative;
    }

    /* Bande supérieure colorée */
    .cert-header {
      background: ${couleur};
      padding: 28px 36px 24px;
      text-align: center;
      color: #fff;
    }
    .cert-header .logo {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.05em;
      opacity: 0.85;
      margin-bottom: 6px;
    }
    .cert-header .titre {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.7;
    }

    /* Corps */
    .cert-body {
      padding: 36px 40px 32px;
      text-align: center;
    }

    .cert-emoji {
      font-size: 56px;
      line-height: 1;
      margin-bottom: 12px;
    }

    .cert-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${couleur};
      background: ${couleur}18;
      border: 1.5px solid ${couleur}40;
      border-radius: 99px;
      padding: 4px 14px;
      margin-bottom: 20px;
    }

    .cert-decerne {
      font-size: 14px;
      color: #888;
      margin-bottom: 6px;
    }

    .cert-prenom {
      font-size: 36px;
      font-weight: 900;
      color: #1a1a1a;
      margin-bottom: 4px;
      line-height: 1.15;
    }

    .cert-texte {
      font-size: 14px;
      color: #555;
      margin-bottom: 24px;
      line-height: 1.6;
    }

    .cert-notion {
      display: inline-block;
      font-size: 20px;
      font-weight: 900;
      color: #1a1a1a;
      background: ${couleur}0f;
      border: 2px solid ${couleur}30;
      border-radius: 12px;
      padding: 12px 24px;
      margin: 4px 0 20px;
    }

    .cert-matiere {
      font-size: 13px;
      color: ${couleur};
      font-weight: 700;
      margin-bottom: 28px;
    }

    /* Séparateur */
    .cert-sep {
      border: none;
      border-top: 1.5px solid #f0ede8;
      margin: 0 -40px 24px;
    }

    /* Pied */
    .cert-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #aaa;
    }
    .cert-date { font-weight: 600; color: #888; }
    .cert-seal {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${couleur};
      color: #fff;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px ${couleur}60;
    }

    /* Motif décoratif coin */
    .cert::before, .cert::after {
      content: "";
      position: absolute;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: ${couleur}08;
      pointer-events: none;
    }
    .cert::before { top: -20px; right: -20px; }
    .cert::after  { bottom: -20px; left: -20px; }

    /* ── Print ── */
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .cert {
        border-radius: 0;
        box-shadow: none;
        max-width: 100%;
        border: 2px solid ${couleur}40;
      }
      @page { size: A4 portrait; margin: 15mm; }
    }
  </style>
</head>
<body>

  <div class="toolbar">
    <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button>
    <a href="${siteUrl}/eleve/plan" class="btn btn-secondary">← Retour au plan</a>
  </div>

  <div class="cert" role="main" aria-label="Certificat de maîtrise">

    <div class="cert-header">
      <p class="logo">✦ Édu-Réussite</p>
      <p class="titre">Certificat de maîtrise</p>
    </div>

    <div class="cert-body">

      <div class="cert-emoji">${matiereEmoji}</div>
      <div class="cert-badge">${matiereLabel}</div>

      <p class="cert-decerne">Ce certificat est décerné à</p>
      <p class="cert-prenom">${profil.prenom}</p>

      <p class="cert-texte">
        pour avoir démontré la maîtrise complète de la notion
      </p>

      <div class="cert-notion">${notionLabel}</div>
      <p class="cert-matiere">${matiereEmoji} ${matiereLabel}</p>

      <hr class="cert-sep" />

      <div class="cert-footer">
        <div>
          <p class="cert-date">Maîtrisée le ${dateStr}</p>
          <p style="margin-top:2px">Édu-Réussite — edureussite.ca</p>
        </div>
        <div class="cert-seal" aria-hidden="true">🏅</div>
      </div>

    </div>
  </div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
