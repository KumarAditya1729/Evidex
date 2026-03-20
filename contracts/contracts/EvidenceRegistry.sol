// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EvidenceRegistry {
    struct EvidenceRecord {
        address owner;
        uint64 timestamp;
        string ipfsCID;
        bool exists;
    }

    error EvidenceAlreadyExists(bytes32 hash);
    error EvidenceNotFound(bytes32 hash);

    mapping(bytes32 => EvidenceRecord) private evidenceByHash;
    mapping(address => bytes32[]) private evidenceByUser;

    event EvidenceRegistered(
        bytes32 indexed hash,
        address indexed owner,
        string ipfsCID,
        uint256 timestamp
    );

    function registerEvidence(bytes32 hash, string calldata ipfsCID) external {
        if (evidenceByHash[hash].exists) {
            revert EvidenceAlreadyExists(hash);
        }

        evidenceByHash[hash] = EvidenceRecord({
            owner: msg.sender,
            timestamp: uint64(block.timestamp),
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

    function getUserEvidence(address wallet) external view returns (bytes32[] memory) {
        return evidenceByUser[wallet];
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
