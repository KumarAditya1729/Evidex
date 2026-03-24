import { PrismaClient, Role, Chain, EvidenceStatus } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function generateHash(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function main() {
  const adminWallet = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase() || "0x0000000000000000000000000000000000000000";

  // 1. Create Admin
  await prisma.user.upsert({
    where: { walletAddress: adminWallet },
    update: { role: Role.ADMIN, name: "Admin" },
    create: { walletAddress: adminWallet, role: Role.ADMIN, name: "Admin" }
  });
  console.log(`✅ Admin ensured for wallet ${adminWallet}`);

  // 2. Create 3 Mock Users
  const usersData = [
    { name: "Alice (Polkadot User)", walletAddress: "0x1111111111111111111111111111111111111111" },
    { name: "Bob (Polygon User)", walletAddress: "0x2222222222222222222222222222222222222222" },
    { name: "Charlie (Ethereum User)", walletAddress: "0x3333333333333333333333333333333333333333" }
  ];

  const dbUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { walletAddress: u.walletAddress },
      update: { name: u.name, role: Role.USER },
      create: { walletAddress: u.walletAddress, name: u.name, role: Role.USER }
    });
    dbUsers.push(user);
    console.log(`✅ Student/User ensured: ${u.name} (Login Wallet: ${u.walletAddress})`);
  }

  // 3. Create Evidence & Anchors for each user on different chains
  const evidenceData = [
    {
      user: dbUsers[0],
      chain: Chain.POLKADOT,
      txHash: "0x98a1a9ba23423b49fb9b8f87e5b1285324b89b439c28b3408b0821ab012847a9",
      filename: "financial_audit_2025.pdf",
    },
    {
      user: dbUsers[1],
      chain: Chain.POLYGON,
      txHash: "0x3429813298abaecbfab20948ab201948ba201490bd28fab091ba8490a28fb010",
      filename: "medical_records_v2.docx",
    },
    {
      user: dbUsers[2],
      chain: Chain.ETHEREUM,
      txHash: "0x78ab213491ba09214b219084901ba1012bb091ab10f9b87a0b0101b0a880bb01",
      filename: "intellectual_property_patents.zip",
    }
  ];

  for (const item of evidenceData) {
    const hash = generateHash(item.filename + item.user.id); // deterministic hash per user/file
    
    // Check if evidence already seeded for this hash to avoid collisions
    const existing = await prisma.evidence.findFirst({ where: { sha256Hash: hash } });
    if (existing) {
      console.log(`⏭️  Skipping existing evidence for ${item.user.name}: ${item.filename}`);
      continue;
    }

    await prisma.evidence.create({
      data: {
        userId: item.user.id,
        originalFilename: item.filename,
        mimeType: item.filename.endsWith('.pdf') ? 'application/pdf' : item.filename.endsWith('.zip') ? 'application/zip' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: BigInt(Math.floor(Math.random() * 5000000) + 100000), // Random size
        sha256Hash: hash,
        ipfsCID: `Qm${hash.substring(0, 44)}`, 
        chain: item.chain,
        chainTxHash: item.txHash,
        chainTimestamp: new Date(),
        status: EvidenceStatus.ANCHORED,
        anchors: {
          create: {
            chain: item.chain,
            txHash: item.txHash,
            explorerUrl: `https://${item.chain.toLowerCase()}.explorer.example.com/tx/${item.txHash}`,
            anchoredAt: new Date(),
          }
        }
      }
    });

    console.log(`✅ Seeded ${item.chain} evidence for ${item.user.name}: ${item.filename}`);
  }

  console.log("🎉 Seeding complete! For the presentation, log in using the mock wallets to see isolated data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
