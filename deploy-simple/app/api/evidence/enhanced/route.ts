import { NextRequest, NextResponse } from "next/server";
import { processEvidenceUploadEnhanced, verifyEvidenceEnhanced } from "@evidex/api/evidence-enhanced.service";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🚀 Enhanced Evidence Upload with Multi-Chain Strategy
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const chain = formData.get("chain") as string || "polkadot";
    const evidenceType = formData.get("evidenceType") as string || "general";
    const priority = formData.get("priority") as string || "medium";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 100MB." }, { status: 413 });
    }

    const content = Buffer.from(await file.arrayBuffer());

    const result = await processEvidenceUploadEnhanced({
      walletAddress: session.walletAddress,
      chain,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      content,
      evidenceType: evidenceType as any,
      priority: priority as any,
      metadata: {
        uploadedVia: "enhanced-api",
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json(serializeForJson(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence upload failed." },
      { status: 400 }
    );
  }
}

// 🔍 Enhanced Multi-Chain Verification
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get("hash");
    const chain = searchParams.get("chain");
    const verifyAllChains = searchParams.get("verifyAll") === "true";

    if (!hash) {
      return NextResponse.json({ error: "Hash is required." }, { status: 400 });
    }

    const result = await verifyEvidenceEnhanced({
      hash,
      chain: chain || undefined,
      verifyAllChains
    });

    return NextResponse.json(serializeForJson(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed." },
      { status: 400 }
    );
  }
}
