// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EvidenceRegistry {
    struct EvidenceRecord {
        address owner;
        uint256 timestamp;  // was uint64 — now matches event emit type
        string ipfsCID;
        bool exists;
    }

    error EvidenceAlreadyExists(bytes32 hash);
    error EvidenceNotFound(bytes32 hash);

    mapping(bytes32 => EvidenceRecord) private evidenceByHash;
    mapping(address => bytes32[]) private evidenceByUser;

    // CQ-6: Secure access control for evidence registration
    address public immutable trustedAnchor;

    event EvidenceRegistered(
        bytes32 indexed hash,
        address indexed owner,
        string ipfsCID,
        uint256 timestamp
    );

    constructor(address _trustedAnchor) {
        trustedAnchor = _trustedAnchor;
    }

    modifier onlyAnchor() {
        if (msg.sender != trustedAnchor) revert Unauthorized();
        _;
    }

    error Unauthorized();

    function registerEvidence(bytes32 hash, string calldata ipfsCID) external onlyAnchor {
        if (evidenceByHash[hash].exists) {
            revert EvidenceAlreadyExists(hash);
        }

        evidenceByHash[hash] = EvidenceRecord({
            owner: msg.sender,
            timestamp: block.timestamp,  // uint256 — no cast needed
            ipfsCID: ipfsCID,
            exists: true
        });

        evidenceByUser[msg.sender].push(hash);

        emit EvidenceRegistered(hash, msg.sender, ipfsCID, block.timestamp);
    }

    function verifyEvidence(bytes32 hash)
        external
        view
        returns (bool exists, uint256 timestamp, address owner, string memory ipfsCID)
    {
        EvidenceRecord memory record = evidenceByHash[hash];
        if (!record.exists) {
            return (false, 0, address(0), "");
        }

        return (true, record.timestamp, record.owner, record.ipfsCID);
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
