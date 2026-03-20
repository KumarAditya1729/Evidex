import { NextRequest, NextResponse } from "next/server";
import { getEvidenceById } from "@evidex/database";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const evidence = await getEvidenceById(params.id);
  if (!evidence) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = evidence.user.walletAddress === session.walletAddress;
  if (!isOwner && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(serializeForJson({ evidence }));
}
