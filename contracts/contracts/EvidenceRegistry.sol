// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./utils/MerkleProof.sol";

/**
 * @title EvidenceRegistry
 * @dev Manages the registration and verification of digital evidence.
 * Supports primary anchoring and secondary cross-chain Merkle Proof verification.
 */
contract EvidenceRegistry {
    struct EvidenceRecord {
        address owner;
        uint256 timestamp;
        string ipfsCID;
        bool exists;
    }

    error EvidenceAlreadyExists(bytes32 hash);
    error EvidenceNotFound(bytes32 hash);
    error InvalidMerkleProof();

    // Primary Evidence mapping
    mapping(bytes32 => EvidenceRecord) private evidenceByHash;
    mapping(address => bytes32[]) private evidenceByUser;

    // Cross-Chain tracking (Merkle Roots)
    // Maps Merkle Root => Polkadot TxHash (the extrinsic that anchored the batch)
    mapping(bytes32 => string) public merkleRoots;
    // Maps Evidence Hash => Polkadot TxHash (for backward compatibility / direct relay tracking)
    mapping(bytes32 => string) public crossChainProofs;

    // Secure access control for evidence registration
    address public immutable trustedAnchor;

    event EvidenceRegistered(
        bytes32 indexed hash,
        address indexed owner,
        string ipfsCID,
        uint256 timestamp
    );

    event MerkleRootCommitted(
        bytes32 indexed root,
        string polkadotTxHash,
        uint256 timestamp
    );

    event CrossChainVerified(
        bytes32 indexed hash,
        string polkadotTxHash,
        uint256 timestamp
    );

    modifier onlyAnchor() {
        if (msg.sender != trustedAnchor) revert Unauthorized();
        _;
    }

    error Unauthorized();

    constructor(address _trustedAnchor) {
        trustedAnchor = _trustedAnchor;
    }

    /**
     * @dev Register evidence directly on this chain (Primary Anchoring)
     */
    function registerEvidence(bytes32 hash, string calldata ipfsCID) external onlyAnchor {
        if (evidenceByHash[hash].exists) {
            revert EvidenceAlreadyExists(hash);
        }

        evidenceByHash[hash] = EvidenceRecord({
            owner: msg.sender,
            timestamp: block.timestamp,
            ipfsCID: ipfsCID,
            exists: true
        });

        evidenceByUser[msg.sender].push(hash);

        emit EvidenceRegistered(hash, msg.sender, ipfsCID, block.timestamp);
    }

    /**
     * @dev Phase 2: Commits a Merkle Root representing a batch of Polkadot evidence hashes.
     * The `polkadotTxHash` is the transaction on Polkadot that contains this batched data.
     */
    function commitMerkleRoot(bytes32 root, string calldata polkadotTxHash) external onlyAnchor {
        merkleRoots[root] = polkadotTxHash;
        emit MerkleRootCommitted(root, polkadotTxHash, block.timestamp);
    }

    /**
     * @dev Cryptographically verify an evidence hash using a committed Merkle Proof.
     * If valid, it records the verification so `verifyEvidence` can return the cross-chain proof info.
     * This can be called by ANYONE (fully decentralized verification).
     */
    function verifyEvidenceWithMerkle(bytes32 hash, bytes32[] calldata proof, bytes32 root) external {
        string memory polkadotTx = merkleRoots[root];
        require(bytes(polkadotTx).length > 0, "Merkle Root not found");

        // The OpenZeppelin MerkleProof requires leaves to be keccak256
        // Alternatively, if the backend uses the raw hash bytes, we can hash it.
        // Assuming the `hash` itself is the leaf node.
        bytes32 leaf = hash;
        
        bool isValid = MerkleProof.verify(proof, root, leaf);
        if (!isValid) revert InvalidMerkleProof();

        // Mark it as cross-chain verified if not already
        if (bytes(crossChainProofs[hash]).length == 0) {
            crossChainProofs[hash] = polkadotTx;
            emit CrossChainVerified(hash, polkadotTx, block.timestamp);
        }
    }

    /**
     * @dev Legacy / Direct Relay Verification (Phase 1)
     */
    function verifyFromPolkadot(bytes32 hash, string calldata polkadotTxHash) external onlyAnchor {
        if (evidenceByHash[hash].exists) {
            revert EvidenceAlreadyExists(hash);
        }
        
        // In Phase 2, this is kept for compatibility but we prefer verifyEvidenceWithMerkle
        crossChainProofs[hash] = polkadotTxHash;
        emit CrossChainVerified(hash, polkadotTxHash, block.timestamp);
    }

    function verifyEvidence(bytes32 hash)
        external
        view
        returns (bool exists, uint256 timestamp, address owner, string memory ipfsCID, string memory polkadotProof)
    {
        EvidenceRecord memory record = evidenceByHash[hash];
        if (!record.exists && bytes(crossChainProofs[hash]).length == 0) {
            return (false, 0, address(0), "", "");
        }

        // Return the primary record if it exists, otherwise it's just a cross-chain proof
        return (
            record.exists || bytes(crossChainProofs[hash]).length > 0,
            record.timestamp,
            record.owner,
            record.ipfsCID,
            crossChainProofs[hash]
        );
    }

    function getUserEvidence(
        address wallet,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        bytes32[] storage all = evidenceByUser[wallet];
        uint256 total = all.length;
        if (offset >= total) {
            return new bytes32[](0);
        }
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 size = end - offset;
        bytes32[] memory page = new bytes32[](size);
        for (uint256 i = 0; i < size; i++) {
            page[i] = all[offset + i];
        }
        return page;
    }

    function getEvidenceByHash(bytes32 hash)
        external
        view
        returns (address owner, uint256 timestamp, string memory ipfsCID)
    {
        EvidenceRecord memory record = evidenceByHash[hash];
        if (!record.exists) {
            revert EvidenceNotFound(hash);
        }

        return (record.owner, record.timestamp, record.ipfsCID);
    }
}
