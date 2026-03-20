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

  blockchainServicePromise = buildBlockchainServiceFromEnv();
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

  return new BlockchainService({ adapters });
}
