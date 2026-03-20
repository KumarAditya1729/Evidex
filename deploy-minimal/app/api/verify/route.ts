import { NextRequest, NextResponse } from "next/server";
import { PRIMARY_CHAIN } from "@evidex/api/chains";
import { verifyEvidence } from "@evidex/api/verification.service";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chain = PRIMARY_CHAIN;
    const hash = formData.get("hash") ? String(formData.get("hash")) : undefined;
    const file = formData.get("file");
    const session = await getSessionFromRequest(request);

    let content: Buffer | undefined;
    if (file instanceof File) {
      content = Buffer.from(await file.arrayBuffer());
    }

    const result = await verifyEvidence({
      chain,
      hashHex: hash,
      content,
      walletAddress: session?.walletAddress
    });

    return NextResponse.json(serializeForJson(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed." },
      { status: 400 }
    );
  }
}
