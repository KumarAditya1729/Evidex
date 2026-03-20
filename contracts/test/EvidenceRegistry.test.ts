import { expect } from "chai";
import hre from "hardhat";

describe("EvidenceRegistry", () => {
  it("registers and verifies evidence", async () => {
    const { ethers } = hre;
    const registryFactory = await ethers.getContractFactory("EvidenceRegistry");
    const registry = await registryFactory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("test-evidence"));
    const cid = "bafybeigdyrztk3qxz6mylq5gq2m6";

    await expect(registry.registerEvidence(hash, cid)).to.emit(registry, "EvidenceRegistered");

    const verification = await registry.verifyEvidence(hash);
    expect(verification[0]).to.equal(true);
    expect(verification[3]).to.equal(cid);
  });

  it("prevents duplicate evidence", async () => {
    const { ethers } = hre;
    const registryFactory = await ethers.getContractFactory("EvidenceRegistry");
    const registry = await registryFactory.deploy();
    await registry.waitForDeployment();

    const hash = ethers.keccak256(ethers.toUtf8Bytes("duplicate-evidence"));
    const cid = "bafybeie6iqu5xfr5yz2gv3";

    await registry.registerEvidence(hash, cid);

    await expect(registry.registerEvidence(hash, cid)).to.be.reverted;
  });
});
