import axios from "axios";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { blake2AsHex } from "@polkadot/util-crypto";
import type { BlockchainAdapter } from "./base";
import type {
  AdapterUserEvidence,
  AnchorPayload,
  AnchorReceipt,
  ChainTransactionDetails,
  VerificationResult,
  VerifyPayload
} from "../types";

interface PolkadotAdapterConfig {
  wsUrl: string;
  mnemonic: string;
  subscanApiKey?: string;
  scanApiUrl?: string;
  explorerBaseUrl: string;
  remarkPrefix?: string;
  usePallet?: boolean;
  palletName?: string;
  submitExtrinsic?: string;
  enableRemarkFallback?: boolean;
}

export class AnchoringError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, details?: Record<string, unknown>, message?: string) {
    super(message || code);
    this.name = "AnchoringError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AnchoringError.prototype);
  }
}

interface SubscanResponse {
  data?: {
    hash?: string;
    block_num?: number;
    block_timestamp?: number;
    account_display?: {
      address?: string;
    };
    call_module?: string;
    call_module_function?: string;
    success?: boolean;
    params?: Array<{
      name?: string;
      value?: string;
    }>;
  };
}

interface PinnedEvidence {
  owner?: string;
  ipfsCID?: string;
  blockNumber?: number;
  timestamp?: number;
}

export class PolkadotEvidenceAdapter implements BlockchainAdapter {
  readonly chain = "polkadot" as const;

  private readonly wsUrl: string;
  private readonly mnemonic: string;
  private readonly subscanApiKey?: string;
  private readonly scanApiUrl: string;
  private readonly explorerBaseUrl: string;
  private readonly remarkPrefix: string;
  private readonly usePallet: boolean;
  private readonly palletName: string;
  private readonly submitExtrinsic: string;
  private readonly enableRemarkFallback: boolean;

  constructor(config: PolkadotAdapterConfig) {
    this.wsUrl = config.wsUrl;
    this.mnemonic = config.mnemonic;
    this.subscanApiKey = config.subscanApiKey;
    this.scanApiUrl = config.scanApiUrl ?? "https://polkadot.api.subscan.io/api/v2/scan/extrinsic";
    this.explorerBaseUrl = config.explorerBaseUrl;
    this.remarkPrefix = config.remarkPrefix ?? "EVIDEX";
    this.usePallet = config.usePallet ?? true;
    this.palletName = config.palletName ?? "evidence";
    this.submitExtrinsic = config.submitExtrinsic ?? "submitEvidence";
    this.enableRemarkFallback = config.enableRemarkFallback ?? true;
  }

  async anchorEvidence(payload: AnchorPayload): Promise<AnchorReceipt> {
    const api = await this.createApi();
    const keyring = new Keyring({ type: "sr25519" });
    const signer = keyring.addFromUri(this.mnemonic);

    const hashHex = normalizeHash(payload.hashHex);
    const tx = this.buildAnchorExtrinsic(api, hashHex, payload.ipfsCID);

    // ==========================================
    // Pre-flight Validation: Check Balance & Fees
    // ==========================================
    const accountInfo = await api.query.system.account(signer.address);
    const freeBalance = (accountInfo as any).data.free.toBigInt();

    // If balance is exactly 0, even fee estimation (paymentInfo) will throw a 1010 RPC error
    if (freeBalance === 0n) {
      await api.disconnect();
      throw new AnchoringError("INSUFFICIENT_FUNDS", {
        requiredFee: "Unknown",
        currentBalance: "0",
        address: signer.address,
        chain: this.chain
      }, "Account balance is absolute zero. Cannot pay for transaction fees.");
    }

    let estimatedFee = 0n;
    try {
      const paymentInfo = await tx.paymentInfo(signer);
      estimatedFee = paymentInfo.partialFee.toBigInt();
    } catch (error: any) {
      if (error?.message?.includes("1010") || error?.message?.includes("Inability to pay some fees")) {
        await api.disconnect();
        throw new AnchoringError("INSUFFICIENT_FUNDS", {
          requiredFee: "Unknown",
          currentBalance: freeBalance.toString(),
          address: signer.address,
          chain: this.chain
        }, "Account balance is too low to even simulate the transaction fee.");
      }
      throw error;
    }

    if (freeBalance < estimatedFee) {
      await api.disconnect();
      throw new AnchoringError("INSUFFICIENT_FUNDS", {
        requiredFee: estimatedFee.toString(),
        currentBalance: freeBalance.toString(),
        address: signer.address,
        chain: this.chain
      }, "Insufficient native balance to pay for transaction fees.");
    }
    // ==========================================

    let txHash = tx.hash.toHex();
    let finalizedBlockHash: string | undefined;
    let blockNumber: number | undefined;
    let chainTimestamp = Math.floor(Date.now() / 1000);

    await Promise.race([
      new Promise<void>((resolve, reject) => {
        let unsub: (() => void) | undefined;
        tx.signAndSend(signer, (result) => {
          txHash = result.txHash.toHex();

          if (result.dispatchError) {
            if (unsub) unsub();
            reject(new Error(result.dispatchError.toString()));
            return;
          }

          if (result.status.isFinalized) {
            finalizedBlockHash = result.status.asFinalized.toHex();
            if (unsub) unsub();
            resolve();
          }
        })
          .then((u) => {
            unsub = u;
          })
          .catch(reject);
      }),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Transaction timed out waiting for finalization on the blockchain (60s).")), 60000)
      )
    ]);

