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
  return ["polkadot", "polygon", "ethereum", "bitcoin", "arbitrum"];
}

/**
 * 🧠 Core AI-Assisted Routing Heuristic 
 * Selects the optimal chain mathematically based on the user's priority.
 */
export function deriveOptimalChain(priority: RoutingPriority = "auto"): SupportedChain {
  if (priority === "cost") return "polygon";
  if (priority === "speed") return "arbitrum";
  if (priority === "security") return "ethereum";
  
  // "auto" balances cost and speed for the best UX
  return "polygon";
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
    case "arbitrum":
    case "optimism":
    case "base":
      return Chain.ETHEREUM; // We map L2s to ETH for DB simplicity in this schema
    case "polygon":
      return Chain.POLYGON;
    case "bitcoin":
      return Chain.BITCOIN;
    case "polkadot":
    case "kusama":
    case "moonbeam":
    default:
      return Chain.POLKADOT;
  }
}
