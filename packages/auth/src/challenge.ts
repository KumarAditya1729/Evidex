import { randomBytes } from "crypto";

export interface AuthChallenge {
  nonce: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
}

const CHALLENGE_TTL_SECONDS = 5 * 60;

export function createWalletAuthChallenge(walletAddress: string, domain: string): AuthChallenge {
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_SECONDS * 1000);

  const message = [
    "Evidex Evidence Platform",
    "Sign this message to authenticate your wallet.",
    `Wallet: ${walletAddress.toLowerCase()}`,
    `Domain: ${domain}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expires At: ${expiresAt.toISOString()}`
  ].join("\n");

  return {
    nonce,
    message,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

export function extractNonce(message: string): string | null {
  const match = message.match(/Nonce:\s*([a-fA-F0-9]+)/);
  return match?.[1] ?? null;
}

export function extractExpiry(message: string): Date | null {
  const match = message.match(/Expires At:\s*(.+)/);
  if (!match) {
    return null;
  }

  const expiry = new Date(match[1]);
  return Number.isNaN(expiry.getTime()) ? null : expiry;
}
