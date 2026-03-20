import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyAuthToken, type AuthTokenPayload } from "@evidex/auth";

export interface Session {
  userId: string;
  name?: string;
  walletAddress: string;
  role: "USER" | "ADMIN";
}

export async function getSessionFromCookies(): Promise<Session | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("evidex_token")?.value;
  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
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

  const payload = await verifyAuthToken(token);
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
