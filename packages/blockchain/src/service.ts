import type { BlockchainAdapter } from "./adapters/base";
import type {
  AdapterUserEvidence,
  AnchorPayload,
  AnchorReceipt,
  ChainTransactionDetails,
  SupportedChain,
  VerificationResult,
  VerifyPayload
} from "./types";

interface BlockchainServiceOptions {
  adapters: Partial<Record<SupportedChain, BlockchainAdapter>>;
}

export interface MultiChainAnchorResult {
  chain: SupportedChain;
  receipt: AnchorReceipt;
}

export interface MultiChainAnchorFailure {
  chain: SupportedChain;
  error: string;
}

export class BlockchainService {
  private readonly adapters: Partial<Record<SupportedChain, BlockchainAdapter>>;

  constructor(options: BlockchainServiceOptions) {
    this.adapters = options.adapters;
  }

  getSupportedChains(): SupportedChain[] {
    return Object.keys(this.adapters) as SupportedChain[];
  }

  async anchorEvidence(chain: SupportedChain, payload: AnchorPayload): Promise<AnchorReceipt> {
    const adapter = this.getAdapter(chain);
    return adapter.anchorEvidence(payload);
  }

  /**
   * Anchors evidence on ALL configured chains simultaneously.
   * Uses Promise.allSettled so a failure on one chain does not block others.
   */
  async anchorEvidenceOnAllChains(payload: AnchorPayload): Promise<{
    successes: MultiChainAnchorResult[];
    failures: MultiChainAnchorFailure[];
  }> {
    const chains = this.getSupportedChains();

    const results = await Promise.allSettled(
      chains.map(async (chain) => {
        const receipt = await this.anchorEvidence(chain, payload);
        return { chain, receipt } as MultiChainAnchorResult;
      })
    );

    const successes: MultiChainAnchorResult[] = [];
    const failures: MultiChainAnchorFailure[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const chain = chains[i];
      if (result.status === "fulfilled") {
        successes.push(result.value);
      } else {
        failures.push({
          chain,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        });
      }
    }

    return { successes, failures };
  }

  async verifyEvidence(chain: SupportedChain, payload: VerifyPayload): Promise<VerificationResult> {
    const adapter = this.getAdapter(chain);
    return adapter.verifyEvidence(payload);
  }

  async getUserEvidence(chain: SupportedChain, walletAddress: string): Promise<AdapterUserEvidence[]> {
    const adapter = this.getAdapter(chain);
    return adapter.getUserEvidence(walletAddress);
  }

  async getTransactionDetails(
    chain: SupportedChain,
    txHash: string
  ): Promise<ChainTransactionDetails | null> {
    const adapter = this.getAdapter(chain);
    return adapter.getTransactionDetails(txHash);
  }

  private getAdapter(chain: SupportedChain): BlockchainAdapter {
    const adapter = this.adapters[chain];
    if (!adapter) {
      throw new Error(`Chain adapter not configured for ${chain}.`);
    }
    return adapter;
  }
}

let blockchainServicePromise: Promise<BlockchainService> | null = null;

export async function createBlockchainServiceFromEnv(): Promise<BlockchainService> {
  if (blockchainServicePromise) {
    return blockchainServicePromise;
  }

  blockchainServicePromise = buildBlockchainServiceFromEnv().catch(err => {
    blockchainServicePromise = null;
    throw err;
  });
  return blockchainServicePromise;
}

async function buildBlockchainServiceFromEnv(): Promise<BlockchainService> {
  const adapters: Partial<Record<SupportedChain, BlockchainAdapter>> = {};

  const wsUrl = process.env.POLKADOT_WS_URL;
  const mnemonic = process.env.POLKADOT_MNEMONIC;
  if (!wsUrl || !mnemonic) {
    throw new Error("Polkadot-only mode is enabled. Set POLKADOT_WS_URL and POLKADOT_MNEMONIC.");
  }

  const { PolkadotEvidenceAdapter } = await import("./adapters/polkadot.adapter");
  adapters.polkadot = new PolkadotEvidenceAdapter({
    wsUrl,
    mnemonic,
    subscanApiKey: process.env.SUBSCAN_API_KEY,
    scanApiUrl: process.env.POLKADOT_SCAN_API_URL,
    explorerBaseUrl: process.env.POLKADOT_EXPLORER_BASE_URL ?? "https://polkadot.subscan.io/extrinsic/",
    remarkPrefix: process.env.POLKADOT_REMARK_PREFIX ?? "EVIDEX",
    usePallet: process.env.POLKADOT_USE_PALLET !== "false",
    palletName: process.env.POLKADOT_PALLET_NAME ?? "evidence",
    submitExtrinsic: process.env.POLKADOT_SUBMIT_EXTRINSIC ?? "submitEvidence",
    enableRemarkFallback: process.env.POLKADOT_ENABLE_REMARK_FALLBACK !== "false"
  });

  // Optional: Ethereum Sepolia adapter — only registered when private key is provided
  const evmPrivateKey = process.env.EVM_PRIVATE_KEY;
  const sepoliaRpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
  const sepoliaContractAddress = process.env.ETHEREUM_SEPOLIA_CONTRACT_ADDRESS;
  if (evmPrivateKey && sepoliaRpcUrl && sepoliaContractAddress) {
    const { EvmEvidenceAdapter } = await import("./adapters/evm.adapter");
    adapters["ethereum-sepolia" as SupportedChain] = new EvmEvidenceAdapter({
      chain: "ethereum" as any,
      rpcUrl: sepoliaRpcUrl,
      contractAddress: sepoliaContractAddress,
      privateKey: evmPrivateKey,
      explorerBaseUrl: "https://sepolia.etherscan.io/tx/"
    });
    console.log("[EVIDEX] Ethereum Sepolia adapter registered for multi-chain anchoring.");
  }

  return new BlockchainService({ adapters });
}
