import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminWallet = process.env.ADMIN_WALLET_ADDRESS?.toLowerCase();
  if (!adminWallet) {
    console.log("ADMIN_WALLET_ADDRESS not set. Skipping admin seed.");
    return;
  }

  await prisma.user.upsert({
    where: { walletAddress: adminWallet },
    update: { role: Role.ADMIN },
    create: { walletAddress: adminWallet, role: Role.ADMIN }
  });

  console.log(`Admin ensured for wallet ${adminWallet}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
