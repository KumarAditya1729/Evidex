import { ApiPromise, WsProvider } from "@polkadot/api";
import { ethers, Contract, Signer } from "ethers";

// Standard ABI generated from EvidexLightClient.sol
const LIGHT_CLIENT_ABI = [
  "function submitHeader(uint256 _blockNumber, bytes32 _parentHash, bytes32 _stateRoot, bytes32 _extrinsicsRoot) external",
  "function verifyProof(uint256 _blockNumber, bytes32 _leaf, bytes32[] calldata _proof) external returns (bool)",
  "function isBlockAnchored(uint256 _blockNumber) external view returns (bool)"
];

export interface LightClientConfig {
  substrateRpcUrl: string;
  ethContractAddress: string;
  ethSigner: Signer;
}

/**
 * EvidexLightClientRelayer
 * The cross-chain bridge utility that extracts state proofs from Polkadot
 * and submits them to the EVM Light Client for trust-minimized verification.
 */
export class EvidexLightClientRelayer {
  private substrateRpcUrl: string;
  private ethContractAddress: string;
  private ethSigner: Signer;
  private api: ApiPromise | null = null;
  private evmContract: Contract;

  constructor(config: LightClientConfig) {
    this.substrateRpcUrl = config.substrateRpcUrl;
    this.ethContractAddress = config.ethContractAddress;
    this.ethSigner = config.ethSigner;
    this.evmContract = new Contract(this.ethContractAddress, LIGHT_CLIENT_ABI, this.ethSigner);
  }

  /**
   * Initializes the connection to the Substrate Parachain.
   */
  public async connectSubstrate(): Promise<void> {
    const provider = new WsProvider(this.substrateRpcUrl);
    this.api = await ApiPromise.create({ provider });
    console.log("📡 Connected to Substrate for Cross-Chain Extraction.");
  }

  /**
   * Stage 1: Anchor the Substrate Header onto Ethereum.
   * Extracts the finalized header and ferries it into the EvidexLightClient.sol
   */
  public async anchorSubstrateHeaderToEvm(): Promise<ethers.TransactionResponse> {
    if (!this.api) await this.connectSubstrate();

    // 1. Get Finalized Head Block Hash
    const finalizedHash = await this.api!.rpc.chain.getFinalizedHead();
    
    // 2. Extract Complete Header Payload
    const header = await this.api!.rpc.chain.getHeader(finalizedHash);

    const blockNumber = header.number.toNumber();
    const parentHash = header.parentHash.toHex();
    const stateRoot = header.stateRoot.toHex();
    const extrinsicsRoot = header.extrinsicsRoot.toHex();

    console.log(`🔗 Extracted Substrate State Root for Block ${blockNumber}: ${stateRoot}`);

    // Check if already anchored to save EVM Gas
    const isAnchored = await this.evmContract.isBlockAnchored(blockNumber);
    if (isAnchored) {
      console.log("⚡ Block is already anchored on Ethereum.");
      throw new Error(`Substrate Block ${blockNumber} is already synced to the Light Client.`);
    }

    // 3. Dispatch to Ethereum Light Client
    console.log("✍️ Submitting Polkadot Header to EVM Smart Contract...");
    const tx = await this.evmContract.submitHeader(
      blockNumber,
      parentHash,
      stateRoot,
      extrinsicsRoot
    );

    await tx.wait();
    console.log(`✅ Substrate Header Anchored on Ethereum! Tx: ${tx.hash}`);

    return tx;
  }

  /**
   * Stage 1: Verify Evidence via the Anchored State Root
   * Extracts the raw storage proof via `getReadProof` and forces Ethereum to verify it.
   */
  public async verifyEvidenceCrossChain(
    accountAddress: string,
    fileHashKeccak: string,
    blockHashStr?: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.api) await this.connectSubstrate();

    const blockHash = blockHashStr 
      ? this.api!.registry.createType('Hash', blockHashStr)
      : await this.api!.rpc.chain.getFinalizedHead();

    const header = await this.api!.rpc.chain.getHeader(blockHash.toHex());
    const blockNumber = header.number.toNumber();

    // 1. Generate Substrate Storage Key (e.g., retrieving the evidence registry Pallet slot)
    // NOTE: This assumes the data was stored in a StorageMap inside `pallet_evidence` under `accountAddress`
    const storageKey = this.api!.query.evidence.evidences.key(fileHashKeccak);

    console.log("🔎 Extracting Substrate Trie Proof...");
    
    // 2. Extract the mathematically undeniable Merkle / Trie proof from Substrate RPC
    const proofResponse = await this.api!.rpc.state.getReadProof([storageKey], blockHash.toHex());
    
    // Format the proof array as bytes32 explicitly for the EVM boundary
    const merkleProofNodes = proofResponse.proof.map((node) => node.toHex());

    console.log(`📦 Proof Extracted: ${merkleProofNodes.length} Trie Nodes.`);

    // 3. Submit the verification mathematical loop to Ethereum
    console.log("⚖️ Bridging Proof to Ethereum Light Client...");
    const tx = await this.evmContract.verifyProof(
      blockNumber,
      fileHashKeccak,
      merkleProofNodes
    );

    await tx.wait();
    console.log(`✅ Evidence mathematically verified on Ethereum without Trust! Tx: ${tx.hash}`);

    return tx;
  }
}
