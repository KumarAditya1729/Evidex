import { ethers } from "ethers";

/**
 * Client-Side Merkle Tree utility.
 * Allows the browser/React Native app to mathematically construct Merkle Proofs locally.
 */
export class MerkleTree {
  public leaves: string[];
  public layers: string[][];

  constructor(leaves: string[]) {
    this.leaves = leaves.map((leaf) => {
      // If it's not a hex string, assume it's UTF-8 and hash it first
      if (!leaf.startsWith("0x")) {
        return ethers.keccak256(ethers.toUtf8Bytes(leaf));
      }
      return leaf;
    });
    this.layers = [this.leaves];
    this.buildTree();
  }

  public getRoot(): string {
    if (this.layers.length === 0) return "";
    return this.layers[this.layers.length - 1][0];
  }

  public getProof(leaf: string): string[] {
    const proof: string[] = [];
    let index = this.layers[0].indexOf(leaf);

    if (index === -1) {
      throw new Error("Leaf not found in tree.");
    }

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
    const bufferA = ethers.getBytes(a);
    const bufferB = ethers.getBytes(b);

    const isALess = this.compare(bufferA, bufferB) < 0;
    const first = isALess ? bufferA : bufferB;
    const second = isALess ? bufferB : bufferA;

    const concat = new Uint8Array(first.length + second.length);
    concat.set(first, 0);
    concat.set(second, first.length);

    return ethers.keccak256(concat);
  }

  private compare(a: Uint8Array, b: Uint8Array): number {
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return a.length - b.length;
  }
}
