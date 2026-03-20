import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import { parseChain, toPrismaChain } from "./chains";
import { uploadBufferToIPFS, uploadFileStreamToIPFS } from "@evidex/storage";
import { createEvidenceRecord, getOrCreateUser } from "@evidex/database";
import { sha256Hex } from "./hash";
import { assertRateLimit } from "./rate-limit";
import { getRedisClient } from "./cache";
import { z } from "zod";
import type { Prisma } from "@evidex/database";

interface AnchorEntry {
  chain: string;
  type: string;
  status: "success" | "failed";
  txHash?: string;
  timestamp?: number;
  explorerUrl?: string;
  error?: string;
}

const evidenceUploadInputSchema = z.object({
  walletAddress: z.string().min(1),
  chain: z.string().min(1).optional(),
  filename: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  content: z.instanceof(Buffer).optional(),
  filePath: z.string().optional(),
  hash: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  // New fields for enhanced workflow
  evidenceType: z.enum(["financial", "audit", "legal", "general"]).default("general"),
  priority: z.enum(["low", "medium", "high"]).default("medium")
}).refine(data => data.content !== undefined || (data.filePath !== undefined && data.hash !== undefined), {
  message: "Must provide either Buffer content, or filePath + hash for streaming."
});

/**
 * 🚀 Enhanced Evidence Processing with Multi-Chain Strategy
 * 
 * Workflow:
 * 1. User uploads evidence → IPFS (Pinata)
 * 2. Hash stored on multiple blockchains based on type
 * 3. Ethereum/Polygon → Financial proofs
 * 4. Polkadot → Audit logs (parachain)
 * 5. Verification via Subscan + Etherscan
 */
export async function processEvidenceUploadEnhanced(rawInput: z.input<typeof evidenceUploadInputSchema>) {
  const input = evidenceUploadInputSchema.parse(rawInput);
  const primaryChain = parseChain(input.chain || "polkadot");
  const hash = input.hash || sha256Hex(input.content!);

  await assertRateLimit({
    key: `upload:${input.walletAddress.toLowerCase()}`,
    limit: 20,
    windowSeconds: 60
  });

  const user = await getOrCreateUser(input.walletAddress);
  
  // Step 1: Upload to IPFS (Pinata)
  const ipfsResult = input.filePath
    ? await uploadFileStreamToIPFS({
        filename: input.filename,
        filePath: input.filePath,
        contentType: input.mimeType,
        metadata: {
          walletAddress: user.walletAddress,
          chain: primaryChain,
          sha256Hash: hash,
          evidenceType: input.evidenceType,
          priority: input.priority,
          uploadedAt: new Date().toISOString()
        }
      })
    : await uploadBufferToIPFS({
        filename: input.filename,
        content: input.content!,
        contentType: input.mimeType,
        metadata: {
          walletAddress: user.walletAddress,
          chain: primaryChain,
          sha256Hash: hash,
          evidenceType: input.evidenceType,
          priority: input.priority,
          uploadedAt: new Date().toISOString()
        }
      });

  // Step 2: Multi-chain anchoring based on evidence type
  const anchorResults = await anchorEvidenceOnMultipleChains({
    hash,
    ipfsCID: ipfsResult.cid,
    walletAddress: user.walletAddress,
    evidenceType: input.evidenceType,
    primaryChain
  });

  // Step 3: Create evidence record with all chain anchors
  const evidence = await createEvidenceRecord({
    userId: user.id,
    originalFilename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: BigInt(input.content ? input.content.length : ipfsResult.size),
    sha256Hash: hash,
    ipfsCID: ipfsResult.cid,
    chain: toPrismaChain(primaryChain),
    txHash: anchorResults.primary.txHash!,
    chainTimestamp: anchorResults.primary.timestamp!,
    explorerUrl: anchorResults.primary.explorerUrl,
    metadata: {
      evidenceType: input.evidenceType,
      priority: input.priority,
      multiChainAnchors: anchorResults.all,
      verificationUrls: generateVerificationUrls(anchorResults.all),
      uploadedAt: new Date().toISOString(),
      ...input.metadata
    } as unknown as Prisma.InputJsonValue
  });

  return {
    duplicate: false,
    evidence,
    ipfsCID: ipfsResult.cid,
    multiChainAnchors: anchorResults.all,
    verificationUrls: generateVerificationUrls(anchorResults.all)
  };
}

/**
 * 📊 Multi-Chain Anchoring Strategy — runs all chains in PARALLEL
 */
