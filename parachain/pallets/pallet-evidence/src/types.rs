use codec::{Decode, Encode, MaxEncodedLen};
use scale_info::TypeInfo;
use sp_runtime::RuntimeDebug;
use sp_std::vec::Vec;

/// Evidence status enumeration
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub enum EvidenceStatus {
    /// Evidence submitted but not yet verified
    Pending,
    /// Evidence verified and confirmed authentic
    Verified,
    /// Evidence rejected as invalid or fraudulent
    Rejected,
}

/// Evidence metadata structure
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub struct EvidenceMetadata {
    /// Title or description of the evidence
    pub title: Vec<u8>,
    /// Detailed description
    pub description: Vec<u8>,
    /// Evidence type (document, image, video, etc.)
    pub evidence_type: Vec<u8>,
    /// Tags for categorization
    pub tags: Vec<Vec<u8>>,
}

/// Main evidence record structure
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub struct EvidenceRecord<AccountId, BlockNumber> {
    /// Owner who submitted the evidence
    pub owner: AccountId,
    /// SHA256 hash of the file content
    pub file_hash: Vec<u8>,
    /// IPFS content identifier
    pub ipfs_cid: Vec<u8>,
    /// Block number when evidence was submitted
    pub timestamp: BlockNumber,
    /// Current verification status
    pub status: EvidenceStatus,
    /// Optional metadata
    pub metadata: Option<EvidenceMetadata>,
    /// Audit trail of status changes
    pub audit_trail: Vec<AuditEntry<BlockNumber>>,
}

/// Audit trail entry for tracking evidence lifecycle
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub struct AuditEntry<BlockNumber> {
    /// Block number of the action
    pub block_number: BlockNumber,
    /// Type of action performed
    pub action: AuditAction,
    /// Account that performed the action
    pub actor: Vec<u8>, // AccountId encoded as bytes
    /// Optional reason or comment
    pub reason: Option<Vec<u8>>,
}

/// Types of audit actions
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub enum AuditAction {
    /// Evidence was initially submitted
    Submitted,
    /// Evidence was verified
    Verified,
    /// Evidence was rejected
    Rejected,
    /// Metadata was updated
    MetadataUpdated,
    /// Status was changed
    StatusChanged,
}

/// Verification request structure
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub struct VerificationRequest {
    /// Evidence ID being verified
    pub evidence_id: Vec<u8>,
    /// Verifier account
    pub verifier: Vec<u8>,
    /// Verification method used
    pub method: Vec<u8>,
    /// Verification result
    pub result: bool,
    /// Verification timestamp (block number)
    pub timestamp: Vec<u8>,
}

/// Evidence statistics for dashboard
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub struct EvidenceStats {
    /// Total evidence count
    pub total_count: u64,
    /// Pending evidence count
    pub pending_count: u64,
    /// Verified evidence count
    pub verified_count: u64,
    /// Rejected evidence count
    pub rejected_count: u64,
    /// Total submissions by this account
    pub user_submissions: u64,
}

/// Configuration for evidence submission limits
#[derive(Encode, Decode, Clone, PartialEq, RuntimeDebug, TypeInfo)]
pub struct EvidenceConfig {
    /// Maximum file size in bytes
    pub max_file_size: u64,
    /// Maximum hash length
    pub max_hash_length: u32,
    /// Maximum metadata size
    pub max_metadata_size: u32,
    /// Required verification confirmations
    pub required_verifications: u32,
}

impl Default for EvidenceConfig {
    fn default() -> Self {
        Self {
            max_file_size: 100 * 1024 * 1024, // 100MB
            max_hash_length: 64, // SHA256 hex length
            max_metadata_size: 1024, // 1KB
            required_verifications: 1,
        }
    }
}
