import { Redis } from "@upstash/redis";

// Client Upstash Redis — HTTP REST, compatible Edge Runtime et Node.js
// Variables requises : UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// En développement sans Redis, les fonctions de sécurité tombent en fallback mémoire.

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) {
    // Supprimer tout espace blanc (y compris les sauts de ligne encodés Vercel)
    const url   = process.env.UPSTASH_REDIS_REST_URL.replace(/\s+/g, "");
    const token = process.env.UPSTASH_REDIS_REST_TOKEN.replace(/\s+/g, "");
    if (!url || !token) return null;
    _redis = new Redis({ url, token });
  }
  return _redis;
}
