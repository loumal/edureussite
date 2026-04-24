import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { anthropic } from "@/lib/ai/client";
import { analyserStructureEpreuve } from "@/lib/ai/epreuve";
import type { Matiere, NiveauScolaire } from "@/generated/prisma";

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count += 1;
  return true;
}

const NIVEAUX_LABELS: Record<NiveauScolaire, string> = {
  PRIMAIRE_1: "1re année du primaire",
  PRIMAIRE_2: "2e année du primaire",
  PRIMAIRE_3: "3e année du primaire",
  PRIMAIRE_4: "4e année du primaire",
  PRIMAIRE_5: "5e année du primaire",
  PRIMAIRE_6: "6e année du primaire",
  SECONDAIRE_1: "1re secondaire",
  SECONDAIRE_2: "2e secondaire",
  SECONDAIRE_3: "3e secondaire",
  SECONDAIRE_4: "4e secondaire",
  SECONDAIRE_5: "5e secondaire",
  SECONDAIRE_6: "6e secondaire / 1ère",
  SECONDAIRE_7: "Terminale",
};

const MATIERES_LABELS: Record<Matiere, string> = {
  FRANCAIS: "Français langue d'enseignement",
  MATHEMATIQUES: "Mathématiques",
  SCIENCES: "Science et technologie",
  UNIVERS_SOCIAL: "Univers social",
  ARTS: "Arts",
  ETHIQUE: "Éthique et culture religieuse",
  ANGLAIS: "Anglais langue seconde",
  EDUCATION_PHYSIQUE: "Éducation physique",
};

