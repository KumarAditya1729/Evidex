import type {
  AdapterUserEvidence,
  AnchorPayload,
  AnchorReceipt,
  ChainTransactionDetails,
  SupportedChain,
  VerificationResult,
  VerifyPayload
} from "../types";

export interface BlockchainAdapter {
  readonly chain: SupportedChain;
  anchorEvidence(payload: AnchorPayload): Promise<AnchorReceipt>;
  verifyEvidence(payload: VerifyPayload): Promise<VerificationResult>;
  getUserEvidence(walletAddress: string): Promise<AdapterUserEvidence[]>;
  getTransactionDetails(txHash: string): Promise<ChainTransactionDetails | null>;
}
