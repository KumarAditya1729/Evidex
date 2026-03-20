export type SupportedChain = 
  // EVM Chains
  | "ethereum" | "ethereum-sepolia" | "ethereum-goerli" | "ethereum-holesky"
  | "polygon" | "polygon-mumbai" | "polygon-amoy"
  | "bsc" | "bsc-testnet" | "opbnb" | "opbnb-testnet"
  | "arbitrum" | "arbitrum-sepolia" | "arbitrum-goerli"
  | "optimism" | "optimism-sepolia" | "optimism-goerli"
  | "avalanche" | "avalanche-fuji"
  | "fantom" | "fantom-testnet"
  | "cronos" | "cronos-testnet"
  | "celo" | "celo-alfajores" | "celo-baklava"
  | "aurora" | "aurora-testnet"
  | "harmony" | "harmony-testnet"
  | "heco" | "heco-testnet"
  | "moonbeam" | "moonriver" | "moonbase"
  | "kcc" | "kcc-testnet"
  | "canto" | "canto-testnet"
  | "gnosis" | "gnosis-chiado"
  | "base" | "base-sepolia" | "base-goerli"
  | "zksync" | "zksync-testnet"
  | "linea" | "linea-testnet"
  | "scroll" | "scroll-sepolia"
  | "mantle" | "mantle-testnet"
  | "blast" | "blast-sepolia"
  | "mode" | "mode-testnet"
  | "sei" | "sei-testnet"
  
  // Bitcoin-like Chains
  | "bitcoin" | "bitcoin-testnet" | "bitcoin-regtest"
  | "bitcoin-cash" | "bitcoin-cash-testnet"
  | "litecoin" | "litecoin-testnet"
  | "dogecoin" | "dogecoin-testnet"
  | "dash" | "dash-testnet"
  | "zcash" | "zcash-testnet"
  
  // Substrate Chains
  | "polkadot" | "polkadot-westend" | "polkadot-rococo"
  | "kusama" | "kusama-westend"
  | "moonbeam" | "moonriver" | "moonbase"
  | "acala" | "acala-mandala"
  | "karura" | "karura-testnet"
  | "parallel" | "parallel-heiko"
  | "astar" | "astar-shiden"
  | "shiden" | "shiden-testnet"
  | "centrifuge" | "centrifuge-altair"
  | "equilibrium" | "equilibrium-testnet"
  | "sora" | "sora-testnet"
  | "kilt" | "kilt-peregrine"
  | "unique" | "unique-testnet"
  | "quartz" | "quartz-testnet"
  | "varaverse" | "varaverse-testnet"
  
  // Custom Chains
  | "custom-1" | "custom-2" | "custom-3";

export interface AnchorPayload {
  hashHex: string;
  ipfsCID: string;
  walletAddress: string;
}

export interface AnchorReceipt {
  chain: SupportedChain;
  txHash: string;
  timestamp: number;
  blockNumber?: number;
  explorerUrl?: string;
}

export interface VerifyPayload {
  hashHex: string;
  walletAddress?: string;
  chainTxHash?: string;
}

export interface VerificationResult {
  chain: SupportedChain;
  exists: boolean;
  owner?: string;
  timestamp?: number;
  ipfsCID?: string;
  txHash?: string;
}

export interface AdapterUserEvidence {
  hashHex: string;
  txHash?: string;
  timestamp?: number;
  ipfsCID?: string;
}

export interface ChainTransactionDetails {
  chain: SupportedChain;
  txHash: string;
  blockNumber?: number;
  timestamp?: number;
  explorerUrl?: string;
  success?: boolean;
  signer?: string;
  section?: string;
  method?: string;
  remark?: string;
}