const VALID_MATIERES = new Set(["FRANCAIS", "MATHEMATIQUES", "SCIENCES", "UNIVERS_SOCIAL", "ARTS", "ETHIQUE", "ANGLAIS", "EDUCATION_PHYSIQUE"]);
const VALID_NIVEAUX = new Set(["PRIMAIRE_1", "PRIMAIRE_2", "PRIMAIRE_3", "PRIMAIRE_4", "PRIMAIRE_5", "PRIMAIRE_6", "SECONDAIRE_1", "SECONDAIRE_2", "SECONDAIRE_3", "SECONDAIRE_4", "SECONDAIRE_5", "SECONDAIRE_6", "SECONDAIRE_7"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: `Limite atteinte : maximum ${LIMIT} analyses par heure.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const fichier = formData.get("fichier") as File | null;
  const matiereRaw = formData.get("matiere") as string | null;
  const niveauRaw = formData.get("niveauScolaire") as string | null;
  const typeModeleRaw = formData.get("typeModele") as string | null;

  if (!fichier) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  if (!matiereRaw || !VALID_MATIERES.has(matiereRaw)) return NextResponse.json({ error: "Matière invalide." }, { status: 400 });
  if (!niveauRaw || !VALID_NIVEAUX.has(niveauRaw)) return NextResponse.json({ error: "Niveau scolaire invalide." }, { status: 400 });

  const matiere = matiereRaw as Matiere;
  const niveauScolaire = niveauRaw as NiveauScolaire;
  const typeModele = typeModeleRaw === "CONSOLIDATION" ? "CONSOLIDATION" : "EPREUVE_COMPLETE" as const;

  if (fichier.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 400 });
  }

  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = fichier.type;
  const isPDF = mime === "application/pdf" || ext === "pdf";
  const isDOCX = ext === "docx" || ext === "doc" || mime.includes("officedocument") || mime.includes("msword");
  const isTXT = ext === "txt" || mime === "text/plain";

  if (!isPDF && !isDOCX && !isTXT) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez un PDF, un fichier Word (.docx) ou un fichier texte (.txt)." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());

  try {
    let structure;
    let contenuExtrait = "";

    if (isPDF) {
      // Use Claude's native PDF document API — best quality, single API call
      const base64 = buffer.toString("base64");
      const result = await analyserPDFAvecClaude(base64, matiere, niveauScolaire, typeModele);
      structure = result.structure;
      contenuExtrait = result.contenuExtrait;
    } else if (isDOCX) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      contenuExtrait = result.value.trim();
      if (contenuExtrait.length < 50) {
        return NextResponse.json(
          { error: "Impossible d'extraire le texte du document Word. Essayez de l'exporter en PDF." },
          { status: 422 }
        );
      }
      structure = await analyserStructureEpreuve({ contenu: contenuExtrait, matiere, niveauScolaire, typeModele });
    } else {
      contenuExtrait = buffer.toString("utf-8").trim();
      if (contenuExtrait.length < 50) {
        return NextResponse.json({ error: "Le fichier texte semble vide." }, { status: 422 });
      }
      structure = await analyserStructureEpreuve({ contenu: contenuExtrait, matiere, niveauScolaire, typeModele });
    }

    return NextResponse.json({ structure, contenuExtrait, nomFichier: fichier.name });
  } catch (err) {
    console.error("[analyser-epreuve-doc] Erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur lors de l'analyse du document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function analyserPDFAvecClaude(
  base64: string,
  matiere: Matiere,
  niveauScolaire: NiveauScolaire,
  typeModele: "EPREUVE_COMPLETE" | "CONSOLIDATION" = "EPREUVE_COMPLETE"
): Promise<{ structure: Awaited<ReturnType<typeof analyserStructureEpreuve>>; contenuExtrait: string }> {
  const isConsolidation = typeModele === "CONSOLIDATION";

  const systemPrompt = `Tu es un expert en évaluation pédagogique québécoise, spécialisé dans le Programme de formation de l'école québécoise (PFEQ) du MEES.

Ta mission : analyser la STRUCTURE d'${isConsolidation ? "une consolidation (mini-composition ciblant une notion précise)" : "une épreuve"} fournie en PDF et en extraire un modèle réutilisable.

${isConsolidation ? `UNE CONSOLIDATION est une mini-composition faite après l'enseignement d'une notion. Elle est courte (15–30 min), ciblée sur 1 à 3 notions précises du PFEQ, et composée de 1 à 3 sections.

` : ""}RÈGLES ABSOLUES :
1. Tu analyses uniquement la STRUCTURE (format, types de questions, répartition des points, compétences ciblées)
2. Tu NE reproduis JAMAIS le contenu exact des questions — uniquement leur forme
3. Pour "exempleQuestion", crée un exemple ORIGINAL illustrant le TYPE de question, jamais copié
4. Aligne chaque section sur les compétences PFEQ officielles
5. Réponds UNIQUEMENT avec un JSON valide, sans markdown ni explication`;

  const userPrompt = `Analyse la structure de ${isConsolidation ? "cette consolidation" : "cette épreuve"} de ${MATIERES_LABELS[matiere]} pour ${NIVEAUX_LABELS[niveauScolaire]}.

RÉPONDS avec ce JSON exact :
{
  "titre": "Titre descriptif du type d'épreuve",
  "totalPoints": 100,
  "dureeMinutes": 90,
  "description": "Description pédagogique de 1-2 phrases",
  "styleGeneral": "Description du style général",
  "competencesGlobales": ["Compétence PFEQ 1", "Compétence PFEQ 2"],
  "niveauLangue": "Description du registre de langue attendu",
  "consignesGenerales": "Structure typique des consignes générales si présente",
  "sections": [
    {
      "ordre": 1,
      "titre": "Titre de la section",
      "typeQuestion": "LECTURE_COMPREHENSION",
      "nombreQuestions": 10,
      "pointsTotal": 40,
      "difficulte": "ATTENDU",
      "competencesPFEQ": ["Lire des textes variés"],
      "instructions": "Format typique des consignes",
      "exempleQuestion": {
        "enonce": "Exemple original illustrant le format (jamais copié)",
        "typeReponse": "choix_multiple",
        "pointsParQuestion": 4
      }
    }
  ]
}

Types valides : TEXTE_TROUS, QCM, QUESTION_OUVERTE, PROBLEME_MATHEMATIQUE, LECTURE_COMPREHENSION, EXERCICE_ORAL, MISE_EN_SITUATION, SCHEMA_COMPLETER, CHRONOLOGIE, MINI_DEFI
Niveaux valides : REMEDIATION, BASE, ATTENDU, AVANCE, EXCELLENCE`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          { type: "text", text: userPrompt },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const structure = JSON.parse(cleaned);
    return { structure, contenuExtrait: "[Document PDF analysé directement]" };
  } catch {
    throw new Error("L'analyse du PDF a échoué. Vérifiez que le document est lisible.");
  }
}