    if (finalizedBlockHash) {
      const header = await api.rpc.chain.getHeader(finalizedBlockHash);
      blockNumber = header.number.toNumber();
      const timestampEntry = (api.query as Record<string, unknown>).timestamp as
        | { now?: { at?: (hash: string) => Promise<{ toString(): string }> } }
        | undefined;
      const at = timestampEntry?.now?.at;
      if (at) {
        const chainMoment = await at(finalizedBlockHash);
        const millis = Number(chainMoment.toString());
        if (Number.isFinite(millis) && millis > 0) {
          chainTimestamp = Math.floor(millis / 1000);
        }
      }
    }

    await api.disconnect();

    return {
      chain: this.chain,
      txHash,
      timestamp: chainTimestamp,
      blockNumber,
      explorerUrl: `${this.explorerBaseUrl}${txHash}`
    };
  }

  async verifyEvidence(payload: VerifyPayload): Promise<VerificationResult> {
    const hashHex = normalizeHash(payload.hashHex);

    if (this.usePallet) {
      const pinned = await this.findEvidenceOnChain(hashHex);
      if (pinned) {
        return {
          chain: this.chain,
          exists: true,
          owner: pinned.owner,
          ipfsCID: pinned.ipfsCID,
          timestamp: pinned.timestamp
        };
      }
    }

    if (!payload.chainTxHash) {
      return {
        chain: this.chain,
        exists: false
      };
    }

    const response = await this.fetchSubscanExtrinsic(payload.chainTxHash);
    const remarkParam = response.data?.params?.find((param) => param.name === "remark");
    const expected = hashHex.toLowerCase();
    const rawRemark = decodeSubscanValue(remarkParam?.value ?? "").toLowerCase();
    const containsHash = rawRemark.includes(expected);

    return {
      chain: this.chain,
      exists: containsHash,
      txHash: response.data?.hash,
      timestamp: response.data?.block_timestamp
    };
  }

  async getUserEvidence(_walletAddress: string): Promise<AdapterUserEvidence[]> {
    // For production usage, integrate indexer pagination by account or project indexer.
    return [];
  }

  async getTransactionDetails(txHash: string): Promise<ChainTransactionDetails | null> {
    try {
      const response = await this.fetchSubscanExtrinsic(txHash);
      if (!response.data?.hash) {
        return null;
      }

      const remarkParam = response.data.params?.find((param) => param.name === "remark");
      const remark = remarkParam?.value ? decodeSubscanValue(remarkParam.value) : undefined;

      return {
        chain: this.chain,
        txHash: response.data.hash,
        blockNumber: response.data.block_num,
        timestamp: response.data.block_timestamp,
        explorerUrl: `${this.explorerBaseUrl}${response.data.hash}`,
        success: response.data.success,
        signer: response.data.account_display?.address,
        section: response.data.call_module,
        method: response.data.call_module_function,
        remark
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return null;
      }
      throw error;
    }
  }

  private async createApi(): Promise<ApiPromise> {
    const provider = new WsProvider(this.wsUrl);
    
    // Vercel serverless functions will hang indefinitely if WsProvider tries to reconnect to an unreachable node (like localhost)
    return Promise.race([
      ApiPromise.create({ provider }),
      new Promise<ApiPromise>((_, reject) =>
        setTimeout(() => {
          provider.disconnect().catch(() => {});
          reject(new Error(`Failed to connect to Polkadot Node at ${this.wsUrl} within 10 seconds. Please check your POLKADOT_WS_URL.`));
        }, 10000)
      )
    ]);
  }

  private async fetchSubscanExtrinsic(txHash: string): Promise<SubscanResponse> {
    const response = await axios.post<SubscanResponse>(
      this.scanApiUrl,
      { hash: txHash },
      {
        headers: {
          "Content-Type": "application/json",
          ...(this.subscanApiKey ? { "X-API-Key": this.subscanApiKey } : {})
        }
      }
    );

    return response.data;
  }

  private buildAnchorExtrinsic(api: ApiPromise, hashHex: string, ipfsCID: string) {
    if (this.usePallet) {
      const pallet = (api.tx as Record<string, unknown>)[this.palletName] as
        | Record<string, (...args: unknown[]) => unknown>
        | undefined;
      const submitMethod =
        pallet?.[this.submitExtrinsic] ??
        pallet?.submitEvidence ??
        pallet?.registerEvidence;

      if (typeof submitMethod === "function") {
        const hashUtf8 = Array.from(Buffer.from(hashHex, "utf8"));
        const cidUtf8 = Array.from(Buffer.from(ipfsCID, "utf8"));
        const tx = submitMethod(hashUtf8, cidUtf8);
        return tx as {
          hash: { toHex(): string };
          paymentInfo: (signer: unknown) => Promise<{ partialFee: { toBigInt(): bigint } }>;
          signAndSend: (
            signer: unknown,
            callback: (result: {
              txHash: { toHex(): string };
              status: { isFinalized: boolean; asFinalized: { toHex(): string } };
              dispatchError?: { toString(): string };
            }) => void
          ) => Promise<() => void>;
        };
      }
    }

    if (!this.enableRemarkFallback) {
      throw new Error(
        `Pallet extrinsic not found at api.tx.${this.palletName}.${this.submitExtrinsic} and remark fallback is disabled.`
      );
    }

    const remark = `${this.remarkPrefix}:${hashHex}:${ipfsCID}`;
    const tx = api.tx.system.remarkWithEvent(remark);
    return tx as {
      hash: { toHex(): string };
      paymentInfo: (signer: unknown) => Promise<{ partialFee: { toBigInt(): bigint } }>;
      signAndSend: (
        signer: unknown,
        callback: (result: {
          txHash: { toHex(): string };
          status: { isFinalized: boolean; asFinalized: { toHex(): string } };
          dispatchError?: { toString(): string };
        }) => void
      ) => Promise<() => void>;
    };
  }

  private async findEvidenceOnChain(hashHex: string): Promise<PinnedEvidence | null> {
    const api = await this.createApi();

    try {
      const palletQuery = (api.query as Record<string, unknown>)[this.palletName] as
        | Record<string, (key: string) => Promise<unknown>>
        | undefined;
      const evidences = palletQuery?.evidences;
      if (typeof evidences !== "function") {
        return null;
      }

      const evidenceId = blake2AsHex(Buffer.from(hashHex, "utf8"), 256);
      const maybeRecord = await evidences(evidenceId);

      if (!isSomeCodec(maybeRecord)) {
        return null;
      }

      const record = maybeRecord.unwrap();
      const owner = safeToString((record as Record<string, unknown>).owner);
      const ipfsCID = decodeCodecBytes((record as Record<string, unknown>).ipfsCid);
      const blockNumber = codecToNumber((record as Record<string, unknown>).submittedAt);
      const timestamp = blockNumber
        ? await this.getBlockTimestampByNumber(api, blockNumber)
        : undefined;

      return {
        owner,
        ipfsCID,
        blockNumber,
        timestamp
      };
    } finally {
      await api.disconnect();
    }
  }

  private async getBlockTimestampByNumber(api: ApiPromise, blockNumber: number): Promise<number | undefined> {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const timestampEntry = (api.query as Record<string, unknown>).timestamp as
      | { now?: { at?: (hash: unknown) => Promise<{ toString(): string }> } }
      | undefined;
    const at = timestampEntry?.now?.at;
    if (!at) {
      return undefined;
    }

    const moment = await at(blockHash);
    const millis = Number(moment.toString());
    if (!Number.isFinite(millis) || millis <= 0) {
      return undefined;
    }

    return Math.floor(millis / 1000);
  }
}

function normalizeHash(hashHex: string): string {
  const normalized = hashHex.replace(/^0x/, "");
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("Invalid SHA256 hash. Expected 64 hex chars.");
  }

  return normalized;
}

function decodeSubscanValue(value: string): string {
  if (value.startsWith("0x")) {
    return Buffer.from(value.slice(2), "hex").toString("utf8");
  }

  return value;
}

function isSomeCodec(value: unknown): value is { isSome: boolean; unwrap(): unknown } {
  if (!value || typeof value !== "object") {
    return false;
  }

  return "isSome" in value && (value as { isSome: boolean }).isSome && "unwrap" in value;
}

function safeToString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "toString" in value && typeof value.toString === "function") {
    return value.toString();
  }

  return undefined;
}

function decodeCodecBytes(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "toU8a" in value && typeof value.toU8a === "function") {
    return Buffer.from((value as { toU8a(): Uint8Array }).toU8a()).toString("utf8");
  }

  return safeToString(value);
}

function codecToNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return (value as { toNumber(): number }).toNumber();
  }

  const parsed = Number(safeToString(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}
