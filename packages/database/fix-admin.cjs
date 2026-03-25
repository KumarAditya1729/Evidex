const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_faC4JVWw7run@ep-winter-cherry-anbx44sn-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
    }
  }
});

async function main() {
  const wallet = "0x7014b1ed9825905ce8fd0d8744896eab2c6db6f3";
  try {
    const updatedUser = await prisma.user.update({
      where: { walletAddress: wallet },
      data: { role: "ADMIN" }
    });
    console.log("Successfully upgraded user to ADMIN:", updatedUser);
  } catch (error) {
    console.error("Failed to upgrade:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
