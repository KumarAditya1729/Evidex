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

export class EnhancedBlockchainService {
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

let enhancedBlockchainServicePromise: Promise<EnhancedBlockchainService> | null = null;

export async function createEnhancedBlockchainServiceFromEnv(): Promise<EnhancedBlockchainService> {
  if (enhancedBlockchainServicePromise) {
    return enhancedBlockchainServicePromise;
  }

  enhancedBlockchainServicePromise = buildEnhancedBlockchainServiceFromEnv();
  return enhancedBlockchainServicePromise;
}

async function buildEnhancedBlockchainServiceFromEnv(): Promise<EnhancedBlockchainService> {
  const adapters: Partial<Record<SupportedChain, BlockchainAdapter>> = {};

  // 🟢 ETHEREUM CONFIGURATION
  const ethereumRpcUrl = process.env.ETHEREUM_RPC_URL;
  const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY;
  if (ethereumRpcUrl && ethereumPrivateKey) {
    const { EvmEvidenceAdapter } = await import("./adapters/evm.adapter");
    adapters.ethereum = new EvmEvidenceAdapter({
      rpcUrl: ethereumRpcUrl,
      backupRpcUrl: process.env.ETHEREUM_BACKUP_RPC_URL,
      privateKey: ethereumPrivateKey,
      chainId: 1,
      name: "Ethereum Mainnet",
      explorerUrl: "https://etherscan.io/tx/"
    });
  }

  // 🟣 POLYGON CONFIGURATION
  const polygonRpcUrl = process.env.POLYGON_RPC_URL;
  const polygonPrivateKey = process.env.POLYGON_PRIVATE_KEY;
  if (polygonRpcUrl && polygonPrivateKey) {
    const { EvmEvidenceAdapter } = await import("./adapters/evm.adapter");
    adapters.polygon = new EvmEvidenceAdapter({
      rpcUrl: polygonRpcUrl,
      backupRpcUrl: process.env.POLYGON_BACKUP_RPC_URL,
      privateKey: polygonPrivateKey,
      chainId: 137,
      name: "Polygon Mainnet",
      explorerUrl: "https://polygonscan.com/tx/"
    });
  }

  // 🟠 BITCOIN CONFIGURATION
  const bitcoinRpcUrl = process.env.BITCOIN_RPC_URL;
  const bitcoinWif = process.env.BITCOIN_WIF;
  if (bitcoinRpcUrl && bitcoinWif) {
    const { BitcoinEvidenceAdapter } = await import("./adapters/bitcoin.adapter");
    adapters.bitcoin = new BitcoinEvidenceAdapter({
      rpcUrl: bitcoinRpcUrl,
      backupRpcUrl: process.env.BITCOIN_BACKUP_RPC_URL,
      wif: bitcoinWif,
      network: "mainnet",
      explorerUrl: "https://blockstream.info/tx/"
    });
  }

  // 🟣 POLKADOT CONFIGURATION (Audit Logs)
  const polkadotWsUrl = process.env.POLKADOT_WS_URL;
  const polkadotMnemonic = process.env.POLKADOT_MNEMONIC;
  if (polkadotWsUrl && polkadotMnemonic) {
    const { PolkadotEvidenceAdapter } = await import("./adapters/polkadot.adapter");
    adapters.polkadot = new PolkadotEvidenceAdapter({
      wsUrl: polkadotWsUrl,
      mnemonic: polkadotMnemonic,
      subscanApiKey: process.env.SUBSCAN_API_KEY,
      scanApiUrl: process.env.POLKADOT_SCAN_API_URL,
      explorerBaseUrl: process.env.POLKADOT_EXPLORER_BASE_URL ?? "https://polkadot.subscan.io/extrinsic/",
      remarkPrefix: process.env.POLKADOT_REMARK_PREFIX ?? "EVIDEX",
      usePallet: process.env.POLKADOT_USE_PALLET !== "false",
      palletName: process.env.POLKADOT_PALLET_NAME ?? "evidence",
      submitExtrinsic: process.env.POLKADOT_SUBMIT_EXTRINSIC ?? "submitEvidence",
      enableRemarkFallback: process.env.POLKADOT_ENABLE_REMARK_FALLBACK !== "false"
    });
  }

  return new EnhancedBlockchainService({ adapters });
}
