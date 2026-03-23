require("dotenv").config({ path: "./apps/web/.env.local" });
const { processEvidenceUpload } = require("./packages/api/dist/evidence.service.js"); // Wait, does `@evidex/api` have dist?

async function run() {
  try {
    console.log("Starting script...");
    const { processEvidenceUpload } = require("@evidex/api/evidence.service");
    
    const res = await processEvidenceUpload({
      walletAddress: "0xTest",
      chain: "polkadot",
      filename: "test.pdf",
      content: Buffer.from("Hello World")
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("CRASH:", err);
  }
}
run();
