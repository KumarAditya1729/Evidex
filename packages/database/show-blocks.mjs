// show-blocks.mjs — shows all Evidex anchored blocks from Neon DB
// Run from: packages/database/ → node show-blocks.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const anchors = await prisma.anchor.findMany({
    include: {
      evidence: {
        include: { user: true }
      }
    },
    orderBy: { anchoredAt: "desc" }
  });

  if (anchors.length === 0) {
    console.log("\n  No blocks found yet. Upload some evidence first!\n");
    return;
  }

  console.log(`\n${"═".repeat(100)}`);
  console.log(`  🔗 EVIDEX — ALL ANCHORED BLOCKS  (${anchors.length} total)`);
  console.log(`${"═".repeat(100)}\n`);

  for (const a of anchors) {
    const e = a.evidence;
    const u = e.user;
    console.log(`  📦 ${e.originalFilename}`);
    console.log(`     Chain      : ${a.chain}`);
    console.log(`     Tx Hash    : ${a.txHash}`);
    console.log(`     Anchored   : ${new Date(a.anchoredAt).toLocaleString()}`);
    console.log(`     SHA-256    : ${e.sha256Hash}`);
    console.log(`     IPFS CID   : ${e.ipfsCID}`);
    console.log(`     Owner      : ${u.walletAddress} (${u.role})`);
    if (a.explorerUrl) console.log(`     Explorer   : ${a.explorerUrl}`);
    console.log(`     ${"─".repeat(90)}`);
  }

  console.log(`\n  ✅  ${anchors.length} block(s) anchored across all chains.\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
