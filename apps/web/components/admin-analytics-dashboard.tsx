"use client";

import { useState, useEffect } from "react";

interface AnalyticsMetrics {
  timestamp: string;
  users: {
    total: number;
    active: number;
    new: number;
  };
  evidence: {
    total: number;
    verified: number;
    failed: number;
    pending: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageConfirmationTime: number;
  };
  chains: {
    [chain: string]: {
      transactionCount: number;
      successRate: number;
      averageBlockTime: number;
      lastBlockHeight?: number;
    };
  };
}

interface ChainProofStatus {
  chain: string;
  lastVerifiedBlock: number;
  lastVerifiedTimestamp: string;
  verificationStatus: 'healthy' | 'warning' | 'critical';
  blockProductionRate: number;
  reorgCount: number;
  issues: string[];
}

export default function AdminAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [chainStatus, setChainStatus] = useState<ChainProofStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchChainStatus = async () => {
    try {
      // Get all active chains from the chain configuration
      const response = await fetch('/api/analytics/chains/active');
      if (!response.ok) throw new Error('Failed to fetch active chains');
      
      const activeChains = await response.json();
      
      // Fetch status for each active chain
      const statusPromises = activeChains.map(async (chain: string) => {
        try {
          const statusResponse = await fetch(`/api/analytics/chain/${chain}`);
          if (statusResponse.ok) {
            return await statusResponse.json();
          }
          return null;
        } catch (error) {
          console.error(`Failed to fetch status for ${chain}:`, error);
          return null;
        }
      });
      
      const statuses = await Promise.all(statusPromises);
      setChainStatus(statuses.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch chain status:', err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchMetrics(), fetchChainStatus()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2">Loading analytics...</span>
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
          <button 
            onClick={refreshData} 
            className="rounded-full border border-cloud/20 px-3 py-1 text-sm hover:bg-cloud/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-cloud/60">
            Real-time monitoring of blockchain evidence operations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="rounded-full border border-cloud/20 px-4 py-2 text-sm hover:bg-cloud/10 disabled:opacity-50"
          >
            <svg className={`inline h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded-full px-4 py-2 text-sm ${
              autoRefresh 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'border border-cloud/20 hover:bg-cloud/10'
            }`}
          >
            Auto-refresh: {autoRefresh ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Total Users</p>
              <p className="text-2xl font-bold">{metrics?.users.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Active Users</p>
              <p className="text-2xl font-bold">{metrics?.users.active || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">New Users</p>
              <p className="text-2xl font-bold">{metrics?.users.new || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Last Updated</p>
              <p className="text-sm font-mono">
                {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Total Evidence</p>
              <p className="text-2xl font-bold">{metrics?.evidence.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Verified</p>
              <p className="text-2xl font-bold">{metrics?.evidence.verified || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Pending</p>
              <p className="text-2xl font-bold">{metrics?.evidence.pending || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-cloud/60">Failed</p>
              <p className="text-2xl font-bold">{metrics?.evidence.failed || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Metrics */}
      <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction Health</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-cloud/60">Total Transactions</p>
            <p className="text-2xl font-bold">{metrics?.transactions.total || 0}</p>
          </div>
          <div>
            <p className="text-sm text-cloud/60">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics?.transactions.total ? 
                Math.round((metrics.transactions.successful / metrics.transactions.total) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-cloud/60">Failed</p>
            <p className="text-2xl font-bold text-red-600">{metrics?.transactions.failed || 0}</p>
          </div>
          <div>
            <p className="text-sm text-cloud/60">Avg Confirmation</p>
            <p className="text-2xl font-bold">
              {metrics?.transactions.averageConfirmationTime ? 
                formatDuration(metrics.transactions.averageConfirmationTime) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Chain Status */}
      <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Chain Proof Status</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {chainStatus.map((status) => (
            <div key={status.chain} className="border border-cloud/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold capitalize">{status.chain}</h3>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.verificationStatus)}`} />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-cloud/60">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    status.verificationStatus === 'healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {status.verificationStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud/60">Block:</span>
                  <span className="font-mono">{status.lastVerifiedBlock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud/60">Rate:</span>
                  <span>{status.blockProductionRate.toFixed(2)}/min</span>
                </div>
              </div>
              {status.issues.length > 0 && (
                <div className="mt-2 text-xs text-red-500">
                  {status.issues[0]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
