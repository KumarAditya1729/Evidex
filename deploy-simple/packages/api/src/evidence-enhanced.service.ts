import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import { parseChain, toPrismaChain } from "@evidex/api/chains";
import { uploadBufferToIPFS } from "@evidex/storage";
import { createEvidenceRecord, getOrCreateUser } from "@evidex/database";
import { sha256Hex } from "@evidex/api/hash";
import { assertRateLimit } from "@evidex/api/rate-limit";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const evidenceUploadInputSchema = z.object({
  walletAddress: z.string().min(1),
  chain: z.string().min(1).optional(),
  filename: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  content: z.instanceof(Buffer),
  metadata: z.record(z.any()).optional(),
  // New fields for enhanced workflow
  evidenceType: z.enum(["financial", "audit", "legal", "general"]).default("general"),
  priority: z.enum(["low", "medium", "high"]).default("medium")
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
  const hash = sha256Hex(input.content);

  await assertRateLimit({
    key: `upload:${input.walletAddress.toLowerCase()}`,
    limit: 20,
    windowSeconds: 60
  });

  const user = await getOrCreateUser(input.walletAddress);
  
  // Step 1: Upload to IPFS (Pinata)
  const ipfsResult = await uploadBufferToIPFS({
    filename: input.filename,
    content: input.content,
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
    sizeBytes: BigInt(input.content.length),
    sha256Hash: hash,
    ipfsCID: ipfsResult.cid,
    chain: toPrismaChain(primaryChain),
    txHash: anchorResults.primary.txHash,
    chainTimestamp: anchorResults.primary.timestamp,
    explorerUrl: anchorResults.primary.explorerUrl,
    metadata: {
      evidenceType: input.evidenceType,
      priority: input.priority,
      multiChainAnchors: anchorResults.all,
      verificationUrls: generateVerificationUrls(anchorResults.all),
      uploadedAt: new Date().toISOString(),
      ...input.metadata
    } as Prisma.InputJsonValue
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
 * 📊 Multi-Chain Anchoring Strategy
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
  const anchorResults = [];

  // Strategy 1: Financial evidence → Ethereum + Polygon
  if (evidenceType === "financial") {
    try {
      // Ethereum anchor (primary financial proof)
      const ethReceipt = await blockchainService.anchorEvidence("ethereum", {
        hashHex: hash,
        ipfsCID,
        walletAddress
      });
      anchorResults.push({
        chain: "ethereum",
        type: "financial_proof",
        txHash: ethReceipt.txHash,
        timestamp: ethReceipt.timestamp,
        explorerUrl: ethReceipt.explorerUrl,
        status: "success"
      });
    } catch (error) {
      console.error("Ethereum anchoring failed:", error);
      anchorResults.push({
        chain: "ethereum",
        type: "financial_proof",
        error: error instanceof Error ? error.message : "Unknown error",
        status: "failed"
      });
    }

    try {
      // Polygon anchor (backup financial proof)
      const polygonReceipt = await blockchainService.anchorEvidence("polygon", {
        hashHex: hash,
        ipfsCID,
        walletAddress
      });
      anchorResults.push({
        chain: "polygon",
        type: "financial_proof_backup",
        txHash: polygonReceipt.txHash,
        timestamp: polygonReceipt.timestamp,
        explorerUrl: polygonReceipt.explorerUrl,
        status: "success"
      });
    } catch (error) {
      console.error("Polygon anchoring failed:", error);
      anchorResults.push({
        chain: "polygon",
        type: "financial_proof_backup",
        error: error instanceof Error ? error.message : "Unknown error",
        status: "failed"
      });
    }
  }

  // Strategy 2: All evidence types → Polkadot (audit logs)
  try {
    const polkadotReceipt = await blockchainService.anchorEvidence("polkadot", {
      hashHex: hash,
      ipfsCID,
      walletAddress
    });
    anchorResults.push({
      chain: "polkadot",
      type: "audit_log",
      txHash: polkadotReceipt.txHash,
      timestamp: polkadotReceipt.timestamp,
      explorerUrl: polkadotReceipt.explorerUrl,
      status: "success"
    });
  } catch (error) {
    console.error("Polkadot anchoring failed:", error);
    anchorResults.push({
      chain: "polkadot",
      type: "audit_log",
      error: error instanceof Error ? error.message : "Unknown error",
      status: "failed"
    });
  }

  // Strategy 3: High priority evidence → Additional chains
  if (params.evidenceType === "legal" || params.evidenceType === "financial") {
    // Add Bitcoin for maximum immutability
    try {
      const bitcoinReceipt = await blockchainService.anchorEvidence("bitcoin", {
        hashHex: hash,
        ipfsCID,
        walletAddress
      });
      anchorResults.push({
        chain: "bitcoin",
        type: "immutability_proof",
        txHash: bitcoinReceipt.txHash,
        timestamp: bitcoinReceipt.timestamp,
        explorerUrl: bitcoinReceipt.explorerUrl,
        status: "success"
      });
    } catch (error) {
      console.error("Bitcoin anchoring failed:", error);
    }
  }

  // Return primary anchor (for backward compatibility) and all anchors
  const primaryAnchor = anchorResults.find(r => r.chain === primaryChain && r.status === "success") || 
                       anchorResults.find(r => r.status === "success") ||
                       anchorResults[0];

  return {
    primary: primaryAnchor,
    all: anchorResults
  };
}

/**
 * 🔍 Generate Verification URLs for All Chains
 */
function generateVerificationUrls(anchors: any[]) {
  const urls = {};
  
  anchors.forEach(anchor => {
    if (anchor.status === "success") {
      switch (anchor.chain) {
        case "ethereum":
          urls.etherscan = `https://etherscan.io/tx/${anchor.txHash}`;
          break;
        case "polygon":
          urls.polygonscan = `https://polygonscan.com/tx/${anchor.txHash}`;
          break;
        case "polkadot":
          urls.subscan = `${anchor.explorerUrl}${anchor.txHash}`;
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
 * ✅ Enhanced Verification with Multi-Chain Support
 */
export async function verifyEvidenceEnhanced(params: {
  hash: string;
  chain?: string;
  verifyAllChains?: boolean;
}) {
  const { hash, chain, verifyAllChains = false } = params;
  const blockchainService = await createBlockchainServiceFromEnv();
  
  if (verifyAllChains) {
    // Verify on all supported chains
    const chains = ["ethereum", "polygon", "polkadot", "bitcoin"];
    const results = [];
    
    for (const chainName of chains) {
      try {
        const result = await blockchainService.verifyEvidence(chainName as any, { hashHex: hash });
        results.push({
          chain: chainName,
          verified: result.verified,
          details: result
        });
      } catch (error) {
        results.push({
          chain: chainName,
          verified: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    
    return {
      hash,
      multiChainVerification: results,
      overallVerified: results.some(r => r.verified),
      verifiedChains: results.filter(r => r.verified).map(r => r.chain)
    };
  } else {
    // Single chain verification (existing behavior)
    const targetChain = chain || "polkadot";
    const result = await blockchainService.verifyEvidence(targetChain as any, { hashHex: hash });
    
    return {
      hash,
      chain: targetChain,
      verified: result.verified,
      details: result
    };
  }
}
