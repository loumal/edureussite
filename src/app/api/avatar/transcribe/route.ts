import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logElevenLabsSTT, logDeepgramSTT } from "@/lib/api-usage/logger";
import { getSttProvider } from "@/lib/features";

// Vercel Pro : autoriser jusqu'à 60 s pour la transcription
export const maxDuration = 60;

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY!;

// Cache du provider en mémoire — évite un aller-retour Prisma à chaque requête
// TTL de 5 minutes : cohérent avec les changements admin peu fréquents
let _cachedProvider: "ELEVENLABS" | "DEEPGRAM" | null = null;
let _cacheExpiresAt = 0;

async function getCachedSttProvider(): Promise<"ELEVENLABS" | "DEEPGRAM"> {
  if (_cachedProvider && Date.now() < _cacheExpiresAt) return _cachedProvider;
  _cachedProvider = await getSttProvider();
  _cacheExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min
  return _cachedProvider;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    if (!audio) {
      return NextResponse.json({ error: "Audio manquant" }, { status: 400 });
    }

    const rawType = audio.type || "audio/webm";
    const mimeType = rawType.split(";")[0].trim();
    const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "mp4"
      : mimeType.includes("ogg") ? "ogg"
      : "webm";

    const arrayBuffer = await audio.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: mimeType });
    const audioSecs = Math.round(blob.size / 16000);

    const provider = await getCachedSttProvider();

    if (provider === "DEEPGRAM") {
      if (!DEEPGRAM_API_KEY) {
        return NextResponse.json({ error: "Deepgram non configuré" }, { status: 503 });
      }

      const res = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-3&language=fr&smart_format=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${DEEPGRAM_API_KEY}`,
            "Content-Type": mimeType,
          },
          body: blob,
        }
      );

      const rawText = await res.text();

      if (!res.ok) {
        console.error("Deepgram STT error:", res.status, rawText);
        return NextResponse.json({ error: `Deepgram ${res.status}: ${rawText}` }, { status: 500 });
      }

      const data = JSON.parse(rawText);
      const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";

      logDeepgramSTT({ audioSecs, userId: session.user.id });

      return NextResponse.json({ text: transcript });
    }

    // ElevenLabs (défaut)
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs non configuré" }, { status: 503 });
    }

    const elForm = new FormData();
    elForm.append("audio", blob, `recording.${ext}`);
    elForm.append("model_id", "scribe_v1");

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: elForm,
    });

    const rawText = await res.text();

    if (!res.ok) {
      console.error("ElevenLabs STT error:", res.status, rawText);
      let detail = rawText;
      try { detail = JSON.stringify(JSON.parse(rawText)); } catch { /* keep rawText */ }
      return NextResponse.json({ error: `EL ${res.status}: ${detail}` }, { status: 500 });
    }

    const data = JSON.parse(rawText);

    logElevenLabsSTT({ audioSecs, userId: session.user.id });

    return NextResponse.json({ text: data.text ?? "" });
  } catch (error) {
    console.error("Transcribe route error:", error);
    return NextResponse.json({ error: `Erreur interne: ${error}` }, { status: 500 });
  }
}
