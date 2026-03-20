import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertRateLimit } from "@evidex/api/rate-limit";
import { getRedisClient } from "@evidex/api/cache";
import { signAuthToken, verifyPasswordHash, verifyWalletSignature } from "@evidex/auth";
import { findUserByName } from "@evidex/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  name: z.string().trim().min(3).max(32),
  password: z.string().min(8).max(128),
  expectedRole: z.enum(["USER", "ADMIN"]).optional(),
  walletAddress: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const walletAddress = body.walletAddress.toLowerCase();
    const name = body.name.toLowerCase();

    await assertRateLimit({
      key: `auth:login:${request.ip ?? walletAddress}`,
      limit: 20,
      windowSeconds: 60
    });

    const redis = getRedisClient();
    const expectedNonce = await redis.get(`auth:nonce:${walletAddress}`);
    if (!expectedNonce) {
      return NextResponse.json({ error: "Challenge expired. Please sign in again." }, { status: 401 });
    }

    const isSignatureValid = await verifyWalletSignature({
      walletAddress,
      message: body.message,
      signature: body.signature,
      expectedNonce
    });

    if (!isSignatureValid) {
      return NextResponse.json({ error: "Invalid wallet signature." }, { status: 401 });
    }

    const user = await findUserByName(name);
    if (!user || !user.passwordHash || user.walletAddress !== walletAddress) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const isPasswordValid = await verifyPasswordHash(body.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (body.expectedRole && user.role !== body.expectedRole) {
      return NextResponse.json(
        {
          error:
            body.expectedRole === "ADMIN"
              ? "This account is not an admin account."
              : "This account is not a user account."
        },
        { status: 403 }
      );
    }

    const token = await signAuthToken({
      sub: user.id,
      walletAddress: user.walletAddress,
      role: user.role,
      name: user.name ?? undefined
    });

    await redis.del(`auth:nonce:${walletAddress}`);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        walletAddress: user.walletAddress,
        role: user.role
      }
    });

    response.cookies.set("evidex_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Rate limit exceeded")) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signin failed." },
      { status: 400 }
    );
  }
}
