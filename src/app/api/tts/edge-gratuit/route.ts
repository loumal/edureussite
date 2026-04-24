import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logEdgeGratuitTTS } from "@/lib/api-usage/logger";
import { generateEdgeGratuitAudio } from "@/lib/tts/edge-gratuit";

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      text,
      language,
      style = "cheerful",
      styledegree = 1.8,
      speaking_rate = "-8%",
      pitch,
    } = body;

    if (typeof text !== "string" || !text.trim() || text.length > 3000) {
      return NextResponse.json({ error: "Texte invalide" }, { status: 400 });
    }

    const lang: "fr" | "en" = language === "en" ? "en" : "fr";
    const clean = stripMarkdown(text.trim());

    const audioBuffer = await generateEdgeGratuitAudio(
      clean,
      lang,
      style,
      Number(styledegree),
      speaking_rate,
      pitch
    );

    logEdgeGratuitTTS({ characters: clean.length, userId: session.user.id });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Edge Gratuit TTS error:", error);
    return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    provider: "edge-gratuit",
    voices: { fr: "fr-FR-DeniseNeural", en: "en-US-JennyNeural" },
    styles: ["cheerful", "excited", "friendly", "hopeful", "empathetic"],
  });
}
