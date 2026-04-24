import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logElevenLabsTTS, logOpenAITTS, logEduReussiteTTS, logEdgeGratuitTTS } from "@/lib/api-usage/logger";
import { generateEdgeGratuitAudio } from "@/lib/tts/edge-gratuit";
import { getTtsProvider } from "@/lib/features";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const EDUREUSSITE_TTS_URL = process.env.EDUREUSSITE_TTS_URL;
const EDUREUSSITE_TTS_KEY = process.env.EDUREUSSITE_TTS_KEY;

// RunPod — aligné sur EDGE_GRATUIT : cheerful, rate -8%, pitch +10% FR / +8% EN auto-détecté
const RUNPOD_VOICE_PARAMS = {
  rate: "-8%",
  pitch: "+10%", // RunPod API v8 convertit automatiquement en +8% pour l'anglais
};


const ELEVENLABS_VOICE_SETTINGS = {
  stability: 0.38,
  similarity_boost: 0.80,
  style: 0.55,
  use_speaker_boost: true,
};

/**
 * Nettoie le markdown pour que edge-tts ne lise pas les symboles bruts.
 * Sans ce nettoyage, "**bonjour**" → la voix lit "astérisque astérisque bonjour..."
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")           // titres # ## ###
    .replace(/\*\*(.+?)\*\*/g, "$1")     // **gras**
    .replace(/\*(.+?)\*/g, "$1")         // *italique*
    .replace(/__(.+?)__/g, "$1")         // __gras__
    .replace(/_(.+?)_/g, "$1")           // _italique_
    .replace(/`{1,3}[^`]*`{1,3}/g, "")  // `code` ou ```bloc```
    .replace(/\[(.+?)\]\(.*?\)/g, "$1") // [liens](url)
    .replace(/\S+\s*[:=]\s*https?:\/\/\S+/g, "")  // label = http://... (ex: MSTP=http://...)
    .replace(/\S+\s*[:=]\s*www\.\S+/g, "")        // label = www....
    .replace(/https?:\/\/\S+/g, "")               // URLs brutes http(s)://...
    .replace(/www\.\S+/g, "")                     // URLs www....
    .replace(/^[-*+]\s+/gm, "")         // listes à puces
    .replace(/^\d+\.\s+/gm, "")         // listes numérotées
    .replace(/^>\s+/gm, "")             // citations >
    .replace(/\n{2,}/g, ". ")           // double saut → pause naturelle
    .replace(/\n/g, ", ")               // simple saut → virgule
    .replace(/\s{2,}/g, " ")            // espaces multiples
    .trim();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, voiceId, language } = body;
    const lang: "fr" | "en" = language === "en" ? "en" : "fr";

    if (typeof text !== "string" || !text.trim() || text.length > 2000) {
      return NextResponse.json({ error: "Texte invalide" }, { status: 400 });
    }

    const trimmed = text.trim();
    const clean = stripMarkdown(trimmed);
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
          model: "tts-1",
          input: clean,
          voice: "nova",
          response_format: "mp3",
        }),
      });

      if (!response.ok) {
        console.error("OpenAI TTS error:", response.status, await response.text());
        return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
      }

      logOpenAITTS({ characters: clean.length, userId: session.user.id });

      return new NextResponse(response.body, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // ── Edureussite RunPod TTS (edge-tts bilingue) ────────────────────────────
    if (provider === "EDUREUSSITE_RUNPOD") {
      if (!EDUREUSSITE_TTS_URL || !EDUREUSSITE_TTS_KEY) {
        return NextResponse.json({ error: "Edureussite TTS non configuré" }, { status: 503 });
      }

      // Anglais → OpenAI tts-1-hd nova : accent natif américain, bien meilleur que JennyNeural
      if (lang === "en" && OPENAI_API_KEY) {
        const enRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1-hd",
            input: clean,
            voice: "nova",
            response_format: "mp3",
          }),
        });
        if (enRes.ok) {
          logOpenAITTS({ characters: clean.length, userId: session.user.id });
          return new NextResponse(enRes.body, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
        console.warn("OpenAI TTS indisponible, fallback RunPod JennyNeural");
      }

      // Français (ou fallback anglais) → RunPod DeniseNeural (timeout 12 s)
      const runpodAbort = new AbortController();
      const runpodTimeout = setTimeout(() => runpodAbort.abort(), 5_000);

      try {
        const response = await fetch(`${EDUREUSSITE_TTS_URL}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": EDUREUSSITE_TTS_KEY,
          },
          body: JSON.stringify({
            text: clean,
            language: lang,
            ...RUNPOD_VOICE_PARAMS,
          }),
          signal: runpodAbort.signal,
        });
        clearTimeout(runpodTimeout);

        if (!response.ok) throw new Error(`RunPod ${response.status}`);

        logEduReussiteTTS({ characters: clean.length, userId: session.user.id });
        return new NextResponse(response.body, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
        });
      } catch (runpodErr) {
        clearTimeout(runpodTimeout);
        console.warn("RunPod TTS indisponible, fallback EDGE_GRATUIT:", runpodErr instanceof Error ? runpodErr.message : runpodErr);
        // Fallback automatique vers EDGE_GRATUIT (Vercel, scale illimité)
        try {
          const audioBuffer = await generateEdgeGratuitAudio(clean, lang);
          logEdgeGratuitTTS({ characters: clean.length, userId: session.user.id });
          return new NextResponse(new Uint8Array(audioBuffer), {
            status: 200,
            headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
          });
        } catch {
          return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
        }
      }
    }

    // ── Edge Gratuit TTS (msedge-tts sur Vercel, gratuit) ────────────────────
    if (provider === "EDGE_GRATUIT") {
      try {
        const audioBuffer = await generateEdgeGratuitAudio(clean, lang);
        logEdgeGratuitTTS({ characters: clean.length, userId: session.user.id });
        return new NextResponse(new Uint8Array(audioBuffer), {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch (e) {
        console.error("Edge Gratuit TTS error:", e);
        return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
      }
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
          text: clean,
          model_id: "eleven_turbo_v2_5",
          voice_settings: ELEVENLABS_VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      console.error("ElevenLabs error:", response.status, await response.text());
      return NextResponse.json({ error: "Synthèse vocale indisponible" }, { status: 500 });
    }

    logElevenLabsTTS({ characters: clean.length, userId: session.user.id });

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
