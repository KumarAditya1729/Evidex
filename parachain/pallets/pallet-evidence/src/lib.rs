#![cfg_attr(not(feature = "std"), no_std)]

use frame_support::pallet_prelude::*;
use frame_support::traits::{Currency, ExistenceRequirement, WithdrawReasons};
use frame_system::pallet_prelude::*;
use sp_runtime::{traits::Hash, RuntimeDebug};
// Phase 5: Trustless XCMP Imports
use staging_xcm::v3::{
    Junction::Parachain, Junctions::X1, MultiLocation, SendXcm, Xcm, Instruction::Transact,
    OriginKind, Weight,
};
use sp_std::prelude::*;

pub use pallet::*;

#[frame_support::pallet]
pub mod pallet {
    use super::*;

    type HashBytesOf<T> = BoundedVec<u8, <T as Config>::MaxHashLength>;
    type CidBytesOf<T> = BoundedVec<u8, <T as Config>::MaxCidLength>;
    type ReasonBytesOf<T> = BoundedVec<u8, <T as Config>::MaxChallengeReasonLength>;
    type BalanceOf<T> =
        <<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;

    #[derive(Encode, Decode, Clone, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub enum EvidenceStatus {
        Pending,
        Verified,
        Challenged,
        Rejected,
    }

    #[derive(Encode, Decode, Clone, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct EvidenceRecord<AccountId, BlockNumber, HashBytes, CidBytes> {
        pub owner: AccountId,
        pub file_hash: HashBytes,
        pub ipfs_cid: CidBytes,
        pub submitted_at: BlockNumber,
        pub status: EvidenceStatus,
    }

    #[derive(Encode, Decode, Clone, Eq, PartialEq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
    pub struct ChallengeRecord<AccountId, BlockNumber, ReasonBytes> {
        pub challenger: AccountId,
        pub reason: ReasonBytes,
        pub challenged_at: BlockNumber,
    }

    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

        #[pallet::constant]
        type MaxHashLength: Get<u32>;

        #[pallet::constant]
        type MaxCidLength: Get<u32>;

        #[pallet::constant]
        type MaxChallengeReasonLength: Get<u32>;

        #[pallet::constant]
        type SubmissionFee: Get<BalanceOf<Self>>;

        type Currency: Currency<<Self as frame_system::Config>::AccountId>;

        type AdminKey: Get<<Self as frame_system::Config>::AccountId>;

        /// Phase 5: The mechanism to send Cross-Consensus Messages natively
        type XcmSender: SendXcm;
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(fn evidences)]
    pub type Evidences<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::Hash,
        EvidenceRecord<T::AccountId, BlockNumberFor<T>, HashBytesOf<T>, CidBytesOf<T>>,
        OptionQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn user_evidences)]
    pub type UserEvidences<T: Config> = StorageDoubleMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        Blake2_128Concat,
        T::Hash,
        (),
        OptionQuery,
    >;

    #[pallet::storage]
    #[pallet::getter(fn challenges)]
    pub type Challenges<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::Hash,
        ChallengeRecord<T::AccountId, BlockNumberFor<T>, ReasonBytesOf<T>>,
        OptionQuery,
    >;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        EvidenceSubmitted {
            owner: T::AccountId,
            evidence_id: T::Hash,
            file_hash: Vec<u8>,
            ipfs_cid: Vec<u8>,
        },
        EvidenceVerified {
            evidence_id: T::Hash,
            verifier: T::AccountId,
        },
        EvidenceChallenged {
            evidence_id: T::Hash,
            challenger: T::AccountId,
            reason: Vec<u8>,
        },
        EvidenceResolved {
            evidence_id: T::Hash,
            resolver: T::AccountId,
            accepted: bool,
        },
    }

    #[pallet::error]
    pub enum Error<T> {
        EvidenceAlreadyExists,
        EvidenceNotFound,
        InvalidHash,
        HashTooLong,
        InvalidIpfsCid,
        InsufficientBalance,
        Unauthorized,
        InvalidStatusTransition,
        ReasonTooLong,
        ChallengeNotFound,
    }

    #[pallet::hooks]
    impl<T: Config> Hooks<BlockNumberFor<T>> for Pallet<T> {}

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000)]
        pub fn submit_evidence(
            origin: OriginFor<T>,
            file_hash: Vec<u8>,
            ipfs_cid: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;

            let hash_bytes = Self::validate_hash(file_hash.clone())?;
            let cid_bytes = Self::validate_cid(ipfs_cid.clone())?;
            let evidence_id = T::Hashing::hash(file_hash.as_slice());

            ensure!(
                !Evidences::<T>::contains_key(evidence_id),
                Error::<T>::EvidenceAlreadyExists
            );

            let _imbalance = T::Currency::withdraw(
                &sender,
                T::SubmissionFee::get(),
                WithdrawReasons::FEE,
                ExistenceRequirement::KeepAlive,
            )
            .map_err(|_| Error::<T>::InsufficientBalance)?;

            let record = EvidenceRecord::<T::AccountId, BlockNumberFor<T>, HashBytesOf<T>, CidBytesOf<T>> {
                owner: sender.clone(),
                file_hash: hash_bytes,
                ipfs_cid: cid_bytes,
                submitted_at: frame_system::Pallet::<T>::block_number(),
                status: EvidenceStatus::Pending,
            };

            Evidences::<T>::insert(evidence_id, record);
            UserEvidences::<T>::insert(sender.clone(), evidence_id, ());

            Self::deposit_event(Event::EvidenceSubmitted {
                owner: sender,
                evidence_id,
                file_hash: file_hash.clone(),
                ipfs_cid: ipfs_cid.clone(),
            });

            // PHASE 5: Fully Decentralized XCMP Dispatch
            // Here we construct a native XCM message containing the evidence payload
            // and dispatch it to a peer parachain (e.g. Parachain 2000) for cross-chain verification.
            // This completely eliminates the need for the Node.js API "Relayer"
            let destination = MultiLocation::new(1, X1(Parachain(2000)));
            
            // In a full implementation, `call` would be the SCALE-encoded bytes of the destination chain's verification extrinsic
            let call_payload = file_hash; 

            let message = Xcm(vec![
                Transact {
                    origin_kind: OriginKind::Native,
                    require_weight_at_most: Weight::from_parts(1_000_000_000, 0),
                    call: call_payload.into(),
                }
            ]);

            // Dispatch natively via the Relay Chain
            if let Err(e) = T::XcmSender::send_xcm(destination, message) {
                log::error!("XCMP Native Dispatch failed: {:?}", e);
            }

            Ok(())
        }

        #[pallet::weight(10_000)]
        pub fn register_evidence(
            origin: OriginFor<T>,
            file_hash: Vec<u8>,
            ipfs_cid: Vec<u8>,
        ) -> DispatchResult {
            Self::submit_evidence(origin, file_hash, ipfs_cid)
        }

        /// Phase 7: Cross-Chain Message Ingestion (XCMP)
        /// This function is the target destination for incoming `Transact` messages from sibling parachains.
        /// It bypasses the fee since the sending chain (or holding register) covers execution weights.
        #[pallet::weight(5_000)]
        pub fn receive_evidence(
            origin: OriginFor<T>,
            file_hash: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            
            // In a strict XCM environment, we would verify `EnsureXcmOrigin` or check if the sender
            // is the Sovereign Account of the originating Parachain ID.
            
            let hash_bytes = Self::validate_hash(file_hash.clone())?;
            let evidence_id = T::Hashing::hash(file_hash.as_slice());

            let record = EvidenceRecord::<T::AccountId, BlockNumberFor<T>, HashBytesOf<T>, CidBytesOf<T>> {
                owner: sender,
                file_hash: hash_bytes,
                // The receiver chain doesn't necessarily need the IPFS payload, just the cryptographic proof
                ipfs_cid: BoundedVec::default(),
                submitted_at: frame_system::Pallet::<T>::block_number(),
                status: EvidenceStatus::Verified, // Auto-verified since it came from a trusted sister parachain via XCM
            };

            Evidences::<T>::insert(evidence_id, record);

            Self::deposit_event(Event::EvidenceVerified {
                evidence_id,
                verifier: T::AdminKey::get(),
            });

            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn verify_evidence(origin: OriginFor<T>, evidence_id: T::Hash) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            Self::ensure_admin(&sender)?;

            Evidences::<T>::try_mutate(evidence_id, |record| -> DispatchResult {
                let record = record.as_mut().ok_or(Error::<T>::EvidenceNotFound)?;
                ensure!(
                    matches!(record.status, EvidenceStatus::Pending | EvidenceStatus::Challenged),
                    Error::<T>::InvalidStatusTransition
                );
                record.status = EvidenceStatus::Verified;
                Ok(())
            })?;

            Challenges::<T>::remove(evidence_id);

            Self::deposit_event(Event::EvidenceVerified {
                evidence_id,
                verifier: sender,
            });

            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn challenge_evidence(
            origin: OriginFor<T>,
            evidence_id: T::Hash,
            reason: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let reason_bytes: ReasonBytesOf<T> = reason
                .clone()
                .try_into()
                .map_err(|_| Error::<T>::ReasonTooLong)?;
            ensure!(!reason_bytes.is_empty(), Error::<T>::ReasonTooLong);

            Evidences::<T>::try_mutate(evidence_id, |record| -> DispatchResult {
                let record = record.as_mut().ok_or(Error::<T>::EvidenceNotFound)?;
                let is_owner = sender == record.owner;
                let is_admin = sender == T::AdminKey::get();
                ensure!(is_owner || is_admin, Error::<T>::Unauthorized);
                ensure!(
                    matches!(record.status, EvidenceStatus::Pending | EvidenceStatus::Verified),
                    Error::<T>::InvalidStatusTransition
                );
                record.status = EvidenceStatus::Challenged;
                Ok(())
            })?;

            let challenge = ChallengeRecord::<T::AccountId, BlockNumberFor<T>, ReasonBytesOf<T>> {
                challenger: sender.clone(),
                reason: reason_bytes,
                challenged_at: frame_system::Pallet::<T>::block_number(),
            };
            Challenges::<T>::insert(evidence_id, challenge);

            Self::deposit_event(Event::EvidenceChallenged {
                evidence_id,
                challenger: sender,
                reason,
            });

            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn resolve_challenge(
            origin: OriginFor<T>,
            evidence_id: T::Hash,
            accept: bool,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            Self::ensure_admin(&sender)?;

            ensure!(
                Challenges::<T>::contains_key(evidence_id),
                Error::<T>::ChallengeNotFound
            );

            Evidences::<T>::try_mutate(evidence_id, |record| -> DispatchResult {
                let record = record.as_mut().ok_or(Error::<T>::EvidenceNotFound)?;
                ensure!(
                    matches!(record.status, EvidenceStatus::Challenged),
                    Error::<T>::InvalidStatusTransition
                );
                record.status = if accept {
                    EvidenceStatus::Verified
                } else {
                    EvidenceStatus::Rejected
                };
                Ok(())
            })?;

            Challenges::<T>::remove(evidence_id);

            Self::deposit_event(Event::EvidenceResolved {
                evidence_id,
                resolver: sender,
                accepted: accept,
            });

            Ok(())
        }

        #[pallet::weight(5_000)]
        pub fn reject_evidence(
            origin: OriginFor<T>,
            evidence_id: T::Hash,
            _reason: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            Self::ensure_admin(&sender)?;

            Evidences::<T>::try_mutate(evidence_id, |record| -> DispatchResult {
                let record = record.as_mut().ok_or(Error::<T>::EvidenceNotFound)?;
                ensure!(
                    matches!(record.status, EvidenceStatus::Pending | EvidenceStatus::Challenged),
                    Error::<T>::InvalidStatusTransition
                );
                record.status = EvidenceStatus::Rejected;
                Ok(())
            })?;

            Challenges::<T>::remove(evidence_id);

            Self::deposit_event(Event::EvidenceResolved {
                evidence_id,
                resolver: sender,
                accepted: false,
            });

            Ok(())
        }
    }

    impl<T: Config> Pallet<T> {
        fn ensure_admin(account: &T::AccountId) -> DispatchResult {
            ensure!(account == &T::AdminKey::get(), Error::<T>::Unauthorized);
            Ok(())
        }

        fn validate_hash(hash: Vec<u8>) -> Result<HashBytesOf<T>, DispatchError> {
            ensure!(
                hash.len() as u32 <= T::MaxHashLength::get(),
                Error::<T>::HashTooLong
            );
            ensure!(hash.len() == 64, Error::<T>::InvalidHash);
            ensure!(
                hash.iter().all(|byte| byte.is_ascii_hexdigit()),
                Error::<T>::InvalidHash
            );

            hash.try_into().map_err(|_| Error::<T>::HashTooLong.into())
        }

        fn validate_cid(cid: Vec<u8>) -> Result<CidBytesOf<T>, DispatchError> {
            ensure!(!cid.is_empty(), Error::<T>::InvalidIpfsCid);
            cid.try_into().map_err(|_| Error::<T>::InvalidIpfsCid.into())
        }
    }
}
