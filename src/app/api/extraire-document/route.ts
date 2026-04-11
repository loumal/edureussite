import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { anthropic } from "@/lib/ai/client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Rate limiting simple par userId (10 extractions / heure)
const docRateLimits = new Map<string, { count: number; resetAt: number }>();
const DOC_LIMIT = 10;
const DOC_WINDOW_MS = 60 * 60 * 1000;

function checkDocRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = docRateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    docRateLimits.set(userId, { count: 1, resetAt: now + DOC_WINDOW_MS });
    return true;
  }
  if (entry.count >= DOC_LIMIT) return false;
  entry.count += 1;
  return true;
}

// Seuls les types MIME attendus sont acceptés
const ALLOWED_MIME_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_TYPES_COMMENTAIRE = new Set([
  "OBSERVATION_PARENT", "COMMENTAIRE_ENSEIGNANT",
  "PLAN_INTERVENTION", "RAPPORT_BILAN", "AUTRE",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Rate limiting
  if (!checkDocRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: `Limite atteinte : maximum ${DOC_LIMIT} extractions par heure.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const fichier = formData.get("fichier") as File | null;
  const typeCommentaireRaw = (formData.get("type") as string) ?? "AUTRE";

  // Valider le type de commentaire contre une liste blanche
  const typeCommentaire = ALLOWED_TYPES_COMMENTAIRE.has(typeCommentaireRaw)
    ? typeCommentaireRaw
    : "AUTRE";

  if (!fichier) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  if (fichier.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 10 Mo)" },
      { status: 400 }
    );
  }

  const mime = fichier.type;
  // Valider le MIME type strictement (pas juste startsWith)
  const isImage = ALLOWED_MIME_IMAGE.has(mime);
  const isPDF = mime === "application/pdf";

  if (!isImage && !isPDF) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez une image (JPG, PNG, WebP) ou un PDF." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const base64 = buffer.toString("base64");

  const contextLabels: Record<string, string> = {
    OBSERVATION_PARENT: "note ou observation d'un parent",
    COMMENTAIRE_ENSEIGNANT: "commentaire ou note d'un enseignant",
    PLAN_INTERVENTION: "plan d'intervention éducatif (PIE) ou plan d'action scolaire",
    RAPPORT_BILAN: "rapport d'évaluation, bulletin scolaire ou bilan pédagogique",
    AUTRE: "document scolaire ou pédagogique",
  };

  const contexte = contextLabels[typeCommentaire] ?? "document scolaire";

  const systemPrompt = `Tu es un assistant spécialisé en extraction de texte pour une plateforme éducative québécoise.
Ta tâche est d'extraire fidèlement le texte du document fourni qui semble être un(e) ${contexte}.

Consignes :
- Transcris le texte tel quel, en préservant la structure (paragraphes, listes, titres)
- Si c'est un tableau, formate-le lisiblement
- Garde tous les détails : objectifs, stratégies, observations, recommandations, dates
- N'ajoute pas d'interprétation, ne reformule pas — transcription fidèle uniquement
- Si l'image est floue ou illisible, indique-le clairement
- Réponds en français`;

  try {
    const contentBlock = isImage
      ? ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mime as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: base64,
          },
        })
      : ({
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: `Voici un(e) ${contexte}. Transcris fidèlement tout le texte visible dans ce document.`,
            },
          ],
        },
      ],
    });

    const texte =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ texte });
  } catch (err) {
    console.error("Erreur extraction document:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du document. Réessayez." },
      { status: 500 }
    );
  }
}
