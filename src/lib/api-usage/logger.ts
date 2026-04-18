import { prisma } from "@/lib/prisma/client";
import { ApiService } from "@/generated/prisma";

// ── Tarifs estimés (USD) ───────────────────────────────────────────────────
// Claude claude-sonnet-4-6 : https://anthropic.com/pricing
const CLAUDE_INPUT_PER_TOKEN  = 3 / 1_000_000;   // $3 / 1M tokens
const CLAUDE_OUTPUT_PER_TOKEN = 15 / 1_000_000;  // $15 / 1M tokens

// ElevenLabs : tarif calculé sur le plan Indie/Business ($99/500 000 crédits).
// Le taux exact est recalculé dynamiquement côté admin quand creditsTotal est configuré —
// ce taux sert uniquement de fallback pour les groupes sans crédits configurés.
const EL_TTS_PER_CHAR = 0.198 / 1_000; // $0.198 / 1000 chars (~$99 / 500K crédits)
const EL_STT_PER_SEC  = 0.40 / 3_600;  // $0.40 / heure (facturé séparément des crédits)

// Deepgram Nova-3 STT : $0.0043 / minute
const DEEPGRAM_STT_PER_SEC = 0.0043 / 60;

// Deepgram Aura TTS : $0.015 / 1000 chars
const DEEPGRAM_TTS_PER_CHAR = 0.015 / 1_000;

// OpenAI TTS : tts-1-hd $15 / 1M chars
const OPENAI_TTS_PER_CHAR = 15 / 1_000_000;

// Resend : 100 emails/jour gratuits, ensuite $1 / 1000 emails
const RESEND_PER_EMAIL = 1 / 1_000;

// ── Logging fire-and-forget ─────────────────────────────────────────────────

export function logClaude(params: {
  service: ApiService;
  inputTokens: number;
  outputTokens: number;
  userId?: string | null;
}) {
  const coutUSD =
    params.inputTokens * CLAUDE_INPUT_PER_TOKEN +
    params.outputTokens * CLAUDE_OUTPUT_PER_TOKEN;

  prisma.apiUsageLog
    .create({
      data: {
        service: params.service,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        coutUSD,
        userId: params.userId ?? undefined,
      },
    })
    .catch(() => {}); // non bloquant
}

export function logElevenLabsTTS(params: {
  characters: number;
  userId?: string | null;
}) {
  const coutUSD = params.characters * EL_TTS_PER_CHAR;
  prisma.apiUsageLog
    .create({
      data: {
        service: ApiService.ELEVENLABS_TTS,
        characters: params.characters,
        coutUSD,
        userId: params.userId ?? undefined,
      },
    })
    .catch(() => {});
}

export function logElevenLabsSTT(params: {
  audioSecs?: number;
  userId?: string | null;
}) {
  const secs = params.audioSecs ?? 30; // ~30s par défaut si inconnu
  const coutUSD = secs * EL_STT_PER_SEC;
  prisma.apiUsageLog
    .create({
      data: {
        service: ApiService.ELEVENLABS_STT,
        audioSecs: secs,
        coutUSD,
        userId: params.userId ?? undefined,
      },
    })
    .catch(() => {});
}

export function logDeepgramSTT(params: {
  audioSecs?: number;
  userId?: string | null;
}) {
  const secs = params.audioSecs ?? 30;
  const coutUSD = secs * DEEPGRAM_STT_PER_SEC;
  prisma.apiUsageLog
    .create({
      data: {
        service: ApiService.DEEPGRAM_STT,
        audioSecs: secs,
        coutUSD,
        userId: params.userId ?? undefined,
      },
    })
    .catch(() => {});
}

export function logDeepgramTTS(params: {
  characters: number;
  userId?: string | null;
}) {
  const coutUSD = params.characters * DEEPGRAM_TTS_PER_CHAR;
  prisma.apiUsageLog
    .create({
      data: {
        service: ApiService.DEEPGRAM_TTS,
        characters: params.characters,
        coutUSD,
        userId: params.userId ?? undefined,
      },
    })
    .catch(() => {});
}

export function logOpenAITTS(params: {
  characters: number;
  userId?: string | null;
}) {
  const coutUSD = params.characters * OPENAI_TTS_PER_CHAR;
  prisma.apiUsageLog
    .create({
      data: {
        service: ApiService.OPENAI_TTS,
        characters: params.characters,
        coutUSD,
        userId: params.userId ?? undefined,
      },
    })
    .catch(() => {});
}

export function logResend(params?: { userId?: string | null }) {
  prisma.apiUsageLog
    .create({
      data: {
        service: ApiService.RESEND,
        emails: 1,
        coutUSD: RESEND_PER_EMAIL,
        userId: params?.userId ?? undefined,
      },
    })
    .catch(() => {});
}
