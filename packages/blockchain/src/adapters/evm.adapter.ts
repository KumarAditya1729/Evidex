import { Contract, Wallet, JsonRpcProvider, type TransactionReceipt } from "ethers";
import { evidenceRegistryAbi } from "../contracts";
import type {
  AdapterUserEvidence,
  AnchorPayload,
  AnchorReceipt,
  ChainTransactionDetails,
  SupportedChain,
  VerificationResult,
  VerifyPayload
} from "../types";
import type { BlockchainAdapter } from "./base";

interface EvmAdapterConfig {
  chain: Extract<SupportedChain, "ethereum" | "polygon">;
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
  explorerBaseUrl: string;
}

export class EvmEvidenceAdapter implements BlockchainAdapter {
  readonly chain: Extract<SupportedChain, "ethereum" | "polygon">;

  private readonly provider: JsonRpcProvider;
  private readonly contract: Contract;
  private readonly explorerBaseUrl: string;

  constructor(config: EvmAdapterConfig) {
    this.chain = config.chain;
    this.explorerBaseUrl = config.explorerBaseUrl;

    this.provider = new JsonRpcProvider(config.rpcUrl);
    const signer = new Wallet(config.privateKey, this.provider);
    this.contract = new Contract(config.contractAddress, evidenceRegistryAbi, signer);
  }

  async anchorEvidence(payload: AnchorPayload): Promise<AnchorReceipt> {
    const hash = normalizeHash(payload.hashHex);
    const tx = await this.contract.registerEvidence(hash, payload.ipfsCID);
    const receipt = (await tx.wait()) as TransactionReceipt;

    return {
      chain: this.chain,
      txHash: tx.hash,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: receipt.blockNumber,
      explorerUrl: `${this.explorerBaseUrl}${tx.hash}`
    };
  }

  /**
   * Phase 2 Cross-Chain Oracle Method
   * Submits a Merkle Root of Polkadot evidence hashes to the EVM contract.
   */
  async commitMerkleRoot(rootHex: string, polkadotTxHash: string): Promise<AnchorReceipt> {
    const root = normalizeHash(rootHex);
    const tx = await this.contract.commitMerkleRoot(root, polkadotTxHash);
    const receipt = (await tx.wait()) as TransactionReceipt;

    return {
      chain: this.chain,
      txHash: tx.hash,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: receipt.blockNumber,
      explorerUrl: `${this.explorerBaseUrl}${tx.hash}`
    };
  }

  /**
   * Legacy Array-based Cross-Chain Verifier (Phase 1)
   */
  async verifyFromPolkadot(hashHex: string, polkadotTxHash: string): Promise<AnchorReceipt> {
    const hash = normalizeHash(hashHex);
    const tx = await this.contract.verifyFromPolkadot(hash, polkadotTxHash);
    const receipt = (await tx.wait()) as TransactionReceipt;

    return {
      chain: this.chain,
      txHash: tx.hash,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: receipt.blockNumber,
      explorerUrl: `${this.explorerBaseUrl}${tx.hash}`
    };
  }

  async verifyEvidence(payload: VerifyPayload): Promise<VerificationResult> {
    const hash = normalizeHash(payload.hashHex);
    const [exists, timestamp, owner, ipfsCID, polkadotProof] = await this.contract.verifyEvidence(hash);

    if (!exists) {
      return {
        chain: this.chain,
        exists: false
      };
    }

    return {
      chain: this.chain,
      exists,
      timestamp: Number(timestamp),
      owner,
      ipfsCID,
      polkadotProof
    };
  }

  async getUserEvidence(walletAddress: string): Promise<AdapterUserEvidence[]> {
    const hashes: string[] = await this.contract.getUserEvidence(walletAddress);
    return hashes.map((hash) => ({
      hashHex: hash.replace(/^0x/, "")
    }));
  }

  async getTransactionDetails(txHash: string): Promise<ChainTransactionDetails | null> {
    const tx = await this.provider.getTransaction(txHash);
    if (!tx) {
      return null;
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);
    const block = tx.blockNumber !== null ? await this.provider.getBlock(tx.blockNumber) : null;

    return {
      chain: this.chain,
      txHash,
      blockNumber: tx.blockNumber ?? undefined,
      timestamp: block?.timestamp,
      explorerUrl: `${this.explorerBaseUrl}${txHash}`,
      success: receipt?.status === 1,
      signer: tx.from ?? undefined
    };
  }
}

function normalizeHash(hashHex: string): string {
  const cleanHash = hashHex.startsWith("0x") ? hashHex : `0x${hashHex}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(cleanHash)) {
    throw new Error("Invalid SHA256 hash. Expected 32-byte hex string.");
  }

  return cleanHash;
}
