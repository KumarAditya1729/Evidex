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

const FALLBACK_CHAINS: Record<string, string[]> = {
  "polygon": ["arbitrum"], // Typical EVM routing
  "ethereum": ["optimism", "base"],
  "polkadot": ["kusama", "moonbeam"], // Substrate fallback
  "bsc": ["opbnb"]
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function anchorWithRetryAndFallback(blockchainService: any, requestedChain: string, payload: { hashHex: string, ipfsCID: string, walletAddress: string }) {
  const MAX_RETRIES = 2; // Up to 3 sequential attempts on primary
  
  // 1. Transient RPC Retry Logic
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      const receipt = await blockchainService.anchorEvidence(requestedChain, payload);
      return { receipt, actualChain: requestedChain };
    } catch (error) {
      attempt++;
      if (attempt > MAX_RETRIES) {
        console.warn(`[EVIDEX] Primary chain ${requestedChain} failed all ${MAX_RETRIES + 1} attempts. Routing to fallback...`);
        break;
      }
      console.log(`[EVIDEX] Transient failure on ${requestedChain}. Retrying in ${attempt}s...`);
      await sleep(attempt * 1000); // 1s, 2s exponential backoff
    }
  }

  // 2. Cross-Chain Fallback Logic
  const fallbacks = FALLBACK_CHAINS[requestedChain] || [];
  for (const fallbackChain of fallbacks) {
    console.log(`[EVIDEX] ATTEMPTING FALLBACK ON: ${fallbackChain}...`);
    try {
      const receipt = await blockchainService.anchorEvidence(fallbackChain, payload);
      console.log(`[EVIDEX] Successfully anchored on fallback chain: ${fallbackChain}`);
      return { receipt, actualChain: fallbackChain };
    } catch (error) {
      console.error(`[EVIDEX] Fallback chain ${fallbackChain} failed as well.`);
    }
  }

  throw new Error(`CRITICAL FAILURE: Anchoring failed completely on target chain (${requestedChain}) and all fallback chains (${fallbacks.join(", ")}).`);
}

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
  
  const { receipt: anchorReceipt, actualChain } = await anchorWithRetryAndFallback(blockchainService, chain, {
    hashHex: hash,
    ipfsCID: ipfsResult.cid,
    walletAddress: user.walletAddress
  });
  
  const actualPrismaChain = toPrismaChain(parseChain(actualChain));

  const evidence = await createEvidenceRecord({
    userId: user.id,
    originalFilename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: BigInt(input.content ? input.content.length : ipfsResult.size),
    sha256Hash: hash,
    ipfsCID: ipfsResult.cid,
    chain: actualPrismaChain,
    txHash: anchorReceipt.txHash,
    chainTimestamp: anchorReceipt.timestamp,
    explorerUrl: anchorReceipt.explorerUrl,
    metadata: {
      ...((input.metadata ?? {}) as any),
      requestedChain: chain,
      wasFallback: actualChain !== chain
    }
  });

  await publishEvidenceEvent({
    type: "evidence.anchored",
    evidenceId: evidence.id,
    walletAddress: user.walletAddress,
    chain: actualChain as any,
    txHash: anchorReceipt.txHash,
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
