use super::*;

impl<T: Config> crate::pallet::pallet::pallet_prelude::ValueQuery for EvidenceStats {
    fn query() -> Self {
        Self {
            total_count: 0,
            pending_count: 0,
            verified_count: 0,
            rejected_count: 0,
            user_submissions: 0,
        }
    }
}

#[cfg(feature = "std")]
impl<T: Config> crate::pallet::pallet_prelude::ValueQuery for EvidenceStats {
    fn query() -> Self {
        Self {
            total_count: 0,
            pending_count: 0,
            verified_count: 0,
            rejected_count: 0,
            user_submissions: 0,
        }
    }
}
