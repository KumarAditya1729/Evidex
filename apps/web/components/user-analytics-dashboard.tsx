"use client";

import { useState, useEffect } from "react";

interface UserAnalyticsMetrics {
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
  recentActivity: Array<{
    id: string;
    type: 'evidence_uploaded' | 'transaction_created' | 'transaction_confirmed';
    timestamp: string;
    status: string;
    details: string;
  }>;
}

export default function UserAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<UserAnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/user');
      if (!response.ok) throw new Error('Failed to fetch user analytics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchUserAnalytics();
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'evidence_uploaded':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'transaction_created':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'transaction_confirmed':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'confirmed':
      case 'successful':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-cloud/60';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2">Loading your analytics...</span>
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
            onClick={fetchUserAnalytics} 
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
          <h1 className="text-3xl font-bold">Your Analytics</h1>
          <p className="text-cloud/60">
            Track your evidence uploads and transaction history
          </p>
        </div>
        <button
          onClick={fetchUserAnalytics}
          disabled={loading}
          className="rounded-full border border-cloud/20 px-4 py-2 text-sm hover:bg-cloud/10 disabled:opacity-50"
        >
          <svg className={`inline h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
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
        <h2 className="text-xl font-semibold mb-4">Transaction Summary</h2>
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

      {/* Recent Activity */}
      <div className="rounded-xl border border-cloud/10 bg-canvas/40 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {metrics?.recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-3 border border-cloud/10 rounded-lg">
              <div className="p-2 bg-cloud/10 rounded-lg">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{activity.details}</span>
                  <span className={`text-sm ${getStatusColor(activity.status)}`}>
                    ({activity.status})
                  </span>
                </div>
                <p className="text-sm text-cloud/60">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {(!metrics?.recentActivity || metrics.recentActivity.length === 0) && (
            <p className="text-center text-cloud/60 py-8">
              No recent activity found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
