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
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}
