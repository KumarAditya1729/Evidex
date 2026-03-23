import { ethers } from "ethers";
import * as fs from "fs";

async function performUAT(role: "ADMIN" | "USER", wallet: ethers.Wallet, name: string) {
  const HOST = "https://evidex-tau.vercel.app";
  console.log(`\n================================`);
  console.log(`🚀 Starting UAT for role: ${role}`);
  console.log(`Wallet Address: ${wallet.address}`);
  console.log(`================================\n`);

  try {
    // 1. Get Challenge Nonce
    console.log(`[1] Fetching Signature Challenge...`);
    const challengeRes = await fetch(`${HOST}/api/auth/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: wallet.address })
    });
    const challenge = await challengeRes.json();
    
    if (challenge.error) {
      throw new Error(`Challenge API failed: ${challenge.error}`);
    }
    console.log(`✓ Challenge received: ${challenge.message.substring(0, 30)}...`);

    // 2. Sign Message
    console.log(`[2] Signing Challenge...`);
    const signature = await wallet.signMessage(challenge.message);
    console.log(`✓ Signature generated.`);

    // 3. Attempt Login
    let cookie = "";
    console.log(`[3] Attempting Login (simulating existing user)...`);
    let authRes = await fetch(`${HOST}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        password: "SuperSecurePassword123!",
        walletAddress: wallet.address,
        message: challenge.message,
        signature
      })
    });
    let authData = await authRes.json();

    // 4. Fallback to Signup if user not found
    if (authRes.status === 401 && (authData.error === "Invalid credentials." || authData.error === "Challenge expired. Please sign in again.")) {
      console.log(`✗ Login failed (${authData.error}), attempting Sign Up...`);
      
      // Need a new challenge because the nonce is burned
      const newChallengeRes = await fetch(`${HOST}/api/auth/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet.address })
      });
      const newChallenge = await newChallengeRes.json();
      const newSignature = await wallet.signMessage(newChallenge.message);

      authRes = await fetch(`${HOST}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password: "SuperSecurePassword123!",
          walletAddress: wallet.address,
          message: newChallenge.message,
          signature: newSignature
        })
      });
      authData = await authRes.json();
    }

    if (!authRes.ok) {
      throw new Error(`Auth failed: ${JSON.stringify(authData)}`);
    }

    cookie = authRes.headers.get("set-cookie") || "";
    console.log(`✓ Authentication successful!`);
    console.log(`User Profile:`, authData);

    // 5. Verify Session
    console.log(`[4] Verifying active session via /api/auth/me...`);
    const meRes = await fetch(`${HOST}/api/auth/me`, {
      headers: { cookie }
    });
    const meData = await meRes.json();
    if (!meRes.ok) throw new Error(`Me API failed: ${JSON.stringify(meData)}`);
    console.log(`✓ Session Validated. Role: ${meData.user?.role}`);

    // ----- ADMIN ONLY TESTS -----
    if (role === "ADMIN") {
       console.log(`[Admin-Specific] testing Admin Statistics View...`);
       const adminStatsRes = await fetch(`${HOST}/api/admin/stats`, {
           headers: { cookie }
       });
       if (adminStatsRes.status === 403) {
           console.log(`⚠️ Warning: Account is registered but not recognized as ADMIN in DB.`);
       } else if (!adminStatsRes.ok) {
           throw new Error(`Admin stats failed: ${adminStatsRes.status} - ${await adminStatsRes.text()}`);
       } else {
           console.log(`✓ Admin Stats Fetched: ${Object.keys(await adminStatsRes.json()).join(', ')}`);
       }
    }

    console.log(`\n🎉 UAT for ${role} completed successfully!`);

  } catch (error) {
    console.error(`\n❌ UAT Failed for ${role}:`);
    console.error(error);
  }
}

async function main() {
  // Load standard Ethers wallet from Keystore
  const keystorePass = "Nicehome@1";
  const keystoreData = fs.readFileSync("./secrets/eth-keystore.json", "utf8");
  const adminWallet = ethers.Wallet.fromEncryptedJsonSync(keystoreData, keystorePass);

  // Random Test User
  const userWallet = ethers.Wallet.createRandom();

  await performUAT("ADMIN", adminWallet, "admin_" + Date.now().toString().slice(-4));
  await performUAT("USER", userWallet, "testuser_" + Date.now().toString().slice(-4));
}

main();
