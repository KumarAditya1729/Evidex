"use client";

import { useEffect, useState, useRef } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";

interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  evidenceHashes: string[]; // List of Keccak hashes anchored in this explicit block
  timestamp: number;
}

const SUBSTRATE_WSS = process.env.NEXT_PUBLIC_SUBSTRATE_RPC || "ws://127.0.0.1:9944";

export default function EvidenceExplorerPage() {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState({ totalBlocks: 0, totalEvidence: 0 });
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let api: ApiPromise;

    const connectToParachain = async () => {
      try {
        const provider = new WsProvider(SUBSTRATE_WSS);
        api = await ApiPromise.create({ provider });
        setIsConnected(true);

        // Natively subscribe to new Substrate block finalizations in Real-Time
        const unsub = await api.rpc.chain.subscribeNewHeads(async (header) => {
          const blockNumber = header.number.toNumber();
          const blockHash = header.hash.toHex();
          
          setMetrics(prev => ({ ...prev, totalBlocks: blockNumber }));

          // Pull the full block to check for our specific Evidence Pallet extrinsics
          const signedBlock = await api.rpc.chain.getBlock(blockHash);
          const evidenceFound: string[] = [];

          signedBlock.block.extrinsics.forEach((ex) => {
             // In a true deployment, we map the exact extrinsic index or decode the Call.
             // For this UI, we extract identifying metadata from the chain data.
             if (ex.method.section === 'evidence' && ex.method.method === 'submitEvidence') {
                // Parse the args (fileHash is usually Arg 0)
                const fileHashRaw = ex.method.args[0].toHex(); 
                evidenceFound.push(fileHashRaw);
             }
          });

          // Prepend the new block to our live feed
          const newBlock: BlockData = {
            number: blockNumber,
            hash: blockHash,
            parentHash: header.parentHash.toHex(),
            stateRoot: header.stateRoot.toHex(),
            evidenceHashes: evidenceFound, // Might be empty if it's just a consensus heartbeat
            timestamp: Date.now()
          };

          setBlocks((prevBlocks) => {
            // Keep the feed lightweight (last 20 blocks max)
            const updatedFeed = [newBlock, ...prevBlocks].slice(0, 20);
            return updatedFeed;
          });

          if (evidenceFound.length > 0) {
             setMetrics(prev => ({ ...prev, totalEvidence: prev.totalEvidence + evidenceFound.length }));
          }
        });

        unsubscribeRef.current = unsub;
      } catch (error) {
        console.error("Failed to connect to Parachain Explorer WSS:", error);
        setIsConnected(false);
      }
    };

    connectToParachain();

    return () => {
      if (unsubscribeRef.current) {
         unsubscribeRef.current();
      }
      if (api) {
         api.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Explorer Header */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-800 pb-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-widest text-emerald-400 uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
               Evidex Explorer
            </h1>
            <div className="flex items-center space-x-3">
               <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
               <p className="text-gray-400 text-sm">
                 {isConnected ? `Subscribed to WSS: ${SUBSTRATE_WSS}` : 'Attempting to reach Substrate node...'}
               </p>
            </div>
          </div>
          
          <div className="flex space-x-8 mt-6 md:mt-0 bg-gray-900 border border-gray-800 p-4 rounded-xl">
             <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Head Block</p>
                <p className="text-2xl font-bold text-white">{metrics.totalBlocks}</p>
             </div>
             <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Anchored Items</p>
                <p className="text-2xl font-bold text-blue-400">{metrics.totalEvidence}</p>
             </div>
          </div>
        </div>

        {/* Live Block Feed Matrix */}
        <div className="space-y-6">
          <h2 className="text-lg text-gray-400 uppercase tracking-widest font-semibold flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping mr-3"></span>
              Live Consensus Feed
          </h2>

          <div className="space-y-4">
             {blocks.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 text-center">
                   <p className="text-gray-500 animate-pulse">Awaiting first block heartbeat from Parachain...</p>
                </div>
             ) : (
                blocks.map((block, idx) => (
                  <div 
                     key={block.number} 
                     className={`rounded-2xl border p-6 transition-all duration-500 ${
                        idx === 0 
                           ? 'bg-blue-900/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-in slide-in-from-top-4 fade-in' 
                           : 'bg-black border-gray-800 opacity-70'
                     }`}
                  >
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                           <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${idx === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                              #{block.number}
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Block Hash</p>
                              <p className={`font-bold ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>{block.hash.substring(0, 20)}...</p>
                           </div>
                        </div>

                        <div className="text-left md:text-right hidden sm:block">
                           <p className="text-xs text-gray-500 uppercase tracking-wider">State Root</p>
                           <p className="text-gray-400">{block.stateRoot.substring(0, 16)}...</p>
                        </div>
                     </div>

                     {/* Highlight Actual Evidence if anchored in this block */}
                     {block.evidenceHashes.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
                           <p className="text-xs text-emerald-500 tracking-widest uppercase font-bold flex items-center">
                              <span className="mr-2">⚡</span> EVIDEX ANCHOR DETECTED
                           </p>
                           {block.evidenceHashes.map((hash, hIdx) => (
                              <div key={hIdx} className="bg-emerald-900/10 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-between">
                                 <code className="text-emerald-300 text-sm break-all">{hash}</code>
                                 <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded ml-4 uppercase">Keccak256</span>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