async function anchorEvidenceOnMultipleChains(params: {
  hash: string;
  ipfsCID: string;
  walletAddress: string;
  evidenceType: string;
  primaryChain: string;
}) {
  const { hash, ipfsCID, walletAddress, evidenceType, primaryChain } = params;
  const blockchainService = await createBlockchainServiceFromEnv();

  // Define which chains to anchor on based on evidence type
  type AnchorJob = { chain: "ethereum" | "polygon" | "polkadot" | "bitcoin"; type: string };
  const jobs: AnchorJob[] = [];

  if (evidenceType === "financial") {
    jobs.push({ chain: "ethereum", type: "financial_proof" });
    jobs.push({ chain: "polygon", type: "financial_proof_backup" });
  }

  // Polkadot for all types
  jobs.push({ chain: "polkadot", type: "audit_log" });

  // Bitcoin for high-value evidence
  if (evidenceType === "legal" || evidenceType === "financial") {
    jobs.push({ chain: "bitcoin", type: "immutability_proof" });
  }

  // Run all chains in parallel — individual failures don't block others
  const settled = await Promise.allSettled(
    jobs.map(async (job) => {
      const receipt = await blockchainService.anchorEvidence(job.chain, {
        hashHex: hash,
        ipfsCID,
        walletAddress
      });
      return { ...job, ...receipt, status: "success" as const };
    })
  );

  const anchorResults: AnchorEntry[] = settled.map((result, i) => {
    if (result.status === "fulfilled") {
      return {
        chain: result.value.chain,
        type: result.value.type,
        status: "success",
        txHash: result.value.txHash,
        timestamp: result.value.timestamp,
        explorerUrl: result.value.explorerUrl
      };
    } else {
      console.error(`${jobs[i].chain} anchoring failed:`, result.reason);
      return {
        chain: jobs[i].chain,
        type: jobs[i].type,
        status: "failed",
        error: result.reason instanceof Error ? result.reason.message : "Unknown error"
      };
    }
  });

  // Pick primary anchor (prefer the requested primaryChain, fall back to any success)
  const primaryAnchor =
    anchorResults.find(r => r.chain === primaryChain && r.status === "success") ??
    anchorResults.find(r => r.status === "success");

  if (!primaryAnchor) {
    throw new Error("All chain anchoring attempts failed. No anchor was created.");
  }

  return {
    primary: primaryAnchor,
    all: anchorResults
  };
}

/**
 * 🔍 Generate Verification URLs for All Chains
 */
function generateVerificationUrls(anchors: AnchorEntry[]): Record<string, string> {
  const urls: Record<string, string> = {};

  anchors.forEach(anchor => {
    if (anchor.status === "success" && anchor.txHash) {
      switch (anchor.chain) {
        case "ethereum":
          urls.etherscan = `https://etherscan.io/tx/${anchor.txHash}`;
          break;
        case "polygon":
          urls.polygonscan = `https://polygonscan.com/tx/${anchor.txHash}`;
          break;
        case "polkadot":
          urls.subscan = `${anchor.explorerUrl ?? ""}${anchor.txHash}`;
          break;
        case "bitcoin":
          urls.blockstream = `https://blockstream.info/tx/${anchor.txHash}`;
          break;
      }
    }
  });

  return urls;
}

/**
 * ✅ Enhanced Verification with Multi-Chain Support + Redis Cache
 */
export async function verifyEvidenceEnhanced(params: {
  hash: string;
  chain?: string;
  verifyAllChains?: boolean;
}) {
  const { hash, chain, verifyAllChains = false } = params;
  const blockchainService = await createBlockchainServiceFromEnv();
  const redis = getRedisClient();

  if (verifyAllChains) {
    // Verify on all chains IN PARALLEL
    const chains = ["ethereum", "polygon", "polkadot", "bitcoin"];

    const settled = await Promise.allSettled(
      chains.map(async (chainName) => {
        const cacheKey = `verify:${chainName}:${hash}`;
        const cached = await redis.get(cacheKey);
        if (cached) return { chain: chainName, ...JSON.parse(cached), fromCache: true };

        const result = await blockchainService.verifyEvidence(chainName as any, { hashHex: hash });
        await redis.set(cacheKey, JSON.stringify(result), "EX", 300); // 5-min TTL
        return { chain: chainName, verified: result.exists, details: result };
      })
    );

    const results = settled.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { chain: chains[i], verified: false, error: r.reason instanceof Error ? r.reason.message : "Unknown error" }
    );

    return {
      hash,
      multiChainVerification: results,
      overallVerified: results.some(r => r.verified),
      verifiedChains: results.filter(r => r.verified).map(r => r.chain)
    };
  } else {
    // Single chain verification with cache
    const targetChain = chain || "polkadot";
    const cacheKey = `verify:${targetChain}:${hash}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      const result = JSON.parse(cached);
      return { hash, chain: targetChain, verified: result.exists, details: result, fromCache: true };
    }

    const result = await blockchainService.verifyEvidence(targetChain as any, { hashHex: hash });
    await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

    return {
      hash,
      chain: targetChain,
      verified: result.exists,
      details: result
    };
  }
}
