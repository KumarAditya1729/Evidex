import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomUUID } from "crypto";

export interface AuthTokenPayload extends JWTPayload {
  sub: string;
  walletAddress: string;
  role: "USER" | "ADMIN";
  name?: string;
}

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(randomUUID())   // unique token ID for revocation
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(
  token: string,
  isRevoked?: (jti: string) => Promise<boolean>
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.walletAddress !== "string" ||
      (payload.role !== "USER" && payload.role !== "ADMIN") ||
      (payload.name !== undefined && typeof payload.name !== "string")
    ) {
      return null;
    }

    // Check revocation blocklist if a checker is provided
    if (isRevoked && payload.jti) {
      const revoked = await isRevoked(payload.jti);
      if (revoked) return null;
    }

    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Adds a token's jti to the Redis blocklist until it expires.
 * Call this on logout. Requires ioredis-style client.
 */
export async function revokeToken(
  token: string,
  redisSet: (key: string, value: string, mode: string, ttl: number) => Promise<unknown>
): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.jti || !payload.exp) return;
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisSet(`jwt:revoked:${payload.jti}`, "1", "EX", ttl);
    }
  } catch {
    // Token already invalid — nothing to revoke
  }
}
