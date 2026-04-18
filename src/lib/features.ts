import { prisma } from "@/lib/prisma/client";

export const FEATURE_KEYS = {
  SPECIALISTES: "feature_specialistes",
  RECOMMANDATION_IA: "feature_recommandation_ia",
} as const;

export const CONFIG_KEYS = {
  STT_PROVIDER: "config_stt_provider",
  TTS_PROVIDER: "config_tts_provider",
} as const;

export type SttProvider = "ELEVENLABS" | "DEEPGRAM";
export type TtsProvider = "ELEVENLABS" | "OPENAI" | "EDUREUSSITE_RUNPOD";

export async function getSttProvider(): Promise<SttProvider> {
  const param = await prisma.parametreApp.findUnique({ where: { cle: CONFIG_KEYS.STT_PROVIDER } });
  if (param?.valeur === "DEEPGRAM") return "DEEPGRAM";
  return "ELEVENLABS"; // défaut
}

export async function getTtsProvider(): Promise<TtsProvider> {
  const param = await prisma.parametreApp.findUnique({ where: { cle: CONFIG_KEYS.TTS_PROVIDER } });
  if (param?.valeur === "OPENAI") return "OPENAI";
  if (param?.valeur === "EDUREUSSITE_RUNPOD") return "EDUREUSSITE_RUNPOD";
  return "ELEVENLABS"; // défaut
}

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

/**
 * Lit la valeur d'un feature flag depuis la DB.
 * Par défaut activé si le paramètre n'existe pas encore.
 */
export async function isFeatureActive(cle: FeatureKey): Promise<boolean> {
  const param = await prisma.parametreApp.findUnique({ where: { cle } });
  if (!param) return false; // désactivé par défaut (security by design)
  return param.valeur === "true";
}

/**
 * Lit tous les feature flags d'un coup.
 */
export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  const params = await prisma.parametreApp.findMany({
    where: { cle: { startsWith: "feature_" } },
  });
  const flags: Record<string, boolean> = {};
  for (const p of params) {
    flags[p.cle] = p.valeur === "true";
  }
  // Valeurs par défaut pour les clés non encore persistées
  for (const key of Object.values(FEATURE_KEYS)) {
    if (!(key in flags)) flags[key] = false;
  }
  return flags;
}
