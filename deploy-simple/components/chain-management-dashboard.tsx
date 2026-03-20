"use client";

import { useState, useEffect } from "react";

interface ChainConfig {
  name: string;
  displayName: string;
  type: 'evm' | 'utxo' | 'substrate';
  rpcUrl: string;
  chainId?: number;
  explorerUrl?: string;
  testnet: boolean;
  active: boolean;
  blockTime?: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface ChainStats {
  total: number;
  active: number;
  mainnet: number;
  testnet: number;
  evm: number;
  utxo: number;
  substrate: number;
}

export default function ChainManagementDashboard() {
  const [chains, setChains] = useState<Record<string, ChainConfig>>({});
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'mainnet' | 'testnet' | 'evm' | 'utxo' | 'substrate'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchChains = async () => {
    try {
      const response = await fetch('/api/analytics/chains');
      if (!response.ok) throw new Error('Failed to fetch chains');
      
      const data = await response.json();
      setChains(data.configurations);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleChainStatus = async (chain: string, activate: boolean) => {
    try {
      const response = await fetch('/api/analytics/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain,
          action: activate ? 'activate' : 'deactivate'
        })
      });

      if (!response.ok) throw new Error('Failed to update chain status');
      
      await fetchChains();
    } catch (err) {
      console.error('Error updating chain status:', err);
    }
  };

  useEffect(() => {
    fetchChains();
  }, []);

  const getFilteredChains = () => {
    let filteredChains = Object.entries(chains);

    // Apply filter
    switch (filter) {
      case 'active':
        filteredChains = filteredChains.filter(([_, config]) => config.active);
        break;
      case 'mainnet':
        filteredChains = filteredChains.filter(([_, config]) => !config.testnet);
        break;
      case 'testnet':
        filteredChains = filteredChains.filter(([_, config]) => config.testnet);
        break;
      case 'evm':
        filteredChains = filteredChains.filter(([_, config]) => config.type === 'evm');
        break;
      case 'utxo':
        filteredChains = filteredChains.filter(([_, config]) => config.type === 'utxo');
        break;
      case 'substrate':
        filteredChains = filteredChains.filter(([_, config]) => config.type === 'substrate');
        break;
    }

    // Apply search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredChains = filteredChains.filter(([chain, config]) =>
        chain.toLowerCase().includes(lowerSearch) ||
        config.displayName.toLowerCase().includes(lowerSearch) ||
        config.type.toLowerCase().includes(lowerSearch)
      );
    }

    return filteredChains;
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'bg-green-500' : 'bg-gray-500';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'evm': return 'bg-blue-100 text-blue-800';
      case 'utxo': return 'bg-orange-100 text-orange-800';
      case 'substrate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNetworkColor = (testnet: boolean) => {
    return testnet ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2">Loading chain configurations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
        <div className="flex items-center gap-2 text-red-500">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Error: {error}</span>
          <button onClick={fetchChains} className="rounded-full border border-cloud/20 px-3 py-1 text-sm hover:bg-cloud/10">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredChains = getFilteredChains();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chain Management</h1>
          <p className="text-cloud/60">
            Manage and monitor all supported blockchain networks
          </p>
        </div>
        <button
          onClick={fetchChains}
          className="rounded-full border border-cloud/20 px-4 py-2 text-sm hover:bg-cloud/10"
        >
          <svg className="inline h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-7">
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">Mainnet</p>
            <p className="text-2xl font-bold">{stats.mainnet}</p>
          </div>
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">Testnet</p>
            <p className="text-2xl font-bold">{stats.testnet}</p>
          </div>
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">EVM</p>
            <p className="text-2xl font-bold text-blue-600">{stats.evm}</p>
          </div>
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">UTXO</p>
            <p className="text-2xl font-bold text-orange-600">{stats.utxo}</p>
          </div>
          <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-4">
            <p className="text-sm text-cloud/60">Substrate</p>
            <p className="text-2xl font-bold text-purple-600">{stats.substrate}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'mainnet', label: 'Mainnet' },
            { value: 'testnet', label: 'Testnet' },
            { value: 'evm', label: 'EVM' },
            { value: 'utxo', label: 'UTXO' },
            { value: 'substrate', label: 'Substrate' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'border border-cloud/20 hover:bg-cloud/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search chains..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-full border border-cloud/20 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Chains List */}
      <div className="rounded-xl border border-cloud/10 bg-canvas/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas/60">
              <tr>
                <th className="px-4 py-3 text-left">Chain</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Network</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Block Time</th>
                <th className="px-4 py-3 text-left">Currency</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChains.map(([chain, config]) => (
                <tr key={chain} className="border-t border-cloud/10">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{config.displayName}</div>
                      <div className="text-xs text-cloud/60 font-mono">{chain}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(config.type)}`}>
                      {config.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getNetworkColor(config.testnet)}`}>
                      {config.testnet ? 'TESTNET' : 'MAINNET'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(config.active)}`} />
                      <span>{config.active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {config.blockTime ? `${config.blockTime}s` : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{config.nativeCurrency.symbol}</div>
                      <div className="text-xs text-cloud/60">{config.nativeCurrency.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleChainStatus(chain, !config.active)}
                      className={`rounded-full px-3 py-1 text-xs ${
                        config.active
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {config.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredChains.length === 0 && (
          <div className="text-center py-8 text-cloud/60">
            No chains found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
