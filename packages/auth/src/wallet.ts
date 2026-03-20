import { recoverMessageAddress } from "viem";
import { extractExpiry, extractNonce } from "./challenge";

export async function verifyWalletSignature(input: {
  walletAddress: string;
  message: string;
  signature: string;
  expectedNonce: string;
}): Promise<boolean> {
  const nonce = extractNonce(input.message);
  if (!nonce || nonce !== input.expectedNonce) {
    return false;
  }

  const expiry = extractExpiry(input.message);
  if (!expiry || expiry.getTime() < Date.now()) {
    return false;
  }

  const recovered = await recoverMessageAddress({
    message: input.message,
    signature: input.signature as `0x${string}`
  });

  return recovered.toLowerCase() === input.walletAddress.toLowerCase();
}
