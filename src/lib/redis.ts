import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;

  try {
    return new Redis(url && url.trim() ? url.trim() : "redis://localhost:6379", {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      retryStrategy: () => null,
    });
  } catch {
    // Malformed URL — fall back to a client pointed at localhost so the
    // module never throws at import time. It simply won't connect, and
    // every call below already fails open when Redis is unreachable.
    return new Redis("redis://localhost:6379", {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      retryStrategy: () => null,
    });
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

redis.on("error", () => {
  // Swallow connection errors — every helper below already fails open.
});

/**
 * Simple cache-aside helper. Falls back gracefully to `fn()` if Redis
 * is unreachable so a Redis outage never takes the site down.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis unavailable — continue without cache.
  }

  const value = await fn();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Ignore cache write failures.
  }

  return value;
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch {
    // Ignore.
  }
}
