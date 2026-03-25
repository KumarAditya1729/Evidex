export const evidenceRegistryAbi = [
  "function registerEvidence(bytes32 hash, string calldata ipfsCID) external",
  "function verifyFromPolkadot(bytes32 hash, string calldata polkadotTxHash) external",
  "function commitMerkleRoot(bytes32 root, string calldata polkadotTxHash) external",
  "function verifyEvidenceWithMerkle(bytes32 hash, bytes32[] calldata proof, bytes32 root) external",
  "function verifyEvidence(bytes32 hash) external view returns (bool exists, uint256 timestamp, address owner, string memory ipfsCID, string memory polkadotProof)",
  "function getUserEvidence(address wallet, uint256 offset, uint256 limit) external view returns (bytes32[])",
  "function getEvidenceByHash(bytes32 hash) external view returns (address owner, uint256 timestamp, string memory ipfsCID)"
];
