import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { anthropic } from "@/lib/ai/client";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

// Rate limit simple en mémoire : max 10 analyses photo/heure
const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Limite atteinte : max 10 analyses photo par heure." }, { status: 429 });
  }

  const formData = await req.formData();
  const fichier = formData.get("fichier") as File | null;
  if (!fichier) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }
  if (fichier.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(fichier.type)) {
    return NextResponse.json({ error: "Format non supporté. Utilisez JPG, PNG ou WebP." }, { status: 400 });
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mime = fichier.type as "image/jpeg" | "image/png" | "image/webp";

  const prompt = `Tu es un assistant éducatif. Cette photo montre le résumé manuscrit d'un élève canadien pour sa lecture quotidienne, structuré selon les 5W.

Extrais les réponses aux 5 questions et retourne-les en JSON uniquement (sans texte autour), avec les champs suivants :
{
  "qui": "réponse à Qui (personnages) — string ou null",
  "quoi": "réponse à Quoi (ce qui se passe) — string ou null",
  "ou": "réponse à Où (lieu) — string ou null",
  "quand": "réponse à Quand (époque) — string ou null",
  "pourquoi": "réponse à Pourquoi (message/leçon) — string ou null"
}

Si une réponse n'est pas visible ou illisible, retourne null pour ce champ.
Si le texte est en anglais, retourne les réponses en anglais.
Si le texte est en français, retourne les réponses en français.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mime, data: base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossible d'extraire le résumé de la photo." }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      qui?: string | null;
      quoi?: string | null;
      ou?: string | null;
      quand?: string | null;
      pourquoi?: string | null;
    };

    return NextResponse.json({
      qui:      parsed.qui      ?? undefined,
      quoi:     parsed.quoi     ?? undefined,
      ou:       parsed.ou       ?? undefined,
      quand:    parsed.quand    ?? undefined,
      pourquoi: parsed.pourquoi ?? undefined,
    });
  } catch (err) {
    console.error("[lecture-photo]", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse de la photo." }, { status: 500 });
  }
}
