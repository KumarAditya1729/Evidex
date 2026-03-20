import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signAuthToken, verifyWalletSignature } from "@evidex/auth";
import { getRedisClient } from "@evidex/api/cache";
import { getOrCreateUser } from "@evidex/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  walletAddress: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const walletAddress = body.walletAddress.toLowerCase();

    const redis = getRedisClient();
    const expectedNonce = await redis.get(`auth:nonce:${walletAddress}`);
    if (!expectedNonce) {
      return NextResponse.json({ error: "Challenge expired. Please sign in again." }, { status: 401 });
    }

    const isValid = await verifyWalletSignature({
      walletAddress,
      message: body.message,
      signature: body.signature,
      expectedNonce
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid wallet signature." }, { status: 401 });
    }

    const user = await getOrCreateUser(walletAddress);
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed." },
      { status: 400 }
    );
  }
}
