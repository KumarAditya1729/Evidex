-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Chain" AS ENUM ('ETHEREUM', 'POLYGON', 'BITCOIN', 'POLKADOT');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('PENDING', 'ANCHORED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "ipfsCID" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "chainTxHash" TEXT NOT NULL,
    "chainTimestamp" TIMESTAMP(3) NOT NULL,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'ANCHORED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anchor" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "txHash" TEXT NOT NULL,
    "explorerUrl" TEXT,
    "anchoredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anchor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT,
    "userId" TEXT,
    "chain" "Chain" NOT NULL,
    "hash" TEXT NOT NULL,
    "result" BOOLEAN NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Evidence_userId_createdAt_idx" ON "Evidence"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_chain_chainTxHash_idx" ON "Evidence"("chain", "chainTxHash");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_sha256Hash_chain_userId_key" ON "Evidence"("sha256Hash", "chain", "userId");

-- CreateIndex
CREATE INDEX "Anchor_chain_anchoredAt_idx" ON "Anchor"("chain", "anchoredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Anchor_evidenceId_chain_key" ON "Anchor"("evidenceId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "Anchor_chain_txHash_key" ON "Anchor"("chain", "txHash");

-- CreateIndex
CREATE INDEX "VerificationLog_hash_chain_idx" ON "VerificationLog"("hash", "chain");

-- CreateIndex
CREATE INDEX "VerificationLog_createdAt_idx" ON "VerificationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anchor" ADD CONSTRAINT "Anchor_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
