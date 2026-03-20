import { z } from "zod";
import { createBlockchainServiceFromEnv } from "@evidex/blockchain";
import {
  createVerificationLog,
  findEvidenceByHash,
  getOrCreateUser,
  type Prisma
} from "@evidex/database";
import { assertRateLimit } from "./rate-limit";
import { parseChain, toPrismaChain } from "./chains";
import { sha256Hex } from "./hash";

const verifyInputSchema = z.object({
  chain: z.string().min(1).optional(),
  walletAddress: z.string().optional(),
  hashHex: z.string().optional(),
  content: z.instanceof(Buffer).optional()
});

export async function verifyEvidence(inputRaw: z.input<typeof verifyInputSchema>) {
  const input = verifyInputSchema.parse(inputRaw);
  const chain = parseChain(input.chain);

  if (!input.hashHex && !input.content) {
    throw new Error("Either hashHex or content must be provided.");
  }

  const hashHex = normalizeHash(input.hashHex ?? sha256Hex(input.content!));

  await assertRateLimit({
    key: `verify:${input.walletAddress ?? "anonymous"}`,
    limit: 60,
    windowSeconds: 60
  });

  const prismaChain = toPrismaChain(chain);
  const evidence = await findEvidenceByHash(hashHex, prismaChain);
  const blockchainService = await createBlockchainServiceFromEnv();

  const chainVerification = await blockchainService.verifyEvidence(chain, {
    hashHex,
    walletAddress: input.walletAddress,
    chainTxHash: evidence?.chainTxHash
  });

  const isValid = Boolean(evidence && chainVerification.exists);

  let userId: string | undefined;
  if (input.walletAddress) {
    const user = await getOrCreateUser(input.walletAddress);
    userId = user.id;
  }

  await createVerificationLog({
    chain: prismaChain,
    hash: hashHex,
    result: isValid,
    evidenceId: evidence?.id,
    userId,
    details: JSON.parse(
      JSON.stringify({
        chainVerification,
        localEvidenceExists: Boolean(evidence)
      })
    ) as Prisma.InputJsonValue
  });

  return {
    hashHex,
    chain,
    isValid,
    evidence,
    chainVerification
  };
}

function normalizeHash(hashHex: string): string {
  const clean = hashHex.replace(/^0x/, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(clean)) {
    throw new Error("Invalid SHA256 hash provided.");
  }

  return clean;
}
