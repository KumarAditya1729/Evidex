import { Chain } from "@evidex/database";
import type { SupportedChain } from "@evidex/blockchain";

export const PRIMARY_CHAIN = "polkadot" as const satisfies SupportedChain;

export function parseChain(chain?: string): SupportedChain {
  const normalized = (chain ?? PRIMARY_CHAIN).toLowerCase();
  if (normalized !== PRIMARY_CHAIN) {
    throw new Error(`Only ${PRIMARY_CHAIN} is enabled in this deployment.`);
  }

  return PRIMARY_CHAIN;
}

export function toPrismaChain(chain: SupportedChain): Chain {
  if (chain !== PRIMARY_CHAIN) {
    throw new Error(`Only ${PRIMARY_CHAIN} is enabled in this deployment.`);
  }

  return Chain.POLKADOT;
}
