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

  // Prevent unhandled 'error' event from crashing the process
  client.on("error", (err) => {
    console.error("[Redis] Connection error:", err);
    globalThis.__evidexRedis = undefined; // allow reconnect on next call
  });

  globalThis.__evidexRedis = client;
  return client;
}
