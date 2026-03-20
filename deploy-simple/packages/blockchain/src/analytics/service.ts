import type { BlockchainService } from '../service';
import type { 
  AnalyticsMetrics, 
  TransactionHealthMetrics, 
  ChainProofStatus, 
  RealtimeAnalyticsEvent,
  AnalyticsDashboardConfig 
} from './types';
import { createBlockchainServiceFromEnv } from '../service';

export class AnalyticsService {
  private blockchainService!: BlockchainService;
  private config: AnalyticsDashboardConfig;
  private metricsCache: AnalyticsMetrics | null = null;
  private lastCacheUpdate: Date | null = null;
  private eventListeners: Map<string, ((event: RealtimeAnalyticsEvent) => void)[]> = new Map();

  constructor(config: AnalyticsDashboardConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.blockchainService = await createBlockchainServiceFromEnv();
    // Start background monitoring
    this.startRealtimeMonitoring();
  }

  // Main analytics data collection
  async collectMetrics(): Promise<AnalyticsMetrics> {
    const now = new Date();
    
    // Check cache validity
    if (this.metricsCache && this.lastCacheUpdate && 
        (now.getTime() - this.lastCacheUpdate.getTime()) < this.config.refreshInterval) {
      return this.metricsCache;
    }

    const metrics: AnalyticsMetrics = {
      timestamp: now,
      users: await this.collectUserMetrics(),
      evidence: await this.collectEvidenceMetrics(),
      transactions: await this.collectTransactionMetrics(),
      chains: await this.collectChainMetrics()
    };

    this.metricsCache = metrics;
    this.lastCacheUpdate = now;
    
    return metrics;
  }

  // Transaction health monitoring
  async monitorTransactionHealth(txHash: string, chain: string): Promise<TransactionHealthMetrics> {
    try {
      const txDetails = await this.blockchainService.getTransactionDetails(chain as any, txHash);
      
      if (!txDetails) {
        return {
          txHash,
          chain,
          status: 'failed',
          timestamp: new Date(),
          healthScore: 0,
          issues: ['Transaction not found']
        };
      }

      const healthScore = this.calculateTransactionHealth(txDetails);
      const issues = this.identifyTransactionIssues(txDetails);

      return {
        txHash,
        chain,
        status: this.getTransactionStatus(txDetails),
        confirmationTime: txDetails.timestamp ? Date.now() - txDetails.timestamp * 1000 : undefined,
        blockHeight: txDetails.blockNumber,
        timestamp: new Date(),
        healthScore,
        issues
      };
    } catch (error) {
      return {
        txHash,
        chain,
        status: 'failed',
        timestamp: new Date(),
        healthScore: 0,
        issues: [`Error monitoring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Chain proof status monitoring
  async monitorChainProofStatus(chain: string): Promise<ChainProofStatus> {
    try {
      // This would integrate with the chain-specific proof verification
      // For now, returning a basic implementation
      const now = new Date();
      
      return {
        chain,
        lastVerifiedBlock: 0, // Would be fetched from chain
        lastVerifiedTimestamp: now,
        verificationStatus: 'healthy',
        blockProductionRate: 1.0, // Would be calculated from actual data
        reorgCount: 0,
        issues: []
      };
    } catch (error) {
      return {
        chain,
        lastVerifiedBlock: 0,
        lastVerifiedTimestamp: new Date(),
        verificationStatus: 'critical',
        blockProductionRate: 0,
        reorgCount: 0,
        issues: [`Chain monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Real-time event handling
  async emitRealtimeEvent(event: RealtimeAnalyticsEvent): Promise<void> {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in analytics event listener:', error);
      }
    });

    // Update cache for immediate consistency
    if (this.metricsCache) {
      this.updateMetricsFromEvent(this.metricsCache, event);
    }
  }

  subscribeToEvents(eventType: string, callback: (event: RealtimeAnalyticsEvent) => void): () => void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(callback);
    this.eventListeners.set(eventType, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.eventListeners.get(eventType) || [];
      const index = currentListeners.indexOf(callback);
      if (index > -1) {
        currentListeners.splice(index, 1);
        this.eventListeners.set(eventType, currentListeners);
      }
    };
  }

