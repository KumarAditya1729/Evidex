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

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const evidences = await listEvidenceByUser(session.walletAddress.toLowerCase(), { limit, offset });
  return NextResponse.json({
    evidences: serializeForJson({ evidences }).evidences
  });
}

import { pipeline } from "stream/promises";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Readable, Transform } from "stream";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const chain = PRIMARY_CHAIN;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 100MB." }, { status: 413 });
  }

  const tmpPath = path.join(os.tmpdir(), `evidex_std_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  
  try {
    const hashStream = crypto.createHash("sha256");
    const hashTransformer = new Transform({
      transform(chunk, encoding, callback) {
        hashStream.update(chunk);
        callback(null, chunk);
      }
    });

    const nodeStream = Readable.fromWeb(file.stream() as any);
    await pipeline(nodeStream, hashTransformer, fs.createWriteStream(tmpPath));
    const hashHex = hashStream.digest("hex");

    const result = await processEvidenceUpload({
      walletAddress: session.walletAddress,
      chain,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      filePath: tmpPath,
      hash: hashHex
    });

    return NextResponse.json(serializeForJson(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.stack || error.message : "Evidence upload failed." },
      { status: 400 }
    );
  } finally {
    await fs.promises.unlink(tmpPath).catch(() => {});
  }
}
