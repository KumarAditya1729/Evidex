export interface AnalyticsMetrics {
  timestamp: Date;
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

export interface TransactionHealthMetrics {
  txHash: string;
  chain: string;
  status: 'pending' | 'confirmed' | 'failed' | 'reorg';
  confirmationTime?: number;
  blockHeight?: number;
  timestamp: Date;
  healthScore: number; // 0-100
  issues: string[];
}

export interface ChainProofStatus {
  chain: string;
  lastVerifiedBlock: number;
  lastVerifiedTimestamp: Date;
  verificationStatus: 'healthy' | 'warning' | 'critical';
  blockProductionRate: number; // blocks per minute
  reorgCount: number;
  issues: string[];
}

export interface RealtimeAnalyticsEvent {
  type: 'transaction_created' | 'transaction_confirmed' | 'transaction_failed' | 'user_registered' | 'evidence_uploaded';
  timestamp: Date;
  data: any;
  userId?: string;
  chain?: string;
}

export interface AnalyticsDashboardConfig {
  refreshInterval: number; // milliseconds
  retentionPeriod: number; // days
  alertThresholds: {
    transactionFailureRate: number; // percentage
    chainBlockDelay: number; // minutes
    userActivityDrop: number; // percentage
  };
}
