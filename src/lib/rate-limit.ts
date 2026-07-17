import { redis } from "./redis";

/**
 * Fixed-window rate limiter backed by Redis. Fails OPEN (allows the
 * request) if Redis is unreachable, so infra hiccups never brick the site.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);

    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
    };
  } catch {
    return { success: true, remaining: limit };
  }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
