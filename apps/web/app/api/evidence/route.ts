import { NextRequest, NextResponse } from "next/server";
import { processEvidenceUpload } from "@evidex/api/evidence.service";
import { PRIMARY_CHAIN } from "@evidex/api/chains";
import { listEvidenceByUser } from "@evidex/database";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const evidences = await listEvidenceByUser(session.walletAddress);
  return NextResponse.json({
    evidences: serializeForJson({ evidences }).evidences
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const chain = PRIMARY_CHAIN;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 100MB." }, { status: 413 });
    }

    const content = Buffer.from(await file.arrayBuffer());

    const result = await processEvidenceUpload({
      walletAddress: session.walletAddress,
      chain,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      content
    });

    return NextResponse.json(serializeForJson(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Evidence upload failed." },
      { status: 400 }
    );
  }
}
