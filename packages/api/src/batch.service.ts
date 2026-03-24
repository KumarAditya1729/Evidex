import { generateMerkleRoot, generateMerkleProof } from "./merkle";
import { processEvidenceUpload } from "./evidence.service";
import { sha256Hex } from "./hash";

export interface BatchItem {
  filename: string;
  mimeType: string;
  content: Buffer;
}

/**
 * 📦 Enterprise Batch Processing Engine
 * Hashes up to thousands of files together using a Merkle Tree inside memory.
 * Compresses them into a single 64-character Root Hash.
 * Anchors the Root Hash to the blockchain, saving 99% of gas fees.
 */
export async function processBatchUpload(walletAddress: string, items: BatchItem[], chain?: string) {
  if (items.length === 0) throw new Error("Empty batch received.");

  // 1. Independently Hash all files
  const leaves = items.map(item => sha256Hex(item.content));
  
  // 2. Generate the unifying Merkle Root
  const merkleRoot = generateMerkleRoot(leaves);

  // 3. Anchor ONLY the Merkle Root on-chain
  const batchAnchorResult = await processEvidenceUpload({
    walletAddress,
    chain,
    filename: `merkle_batch_snapshot_${Date.now()}.json`,
    mimeType: "application/json",
    content: Buffer.from(JSON.stringify({ 
      batchRoot: merkleRoot, 
      count: items.length, 
      timestamp: new Date().toISOString() 
    })),
    metadata: {
      isBatchRoot: true,
      itemCount: items.length
    }
  });

  // 4. Generate the unforgeable mathematical proofs for each user/file
  const individualProofs = items.map((item, index) => {
    const leafHash = leaves[index];
    const proof = generateMerkleProof(leaves, leafHash);
    
    return {
      filename: item.filename,
      fileHash: leafHash,
      merkleRoot,
      merkleProof: proof,
      anchorDetails: batchAnchorResult.evidence
    };
  });

  return {
    merkleRoot,
    chainTxHash: batchAnchorResult.evidence.chainTxHash,
    totalGasSavedPercentage: items.length > 1 ? ((items.length - 1) / items.length) * 100 : 0,
    itemsAnchored: items.length,
    proofs: individualProofs
  };
}
