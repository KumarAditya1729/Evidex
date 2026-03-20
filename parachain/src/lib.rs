#![cfg_attr(not(feature = "std"), no_std)]

// Make the WASM binary available.
#[cfg(feature = "std")]
include!(concat!(env!("OUT_DIR"), "/wasm_binary.rs"));

// Re-export runtime components
pub mod runtime;

use runtime::Runtime;

// Export the WASM binary
#[cfg(feature = "std")]
pub use wasm_binary::*;

/// The WASM binary was built from the runtime.
///
/// This is a workaround for a bug in the compiler where the type of the `WASM_BINARY`
/// constant is not inferred correctly. The issue is that the type is `Option<&'static [u8]>`,
/// but the compiler infers it as `Option<&[u8]>`. This is a problem because the
/// `Option<&[u8]>` type is not `Sync`, which is required for the constant to be
/// used in a static context. The workaround is to explicitly cast the constant to the
/// correct type.
#[cfg(feature = "std")]
pub fn wasm_binary_opt() -> Option<&'static [u8]> {
    WASM_BINARY.as_ref().map(|x| &x[..])
}
