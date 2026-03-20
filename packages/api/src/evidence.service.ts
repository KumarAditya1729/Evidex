import { z } from "zod";
import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import {
  createEvidenceRecord,
  findEvidenceByHash,
  getOrCreateUser,
  type Prisma
} from "@evidex/database";
import { uploadBufferToIPFS, uploadFileStreamToIPFS } from "@evidex/storage";
import { publishEvidenceEvent } from "./queue";
import { assertRateLimit } from "./rate-limit";
import { sha256Hex } from "./hash";
import { parseChain, toPrismaChain } from "./chains";

const evidenceUploadInputSchema = z.object({
  walletAddress: z.string().min(1),
  chain: z.string().min(1).optional(),
  filename: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  content: z.instanceof(Buffer).optional(),
  filePath: z.string().optional(),
  hash: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).refine(data => data.content !== undefined || (data.filePath !== undefined && data.hash !== undefined), {
  message: "Must provide either Buffer content, or filePath + hash for streaming."
});

export async function processEvidenceUpload(rawInput: z.input<typeof evidenceUploadInputSchema>) {
  const input = evidenceUploadInputSchema.parse(rawInput);
  const chain = parseChain(input.chain);
  const hash = input.hash || sha256Hex(input.content!);

  await assertRateLimit({
    key: `upload:${input.walletAddress.toLowerCase()}`,
    limit: 20,
    windowSeconds: 60
  });

  const user = await getOrCreateUser(input.walletAddress);
  const prismaChain = toPrismaChain(chain);

  const duplicate = await findEvidenceByHash(hash, prismaChain, user.id);
  if (duplicate) {
    return {
      duplicate: true,
      evidence: duplicate
    };
  }

  const ipfsResult = input.filePath
    ? await uploadFileStreamToIPFS({
        filename: input.filename,
        filePath: input.filePath,
        contentType: input.mimeType,
        metadata: { walletAddress: user.walletAddress, chain, sha256Hash: hash }
      })
    : await uploadBufferToIPFS({
        filename: input.filename,
        content: input.content!,
        contentType: input.mimeType,
        metadata: { walletAddress: user.walletAddress, chain, sha256Hash: hash }
      });

  const blockchainService = await createBlockchainServiceFromEnv();
  const anchorReceipt = await blockchainService.anchorEvidence(chain, {
    hashHex: hash,
    ipfsCID: ipfsResult.cid,
    walletAddress: user.walletAddress
  });

  const evidence = await createEvidenceRecord({
    userId: user.id,
    originalFilename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: BigInt(input.content ? input.content.length : ipfsResult.size),
    sha256Hash: hash,
    ipfsCID: ipfsResult.cid,
    chain: prismaChain,
    txHash: anchorReceipt.txHash,
    chainTimestamp: anchorReceipt.timestamp,
    explorerUrl: anchorReceipt.explorerUrl,
    metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
  });

  await publishEvidenceEvent({
    type: "evidence.anchored",
    evidenceId: evidence.id,
    walletAddress: user.walletAddress,
    chain,
    txHash: anchorReceipt.txHash,
    hash,
    createdAt: new Date().toISOString()
  });

  return {
    duplicate: false,
    evidence
  };
}

export async function getConfiguredChains() {
  const blockchainService = await createBlockchainServiceFromEnv();
  return blockchainService.getSupportedChains();
}
