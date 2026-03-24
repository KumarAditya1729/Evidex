import { Chain } from "@evidex/database";
import type { SupportedChain } from "@evidex/blockchain";

// We map known performance metrics to drive the "Smart Routing" protocol
const CHAIN_METRICS = {
  polygon: { costScore: 9, speedScore: 8, securityScore: 6 },
  arbitrum: { costScore: 8, speedScore: 9, securityScore: 7 },
  polkadot: { costScore: 7, speedScore: 7, securityScore: 8 },
  ethereum: { costScore: 2, speedScore: 5, securityScore: 10 },
  bitcoin: { costScore: 1, speedScore: 2, securityScore: 10 }
};

export type RoutingPriority = "cost" | "speed" | "security" | "auto";

export function getAvailableChains(): SupportedChain[] {
  return ["polkadot", "polygon", "polygon-amoy", "ethereum", "ethereum-sepolia", "bitcoin", "arbitrum"];
}

/**
 * 🧠 Core AI-Assisted Routing Heuristic 
 * Selects the optimal chain mathematically based on the user's priority.
 * NOTE: Only Polkadot adapter is currently configured. All priorities route to polkadot.
 */
export function deriveOptimalChain(priority: RoutingPriority = "auto"): SupportedChain {
  // Polkadot is the only fully configured chain adapter in the backend.
  // When additional adapters (polygon, arbitrum, ethereum) are configured
  // via env vars, update this routing logic accordingly.
  return "polkadot";
}

export function parseChain(chainInput?: string, priority: RoutingPriority = "auto"): SupportedChain {
  if (!chainInput || chainInput === "auto") {
    return deriveOptimalChain(priority);
  }

  const normalized = chainInput.toLowerCase();
  const available = getAvailableChains();
  
  if (!available.includes(normalized as SupportedChain)) {
    // If they ask for an unsupported chain, route them to the optimal one instead of failing
    console.warn(`[EVIDEX-ROUTER] Requested chain ${chainInput} unsupported. Auto-routing to optimal chain.`);
    return deriveOptimalChain(priority);
  }

  return normalized as SupportedChain;
}

export function toPrismaChain(chain: SupportedChain | string): Chain {
  const normalized = chain.toLowerCase();
  
  switch (normalized) {
    case "ethereum":
    case "ethereum-sepolia":
    case "ethereum-goerli":
    case "ethereum-holesky":
    case "arbitrum":
    case "arbitrum-sepolia":
    case "optimism":
    case "base":
      return Chain.ETHEREUM;
    case "polygon":
    case "polygon-amoy":
    case "polygon-mumbai":
      return Chain.POLYGON;
    case "bitcoin":
    case "bitcoin-testnet":
      return Chain.BITCOIN;
    case "polkadot":
    case "kusama":
    case "moonbeam":
    default:
      return Chain.POLKADOT;
  }
}
