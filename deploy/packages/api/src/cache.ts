import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __evidexRedis: Redis | undefined;
}

export function getRedisClient(): Redis {
  if (globalThis.__evidexRedis) {
    return globalThis.__evidexRedis;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured.");
  }

  const client = new Redis(redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  });

  globalThis.__evidexRedis = client;
  return client;
}
