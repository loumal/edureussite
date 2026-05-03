import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { anthropic } from "@/lib/ai/client";

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Rate limiting : 20 extractions / heure par admin
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 20;
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

const ALLOWED_MIME_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: `Limite atteinte : maximum ${LIMIT} extractions par heure.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const fichier = formData.get("fichier") as File | null;

  if (!fichier) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  if (fichier.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 20 Mo)" },
      { status: 400 }
    );
  }

  const mime = fichier.type;
  const isImage = ALLOWED_MIME_IMAGE.has(mime);
  const isPDF = mime === "application/pdf";

  if (!isImage && !isPDF) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez un PDF ou une image (JPG, PNG, WebP)." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const base64 = buffer.toString("base64");

  const systemPrompt = `Tu es un assistant spécialisé dans l'extraction et la synthèse de documents pédagogiques pour une plateforme éducative québécoise (Édu-Réussite QC).

Ta tâche : extraire le contenu pertinent du document fourni pour qu'il serve de référence à une IA générant des plans d'accompagnement et des exercices personnalisés pour des élèves du primaire et secondaire.

Consignes :
- Extrais les informations clés : conclusions, recommandations, stratégies d'intervention, données probantes, approches pédagogiques
- Structure le texte avec des paragraphes clairs (pas de markdown, pas de titres avec #)
- Si le document contient des tableaux ou des listes, reformule-les en texte fluide
- Conserve les termes techniques importants (TDAH, dyslexie, Zone proximale de développement, etc.)
- Omets les mentions légales, en-têtes répétitifs, numéros de page, bibliographies détaillées
- Vise un texte entre 300 et 1500 mots, dense en information utile
- Réponds uniquement en français`;

  try {
    const contentBlock = isImage
      ? ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mime as "image/jpeg" | "image/png" | "image/webp",
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
              text: "Extrais et synthétise le contenu pertinent de ce document pédagogique pour enrichir les conseils d'une IA éducative.",
            },
          ],
        },
      ],
    });

    const texte =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ texte });
  } catch (err) {
    console.error("Erreur extraction document IA:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du document. Réessayez." },
      { status: 500 }
    );
  }
}
