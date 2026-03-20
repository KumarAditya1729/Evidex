import { getRedisClient } from "./cache";

export async function assertRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<void> {
  const redis = getRedisClient();
  const redisKey = `ratelimit:${input.key}`;

  const tx = redis.multi();
  tx.incr(redisKey);
  tx.expire(redisKey, input.windowSeconds, "NX");

  const results = await tx.exec();
  const count = Number(results?.[0]?.[1] ?? 0);

  if (count > input.limit) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
}
