import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logElevenLabsTTS, logOpenAITTS, logEduReussiteTTS } from "@/lib/api-usage/logger";
import { getTtsProvider } from "@/lib/features";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const EDUREUSSITE_TTS_URL = process.env.EDUREUSSITE_TTS_URL;
const EDUREUSSITE_TTS_KEY = process.env.EDUREUSSITE_TTS_KEY;

const VOICE_SETTINGS = {
  stability: 0.38,
  similarity_boost: 0.80,
  style: 0.55,
  use_speaker_boost: true,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, voiceId } = body;

    if (typeof text !== "string" || !text.trim() || text.length > 2000) {
      return NextResponse.json({ error: "Texte invalide" }, { status: 400 });
    }

    const trimmed = text.trim();
    const provider = await getTtsProvider();

    // ── OpenAI TTS ────────────────────────────────────────────────────────────
    if (provider === "OPENAI") {
      if (!OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
      }

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",        // tts-1 = ~2× plus rapide que tts-1-hd, latence réduite
          input: trimmed,
          voice: "nova",
          response_format: "mp3",
        }),
      });

      if (!response.ok) {
        console.error("OpenAI TTS error:", response.status, await response.text());
        return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
      }

      // Logger avant de streamer (on connaît les chars, pas besoin du buffer)
      logOpenAITTS({ characters: trimmed.length, userId: session.user.id });

      // Streamer directement sans buffériser côté serveur
      return new NextResponse(response.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // ── Edureussite RunPod TTS ────────────────────────────────────────────────
    if (provider === "EDUREUSSITE_RUNPOD") {
      if (!EDUREUSSITE_TTS_URL || !EDUREUSSITE_TTS_KEY) {
        return NextResponse.json({ error: "Edureussite TTS non configuré" }, { status: 503 });
      }

      const response = await fetch(`${EDUREUSSITE_TTS_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": EDUREUSSITE_TTS_KEY,
        },
        body: JSON.stringify({
          text: trimmed,
          language: "fr",
          rate: "-5%",
          pitch: "+5Hz",
          volume: "+10%",
        }),
      });

      if (!response.ok) {
        console.error("Edureussite TTS error:", response.status, await response.text());
        return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
      }

      logEduReussiteTTS({ characters: trimmed.length, userId: session.user.id });

      return new NextResponse(response.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // ── ElevenLabs TTS (défaut) ───────────────────────────────────────────────
    if (typeof voiceId !== "string" || !voiceId.trim()) {
      return NextResponse.json({ error: "voiceId manquant" }, { status: 400 });
    }
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs non configuré" }, { status: 503 });
    }

    const response = await fetch(
      `${ELEVENLABS_BASE}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: "eleven_turbo_v2_5",
          voice_settings: VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs error:", response.status, await response.text());
      return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
    }

    // Logger avant de streamer
    logElevenLabsTTS({ characters: trimmed.length, userId: session.user.id });

    // Streamer directement sans buffériser côté serveur
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Avatar speak route error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
