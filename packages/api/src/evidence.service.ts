import { z } from "zod";
import { createBlockchainServiceFromEnv, MerkleTree } from "@evidex/blockchain";
import {
  createEvidenceRecord,
  findEvidenceByHash,
  getOrCreateUser,
  Chain,
  listEvidenceByUser,
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

  // ─── True Cross-Chain Relayer Sequence ──────────────────────────────────────
  
  // 1. PRIMARY ANCHOR: Always anchor to Polkadot (the source of truth)
  let primary;
  try {
    primary = await blockchainService.anchorEvidence("polkadot", {
      hashHex: hash,
      ipfsCID: ipfsResult.cid,
      walletAddress: user.walletAddress
    });
  } catch (error) {
    throw new Error(`CRITICAL FAILURE: Primary Polkadot anchoring failed. ${error instanceof Error ? error.message : String(error)}`);
  }

  const primaryPrismaChain = toPrismaChain("polkadot");
  const successes = [ { chain: "polkadot", receipt: primary } ];
  const failures: { chain: string; error: string }[] = [];
  const additionalAnchors: Array<{
    chain: Chain;
    txHash: string;
    explorerUrl?: string;
    timestamp: number;
    verifiedChain?: string;
    crossChainProof?: string;
  }> = [];

  // 2. ORACLE RELAYER: Cross-Chain Verification on Secondary Chains (Phase 2 - Merkle Proofs)
  // We fetch the last 3 evidences to batch them into a Merkle Tree with the new upload
  // to demonstrate true cryptographic batched proving.
  const recentEvidences = await listEvidenceByUser(user.walletAddress, { limit: 3 });
  const batchHashes = recentEvidences.map(e => e.sha256Hash).filter(h => h !== hash);
  batchHashes.push(hash); // The new one is guaranteed to be in the tree
  
  const tree = new MerkleTree(batchHashes);
  const merkleRoot = tree.getRoot();
  const hexProof = tree.getProof(hash);

  const configuredChains = blockchainService.getSupportedChains();
  const targetRelayChains = new Set<string>();
  
  if (configuredChains.includes("ethereum-sepolia")) {
    targetRelayChains.add("ethereum-sepolia");
  }
  if (chain !== "polkadot" && configuredChains.includes(chain as any)) {
    targetRelayChains.add(chain);
  }

  for (const relayChain of targetRelayChains) {
    try {
      // PHASE 2: Submit the Merkle Root instead of individual hashes
      const relayReceipt = await blockchainService.commitMerkleRoot(
        relayChain as any,
        merkleRoot,
        primary.txHash
      );
      
      successes.push({ chain: relayChain, receipt: relayReceipt });
      additionalAnchors.push({
        chain: toPrismaChain(relayChain),
        txHash: relayReceipt.txHash,
        explorerUrl: relayReceipt.explorerUrl, 
        timestamp: relayReceipt.timestamp,
        verifiedChain: "POLKADOT",            
        // Store the proof mathematically so the frontend can verify it
        crossChainProof: JSON.stringify({
          root: merkleRoot,
          proof: hexProof
        })
      });
    } catch (error) {
      console.warn(`[CROSS-CHAIN RELAYER] Failed to relay Merkle Root to ${relayChain}:`, error);
      failures.push({ 
        chain: relayChain, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const evidence = await createEvidenceRecord({
    userId: user.id,
    originalFilename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: BigInt(input.content ? input.content.length : ipfsResult.size),
    sha256Hash: hash,
    ipfsCID: ipfsResult.cid,
    chain: primaryPrismaChain,
    txHash: primary.txHash,
    chainTimestamp: primary.timestamp,
    explorerUrl: primary.explorerUrl,
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
    chain: "polkadot" as any,
    txHash: primary.txHash,
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
