import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { anthropic } from "@/lib/ai/client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const photoRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = photoRateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    photoRateLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 15) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Limite atteinte : max 15 analyses par heure." }, { status: 429 });
  }

  const formData = await req.formData();
  const fichier = formData.get("fichier") as File | null;
  if (!fichier) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (fichier.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }

  const mime = fichier.type;
  const isImage = ALLOWED_MIME_IMAGE.has(mime);
  const isPDF = mime === "application/pdf";
  if (!isImage && !isPDF) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez une photo (JPG, PNG, WebP) ou un PDF." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const base64 = buffer.toString("base64");

  const contentBlock = isImage
    ? ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: base64,
        },
      })
    : ({
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
      });

  const systemPrompt = `Tu es un spécialiste de l'analyse d'exercices scolaires québécois (programme PFEQ).
Analyse l'exercice fourni et retourne UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après.

Structure JSON obligatoire :
{
  "typeExercice": "CONSOLIDATION" | "EPREUVE_COMPLETE" | "DEVOIRS" | "AUTRE",
  "matiere": "MATHEMATIQUES" | "FRANCAIS" | "SCIENCES" | "UNIVERS_SOCIAL" | "ANGLAIS" | "ARTS" | "ETHIQUE" | "EDUCATION_PHYSIQUE" | "INCONNUE",
  "niveauEstime": "PRIMAIRE_1" | "PRIMAIRE_2" | "PRIMAIRE_3" | "PRIMAIRE_4" | "PRIMAIRE_5" | "PRIMAIRE_6" | "SECONDAIRE_1" | "SECONDAIRE_2" | "SECONDAIRE_3" | "SECONDAIRE_4" | "SECONDAIRE_5" | "INCONNU",
  "titre": "titre de l'exercice tel qu'affiché ou déduit",
  "notions": ["notion 1", "notion 2"],
  "contenuBrut": "transcription complète et fidèle de tout le texte visible",
  "questions": [
    {
      "numero": 1,
      "enonce": "texte complet de la question, fidèle à l'original",
      "type": "QCM" | "REPONSE_COURTE" | "CALCUL" | "VRAI_FAUX" | "DEVELOPPEMENT",
      "choix": ["choix A", "choix B", "choix C"] ,
      "pointsAttribues": 2
    }
  ],
  "pointsTotal": 20,
  "dureeMinutes": 45,
  "confidenceScore": 0.9
}

Règles :
- typeExercice : CONSOLIDATION = exercice de pratique/révision (le plus fréquent), EPREUVE_COMPLETE = examen officiel ou évaluation formelle, DEVOIRS = travail à la maison, AUTRE = autre
- Transcris TOUTES les questions dans "questions" — chaque question séparément
- contenuBrut : tout le texte fidèle, incluant mise en contexte, tables de données, consignes
- choix : array seulement si QCM, sinon omets le champ
- pointsAttribues / pointsTotal / dureeMinutes : null si non mentionnés
- confidenceScore : 0.0 (illisible) à 1.0 (parfaitement lisible)
- Si illisible, mets confidenceScore < 0.4 et un message dans titre
- JSON pur uniquement, zéro texte supplémentaire`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            { type: "text", text: "Analyse cet exercice scolaire et retourne le JSON structuré." },
          ],
        },
      ],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // Clean JSON
    let jsonStr = rawText.replace(/^```(?:json)?\r?\n?/, "").replace(/\r?\n?```$/, "").trim();
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start !== -1 && end > start) jsonStr = jsonStr.slice(start, end + 1);

    const analyse = JSON.parse(jsonStr);
    return NextResponse.json({ analyse });
  } catch (err) {
    console.error("Erreur analyse exercice depuis photo:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse. Réessayez ou vérifiez la qualité de l'image." },
      { status: 500 }
    );
  }
}