  // Private helper methods
  private async collectUserMetrics(): Promise<AnalyticsMetrics['users']> {
    // This would integrate with your user database
    // For now, returning placeholder data
    return {
      total: 0,
      active: 0,
      new: 0
    };
  }

  private async collectEvidenceMetrics(): Promise<AnalyticsMetrics['evidence']> {
    // This would integrate with your evidence database
    return {
      total: 0,
      verified: 0,
      failed: 0,
      pending: 0
    };
  }

  private async collectTransactionMetrics(): Promise<AnalyticsMetrics['transactions']> {
    // This would aggregate transaction data from all chains
    return {
      total: 0,
      successful: 0,
      failed: 0,
      pending: 0,
      averageConfirmationTime: 0
    };
  }

  private async collectChainMetrics(): Promise<AnalyticsMetrics['chains']> {
    const chains = this.blockchainService.getSupportedChains();
    const metrics: AnalyticsMetrics['chains'] = {};

    for (const chain of chains) {
      metrics[chain] = {
        transactionCount: 0,
        successRate: 100,
        averageBlockTime: 6000, // 6 seconds default
        lastBlockHeight: undefined
      };
    }

    return metrics;
  }

  private calculateTransactionHealth(txDetails: any): number {
    // Health score calculation based on various factors
    let score = 100;

    // Deduct points for confirmation time
    if (txDetails.timestamp) {
      const confirmationTime = Date.now() - txDetails.timestamp * 1000;
      if (confirmationTime > 300000) { // 5 minutes
        score -= 20;
      }
    }

    // Deduct points for failed status
    if (txDetails.success === false) {
      score -= 50;
    }

    return Math.max(0, score);
  }

  private identifyTransactionIssues(txDetails: any): string[] {
    const issues: string[] = [];

    if (txDetails.success === false) {
      issues.push('Transaction failed');
    }

    if (txDetails.timestamp) {
      const confirmationTime = Date.now() - txDetails.timestamp * 1000;
      if (confirmationTime > 300000) {
        issues.push('Slow confirmation time');
      }
    }

    if (!txDetails.blockNumber) {
      issues.push('Transaction not yet included in block');
    }

    return issues;
  }

  private getTransactionStatus(txDetails: any): TransactionHealthMetrics['status'] {
    if (txDetails.success === false) return 'failed';
    if (txDetails.blockNumber) return 'confirmed';
    return 'pending';
  }

  private updateMetricsFromEvent(metrics: AnalyticsMetrics, event: RealtimeAnalyticsEvent): void {
    switch (event.type) {
      case 'user_registered':
        metrics.users.new++;
        metrics.users.total++;
        break;
      case 'evidence_uploaded':
        metrics.evidence.total++;
        metrics.evidence.pending++;
        break;
      case 'transaction_created':
        metrics.transactions.total++;
        metrics.transactions.pending++;
        break;
      case 'transaction_confirmed':
        metrics.transactions.successful++;
        metrics.transactions.pending--;
        break;
      case 'transaction_failed':
        metrics.transactions.failed++;
        metrics.transactions.pending--;
        break;
    }
  }

  private startRealtimeMonitoring(): void {
    // Set up periodic monitoring
    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Error in periodic analytics collection:', error);
      }
    }, this.config.refreshInterval);
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

export async function getAnalyticsService(): Promise<AnalyticsService> {
  if (!analyticsService) {
    const config: AnalyticsDashboardConfig = {
      refreshInterval: 30000, // 30 seconds
      retentionPeriod: 90, // 90 days
      alertThresholds: {
        transactionFailureRate: 10, // 10%
        chainBlockDelay: 5, // 5 minutes
        userActivityDrop: 20 // 20%
      }
    };

    analyticsService = new AnalyticsService(config);
    await analyticsService.initialize();
  }

  return analyticsService;
}
