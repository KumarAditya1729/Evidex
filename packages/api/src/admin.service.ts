import { getAdminStats } from "@evidex/database";
import { getRedisClient } from "./cache";

export async function fetchAdminDashboardStats() {
  const redis = getRedisClient();
  const cacheKey = "admin:stats:cache";
  const lockKey = "admin:stats:lock";

  // Try to get from cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss - Try to acquire lock to recompute
  const lock = await redis.set(lockKey, "locked", "EX", 10, "NX");
  
  if (lock === "OK") {
    try {
      const stats = await getAdminStats();
      // Cache for 60 seconds
      await redis.set(cacheKey, JSON.stringify(stats), "EX", 60);
      return stats;
    } finally {
      await redis.del(lockKey);
    }
  }

  // If we couldn't get the lock, wait and retry once or return empty/stale (for simplicity in this edge case)
  await new Promise(resolve => setTimeout(resolve, 1000));
  const retryCached = await redis.get(cacheKey);
  return retryCached ? JSON.parse(retryCached) : getAdminStats();
}

