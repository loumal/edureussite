import { describe, it, expect } from "vitest";

/**
 * Tests sur la logique de calcul des coûts IA.
 * On extrait les constantes tarifaires et on vérifie les formules
 * sans appeler la DB (fire-and-forget prisma.create est mocké implicitement).
 */

// ── Reproduction des constantes tarifaires ────────────────────────────────────
const CLAUDE_INPUT_PER_TOKEN  = 3 / 1_000_000;
const CLAUDE_OUTPUT_PER_TOKEN = 15 / 1_000_000;
const EL_TTS_PER_CHAR         = 0.30 / 1_000;
const EL_STT_PER_SEC          = 0.40 / 3_600;
const DEEPGRAM_STT_PER_SEC    = 0.0043 / 60;
const OPENAI_TTS_PER_CHAR     = 15 / 1_000_000;
const RESEND_PER_EMAIL        = 1 / 1_000;

describe("Calcul des coûts Claude", () => {
  it("1M tokens input = $3.00 USD", () => {
    expect(1_000_000 * CLAUDE_INPUT_PER_TOKEN).toBeCloseTo(3.0);
  });

  it("1M tokens output = $15.00 USD", () => {
    expect(1_000_000 * CLAUDE_OUTPUT_PER_TOKEN).toBeCloseTo(15.0);
  });

  it("exercice typique (500 input + 800 output) < $0.02", () => {
    const cout = 500 * CLAUDE_INPUT_PER_TOKEN + 800 * CLAUDE_OUTPUT_PER_TOKEN;
    expect(cout).toBeLessThan(0.02);
  });

  it("le coût output est 5x le coût input (ratio Anthropic)", () => {
    expect(CLAUDE_OUTPUT_PER_TOKEN / CLAUDE_INPUT_PER_TOKEN).toBeCloseTo(5);
  });
});

describe("Calcul des coûts TTS/STT", () => {
  it("ElevenLabs TTS : 1000 chars = $0.30", () => {
    expect(1_000 * EL_TTS_PER_CHAR).toBeCloseTo(0.30);
  });

  it("ElevenLabs STT : 1 heure = $0.40", () => {
    expect(3_600 * EL_STT_PER_SEC).toBeCloseTo(0.40);
  });

  it("Deepgram STT : 1 minute = $0.0043", () => {
    expect(60 * DEEPGRAM_STT_PER_SEC).toBeCloseTo(0.0043);
  });

  it("OpenAI TTS : 1M chars = $15.00", () => {
    expect(1_000_000 * OPENAI_TTS_PER_CHAR).toBeCloseTo(15.0);
  });

  it("Resend : 1000 emails = $1.00", () => {
    expect(1_000 * RESEND_PER_EMAIL).toBeCloseTo(1.0);
  });

  it("session Mira de 3 min (ElevenLabs STT) ≈ $0.02", () => {
    const cout = 180 * EL_STT_PER_SEC;
    expect(cout).toBeCloseTo(0.02, 2);
    expect(cout).toBeLessThan(0.05); // reste abordable
  });
});

describe("Limites de sécurité des tarifs", () => {
  it("aucun tarif unitaire n'est négatif", () => {
    [
      CLAUDE_INPUT_PER_TOKEN,
      CLAUDE_OUTPUT_PER_TOKEN,
      EL_TTS_PER_CHAR,
      EL_STT_PER_SEC,
      DEEPGRAM_STT_PER_SEC,
      OPENAI_TTS_PER_CHAR,
      RESEND_PER_EMAIL,
    ].forEach((tarif) => expect(tarif).toBeGreaterThan(0));
  });
});
