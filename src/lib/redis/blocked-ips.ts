import { getRedis } from "./client";

const BLOCKED_IPS_KEY = "security:blocked_ips";

export async function addBlockedIp(ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.sadd(BLOCKED_IPS_KEY, ip);
}

export async function removeBlockedIp(ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.srem(BLOCKED_IPS_KEY, ip);
}
