import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@evidex/auth";
import { getRedisClient } from "@evidex/api/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("evidex_token")?.value;

  if (token) {
    try {
      const redis = getRedisClient();
      // Blocklist the jti so this token cannot be reused even before its expiry
      await revokeToken(token, (key, val, mode, ttl) =>
        redis.set(key, val, mode as "EX", ttl)
      );
    } catch {
      // Non-fatal — proceed with cookie deletion regardless
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("evidex_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
  return response;
}
