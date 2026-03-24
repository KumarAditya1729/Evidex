import { z } from "zod";
import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import {
  createEvidenceRecord,
  findEvidenceByHash,
  getOrCreateUser,
  type Prisma
} from "@evidex/database";
import { uploadBufferToIPFS, uploadFileStreamToIPFS } from "@evidex/storage";
import { publishEvidenceEvent } from "./queue";
import { assertRateLimit } from "./rate-limit";
import { sha256Hex } from "./hash";
import { parseChain, toPrismaChain } from "./chains";

const evidenceUploadInputSchema = z.object({
  walletAddress: z.string().min(1),
  chain: z.string().min(1).optional(),
  filename: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  content: z.instanceof(Buffer).optional(),
  filePath: z.string().optional(),
  hash: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.enum(["cost", "speed", "security", "auto"]).default("auto")
}).refine(data => data.content !== undefined || (data.filePath !== undefined && data.hash !== undefined), {
  message: "Must provide either Buffer content, or filePath + hash for streaming."
});

export async function processEvidenceUpload(rawInput: z.input<typeof evidenceUploadInputSchema>) {
  const input = evidenceUploadInputSchema.parse(rawInput);
  const chain = parseChain(input.chain, input.priority);
  const hash = input.hash || sha256Hex(input.content!);

  await assertRateLimit({
    key: `upload:${input.walletAddress.toLowerCase()}`,
    limit: 20,
    windowSeconds: 60
  });

  const user = await getOrCreateUser(input.walletAddress);
  const prismaChain = toPrismaChain(chain);

  const duplicate = await findEvidenceByHash(hash, prismaChain, user.id);
  if (duplicate) {
    return {
      duplicate: true,
      evidence: duplicate
    };
  }

  const ipfsResult = input.filePath
    ? await uploadFileStreamToIPFS({
        filename: input.filename,
        filePath: input.filePath,
        contentType: input.mimeType,
        metadata: { walletAddress: user.walletAddress, chain, sha256Hash: hash }
      })
    : await uploadBufferToIPFS({
        filename: input.filename,
        content: input.content!,
        contentType: input.mimeType,
        metadata: { walletAddress: user.walletAddress, chain, sha256Hash: hash }
      });

  const blockchainService = await createBlockchainServiceFromEnv();

  // ─── Multi-Chain Parallel Anchoring ───────────────────────────────────────
  const { successes, failures } = await blockchainService.anchorEvidenceOnAllChains({
    hashHex: hash,
    ipfsCID: ipfsResult.cid,
    walletAddress: user.walletAddress
  });

  if (failures.length > 0) {
    console.warn(
      "[EVIDEX] Some chains failed to anchor:",
      failures.map(f => `${f.chain}: ${f.error}`).join(", ")
    );
  }

  if (successes.length === 0) {
    throw new Error(
      `CRITICAL FAILURE: Anchoring failed on all configured chains. Errors: ${failures.map(f => `${f.chain}: ${f.error}`).join("; ")}`
    );
  }

  // Primary anchor = first success (prefer Polkadot if it's first)
  const primary = successes[0];
  const primaryPrismaChain = toPrismaChain(primary.chain);

  // Additional anchors = remaining successes
  const additionalAnchors = successes.slice(1).map(s => ({
    chain: toPrismaChain(s.chain),
    txHash: s.receipt.txHash,
    explorerUrl: s.receipt.explorerUrl,
    timestamp: s.receipt.timestamp
  }));
  // ──────────────────────────────────────────────────────────────────────────

  const evidence = await createEvidenceRecord({
    userId: user.id,
    originalFilename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: BigInt(input.content ? input.content.length : ipfsResult.size),
    sha256Hash: hash,
    ipfsCID: ipfsResult.cid,
    chain: primaryPrismaChain,
    txHash: primary.receipt.txHash,
    chainTimestamp: primary.receipt.timestamp,
    explorerUrl: primary.receipt.explorerUrl,
    additionalAnchors,
    metadata: {
      ...((input.metadata ?? {}) as any),
      requestedChain: chain,
      anchoredChains: successes.map(s => s.chain),
      failedChains: failures.map(f => f.chain)
    }
  });

  await publishEvidenceEvent({
    type: "evidence.anchored",
    evidenceId: evidence.id,
    walletAddress: user.walletAddress,
    chain: primary.chain as any,
    txHash: primary.receipt.txHash,
    hash,
    createdAt: new Date().toISOString()
  });

  return {
    duplicate: false,
    evidence
  };
}

export async function getConfiguredChains() {
  const blockchainService = await createBlockchainServiceFromEnv();
  return blockchainService.getSupportedChains();
}
