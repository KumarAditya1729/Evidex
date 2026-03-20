#![cfg(feature = "runtime-benchmarks")]

use super::*;
use frame_benchmarking::{account, benchmarks, impl_benchmark_test_suite, whitelisted_caller};
use frame_support::traits::Get;
use frame_system::RawOrigin;
use sp_std::vec::Vec;

benchmarks! {
    submit_evidence {
        let caller: T::AccountId = whitelisted_caller();
        let file_hash = vec![0u8; 64]; // SHA256 hash
        let ipfs_cid = b"QmXxx".to_vec();
        
        let metadata = EvidenceMetadata {
            title: b"Test Evidence".to_vec(),
            description: b"Test evidence description".to_vec(),
            evidence_type: b"document".to_vec(),
            tags: vec![b"test".to_vec(), b"evidence".to_vec()],
        };

        // Fund the caller for submission fee
        let balance = T::SubmissionFee::get();
        T::Currency::make_free_balance_be(&caller, balance * 10);

    }: {
        Pallet::<T>::submit_evidence(
            RawOrigin::Signed(caller).into(),
            file_hash,
            ipfs_cid,
            Some(metadata),
        )?
    }

    verify_evidence {
        let caller: T::AccountId = whitelisted_caller();
        let admin = T::AdminKey::get();
        let file_hash = vec![1u8; 64];
        let ipfs_cid = b"QmYyy".to_vec();
        
        // First submit evidence
        let evidence_id = T::Hashing::hash(&file_hash);
        let record = EvidenceRecord {
            owner: caller,
            file_hash: file_hash.clone(),
            ipfs_cid,
            timestamp: frame_system::Pallet::<T>::block_number(),
            status: EvidenceStatus::Pending,
            metadata: None,
            audit_trail: vec![],
        };
        Evidences::<T>::insert(evidence_id, record);

    }: {
        Pallet::<T>::verify_evidence(
            RawOrigin::Signed(admin).into(),
            evidence_id,
        )?
    }

    reject_evidence {
        let caller: T::AccountId = whitelisted_caller();
        let admin = T::AdminKey::get();
        let file_hash = vec![2u8; 64];
        let ipfs_cid = b"QmZzz".to_vec();
        let reason = b"Invalid evidence".to_vec();
        
        // First submit evidence
        let evidence_id = T::Hashing::hash(&file_hash);
        let record = EvidenceRecord {
            owner: caller,
            file_hash: file_hash.clone(),
            ipfs_cid,
            timestamp: frame_system::Pallet::<T>::block_number(),
            status: EvidenceStatus::Pending,
            metadata: None,
            audit_trail: vec![],
        };
        Evidences::<T>::insert(evidence_id, record);

    }: {
        Pallet::<T>::reject_evidence(
            RawOrigin::Signed(admin).into(),
            evidence_id,
            reason,
        )?
    }

    update_metadata {
        let caller: T::AccountId = whitelisted_caller();
        let file_hash = vec![3u8; 64];
        let ipfs_cid = b"QmAaa".to_vec();
        
        let metadata = EvidenceMetadata {
            title: b"Updated Evidence".to_vec(),
            description: b"Updated description".to_vec(),
            evidence_type: b"image".to_vec(),
            tags: vec![b"updated".to_vec()],
        };

        // First submit evidence
        let evidence_id = T::Hashing::hash(&file_hash);
        let record = EvidenceRecord {
            owner: caller,
            file_hash: file_hash.clone(),
            ipfs_cid,
            timestamp: frame_system::Pallet::<T>::block_number(),
            status: EvidenceStatus::Pending,
            metadata: None,
            audit_trail: vec![],
        };
        Evidences::<T>::insert(evidence_id, record);

    }: {
        Pallet::<T>::update_metadata(
            RawOrigin::Signed(caller).into(),
            evidence_id,
            metadata,
        )?
    }

    request_verification {
        let caller: T::AccountId = whitelisted_caller();
        let file_hash = vec![4u8; 64];
        let ipfs_cid = b"QmBbb".to_vec();
        let method = b"manual".to_vec();
        
        // First submit evidence
        let evidence_id = T::Hashing::hash(&file_hash);
        let record = EvidenceRecord {
            owner: caller,
            file_hash: file_hash.clone(),
            ipfs_cid,
            timestamp: frame_system::Pallet::<T>::block_number(),
            status: EvidenceStatus::Pending,
            metadata: None,
            audit_trail: vec![],
        };
        Evidences::<T>::insert(evidence_id, record);
        UserEvidences::<T>::insert(&caller, evidence_id, ());

    }: {
        Pallet::<T>::request_verification(
            RawOrigin::Signed(caller).into(),
            evidence_id,
            method,
        )?
    }

    // Benchmark helper functions
    get_evidence_by_owner {
        let caller: T::AccountId = whitelisted_caller();
        let mut evidence_ids = Vec::new();
        
        // Create multiple evidence records
        for i in 0..10 {
            let file_hash = [i as u8; 64];
            let evidence_id = T::Hashing::hash(&file_hash);
            let record = EvidenceRecord {
                owner: caller.clone(),
                file_hash: file_hash.to_vec(),
                ipfs_cid: format!("QmTest{}", i).into_bytes(),
                timestamp: frame_system::Pallet::<T>::block_number(),
                status: EvidenceStatus::Pending,
                metadata: None,
                audit_trail: vec![],
            };
            Evidences::<T>::insert(evidence_id, record);
            UserEvidences::<T>::insert(&caller, evidence_id, ());
            evidence_ids.push(evidence_id);
        }

    }: {
        let _result = functions::EvidenceHelper::<T>::get_evidence_by_owner(&caller, 0, 5);
    }

    get_evidence_by_status {
        let mut evidence_ids = Vec::new();
        
        // Create evidence with different statuses
        for i in 0..10 {
            let caller: T::AccountId = account("user", i, 0);
            let file_hash = [i as u8; 64];
            let evidence_id = T::Hashing::hash(&file_hash);
            let status = if i % 2 == 0 { EvidenceStatus::Pending } else { EvidenceStatus::Verified };
            
            let record = EvidenceRecord {
                owner: caller,
                file_hash: file_hash.to_vec(),
                ipfs_cid: format!("QmStatus{}", i).into_bytes(),
                timestamp: frame_system::Pallet::<T>::block_number(),
                status,
                metadata: None,
                audit_trail: vec![],
            };
            Evidences::<T>::insert(evidence_id, record);
            evidence_ids.push(evidence_id);
        }

    }: {
        let _result = functions::EvidenceHelper::<T>::get_evidence_by_status(EvidenceStatus::Pending, 0, 5);
    }

    validate_hash {
        let valid_hash = vec![0u8; 64];
        let invalid_hash = vec![0u8; 100];
        let max_length = 64u32;

    }: {
        let _valid = functions::EvidenceHelper::<T>::validate_hash(&valid_hash, max_length);
        let _invalid = functions::EvidenceHelper::<T>::validate_hash(&invalid_hash, max_length);
    }

    validate_metadata {
        let valid_metadata = EvidenceMetadata {
            title: b"Valid Title".to_vec(),
            description: b"Valid description".to_vec(),
            evidence_type: b"document".to_vec(),
            tags: vec![b"tag1".to_vec(), b"tag2".to_vec()],
        };
        
        let invalid_metadata = EvidenceMetadata {
            title: vec![0u8; 1000], // Too large
            description: b"Valid description".to_vec(),
            evidence_type: b"document".to_vec(),
            tags: vec![b"tag1".to_vec()],
        };
        
        let max_size = 512u32;
        let max_tags = 10u32;

    }: {
        let _valid = functions::EvidenceHelper::<T>::validate_metadata(&valid_metadata, max_size, max_tags);
        let _invalid = functions::EvidenceHelper::<T>::validate_metadata(&invalid_metadata, max_size, max_tags);
    }

    calculate_user_stats {
        let caller: T::AccountId = whitelisted_caller();
        
        // Create evidence with different statuses
        for i in 0..5 {
            let file_hash = [i as u8; 64];
            let evidence_id = T::Hashing::hash(&file_hash);
            let status = match i {
                0..=1 => EvidenceStatus::Pending,
                2..=3 => EvidenceStatus::Verified,
                _ => EvidenceStatus::Rejected,
            };
            
            let record = EvidenceRecord {
                owner: caller.clone(),
                file_hash: file_hash.to_vec(),
                ipfs_cid: format!("QmStats{}", i).into_bytes(),
                timestamp: frame_system::Pallet::<T>::block_number(),
                status,
                metadata: None,
                audit_trail: vec![],
            };
            Evidences::<T>::insert(evidence_id, record);
            UserEvidences::<T>::insert(&caller, evidence_id, ());
        }

    }: {
        let _stats = functions::EvidenceHelper::<T>::calculate_user_stats(&caller);
    }

    audit_trail_operations {
        let caller: T::AccountId = whitelisted_caller();
        let admin = T::AdminKey::get();
        let file_hash = vec![5u8; 64];
        let ipfs_cid = b"QmAudit".to_vec();
        
        // Submit evidence
        let evidence_id = T::Hashing::hash(&file_hash);
        let record = EvidenceRecord {
            owner: caller,
            file_hash: file_hash.clone(),
            ipfs_cid,
            timestamp: frame_system::Pallet::<T>::block_number(),
            status: EvidenceStatus::Pending,
            metadata: None,
            audit_trail: vec![],
        };
        Evidences::<T>::insert(evidence_id, record);

        // Verify evidence (adds audit entry)
        Pallet::<T>::verify_evidence(RawOrigin::Signed(admin).into(), evidence_id).unwrap();

    }: {
        let _audit_trail = functions::EvidenceHelper::<T>::get_audit_trail(&evidence_id);
    }
}

impl_benchmark_test_suite!(Pallet);
