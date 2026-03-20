import { Chain, EvidenceStatus, Role, type Prisma } from "@prisma/client";
import { prisma } from "./client";

function resolveRoleForWallet(walletAddress: string): Role {
  return process.env.ADMIN_WALLET_ADDRESS?.toLowerCase() === walletAddress.toLowerCase()
    ? Role.ADMIN
    : Role.USER;
}

export async function getOrCreateUser(walletAddress: string) {
  const normalized = walletAddress.toLowerCase();
  const role = resolveRoleForWallet(normalized);

  return prisma.user.upsert({
    where: { walletAddress: normalized },
    update: {},   // never overwrite role on login — only set at creation
    create: {
      walletAddress: normalized,
      role
    }
  });
}

export async function findUserByName(name: string) {
  return prisma.user.findUnique({
    where: {
      name: name.toLowerCase()
    }
  });
}

export async function registerUserCredentials(input: {
  walletAddress: string;
  name: string;
  passwordHash: string;
}) {
  const normalizedWallet = input.walletAddress.toLowerCase();
  const normalizedName = input.name.toLowerCase();
  const roleForWallet = resolveRoleForWallet(normalizedWallet);

  return prisma.$transaction(async (tx) => {
    const existingName = await tx.user.findUnique({
      where: { name: normalizedName }
    });

    if (existingName && existingName.walletAddress !== normalizedWallet) {
      throw new Error("Username is already in use.");
    }

    const existingWallet = await tx.user.findUnique({
      where: { walletAddress: normalizedWallet }
    });

    if (existingWallet) {
      return tx.user.update({
        where: { walletAddress: normalizedWallet },
        data: {
          name: normalizedName,
          passwordHash: input.passwordHash,
          role: roleForWallet === Role.ADMIN ? Role.ADMIN : existingWallet.role
        }
      });
    }

    return tx.user.create({
      data: {
        walletAddress: normalizedWallet,
        name: normalizedName,
        passwordHash: input.passwordHash,
        role: roleForWallet
      }
    });
  }).catch((error) => {
    // Catch unique constraint violations for name/wallet instead of racing with select queries
    if (error.code === "P2002") {
      throw new Error("Username or wallet is already in use.");
    }
    throw error;
  });
}

export async function createEvidenceRecord(input: {
  userId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: bigint;
  sha256Hash: string;
  ipfsCID: string;
  chain: Chain;
  txHash: string;
  chainTimestamp: number;
  explorerUrl?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.evidence.create({
    data: {
      userId: input.userId,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256Hash: input.sha256Hash,
      ipfsCID: input.ipfsCID,
      chain: input.chain,
      chainTxHash: input.txHash,
      chainTimestamp: new Date(input.chainTimestamp * 1000),
      status: EvidenceStatus.ANCHORED,
      metadata: input.metadata,
      anchors: {
        create: {
          chain: input.chain,
          txHash: input.txHash,
          anchoredAt: new Date(input.chainTimestamp * 1000),
          explorerUrl: input.explorerUrl
        }
      }
    },
    include: {
      anchors: true
    }
  });
}

export async function findEvidenceByHash(hash: string, chain: Chain, userId?: string) {
  return prisma.evidence.findFirst({
    where: {
      sha256Hash: hash,
      chain,
      ...(userId ? { userId } : {})
    },

    include: {
      user: true,
      anchors: true
    }
  });
}

export async function listEvidenceByUser(walletAddress: string, options?: { limit?: number; offset?: number }) {
  const limit = Math.min(options?.limit ?? 50, 100);
  const skip = Math.max(options?.offset ?? 0, 0);

  return prisma.evidence.findMany({
    where: {
      user: {
        walletAddress: walletAddress.toLowerCase()
      }
    },
    include: {
      anchors: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit,
    skip
  });
}

export async function getEvidenceById(id: string) {
  return prisma.evidence.findUnique({
    where: { id },
    include: {
      user: true,
      anchors: true
    }
  });
}

export async function listExplorerEvidence(input?: { limit?: number; role?: Role }) {
  const limit = Math.min(input?.limit ?? 50, 100); // hard cap — never exceed 100

  return prisma.evidence.findMany({
    where: input?.role
      ? {
        user: {
          role: input.role
        }
      }
      : undefined,
    include: {
      user: true,
      anchors: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });
}

export async function createVerificationLog(input: {
  chain: Chain;
  hash: string;
  result: boolean;
  evidenceId?: string;
  userId?: string;
  details?: Prisma.InputJsonValue;
}) {
  return prisma.verificationLog.create({
    data: {
      chain: input.chain,
      hash: input.hash,
      result: input.result,
      evidenceId: input.evidenceId,
      userId: input.userId,
      details: input.details
    }
  });
}

// Public compute logic for Admin statistics
export async function getAdminStats() {
  const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase();

  const [userCount, evidenceCount, verifiedCount, failedCount, latestEvidences, myEvidences] = await prisma.$transaction([
    prisma.user.count(),
    prisma.evidence.count(),
    // Use the correct schema properties for verificationLog
    prisma.verificationLog.count({ where: { result: true } }),
    prisma.verificationLog.count({ where: { result: false } }),
    prisma.evidence.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: true }
    }),
    adminWalletAddress
      ? prisma.evidence.findMany({
          where: { user: { walletAddress: adminWalletAddress } },
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 20
        })
      : prisma.evidence.findMany({ take: 0 })
  ]);

  return {
    userCount,
    evidenceCount,
    verifiedCount,
    failedCount,
    latestEvidences,
    myEvidences,
    adminWallet: adminWalletAddress
  };
}
