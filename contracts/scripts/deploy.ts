import hre from "hardhat";

async function main() {
  const { ethers, network } = hre;
  const registryFactory = await ethers.getContractFactory("EvidenceRegistry");
  const registry = await registryFactory.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const deployer = (await ethers.getSigners())[0];

  console.log("EvidenceRegistry deployed");
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Address: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
