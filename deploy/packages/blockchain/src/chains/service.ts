import type { SupportedChain } from "../types";
import type { ChainConfig } from "./config";
import { CHAIN_CONFIGS, getChainConfig, getActiveChains, getChainsByType } from "./config";

export class ChainConfigurationService {
  private static instance: ChainConfigurationService;
  private chainConfigs: Map<SupportedChain, ChainConfig>;

  private constructor() {
    this.chainConfigs = new Map();
    this.initializeChainConfigs();
  }

  static getInstance(): ChainConfigurationService {
    if (!ChainConfigurationService.instance) {
      ChainConfigurationService.instance = new ChainConfigurationService();
    }
    return ChainConfigurationService.instance;
  }

  private initializeChainConfigs(): void {
    Object.entries(CHAIN_CONFIGS).forEach(([chain, config]) => {
      this.chainConfigs.set(chain as SupportedChain, config);
    });
  }

  getChainConfig(chain: SupportedChain): ChainConfig | undefined {
    return this.chainConfigs.get(chain);
  }

  getAllChains(): SupportedChain[] {
    return Array.from(this.chainConfigs.keys());
  }

  getActiveChains(): SupportedChain[] {
    return Array.from(this.chainConfigs.entries())
      .filter(([_, config]) => config.active)
      .map(([chain]) => chain);
  }

  getChainsByType(type: 'evm' | 'utxo' | 'substrate'): SupportedChain[] {
    return Array.from(this.chainConfigs.entries())
      .filter(([_, config]) => config.type === type && config.active)
      .map(([chain]) => chain);
  }

  getMainnetChains(): SupportedChain[] {
    return Array.from(this.chainConfigs.entries())
      .filter(([_, config]) => config.active && !config.testnet)
      .map(([chain]) => chain);
  }

  getTestnetChains(): SupportedChain[] {
    return Array.from(this.chainConfigs.entries())
      .filter(([_, config]) => config.active && config.testnet)
      .map(([chain]) => chain);
  }

  isChainActive(chain: SupportedChain): boolean {
    const config = this.chainConfigs.get(chain);
    return config?.active ?? false;
  }

  isTestnet(chain: SupportedChain): boolean {
    const config = this.chainConfigs.get(chain);
    return config?.testnet ?? false;
  }

  getChainType(chain: SupportedChain): 'evm' | 'utxo' | 'substrate' | undefined {
    const config = this.chainConfigs.get(chain);
    return config?.type;
  }

  getChainRpcUrl(chain: SupportedChain): string | undefined {
    const config = this.chainConfigs.get(chain);
    return config?.rpcUrl;
  }

  getChainExplorerUrl(chain: SupportedChain): string | undefined {
    const config = this.chainConfigs.get(chain);
    return config?.explorerUrl;
  }

  getChainNativeCurrency(chain: SupportedChain) {
    const config = this.chainConfigs.get(chain);
    return config?.nativeCurrency;
  }

  getChainBlockTime(chain: SupportedChain): number | undefined {
    const config = this.chainConfigs.get(chain);
    return config?.blockTime;
  }

  getChainDisplayName(chain: SupportedChain): string {
    const config = this.chainConfigs.get(chain);
    return config?.displayName || chain;
  }

  updateChainConfig(chain: SupportedChain, updates: Partial<ChainConfig>): void {
    const existingConfig = this.chainConfigs.get(chain);
    if (existingConfig) {
      const updatedConfig = { ...existingConfig, ...updates };
      this.chainConfigs.set(chain, updatedConfig);
    }
  }

  activateChain(chain: SupportedChain): void {
    this.updateChainConfig(chain, { active: true });
  }

  deactivateChain(chain: SupportedChain): void {
    this.updateChainConfig(chain, { active: false });
  }

  getChainStats(): {
    total: number;
    active: number;
    mainnet: number;
    testnet: number;
    evm: number;
    utxo: number;
    substrate: number;
  } {
    const chains = Array.from(this.chainConfigs.values());
    
    return {
      total: chains.length,
      active: chains.filter(c => c.active).length,
      mainnet: chains.filter(c => c.active && !c.testnet).length,
      testnet: chains.filter(c => c.active && c.testnet).length,
      evm: chains.filter(c => c.active && c.type === 'evm').length,
      utxo: chains.filter(c => c.active && c.type === 'utxo').length,
      substrate: chains.filter(c => c.active && c.type === 'substrate').length,
    };
  }

  validateChainConfig(chain: SupportedChain): {
    valid: boolean;
    errors: string[];
  } {
    const config = this.chainConfigs.get(chain);
    const errors: string[] = [];

    if (!config) {
      errors.push('Chain configuration not found');
      return { valid: false, errors };
    }

    if (!config.rpcUrl) {
      errors.push('RPC URL is required');
    }

    if (config.type === 'evm' && !config.chainId) {
      errors.push('Chain ID is required for EVM chains');
    }

    if (!config.displayName) {
      errors.push('Display name is required');
    }

    if (!config.nativeCurrency) {
      errors.push('Native currency configuration is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getChainsByBlockTime(maxBlockTime: number): SupportedChain[] {
    return Array.from(this.chainConfigs.entries())
      .filter(([_, config]) => config.active && config.blockTime && config.blockTime <= maxBlockTime)
      .map(([chain]) => chain);
  }

  searchChains(query: string): SupportedChain[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.chainConfigs.entries())
      .filter(([chain, config]) => 
        config.active && (
          chain.toLowerCase().includes(lowerQuery) ||
          config.displayName.toLowerCase().includes(lowerQuery) ||
          config.type.toLowerCase().includes(lowerQuery)
        )
      )
      .map(([chain]) => chain);
  }

  exportChainConfigs(): Record<string, ChainConfig> {
    const exported: Record<string, ChainConfig> = {};
    this.chainConfigs.forEach((config, chain) => {
      exported[chain] = { ...config };
    });
    return exported;
  }

  importChainConfigs(configs: Record<string, ChainConfig>): void {
    Object.entries(configs).forEach(([chain, config]) => {
      this.chainConfigs.set(chain as SupportedChain, config);
    });
  }
}

export const chainConfigurationService = ChainConfigurationService.getInstance();
