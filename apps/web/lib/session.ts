import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyAuthToken, type AuthTokenPayload } from "@evidex/auth";
import { getRedisClient } from "@evidex/api/cache";

export interface Session {
  userId: string;
  name?: string;
  walletAddress: string;
  role: "USER" | "ADMIN";
}

/** Returns true if the jti has been revoked (i.e. user has logged out). */
async function isRevoked(jti: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const val = await redis.get(`jwt:revoked:${jti}`);
    return val !== null;
  } catch {
    // If Redis is down, fail open (allow the request) rather than locking everyone out.
    return false;
  }
}

export async function getSessionFromCookies(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("evidex_token")?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token, isRevoked);
  if (!payload) {
    return null;
  }

  return toSession(payload);
}

export async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get("evidex_token")?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token, isRevoked);
  if (!payload) {
    return null;
  }

  return toSession(payload);
}

function toSession(payload: AuthTokenPayload): Session {
  return {
    userId: payload.sub,
    name: payload.name,
    walletAddress: payload.walletAddress,
    role: payload.role
  };
}
