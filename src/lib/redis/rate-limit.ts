import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./client";

// ── Fallback mémoire (dev sans Redis) ────────────────────────────────────────
const memoryStore = new Map<string, { count: number; resetAt: number }>();
const AI_LIMIT = 50;
const AI_WINDOW_MS = 60 * 60 * 1000;

// ── Rate limiter OTP (5 req / 15 min / email) — Redis ou fallback mémoire ────
const otpMemoryStore = new Map<string, { count: number; resetAt: number }>();
const OTP_LIMIT = 5;
const OTP_WINDOW_MS = 15 * 60 * 1000;

let _otpRatelimit: Ratelimit | null = null;

function getOtpRatelimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!_otpRatelimit) {
    _otpRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(OTP_LIMIT, "15 m"),
      prefix: "rl:otp",
    });
  }
  return _otpRatelimit;
}

/**
 * Lève une erreur si l'email dépasse 5 envois OTP par fenêtre de 15 minutes.
 * Utilise Redis en production, fallback mémoire en développement.
 */
export async function checkOtpRateLimit(email: string): Promise<void> {
  const ratelimit = getOtpRatelimit();

  if (!ratelimit) {
    // Fallback mémoire
    const now = Date.now();
    const entry = otpMemoryStore.get(email);
    if (!entry || now > entry.resetAt) {
      otpMemoryStore.set(email, { count: 1, resetAt: now + OTP_WINDOW_MS });
      return;
    }
    if (entry.count >= OTP_LIMIT) throw new Error("OTP_RATE_LIMIT_EXCEEDED");
    entry.count += 1;
    return;
  }

  const { success } = await ratelimit.limit(email);
  if (!success) throw new Error("OTP_RATE_LIMIT_EXCEEDED");
}

function checkMemoryLimit(userId: string): boolean {
  const now = Date.now();
  const entry = memoryStore.get(userId);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(userId, { count: 1, resetAt: now + AI_WINDOW_MS });
    return true;
  }
  if (entry.count >= AI_LIMIT) return false;
  entry.count += 1;
  return true;
}

// ── Rate limiter IA (20 appels / heure / utilisateur) ────────────────────────
let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!_ratelimit) {
    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"),
      prefix: "rl:ai",
    });
  }
  return _ratelimit;
}

export async function checkAiRateLimit(userId: string): Promise<void> {
  const ratelimit = getRatelimit();

  if (!ratelimit) {
    // Fallback mémoire (développement local sans Redis)
    if (!checkMemoryLimit(userId)) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    return;
  }

  const { success } = await ratelimit.limit(userId);
  if (!success) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }
}
