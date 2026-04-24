import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const EDGE_VOICES = {
  fr: "fr-FR-DeniseNeural",
  en: "en-US-JennyNeural",
} as const;

const VALID_STYLES = new Set([
  "cheerful", "excited", "friendly", "hopeful", "empathetic",
]);

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSsml(
  text: string,
  lang: "fr" | "en",
  style: string,
  styledegree: number,
  speakingRate: string,
  pitch: string
): string {
  const safeStyle = VALID_STYLES.has(style) ? style : "cheerful";
  const voice = EDGE_VOICES[lang];
  const xmlLang = lang === "en" ? "en-US" : "fr-FR";
  const content = escapeXml(text);

  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
    `xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${xmlLang}">` +
    `<voice name="${voice}">` +
    `<mstts:express-as style="${safeStyle}" styledegree="${styledegree}">` +
    `<prosody rate="${speakingRate}" pitch="${pitch}">` +
    content +
    `</prosody></mstts:express-as></voice></speak>`
  );
}

// Paramètres alignés sur RunPod v8 pour une voix identique
const SSML_PARAMS = {
  style: "cheerful",
  styledegree: 1.8,
  rate: "-8%",
  pitchFr: "+10%",
  pitchEn: "+8%",
} as const;

/**
 * Streaming direct : retourne un ReadableStream Web dès le premier chunk.
 * Le client commence à jouer sans attendre la fin de la synthèse.
 */
export async function streamEdgeGratuitAudio(
  text: string,
  lang: "fr" | "en",
): Promise<ReadableStream<Uint8Array>> {
  const pitch = lang === "en" ? SSML_PARAMS.pitchEn : SSML_PARAMS.pitchFr;
  const ssml = buildSsml(text, lang, SSML_PARAMS.style, SSML_PARAMS.styledegree, SSML_PARAMS.rate, pitch);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(EDGE_VOICES[lang], OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(ssml);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      audioStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      audioStream.on("end", () => controller.close());
      audioStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      audioStream.destroy();
    },
  });
}

/** Version buffered — conservée pour le fallback RunPod */
export async function generateEdgeGratuitAudio(
  text: string,
  lang: "fr" | "en",
  style: string = SSML_PARAMS.style,
  styledegree: number = SSML_PARAMS.styledegree,
  speakingRate: string = SSML_PARAMS.rate,
  pitch?: string
): Promise<Buffer> {
  const effectivePitch = pitch ?? (lang === "en" ? SSML_PARAMS.pitchEn : SSML_PARAMS.pitchFr);
  const ssml = buildSsml(text, lang, style, styledegree, speakingRate, effectivePitch);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(EDGE_VOICES[lang], OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(ssml);

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", resolve);
    audioStream.on("error", reject);
  });

  return Buffer.concat(chunks);
}
