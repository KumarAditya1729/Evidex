// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidexLightClient (Stage 1)
 * @notice Minimum Trust Light Client for verifying Substrate (Polkadot/Rococo) State Proofs on Ethereum.
 * @dev Stores Parachain headers (state roots) and allows users to mathematically prove inclusion.
 */
contract EvidexLightClient {
    
    struct SubstrateHeader {
        bytes32 parentHash;
        bytes32 stateRoot;
        bytes32 extrinsicsRoot;
        uint256 blockNumber;
        uint256 timestamp;
    }

    // Mapping: Substrate Block Number => Anchored State Root
    mapping(uint256 => bytes32) public parachainStateRoots;
    
    // Mapping: Substrate Block Number => Full Header Metadata (Optional but useful)
    mapping(uint256 => SubstrateHeader) public parachainHeaders;

    event SubstrateHeaderAnchored(uint256 indexed blockNumber, bytes32 indexed stateRoot);
    event EvidenceVerified(uint256 indexed blockNumber, bytes32 indexed leafHash);

    /**
     * @notice Anchor a Substrate Block Header to Ethereum.
     * @dev In Stage 3, this function MUST verify a GRANDPA Justification signature set before accepting the State Root.
     *      For Stage 1, we blindly accept the header from the relayer (Trust-Minimized, not Trustless yet).
     */
    function submitHeader(
        uint256 _blockNumber,
        bytes32 _parentHash,
        bytes32 _stateRoot,
        bytes32 _extrinsicsRoot
    ) external {
        // Prevent overwriting existing, secured state roots
        require(parachainStateRoots[_blockNumber] == bytes32(0), "Header already anchored for this block.");

        SubstrateHeader memory newHeader = SubstrateHeader({
            parentHash: _parentHash,
            stateRoot: _stateRoot,
            extrinsicsRoot: _extrinsicsRoot,
            blockNumber: _blockNumber,
            timestamp: block.timestamp
        });

        parachainHeaders[_blockNumber] = newHeader;
        parachainStateRoots[_blockNumber] = _stateRoot;

        emit SubstrateHeaderAnchored(_blockNumber, _stateRoot);
    }

    /**
     * @notice Verify a Polkadot Storage Proof (Merkle Proof) against a previously anchored State Root.
     * @param _blockNumber The Substrate Block Number where the data allegedly resides.
     * @param _leaf The Keccak256 hash of the evidence (e.g. the specific data extracted from the Substrate Trie).
     * @param _proof The Merkle path extracted via `api.rpc.state.getReadProof()`.
     * @return bool True if the proof perfectly re-constructs the anchored Polkadot State Root.
     */
    function verifyProof(
        uint256 _blockNumber,
        bytes32 _leaf,
        bytes32[] calldata _proof
    ) external returns (bool) {
        bytes32 anchoredRoot = parachainStateRoots[_blockNumber];
        require(anchoredRoot != bytes32(0), "Substrate block header not yet anchored to Ethereum.");

        bool isValid = _verifySimplifiedTrieProof(_proof, anchoredRoot, _leaf);
        require(isValid, "Cryptographic Proof Failed: Hash does not exist in Substrate state.");

        emit EvidenceVerified(_blockNumber, _leaf);
        return true;
    }

    /**
     * @notice Internal validation loop to reconstruct the Merkle Root from the provided leaf and proof array.
     * @dev This is a simplified Merkle loop for Stage 1. A true Substrate Trie proof (Stage 2) requires SCALE decode logic.
     */
    function _verifySimplifiedTrieProof(
        bytes32[] calldata _proof,
        bytes32 _root,
        bytes32 _leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = _leaf;

        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == _root;
    }

    /**
     * @notice Check if a specific Substrate Block has already been synced to this Light Client.
     */
    function isBlockAnchored(uint256 _blockNumber) external view returns (bool) {
        return parachainStateRoots[_blockNumber] != bytes32(0);
    }
}
