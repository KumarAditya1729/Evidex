import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createWalletAuthChallenge } from "@evidex/auth";
import { assertRateLimit } from "@evidex/api/rate-limit";
import { getRedisClient } from "@evidex/api/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  walletAddress: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const walletAddress = body.walletAddress.toLowerCase();

    await assertRateLimit({
      key: `auth:challenge:${request.ip ?? walletAddress}`,
      limit: 30,
      windowSeconds: 60
    });

    const challenge = createWalletAuthChallenge(walletAddress, new URL(request.url).host);

    const redis = getRedisClient();
    await redis.set(`auth:nonce:${walletAddress}`, challenge.nonce, "EX", 300);

    return NextResponse.json({
      message: challenge.message,
      expiresAt: challenge.expiresAt
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create challenge." },
      { status: 400 }
    );
  }
}
