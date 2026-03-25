import { getBytes, hexlify, keccak256 } from "ethers";

/**
 * OpenZeppelin-compatible Merkle Tree utility.
 * Assumes Keccak256 hashing and sorted pairs.
 */
export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(leaves: string[]) {
    // 1. Hash all raw leaves (if they are not already 32-byte hex strings, they should be hashed first)
    // We assume the input leaves are already the 32-byte keccak256 hashes of the evidence files.
    // Sorting leaves is not strictly required by OZ, but OZ requires pairs to be sorted before hashing.
    this.leaves = leaves.map(l => this.bufferToHex(l));
    this.layers = [this.leaves];

    this.buildTree();
  }

  public getRoot(): string {
    if (this.layers.length === 0 || this.layers[this.layers.length - 1].length === 0) {
      return "0x" + "00".repeat(32);
    }
    return this.layers[this.layers.length - 1][0];
  }

  public getProof(leaf: string): string[] {
    const proof: string[] = [];
    const hexLeaf = this.bufferToHex(leaf);

    let index = this.layers[0].indexOf(hexLeaf);
    if (index === -1) {
      throw new Error(`Leaf not found in tree: ${hexLeaf}`);
    }

    // Traverse layers
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2 !== 0;
      const pairIndex = isRightNode ? index - 1 : index + 1;

      if (pairIndex < layer.length) {
        proof.push(layer[pairIndex]);
      }

      index = Math.floor(index / 2);
    }

    return proof;
  }

  private buildTree() {
    let currentLayer = this.leaves;
    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 === currentLayer.length) {
          // If odd number of leaves, promote the last one without hashing, 
          // or duplicate it depending on the exact OZ variant.
          // Note: Standard OZ doesn't duplicate. It just promotes.
          nextLayer.push(currentLayer[i]);
        } else {
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i + 1]));
        }
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  private hashPair(a: string, b: string): string {
    // OpenZeppelin requires sorting before hashing
    const bufferA = getBytes(a);
    const bufferB = getBytes(b);

    const isALess = this.compare(bufferA, bufferB) < 0;
    const first = isALess ? bufferA : bufferB;
    const second = isALess ? bufferB : bufferA;

    // Concatenate bytes
    const concat = new Uint8Array(first.length + second.length);
    concat.set(first, 0);
    concat.set(second, first.length);

    return keccak256(concat);
  }

  private bufferToHex(value: string | Uint8Array): string {
    if (typeof value === "string") {
      if (!value.startsWith("0x")) {
         return "0x" + value;
      }
      return value;
    }
    return hexlify(value);
  }

  private compare(a: Uint8Array, b: Uint8Array): number {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  }
}
