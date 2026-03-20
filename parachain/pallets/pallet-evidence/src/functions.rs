use crate::types::*;
use frame_support::traits::Get;
use sp_std::vec::Vec;

/// Helper functions for Arkashri Evidence Pallet
pub struct EvidenceHelper<T: crate::Config>;

impl<T: crate::Config> EvidenceHelper<T> {
    /// Validate evidence hash format
    pub fn validate_hash(hash: &[u8], max_length: u32) -> bool {
        if hash.len() as u32 > max_length {
            return false;
        }
        
        // Check if valid hex string
        hash.iter().all(|c| c.is_ascii_hexdigit())
    }

    /// Validate IPFS CID format (basic validation)
    pub fn validate_ipfs_cid(cid: &[u8]) -> bool {
        !cid.is_empty() && cid.len() <= 256 // Basic length check
    }

    /// Validate metadata structure
    pub fn validate_metadata(
        metadata: &EvidenceMetadata,
        max_size: u32,
        max_tags: u32,
    ) -> bool {
        let total_size = metadata.title.len() + metadata.description.len();
        if total_size > max_size as usize {
            return false;
        }
        
        if metadata.tags.len() > max_tags as usize {
            return false;
        }
        
        // Validate each tag
        metadata.tags.iter().all(|tag| tag.len() <= 64)
    }

    /// Generate evidence statistics for a user
    pub fn calculate_user_stats(account_id: &T::AccountId) -> EvidenceStats {
        let mut stats = EvidenceStats {
            total_count: 0,
            pending_count: 0,
            verified_count: 0,
            rejected_count: 0,
            user_submissions: 0,
        };

        // Iterate through user's evidence
        for (evidence_id, _) in crate::UserEvidences::<T>::iter_prefix(account_id) {
                if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
                    stats.total_count += 1;
                    stats.user_submissions += 1;
                    
                    match evidence.status {
                        EvidenceStatus::Pending => stats.pending_count += 1,
                        EvidenceStatus::Verified => stats.verified_count += 1,
                        EvidenceStatus::Rejected => stats.rejected_count += 1,
                    }
                }
            }

        stats
    }

    /// Get global evidence statistics
    pub fn calculate_global_stats() -> EvidenceStats {
        let mut stats = EvidenceStats {
            total_count: 0,
            pending_count: 0,
            verified_count: 0,
            rejected_count: 0,
            user_submissions: 0,
        };

        for (_, evidence) in crate::Evidences::<T>::iter() {
            stats.total_count += 1;
            
            match evidence.status {
                EvidenceStatus::Pending => stats.pending_count += 1,
                EvidenceStatus::Verified => stats.verified_count += 1,
                EvidenceStatus::Rejected => stats.rejected_count += 1,
            }
        }

        stats
    }

    /// Create audit entry
    pub fn create_audit_entry(
        action: AuditAction,
        actor: Vec<u8>,
        reason: Option<Vec<u8>>,
        block_number: T::BlockNumber,
    ) -> AuditEntry<T::BlockNumber> {
        AuditEntry {
            block_number,
            action,
            actor,
            reason,
        }
    }

    /// Check if account is admin
    pub fn is_admin(account_id: &T::AccountId) -> bool {
        account_id == &T::AdminKey::get()
    }

    /// Check if account owns evidence
    pub fn is_owner(evidence_id: &T::Hash, account_id: &T::AccountId) -> bool {
        if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
            evidence.owner == *account_id
        } else {
            false
        }
    }

    /// Get evidence by hash
    pub fn get_evidence_by_hash(hash: &[u8]) -> Option<T::Hash> {
        let hash_id = T::Hashing::hash(hash);
        crate::Evidences::<T>::get(hash_id).map(|_| hash_id)
    }

    /// Search evidence by owner with pagination
    pub fn get_evidence_by_owner(
        owner: &T::AccountId,
        offset: u32,
        limit: u32,
    ) -> Vec<(T::Hash, EvidenceRecord<T::AccountId, T::BlockNumber>)> {
        crate::UserEvidences::<T>::iter_prefix(owner)
            .skip(offset as usize)
            .take(limit as usize)
            .filter_map(|(evidence_id, _)| {
                crate::Evidences::<T>::get(evidence_id).map(|record| (evidence_id, record))
            })
            .collect()
    }

    /// Search evidence by status with pagination
    pub fn get_evidence_by_status(
        status: EvidenceStatus,
        offset: u32,
        limit: u32,
    ) -> Vec<(T::Hash, EvidenceRecord<T::AccountId, T::BlockNumber>)> {
        crate::Evidences::<T>::iter()
            .skip(offset as usize)
            .take(limit as usize)
            .filter(|(_, record)| record.status == status)
            .collect()
    }

    /// Get evidence audit trail
    pub fn get_audit_trail(evidence_id: &T::Hash) -> Vec<AuditEntry<T::BlockNumber>> {
        crate::Evidences::<T>::get(evidence_id)
            .map(|record| record.audit_trail)
            .unwrap_or_default()
    }

    /// Check if evidence can be verified
    pub fn can_verify(evidence_id: &T::Hash) -> bool {
        if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
            evidence.status == EvidenceStatus::Pending
        } else {
            false
        }
    }

    /// Check if evidence can be rejected
    pub fn can_reject(evidence_id: &T::Hash) -> bool {
        if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
            evidence.status != EvidenceStatus::Verified && evidence.status != EvidenceStatus::Rejected
        } else {
            false
        }
    }

    /// Calculate evidence age in blocks
    pub fn evidence_age(evidence_id: &T::Hash) -> Option<T::BlockNumber> {
        if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
            let current_block = frame_system::Pallet::<T>::block_number();
            Some(current_block.saturating_sub(evidence.timestamp))
        } else {
            None
        }
    }

    /// Get evidence submission rate (evidence per block)
    pub fn submission_rate() -> u64 {
        let total_evidence = crate::Evidences::<T>::iter().count() as u64;
        let current_block = frame_system::Pallet::<T>::block_number();
        
        if current_block > T::BlockNumber::from(0u32) {
            total_evidence / (*current_block as u64)
        } else {
            0
        }
    }

    /// Validate evidence configuration
    pub fn validate_config(config: &EvidenceConfig) -> bool {
        config.max_file_size > 0
            && config.max_hash_length > 0
            && config.max_metadata_size > 0
            && config.required_verifications > 0
            && config.max_hash_length <= 256
            && config.max_metadata_size <= 10240 // 10KB max
    }

    /// Initialize default configuration
    pub fn initialize_config() {
        let default_config = EvidenceConfig::default();
        crate::EvidenceConfig::<T>::put(default_config);
    }

    /// Get evidence verification score
    pub fn verification_score(evidence_id: &T::Hash) -> u32 {
        if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
            match evidence.status {
                EvidenceStatus::Verified => 100,
                EvidenceStatus::Pending => 50,
                EvidenceStatus::Rejected => 0,
            }
        } else {
            0
        }
    }

    /// Get evidence lifecycle duration
    pub fn lifecycle_duration(evidence_id: &T::Hash) -> Option<T::BlockNumber> {
        if let Some(evidence) = crate::Evidences::<T>::get(evidence_id) {
            if evidence.status == EvidenceStatus::Verified || evidence.status == EvidenceStatus::Rejected {
                // Find audit entry that changed the status
                for entry in evidence.audit_trail.iter().rev() {
                    match entry.action {
                        AuditAction::Verified | AuditAction::Rejected => {
                            return Some(entry.block_number.saturating_sub(evidence.timestamp));
                        }
                        _ => continue,
                    }
                }
            }
            None
        } else {
            None
        }
    }
}
