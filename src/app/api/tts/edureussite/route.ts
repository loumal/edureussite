import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logEduReussiteTTS } from "@/lib/api-usage/logger";

const TTS_API_URL = process.env.EDUREUSSITE_TTS_URL;
const TTS_API_KEY = process.env.EDUREUSSITE_TTS_KEY;

// Voix chaleureuse et humanisée — pitch en Hz obligatoire pour edge-tts
const VOICE_PARAMS = {
  rate: "-5%",   // légèrement plus lent = plus posé, plus chaleureux
  pitch: "+3Hz", // ton légèrement plus haut = plus expressif, sympatique
  volume: "+5%", // présence légèrement plus affirmée
};

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

  if (!TTS_API_URL || !TTS_API_KEY) {
    return NextResponse.json({ error: "Edureussite TTS non configuré" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { text, language } = body;
    const lang: "fr" | "en" = language === "en" ? "en" : "fr";

    if (typeof text !== "string" || !text.trim() || text.length > 2000) {
      return NextResponse.json({ error: "Texte invalide" }, { status: 400 });
    }

    const clean = stripMarkdown(text.trim());

    const response = await fetch(`${TTS_API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TTS_API_KEY,
      },
      body: JSON.stringify({
        text: clean,
        language: lang,
        ...VOICE_PARAMS,
      }),
    });

    if (!response.ok) {
      console.error("Edureussite TTS error:", response.status, await response.text());
      return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
    }

    logEduReussiteTTS({ characters: clean.length, userId: session.user.id });

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Edureussite TTS route error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function GET() {
  if (!TTS_API_URL || !TTS_API_KEY) {
    return NextResponse.json({ error: "Edureussite TTS non configuré" }, { status: 503 });
  }

  try {
    const response = await fetch(`${TTS_API_URL}/health`, {
      headers: { "x-api-key": TTS_API_KEY },
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, status: response.status }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unreachable" }, { status: 502 });
  }
}
