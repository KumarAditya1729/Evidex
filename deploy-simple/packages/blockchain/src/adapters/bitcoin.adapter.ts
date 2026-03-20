import axios from "axios";
import * as bitcoin from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import * as tinysecp from "tiny-secp256k1";
import type { BlockchainAdapter } from "./base";
import type {
  AdapterUserEvidence,
  AnchorPayload,
  AnchorReceipt,
  ChainTransactionDetails,
  VerificationResult,
  VerifyPayload
} from "../types";

const ECPair = ECPairFactory(tinysecp);

interface BitcoinAdapterConfig {
  baseUrl: string;
  wif: string;
  network: "mainnet" | "testnet";
  explorerBaseUrl: string;
}

interface BitcoinUtxo {
  txid: string;
  vout: number;
  value: number;
}

interface BitcoinTx {
  txid: string;
  status?: {
    block_time?: number;
  };
  vout?: Array<{
    scriptpubkey_type?: string;
    scriptpubkey_asm?: string;
  }>;
}

export class BitcoinEvidenceAdapter implements BlockchainAdapter {
  readonly chain = "bitcoin" as const;

  private readonly baseUrl: string;
  private readonly network: bitcoin.Network;
  private readonly keyPair: ReturnType<typeof ECPair.fromWIF>;
  private readonly address: string;
  private readonly outputScript: Buffer;
  private readonly explorerBaseUrl: string;

  constructor(config: BitcoinAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.network = config.network === "mainnet" ? bitcoin.networks.bitcoin : bitcoin.networks.testnet;
    this.keyPair = ECPair.fromWIF(config.wif, this.network);
    this.explorerBaseUrl = config.explorerBaseUrl;

    const payment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(this.keyPair.publicKey),
      network: this.network
    });

    if (!payment.address || !payment.output) {
      throw new Error("Failed to derive Bitcoin address from WIF key.");
    }

    this.address = payment.address;
    this.outputScript = payment.output;
  }

  async anchorEvidence(payload: AnchorPayload): Promise<AnchorReceipt> {
    const hashBytes = Buffer.from(normalizeHash(payload.hashHex), "hex");
    const utxos = await this.fetchUtxos();

    if (!utxos.length) {
      throw new Error(`No UTXOs available for Bitcoin anchoring address ${this.address}.`);
    }

    const selected = utxos.sort((a, b) => b.value - a.value)[0];
    const feeRate = await this.fetchFeeRate();
    const estimatedVBytes = 190;
    const fee = feeRate * estimatedVBytes;

    if (selected.value <= fee) {
      throw new Error("Selected UTXO does not have enough value to cover fees.");
    }

    const psbt = new bitcoin.Psbt({ network: this.network });

    psbt.addInput({
      hash: selected.txid,
      index: selected.vout,
      witnessUtxo: {
        script: this.outputScript,
        value: selected.value
      }
    });

    const opReturnScript = bitcoin.script.compile([bitcoin.opcodes.OP_RETURN, hashBytes]);

    psbt.addOutput({
      script: opReturnScript,
      value: 0
    });

    const change = selected.value - fee;
    if (change > 546) {
      psbt.addOutput({
        address: this.address,
        value: change
      });
    }

    psbt.signInput(0, this.keyPair);
    psbt.validateSignaturesOfInput(0, (pubkey, msghash, signature) =>
      this.keyPair.verify(msghash, signature)
    );
    psbt.finalizeInput(0);

    const txHex = psbt.extractTransaction().toHex();
    const txHash = await this.broadcastTransaction(txHex);

    return {
      chain: this.chain,
      txHash,
      timestamp: Math.floor(Date.now() / 1000),
      explorerUrl: `${this.explorerBaseUrl}${txHash}`
    };
  }

  async verifyEvidence(payload: VerifyPayload): Promise<VerificationResult> {
    const hashHex = normalizeHash(payload.hashHex).toLowerCase();

    if (payload.chainTxHash) {
      const tx = await this.fetchTransaction(payload.chainTxHash);
      const hasHash = containsOpReturnHash(tx, hashHex);

      return {
        chain: this.chain,
        exists: hasHash,
        txHash: tx.txid,
        timestamp: tx.status?.block_time
      };
    }

    const txs = await this.fetchAddressTransactions();
    const match = txs.find((tx) => containsOpReturnHash(tx, hashHex));

    if (!match) {
      return {
        chain: this.chain,
        exists: false
      };
    }

    return {
      chain: this.chain,
      exists: true,
      txHash: match.txid,
      timestamp: match.status?.block_time
    };
  }

  async getUserEvidence(_walletAddress: string): Promise<AdapterUserEvidence[]> {
    const txs = await this.fetchAddressTransactions();

    const parsed = txs
      .flatMap((tx) => {
        const opReturn = tx.vout?.find((out) => out.scriptpubkey_type === "op_return");
        const encoded = opReturn?.scriptpubkey_asm?.split(" ")[1];
        if (!encoded || encoded.length !== 64) {
          return [];
        }

        return [
          {
            hashHex: encoded,
            txHash: tx.txid,
            timestamp: tx.status?.block_time
          }
        ];
      })
      .slice(0, 100);

    return parsed;
  }

  async getTransactionDetails(txHash: string): Promise<ChainTransactionDetails | null> {
    const tx = await this.fetchTransaction(txHash);
    if (!tx?.txid) {
      return null;
    }

    return {
      chain: this.chain,
      txHash: tx.txid,
      timestamp: tx.status?.block_time,
      explorerUrl: `${this.explorerBaseUrl}${tx.txid}`,
      success: Boolean(tx.status?.block_time)
    };
  }

  private async fetchUtxos(): Promise<BitcoinUtxo[]> {
    const response = await axios.get<BitcoinUtxo[]>(`${this.baseUrl}/address/${this.address}/utxo`);
    return response.data;
  }

  private async fetchFeeRate(): Promise<number> {
    const response = await axios.get<{ fastestFee?: number; halfHourFee?: number }>(
      `${this.baseUrl}/v1/fees/recommended`
    );

    return response.data.halfHourFee ?? response.data.fastestFee ?? 8;
  }

  private async broadcastTransaction(txHex: string): Promise<string> {
    const response = await axios.post<string>(`${this.baseUrl}/tx`, txHex, {
      headers: {
        "Content-Type": "text/plain"
      }
    });

    return response.data;
  }

  private async fetchAddressTransactions(): Promise<BitcoinTx[]> {
    const response = await axios.get<BitcoinTx[]>(`${this.baseUrl}/address/${this.address}/txs`);
    return response.data;
  }

  private async fetchTransaction(txHash: string): Promise<BitcoinTx> {
    const response = await axios.get<BitcoinTx>(`${this.baseUrl}/tx/${txHash}`);
    return response.data;
  }
}

function normalizeHash(hashHex: string): string {
  const normalized = hashHex.replace(/^0x/, "");
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("Invalid SHA256 hash. Expected 64 hex chars.");
  }
  return normalized;
}

function containsOpReturnHash(tx: BitcoinTx, hashHex: string): boolean {
  const outputs = tx.vout ?? [];
  return outputs.some((output) => {
    if (output.scriptpubkey_type !== "op_return" || !output.scriptpubkey_asm) {
      return false;
    }

    const parts = output.scriptpubkey_asm.split(" ");
    const dataHex = parts[1]?.toLowerCase();
    return dataHex === hashHex;
  });
}
