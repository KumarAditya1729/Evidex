import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Enable, web3Accounts, web3FromSource } from "@polkadot/extension-dapp";
import { uploadToIPFSClientSide } from "./ipfs.js";
import { MerkleTree } from "./merkle.js";
import { ethers } from "ethers";

export interface EvidexClientConfig {
  /**
   * The Substrate WebSocket RPC URL.
   * Default: ws://127.0.0.1:9944
   */
  rpcUrl?: string;
  
  /**
   * Pinata Developer JWT for Client-Side pinning (In prod, use scoped keys/relays)
   */
  pinataJWT: string;
}

export interface AnchorConfig {
  filename: string;
  description?: string;
}

export interface AnchorResponse {
  blockHash: string;
  txHash: string;
  fileHash: string;
  ipfsCID: string;
  merkleRoot: string;
}

/**
 * EvidexClient (v2.0 - Fully Decentralized)
 * The official SDK for interacting directly with the Evidex Cross-Chain Substrate Parachain.
 * Bypasses centralized backends by utilizing injected browser wallets.
 */
export class EvidexClient {
  private readonly rpcUrl: string;
  private readonly pinataJWT: string;
  private api: ApiPromise | null = null;

  constructor(config: EvidexClientConfig) {
    this.rpcUrl = config.rpcUrl || "ws://127.0.0.1:9944";
    this.pinataJWT = config.pinataJWT;
  }

  /**
   * Connects to the Substrate Parachain RPC Node.
   */
  public async connect(): Promise<void> {
    const provider = new WsProvider(this.rpcUrl);
    this.api = await ApiPromise.create({ provider });
    console.log(`📡 Connected to Evidex Parachain via ${this.rpcUrl}`);
  }

  /**
   * Fully decentralized flow: 
   * 1. Hashes file locally
   * 2. Uploads to Pinata directly
   * 3. Prompts Polkadot.js wallet
   * 4. Signs & Broadcasts Extrinsic directly to Substrate
   */
  public async anchorDirectly(
    fileBuffer: Buffer | Blob,
    config: AnchorConfig
  ): Promise<AnchorResponse> {
    if (!this.api) await this.connect();

    console.log("🔐 Step 1: Client-Side Crypto Calculation...");
    let fileHash: string;
    if (typeof Blob !== "undefined" && fileBuffer instanceof Blob) {
      const arrayBuffer = await fileBuffer.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      fileHash = ethers.keccak256(uint8);
    } else {
      fileHash = ethers.keccak256(fileBuffer as Buffer);
    }

    // Initialize local Merkle Proof Generation
    const tree = new MerkleTree([fileHash]);
    const root = tree.getRoot();

    console.log("☁️ Step 2: Client-Side IPFS Pinning...");
    const cid = await uploadToIPFSClientSide(fileBuffer, config.filename, this.pinataJWT);

    console.log("👛 Step 3: Prompting Web3 Wallet Extension...");
    // 💡 This requires the user to be inside a browser environment with a Polkadot extension installed!
    if (typeof window === "undefined") {
      throw new Error("Wallet signing requires a Browser Environment.");
    }

    const extensions = await web3Enable("Evidex dApp");
    if (extensions.length === 0) {
      throw new Error("No Polkadot extension found (e.g. Talisman, Polkadot.js). Please install one.");
    }

    const allAccounts = await web3Accounts();
    if (allAccounts.length === 0) {
      throw new Error("Wallet connected, but no accounts are available. Please create a Polkadot account.");
    }

    const account = allAccounts[0]; // Prompts the first available account
    const injector = await web3FromSource(account.meta.source);

    console.log(`✍️ Signing transaction with account: ${account.address}`);

    // Assuming your runtime Pallet has: pallet_evidence::submit_evidence(hash, cid)
    // Convert hash and cid to Uint8Array as expected by Substrate Vectors
    const hashBytes = ethers.getBytes(fileHash);
    const cidBytes = Buffer.from(cid); // Or TextEncoder in browser

    const extrinsic = this.api!.tx.evidence.submitEvidence(hashBytes, cidBytes);

    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(
          account.address,
          { signer: injector.signer },
          ({ status, events }) => {
            if (status.isInBlock) {
              console.log(`✅ Included in block: ${status.asInBlock.toHex()}`);
              resolve({
                blockHash: status.asInBlock.toHex(),
                txHash: extrinsic.hash.toHex(),
                fileHash: fileHash,
                ipfsCID: cid,
                merkleRoot: root,
              });
            } else if (status.isFinalized) {
              console.log(`🔒 Block Finalized: ${status.asFinalized.toHex()}`);
            }
          }
        )
        .catch(reject);
    });
  }

  public async disconnect() {
    if (this.api) {
      await this.api.disconnect();
    }
  }
}
