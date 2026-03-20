import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processEvidenceUploadEnhanced, verifyEvidenceEnhanced } from "@evidex/api/evidence-enhanced.service";
import { getSessionFromRequest } from "@/lib/session";
import { serializeForJson } from "@/lib/serializers";

const evidenceTypeSchema = z.enum(["financial", "legal", "audit", "general"]).default("general");
const prioritySchema = z.enum(["low", "medium", "high"]).default("medium");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { pipeline } from "stream/promises";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { Readable, Transform } from "stream";

// 🚀 Enhanced Evidence Upload with Multi-Chain Strategy
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  // ... rest of the parsing
  const tmpPath = path.join(os.tmpdir(), `evidex_enh_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  try {
    const file = formData.get("file");
    const chain = formData.get("chain") as string || "polkadot";
    const evidenceType = evidenceTypeSchema.parse(formData.get("evidenceType"));
    const priority = prioritySchema.parse(formData.get("priority"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Max file size is 100MB." }, { status: 413 });
    }

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

    const result = await processEvidenceUploadEnhanced({
      walletAddress: session.walletAddress,
      chain,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      filePath: tmpPath,
      hash: hashHex,
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
  } finally {
    await fs.promises.unlink(tmpPath).catch(() => {});
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
