// @ts-nocheck
"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { EvidexLightClientRelayer } from "@evidex/sdk/dist/lightclient"; // Requires mapping the dist or exporting it from index

// Temporary placeholder for the exact deployed EVM address
const LIGHT_CLIENT_ADDRESS = process.env.NEXT_PUBLIC_EVM_LIGHT_CLIENT || "0x0000000000000000000000000000000000000000";
const SUBSTRATE_RPC = process.env.NEXT_PUBLIC_SUBSTRATE_RPC || "ws://127.0.0.1:9944";

export default function EvidenceVerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  
  // Auditing Context
  const [anchorAccount, setAnchorAccount] = useState("");
  const [blockHash, setBlockHash] = useState("");
  
  // UI State
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<'IDLE' | 'PASS' | 'FAIL'>('IDLE');
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setVerificationResult('IDLE');
      setErrorReason(null);
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const hash = ethers.keccak256(uint8);
      setComputedHash(hash);
    }
  };

  const executeCrossChainAudit = async () => {
    if (!computedHash || !anchorAccount) return;

    try {
      setIsVerifying(true);
      setActiveStep("Connecting to Ethereum and Substrate nodes...");
      
      // 1. Initialize Web3 Provider (E.g. Metamask or a Read-Only public node like Infura/Alchemy)
      // Since verifyProof is a state-changing function in Phase 1 (for simulation), we need a signer.
      // If we made it view-only, we would just need a provider. For now, we simulate the Provider injection.
      if (!window.ethereum) throw new Error("Web3 Wallet not found. Please install MetaMask to run the Ethereum Verifier.");
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      // 2. Initialize the EVIDEX Light Client Abstraction
      const relayer = new EvidexLightClientRelayer({
        substrateRpcUrl: SUBSTRATE_RPC,
        ethContractAddress: LIGHT_CLIENT_ADDRESS,
        ethSigner: signer
      });

      setActiveStep("Extracting Raw Trie Proof from Substrate Parachain...");
      // 3. Command the Relayer to extract the proof and query EVM directly
      // Note: This relies on the EvidexLightClientRelayer SDK code we wrote in Phase 8
      const tx = await relayer.verifyEvidenceCrossChain(anchorAccount, computedHash, blockHash || undefined);
      
      setActiveStep(`Waiting for Ethereum Consensus... Tx: ${tx.hash.substring(0, 10)}...`);
      await tx.wait();

      // If the tx doesn't revert, the Ethereum Light Client mathematically agreed!
      setVerificationResult('PASS');
      setActiveStep(null);
      
    } catch (error: any) {
      console.error(error);
      setVerificationResult('FAIL');
      setActiveStep(null);
      
      // Attempt to parse standard EVM reverting errors
      if (error.reason || error.message) {
         setErrorReason(error.reason || error.message);
      } else {
         setErrorReason("Cryptographic Hash Mismatch or Missing Block Anchor.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
            Cryptographic Auditor
          </h1>
          <p className="text-gray-400 text-lg">
            Verify Data Authenticity across Substrate and Ethereum simultaneously.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-8 transition-all">
          
          {/* Top Level: Document Drop */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest flex items-center justify-between">
              <span>1. Submit Suspect File</span>
              {computedHash && <span className="text-blue-400 text-xs">Generated Local Hash Active</span>}
            </label>
            
            <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer relative group ${computedHash ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 hover:border-blue-500 bg-black/50'}`}>
              <input 
                type="file" 
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {!file ? (
                <p className="text-gray-400 group-hover:text-blue-400 transition-colors">Drop document here to extract undeniable cryptographic signature</p>
              ) : (
                <div className="space-y-2">
                   <p className="text-blue-400 font-bold">{file.name}</p>
                   {computedHash && <p className="text-xs text-blue-200 font-mono break-all bg-black/50 p-2 rounded">{computedHash}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Audit Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">2. Anchor Authority (Wallet)</label>
              <input 
                type="text"
                placeholder="5FHneW46xCG..."
                value={anchorAccount}
                onChange={(e) => setAnchorAccount(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-widest">3. Substrate Block Hash</label>
              <input 
                type="text"
                placeholder="0x9a8b... (Optional, defaults to head)"
                value={blockHash}
                onChange={(e) => setBlockHash(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono text-sm"
              />
            </div>
          </div>

          <button 
              onClick={executeCrossChainAudit}
              disabled={!computedHash || !anchorAccount || isVerifying || verificationResult !== 'IDLE'}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !computedHash || !anchorAccount || isVerifying || verificationResult !== 'IDLE'
                  ? "bg-gray-800 text-gray-600 cursor-not-allowed" 
                  : "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-500/30"
              }`}
            >
              {isVerifying ? "Executing Cross-Chain Merkle Audit..." : "Execute Light Client Verification"}
          </button>

          {/* Verification Status Feedback Array */}
          <div className="space-y-4">
             {activeStep && (
                <div className="flex items-center space-x-3 text-orange-400 animate-pulse bg-orange-900/20 p-4 rounded-xl border border-orange-800/50">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium font-mono">{activeStep}</span>
                </div>
              )}

              {/* Verified Result Pass */}
              {verificationResult === 'PASS' && (
                 <div className="bg-emerald-900/20 border-2 border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                       <span className="text-5xl">✅</span>
                    </div>
                    <h2 className="text-3xl font-bold text-emerald-400 tracking-wide">VERIFIED AUTHENTIC</h2>
                    <p className="text-center text-emerald-200">
                       The Ethereum Light Client has mathematically proven that this exact document exists inside the Polkadot State Root without tampering.
                    </p>
                    <button onClick={() => { setVerificationResult('IDLE'); setFile(null); setComputedHash(null); }} className="mt-4 text-sm text-gray-400 hover:text-white underline">Audit Another File</button>
                 </div>
              )}

              {/* Verified Result Fail */}
              {verificationResult === 'FAIL' && (
                 <div className="bg-red-900/20 border-2 border-red-500 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                       <span className="text-5xl">❌</span>
                    </div>
                    <h2 className="text-3xl font-bold text-red-500 tracking-wide">STATE TAMPERED</h2>
                    <p className="text-center text-red-300 font-medium">
                       Cryptographic proof validation failed. This document does not strictly match the anchored Substrate State Root.
                    </p>
                    {errorReason && <p className="text-xs text-red-400/80 font-mono bg-black/50 p-2 rounded">{errorReason}</p>}
                    <button onClick={() => { setVerificationResult('IDLE'); setFile(null); setComputedHash(null); }} className="mt-4 text-sm text-gray-400 hover:text-white underline">Audit Another File</button>
                 </div>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}
