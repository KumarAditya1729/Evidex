export const evidenceRegistryAbi = [
  "function registerEvidence(bytes32 hash, string ipfsCID)",
  "function verifyFromPolkadot(bytes32 hash, string polkadotTxHash)",
  "function verifyEvidence(bytes32 hash) view returns (bool exists, uint256 timestamp, address owner, string ipfsCID, string polkadotProof)",
  "function getUserEvidence(address wallet) view returns (bytes32[] memory)"
] as const;
