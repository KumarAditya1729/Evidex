import { NextRequest, NextResponse } from "next/server";
import { listEvidenceByUser } from "@evidex/database";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get only evidence from your admin wallet
  const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;
  if (!adminWalletAddress) {
    return NextResponse.json({ error: "Admin wallet not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const evidences = await listEvidenceByUser(adminWalletAddress, { limit, offset });
  return NextResponse.json({
    evidences: serializeForJson({ evidences }).evidences,
    adminWallet: adminWalletAddress
  });
}
