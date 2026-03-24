import * as crypto from "crypto";

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generates a deterministic Merkle Root from an array of SHA256 leaf hashes.
 */
export function generateMerkleRoot(leaves: string[]): string {
  if (!leaves || leaves.length === 0) throw new Error("Cannot generate Merkle Root from empty leaves.");
  if (leaves.length === 1) return leaves[0]; // Optimization: 1 file batch

  let currentLevel = [...leaves];
  currentLevel.sort(); // Lexicographical sort for deterministic trees

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; 
      
      const combined = [left, right].sort().join("");
      nextLevel.push(sha256(combined));
    }
    
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

export interface MerkleProof {
  sibling: string;
  isLeft: boolean;
}

/**
 * Generates the cryptograhic proof needed to verify a single file's inclusion in the batch root.
 */
export function generateMerkleProof(leaves: string[], targetLeaf: string): MerkleProof[] {
  const sortedLeaves = [...leaves].sort();
  let index = sortedLeaves.indexOf(targetLeaf);
  
  if (index === -1) throw new Error("Target leaf not found in tree.");

  let currentLevel = sortedLeaves;
  const proof: MerkleProof[] = [];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    const nextIndex = Math.floor(index / 2);
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      
      if (i === index || i + 1 === index) {
        const isLeft = i === index;
        const sibling = isLeft ? right : left;
        proof.push({ sibling, isLeft });
      }

      const combined = [left, right].sort().join("");
      nextLevel.push(sha256(combined));
    }
    
    currentLevel = nextLevel;
    index = nextIndex;
  }

  return proof;
}

/**
 * Validates an individual file against a known blockchain Merkle Root without revealing other files.
 */
export function verifyMerkleProof(leaf: string, proof: MerkleProof[], root: string): boolean {
  let currentHash = leaf;
  
  for (const step of proof) {
    const combined = [currentHash, step.sibling].sort().join("");
    currentHash = sha256(combined);
  }
  
  return currentHash === root;
}
