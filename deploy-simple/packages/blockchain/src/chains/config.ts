import type { SupportedChain } from "../types";

export interface ChainConfig {
  name: string;
  displayName: string;
  type: 'evm' | 'utxo' | 'substrate';
  rpcUrl: string;
  chainId?: number;
  explorerUrl?: string;
  testnet: boolean;
  active: boolean;
  blockTime?: number; // seconds
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  // Ethereum
  'ethereum': {
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    type: 'evm',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 1,
    explorerUrl: 'https://etherscan.io',
    testnet: false,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'ethereum-sepolia': {
    name: 'ethereum-sepolia',
    displayName: 'Ethereum Sepolia',
    type: 'evm',
    rpcUrl: process.env.ETHEREUM_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    testnet: true,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'ethereum-goerli': {
    name: 'ethereum-goerli',
    displayName: 'Ethereum Goerli',
    type: 'evm',
    rpcUrl: process.env.ETHEREUM_GOERLI_RPC_URL || 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 5,
    explorerUrl: 'https://goerli.etherscan.io',
    testnet: true,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'ethereum-holesky': {
    name: 'ethereum-holesky',
    displayName: 'Ethereum Holesky',
    type: 'evm',
    rpcUrl: process.env.ETHEREUM_HOLESKY_RPC_URL || 'https://holesky.infura.io/v3/YOUR_PROJECT_ID',
    chainId: 17000,
    explorerUrl: 'https://holesky.etherscan.io',
    testnet: true,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Polygon
  'polygon': {
    name: 'polygon',
    displayName: 'Polygon Mainnet',
    type: 'evm',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
    explorerUrl: 'https://polygonscan.com',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  'polygon-mumbai': {
    name: 'polygon-mumbai',
    displayName: 'Polygon Mumbai',
    type: 'evm',
    rpcUrl: process.env.POLYGON_MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    explorerUrl: 'https://mumbai.polygonscan.com',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  'polygon-amoy': {
    name: 'polygon-amoy',
    displayName: 'Polygon Amoy',
    type: 'evm',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    chainId: 80002,
    explorerUrl: 'https://amoy.polygonscan.com',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },

  // BSC
  'bsc': {
    name: 'bsc',
    displayName: 'BNB Smart Chain',
    type: 'evm',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    explorerUrl: 'https://bscscan.com',
    testnet: false,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  'bsc-testnet': {
    name: 'bsc-testnet',
    displayName: 'BNB Smart Chain Testnet',
    type: 'evm',
    rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97,
    explorerUrl: 'https://testnet.bscscan.com',
    testnet: true,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  'opbnb': {
    name: 'opbnb',
    displayName: 'opBNB Mainnet',
    type: 'evm',
    rpcUrl: process.env.OPBNB_RPC_URL || 'https://opbnb-mainnet-rpc.bnbchain.org',
    chainId: 204,
    explorerUrl: 'https://opbnbscan.com',
    testnet: false,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  'opbnb-testnet': {
    name: 'opbnb-testnet',
    displayName: 'opBNB Testnet',
    type: 'evm',
    rpcUrl: process.env.OPBNB_TESTNET_RPC_URL || 'https://opbnb-testnet-rpc.bnbchain.org',
    chainId: 5611,
    explorerUrl: 'https://testnet.opbnbscan.com',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 }
  },

  // Arbitrum
  'arbitrum': {
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    type: 'evm',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    explorerUrl: 'https://arbiscan.io',
    testnet: false,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'arbitrum-sepolia': {
    name: 'arbitrum-sepolia',
    displayName: 'Arbitrum Sepolia',
    type: 'evm',
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
    explorerUrl: 'https://sepolia.arbiscan.io',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'arbitrum-goerli': {
    name: 'arbitrum-goerli',
    displayName: 'Arbitrum Goerli',
    type: 'evm',
    rpcUrl: process.env.ARBITRUM_GOERLI_RPC_URL || 'https://endpoints.omniatech.io/v1/arbitrum/goerli/public',
    chainId: 421613,
    explorerUrl: 'https://goerli.arbiscan.io',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Optimism
  'optimism': {
    name: 'optimism',
    displayName: 'Optimism Mainnet',
    type: 'evm',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    explorerUrl: 'https://optimistic.etherscan.io',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'optimism-sepolia': {
    name: 'optimism-sepolia',
    displayName: 'Optimism Sepolia',
    type: 'evm',
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
    chainId: 11155420,
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'optimism-goerli': {
    name: 'optimism-goerli',
    displayName: 'Optimism Goerli',
    type: 'evm',
    rpcUrl: process.env.OPTIMISM_GOERLI_RPC_URL || 'https://goerli.optimism.io',
    chainId: 420,
    explorerUrl: 'https://goerli-optimism.etherscan.io',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Avalanche
  'avalanche': {
    name: 'avalanche',
    displayName: 'Avalanche C-Chain',
    type: 'evm',
    rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    explorerUrl: 'https://snowtrace.io',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }
  },
  'avalanche-fuji': {
    name: 'avalanche-fuji',
    displayName: 'Avalanche Fuji Testnet',
    type: 'evm',
    rpcUrl: process.env.AVALANCHE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113,
    explorerUrl: 'https://testnet.snowtrace.io',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 }
  },

  // Fantom
  'fantom': {
    name: 'fantom',
    displayName: 'Fantom Opera',
    type: 'evm',
    rpcUrl: process.env.FANTOM_RPC_URL || 'https://rpc.ftm.tools',
    chainId: 250,
    explorerUrl: 'https://ftmscan.com',
    testnet: false,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 }
  },
  'fantom-testnet': {
    name: 'fantom-testnet',
    displayName: 'Fantom Testnet',
    type: 'evm',
    rpcUrl: process.env.FANTOM_TESTNET_RPC_URL || 'https://rpc.testnet.fantom.network',
    chainId: 4002,
    explorerUrl: 'https://testnet.ftmscan.com',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 }
  },

  // Cronos
  'cronos': {
    name: 'cronos',
    displayName: 'Cronos Mainnet',
    type: 'evm',
    rpcUrl: process.env.CRONOS_RPC_URL || 'https://evm.cronos.org',
    chainId: 25,
    explorerUrl: 'https://cronoscan.com',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 }
  },
  'cronos-testnet': {
    name: 'cronos-testnet',
    displayName: 'Cronos Testnet',
    type: 'evm',
    rpcUrl: process.env.CRONOS_TESTNET_RPC_URL || 'https://evm-t3.cronos.org',
    chainId: 338,
    explorerUrl: 'https://testnet.cronoscan.com',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Cronos', symbol: 'tCRO', decimals: 18 }
  },

  // Celo
  'celo': {
    name: 'celo',
    displayName: 'Celo Mainnet',
    type: 'evm',
    rpcUrl: process.env.CELO_RPC_URL || 'https://forno.celo.org',
    chainId: 42220,
    explorerUrl: 'https://celoscan.io',
    testnet: false,
    active: true,
    blockTime: 5,
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }
  },
  'celo-alfajores': {
    name: 'celo-alfajores',
    displayName: 'Celo Alfajores',
    type: 'evm',
    rpcUrl: process.env.CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo.org',
    chainId: 44787,
    explorerUrl: 'https://alfajores.celoscan.io',
    testnet: true,
    active: true,
    blockTime: 5,
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }
  },
  'celo-baklava': {
    name: 'celo-baklava',
    displayName: 'Celo Baklava',
    type: 'evm',
    rpcUrl: process.env.CELO_BAKLAVA_RPC_URL || 'https://baklava-blockscout.celo.org/api/eth-rpc',
    chainId: 62320,
    explorerUrl: 'https://baklava.celoscan.io',
    testnet: true,
    active: true,
    blockTime: 5,
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 }
  },

  // Aurora
  'aurora': {
    name: 'aurora',
    displayName: 'Aurora Mainnet',
    type: 'evm',
    rpcUrl: process.env.AURORA_RPC_URL || 'https://mainnet.aurora.dev',
    chainId: 1313161554,
    explorerUrl: 'https://aurorascan.dev',
    testnet: false,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'aurora-testnet': {
    name: 'aurora-testnet',
    displayName: 'Aurora Testnet',
    type: 'evm',
    rpcUrl: process.env.AURORA_TESTNET_RPC_URL || 'https://testnet.aurora.dev',
    chainId: 1313161555,
    explorerUrl: 'https://testnet.aurorascan.dev',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Harmony
  'harmony': {
    name: 'harmony',
    displayName: 'Harmony Mainnet',
    type: 'evm',
    rpcUrl: process.env.HARMONY_RPC_URL || 'https://api.harmony.one',
    chainId: 1666600000,
    explorerUrl: 'https://explorer.harmony.one',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Harmony', symbol: 'ONE', decimals: 18 }
  },
  'harmony-testnet': {
    name: 'harmony-testnet',
    displayName: 'Harmony Testnet',
    type: 'evm',
    rpcUrl: process.env.HARMONY_TESTNET_RPC_URL || 'https://api.s0.b.hmny.io',
    chainId: 1666700000,
    explorerUrl: 'https://explorer.testnet.harmony.one',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Harmony', symbol: 'ONE', decimals: 18 }
  },

  // HECO
  'heco': {
    name: 'heco',
    displayName: 'HECO Mainnet',
    type: 'evm',
    rpcUrl: process.env.HECO_RPC_URL || 'https://http-mainnet.hecochain.com',
    chainId: 128,
    explorerUrl: 'https://hecoinfo.com',
    testnet: false,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'Huobi Token', symbol: 'HT', decimals: 18 }
  },
  'heco-testnet': {
    name: 'heco-testnet',
    displayName: 'HECO Testnet',
    type: 'evm',
    rpcUrl: process.env.HECO_TESTNET_RPC_URL || 'https://http-testnet.hecochain.com',
    chainId: 256,
    explorerUrl: 'https://testnet.hecoinfo.com',
    testnet: true,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'Huobi Token', symbol: 'HT', decimals: 18 }
  },

  // Moonbeam (EVM side of Substrate)
  'moonbeam': {
    name: 'moonbeam',
    displayName: 'Moonbeam',
    type: 'evm',
    rpcUrl: process.env.MOONBEAM_RPC_URL || 'https://rpc.api.moonbeam.network',
    chainId: 1284,
    explorerUrl: 'https://moonscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 }
  },
  'moonriver': {
    name: 'moonriver',
    displayName: 'Moonriver',
    type: 'evm',
    rpcUrl: process.env.MOONRIVER_RPC_URL || 'https://rpc.moonriver.moonbeam.network',
    chainId: 1285,
    explorerUrl: 'https://moonriver.moonscan.io',
    testnet: false,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 }
  },
  'moonbase': {
    name: 'moonbase',
    displayName: 'Moonbase Alpha',
    type: 'evm',
    rpcUrl: process.env.MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network',
    chainId: 1287,
    explorerUrl: 'https://moonbase.moonscan.io',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Glimmer', symbol: 'DEV', decimals: 18 }
  },

  // KCC
  'kcc': {
    name: 'kcc',
    displayName: 'KuCoin Community Chain',
    type: 'evm',
    rpcUrl: process.env.KCC_RPC_URL || 'https://rpc-mainnet.kcc.network',
    chainId: 321,
    explorerUrl: 'https://explorer.kcc.io',
    testnet: false,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'KCS', symbol: 'KCS', decimals: 18 }
  },
  'kcc-testnet': {
    name: 'kcc-testnet',
    displayName: 'KuCoin Community Chain Testnet',
    type: 'evm',
    rpcUrl: process.env.KCC_TESTNET_RPC_URL || 'https://rpc-testnet.kcc.network',
    chainId: 322,
    explorerUrl: 'https://explorer-testnet.kcc.io',
    testnet: true,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'KCS', symbol: 'KCS', decimals: 18 }
  },

  // Canto
  'canto': {
    name: 'canto',
    displayName: 'Canto Mainnet',
    type: 'evm',
    rpcUrl: process.env.CANTO_RPC_URL || 'https://canto.gravitychain.io',
    chainId: 7700,
    explorerUrl: 'https://tuber.canto.ne',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Canto', symbol: 'CANTO', decimals: 18 }
  },
  'canto-testnet': {
    name: 'canto-testnet',
    displayName: 'Canto Testnet',
    type: 'evm',
    rpcUrl: process.env.CANTO_TESTNET_RPC_URL || 'https://testnet-archive.plexnode.wtf',
    chainId: 7701,
    explorerUrl: 'https://testnet.tuber.canto.ne',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Canto', symbol: 'CANTO', decimals: 18 }
  },

  // Gnosis
  'gnosis': {
    name: 'gnosis',
    displayName: 'Gnosis Chain',
    type: 'evm',
    rpcUrl: process.env.GNOSIS_RPC_URL || 'https://rpc.gnosischain.com',
    chainId: 100,
    explorerUrl: 'https://gnosisscan.io',
    testnet: false,
    active: true,
    blockTime: 5,
    nativeCurrency: { name: 'xDAI', symbol: 'XDAI', decimals: 18 }
  },
  'gnosis-chiado': {
    name: 'gnosis-chiado',
    displayName: 'Gnosis Chiado',
    type: 'evm',
    rpcUrl: process.env.GNOSIS_CHIADO_RPC_URL || 'https://rpc.chiadochain.net',
    chainId: 10200,
    explorerUrl: 'https://chiado.gnosisscan.io',
    testnet: true,
    active: true,
    blockTime: 5,
    nativeCurrency: { name: 'xDAI', symbol: 'XDAI', decimals: 18 }
  },

  // Base
  'base': {
    name: 'base',
    displayName: 'Base Mainnet',
    type: 'evm',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
    explorerUrl: 'https://basescan.org',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'base-sepolia': {
    name: 'base-sepolia',
    displayName: 'Base Sepolia',
    type: 'evm',
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    chainId: 84532,
    explorerUrl: 'https://sepolia.basescan.org',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'base-goerli': {
    name: 'base-goerli',
    displayName: 'Base Goerli',
    type: 'evm',
    rpcUrl: process.env.BASE_GOERLI_RPC_URL || 'https://goerli.base.org',
    chainId: 84531,
    explorerUrl: 'https://goerli.basescan.org',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // zkSync
  'zksync': {
    name: 'zksync',
    displayName: 'zkSync Era Mainnet',
    type: 'evm',
    rpcUrl: process.env.ZKSYNC_RPC_URL || 'https://mainnet.era.zksync.io',
    chainId: 324,
    explorerUrl: 'https://explorer.zksync.io',
    testnet: false,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'zksync-testnet': {
    name: 'zksync-testnet',
    displayName: 'zkSync Era Testnet',
    type: 'evm',
    rpcUrl: process.env.ZKSYNC_TESTNET_RPC_URL || 'https://testnet.era.zksync.dev',
    chainId: 280,
    explorerUrl: 'https://sepolia.explorer.zksync.io',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Linea
  'linea': {
    name: 'linea',
    displayName: 'Linea Mainnet',
    type: 'evm',
    rpcUrl: process.env.LINEA_RPC_URL || 'https://rpc.linea.build',
    chainId: 59144,
    explorerUrl: 'https://lineascan.build',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'linea-testnet': {
    name: 'linea-testnet',
    displayName: 'Linea Testnet',
    type: 'evm',
    rpcUrl: process.env.LINEA_TESTNET_RPC_URL || 'https://rpc.goerli.linea.build',
    chainId: 59140,
    explorerUrl: 'https://goerli.lineascan.build',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Scroll
  'scroll': {
    name: 'scroll',
    displayName: 'Scroll Mainnet',
    type: 'evm',
    rpcUrl: process.env.SCROLL_RPC_URL || 'https://rpc.scroll.io',
    chainId: 534352,
    explorerUrl: 'https://scrollscan.com',
    testnet: false,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'scroll-sepolia': {
    name: 'scroll-sepolia',
    displayName: 'Scroll Sepolia',
    type: 'evm',
    rpcUrl: process.env.SCROLL_SEPOLIA_RPC_URL || 'https://sepolia-rpc.scroll.io',
    chainId: 534351,
    explorerUrl: 'https://sepolia.scrollscan.com',
    testnet: true,
    active: true,
    blockTime: 3,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Mantle
  'mantle': {
    name: 'mantle',
    displayName: 'Mantle Mainnet',
    type: 'evm',
    rpcUrl: process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz',
    chainId: 5000,
    explorerUrl: 'https://mantlescan.xyz',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 }
  },
  'mantle-testnet': {
    name: 'mantle-testnet',
    displayName: 'Mantle Testnet',
    type: 'evm',
    rpcUrl: process.env.MANTLE_TESTNET_RPC_URL || 'https://rpc.testnet.mantle.xyz',
    chainId: 5001,
    explorerUrl: 'https://testnet.mantlescan.xyz',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 }
  },

  // Blast
  'blast': {
    name: 'blast',
    displayName: 'Blast Mainnet',
    type: 'evm',
    rpcUrl: process.env.BLAST_RPC_URL || 'https://rpc.ankr.com/blast',
    chainId: 81457,
    explorerUrl: 'https://blastscan.io',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'blast-sepolia': {
    name: 'blast-sepolia',
    displayName: 'Blast Sepolia',
    type: 'evm',
    rpcUrl: process.env.BLAST_SEPOLIA_RPC_URL || 'https://sepolia.blast.io',
    chainId: 168587773,
    explorerUrl: 'https://sepolia.blastscan.io',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Mode
  'mode': {
    name: 'mode',
    displayName: 'Mode Mainnet',
    type: 'evm',
    rpcUrl: process.env.MODE_RPC_URL || 'https://mainnet.mode.network',
    chainId: 34443,
    explorerUrl: 'https://modescan.io',
    testnet: false,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  'mode-testnet': {
    name: 'mode-testnet',
    displayName: 'Mode Testnet',
    type: 'evm',
    rpcUrl: process.env.MODE_TESTNET_RPC_URL || 'https://sepolia.mode.network',
    chainId: 919,
    explorerUrl: 'https://sepolia.modescan.io',
    testnet: true,
    active: true,
    blockTime: 2,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },

  // Sei
  'sei': {
    name: 'sei',
    displayName: 'Sei Mainnet',
    type: 'evm',
    rpcUrl: process.env.SEI_RPC_URL || 'https://evm.sei.io',
    chainId: 713715,
    explorerUrl: 'https://seiscan.app',
    testnet: false,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Sei', symbol: 'SEI', decimals: 18 }
  },
  'sei-testnet': {
    name: 'sei-testnet',
    displayName: 'Sei Testnet',
    type: 'evm',
    rpcUrl: process.env.SEI_TESTNET_RPC_URL || 'https://evm.atlantic-2.seinetwork.io',
    chainId: 1328,
    explorerUrl: 'https://seiscan.app/atlantic-2',
    testnet: true,
    active: true,
    blockTime: 1,
    nativeCurrency: { name: 'Sei', symbol: 'SEI', decimals: 18 }
  },

  // Bitcoin-like Chains
  'bitcoin': {
    name: 'bitcoin',
    displayName: 'Bitcoin Mainnet',
    type: 'utxo',
    rpcUrl: process.env.BITCOIN_RPC_URL || 'https://blockstream.info/api',
    explorerUrl: 'https://blockstream.info',
    testnet: false,
    active: true,
    blockTime: 600,
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 }
  },
  'bitcoin-testnet': {
    name: 'bitcoin-testnet',
    displayName: 'Bitcoin Testnet',
    type: 'utxo',
    rpcUrl: process.env.BITCOIN_TESTNET_RPC_URL || 'https://blockstream.info/testnet/api',
    explorerUrl: 'https://blockstream.info/testnet',
    testnet: true,
    active: true,
    blockTime: 600,
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 }
  },
  'bitcoin-regtest': {
    name: 'bitcoin-regtest',
    displayName: 'Bitcoin Regtest',
    type: 'utxo',
    rpcUrl: process.env.BITCOIN_REGTEST_RPC_URL || 'http://localhost:18443',
    explorerUrl: 'http://localhost:3000',
    testnet: true,
    active: false,
    blockTime: 0,
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 }
  },

  'bitcoin-cash': {
    name: 'bitcoin-cash',
    displayName: 'Bitcoin Cash',
    type: 'utxo',
    rpcUrl: process.env.BITCOIN_CASH_RPC_URL || 'https://rest.bch.ninja/api/v1',
    explorerUrl: 'https://blockchair.com/bitcoin-cash',
    testnet: false,
    active: true,
    blockTime: 600,
    nativeCurrency: { name: 'Bitcoin Cash', symbol: 'BCH', decimals: 8 }
  },
  'bitcoin-cash-testnet': {
    name: 'bitcoin-cash-testnet',
    displayName: 'Bitcoin Cash Testnet',
    type: 'utxo',
    rpcUrl: process.env.BITCOIN_CASH_TESTNET_RPC_URL || 'https://rest.bch.ninja/api/v1/testnet',
    explorerUrl: 'https://blockchair.com/bitcoin-cash/testnet',
    testnet: true,
    active: true,
    blockTime: 600,
    nativeCurrency: { name: 'Bitcoin Cash', symbol: 'BCH', decimals: 8 }
  },

  'litecoin': {
    name: 'litecoin',
    displayName: 'Litecoin',
    type: 'utxo',
    rpcUrl: process.env.LITECOIN_RPC_URL || 'https://blockchair.com/litecoin/api',
    explorerUrl: 'https://blockchair.com/litecoin',
    testnet: false,
    active: true,
    blockTime: 150,
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 8 }
  },
  'litecoin-testnet': {
    name: 'litecoin-testnet',
    displayName: 'Litecoin Testnet',
    type: 'utxo',
    rpcUrl: process.env.LITECOIN_TESTNET_RPC_URL || 'https://blockchair.com/litecoin/testnet/api',
    explorerUrl: 'https://blockchair.com/litecoin/testnet',
    testnet: true,
    active: true,
    blockTime: 150,
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 8 }
  },

  'dogecoin': {
    name: 'dogecoin',
    displayName: 'Dogecoin',
    type: 'utxo',
    rpcUrl: process.env.DOGECOIN_RPC_URL || 'https://blockchair.com/dogecoin/api',
    explorerUrl: 'https://blockchair.com/dogecoin',
    testnet: false,
    active: true,
    blockTime: 60,
    nativeCurrency: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 }
  },
  'dogecoin-testnet': {
    name: 'dogecoin-testnet',
    displayName: 'Dogecoin Testnet',
    type: 'utxo',
    rpcUrl: process.env.DOGECOIN_TESTNET_RPC_URL || 'https://blockchair.com/dogecoin/testnet/api',
    explorerUrl: 'https://blockchair.com/dogecoin/testnet',
    testnet: true,
    active: true,
    blockTime: 60,
    nativeCurrency: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 }
  },

  'dash': {
    name: 'dash',
    displayName: 'Dash',
    type: 'utxo',
    rpcUrl: process.env.DASH_RPC_URL || 'https://blockchair.com/dash/api',
    explorerUrl: 'https://blockchair.com/dash',
    testnet: false,
    active: true,
    blockTime: 150,
    nativeCurrency: { name: 'Dash', symbol: 'DASH', decimals: 8 }
  },
  'dash-testnet': {
    name: 'dash-testnet',
    displayName: 'Dash Testnet',
    type: 'utxo',
    rpcUrl: process.env.DASH_TESTNET_RPC_URL || 'https://blockchair.com/dash/testnet/api',
    explorerUrl: 'https://blockchair.com/dash/testnet',
    testnet: true,
    active: true,
    blockTime: 150,
    nativeCurrency: { name: 'Dash', symbol: 'DASH', decimals: 8 }
  },

  'zcash': {
    name: 'zcash',
    displayName: 'Zcash',
    type: 'utxo',
    rpcUrl: process.env.ZCASH_RPC_URL || 'https://blockchair.com/zcash/api',
    explorerUrl: 'https://blockchair.com/zcash',
    testnet: false,
    active: true,
    blockTime: 75,
    nativeCurrency: { name: 'Zcash', symbol: 'ZEC', decimals: 8 }
  },
  'zcash-testnet': {
    name: 'zcash-testnet',
    displayName: 'Zcash Testnet',
    type: 'utxo',
    rpcUrl: process.env.ZCASH_TESTNET_RPC_URL || 'https://blockchair.com/zcash/testnet/api',
    explorerUrl: 'https://blockchair.com/zcash/testnet',
    testnet: true,
    active: true,
    blockTime: 75,
    nativeCurrency: { name: 'Zcash', symbol: 'ZEC', decimals: 8 }
  },

  // Substrate Chains
  'polkadot': {
    name: 'polkadot',
    displayName: 'Polkadot',
    type: 'substrate',
    rpcUrl: process.env.POLKADOT_WS_URL || 'wss://rpc.polkadot.io',
    explorerUrl: 'https://polkadot.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 }
  },
  'polkadot-westend': {
    name: 'polkadot-westend',
    displayName: 'Polkadot Westend',
    type: 'substrate',
    rpcUrl: process.env.POLKADOT_WESTEND_WS_URL || 'wss://westend-rpc.polkadot.io',
    explorerUrl: 'https://westend.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 }
  },
  'polkadot-rococo': {
    name: 'polkadot-rococo',
    displayName: 'Polkadot Rococo',
    type: 'substrate',
    rpcUrl: process.env.POLKADOT_ROCOCO_WS_URL || 'wss://rococo-rpc.polkadot.io',
    explorerUrl: 'https://rococo.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 }
  },

  'kusama': {
    name: 'kusama',
    displayName: 'Kusama',
    type: 'substrate',
    rpcUrl: process.env.KUSAMA_WS_URL || 'wss://kusama-rpc.polkadot.io',
    explorerUrl: 'https://kusama.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Kusama', symbol: 'KSM', decimals: 12 }
  },
  'kusama-westend': {
    name: 'kusama-westend',
    displayName: 'Kusama Westend',
    type: 'substrate',
    rpcUrl: process.env.KUSAMA_WESTEND_WS_URL || 'wss://westend-rpc.polkadot.io',
    explorerUrl: 'https://westend.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Kusama', symbol: 'KSM', decimals: 12 }
  },

  'acala': {
    name: 'acala',
    displayName: 'Acala',
    type: 'substrate',
    rpcUrl: process.env.ACALA_WS_URL || 'wss://acala-polkadot.api.onfinality.io/public-ws',
    explorerUrl: 'https://acala.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Acala', symbol: 'ACA', decimals: 12 }
  },
  'acala-mandala': {
    name: 'acala-mandala',
    displayName: 'Acala Mandala',
    type: 'substrate',
    rpcUrl: process.env.ACALA_MANDALA_WS_URL || 'wss://mandala-rpc.acala.io/public-ws',
    explorerUrl: 'https://mandala.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Acala', symbol: 'ACA', decimals: 12 }
  },

  'karura': {
    name: 'karura',
    displayName: 'Karura',
    type: 'substrate',
    rpcUrl: process.env.KARURA_WS_URL || 'wss://karura.api.onfinality.io/public-ws',
    explorerUrl: 'https://karura.subscan.io',
    testnet: false,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Karura', symbol: 'KSM', decimals: 12 }
  },
  'karura-testnet': {
    name: 'karura-testnet',
    displayName: 'Karura Testnet',
    type: 'substrate',
    rpcUrl: process.env.KARURA_TESTNET_WS_URL || 'wss://karura-testnet.api.onfinality.io/public-ws',
    explorerUrl: 'https://testnet.karura.subscan.io',
    testnet: true,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Karura', symbol: 'KSM', decimals: 12 }
  },

  'parallel': {
    name: 'parallel',
    displayName: 'Parallel',
    type: 'substrate',
    rpcUrl: process.env.PARALLEL_WS_URL || 'wss://rpc.parallel.fi',
    explorerUrl: 'https://parallel.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Parallel', symbol: 'PARA', decimals: 12 }
  },
  'parallel-heiko': {
    name: 'parallel-heiko',
    displayName: 'Parallel Heiko',
    type: 'substrate',
    rpcUrl: process.env.PARALLEL_HEIKO_WS_URL || 'wss://heiko.rpc.parallel.fi',
    explorerUrl: 'https://heiko.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Parallel', symbol: 'PARA', decimals: 12 }
  },

  'astar': {
    name: 'astar',
    displayName: 'Astar',
    type: 'substrate',
    rpcUrl: process.env.ASTAR_WS_URL || 'wss://rpc.astar.network',
    explorerUrl: 'https://astar.subscan.io',
    testnet: false,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Astar', symbol: 'ASTR', decimals: 18 }
  },
  'astar-shiden': {
    name: 'astar-shiden',
    displayName: 'Astar Shiden',
    type: 'substrate',
    rpcUrl: process.env.ASTAR_SHIDEN_WS_URL || 'wss://rpc.shiden.astar.network',
    explorerUrl: 'https://shiden.subscan.io',
    testnet: false,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Astar', symbol: 'ASTR', decimals: 18 }
  },

  'shiden': {
    name: 'shiden',
    displayName: 'Shiden',
    type: 'substrate',
    rpcUrl: process.env.SHIDEN_WS_URL || 'wss://rpc.shiden.astar.network',
    explorerUrl: 'https://shiden.subscan.io',
    testnet: false,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Astar', symbol: 'ASTR', decimals: 18 }
  },
  'shiden-testnet': {
    name: 'shiden-testnet',
    displayName: 'Shiden Testnet',
    type: 'substrate',
    rpcUrl: process.env.SHIDEN_TESTNET_WS_URL || 'wss://testnet-rpc.shiden.astar.network',
    explorerUrl: 'https://testnet.shiden.subscan.io',
    testnet: true,
    active: true,
    blockTime: 12,
    nativeCurrency: { name: 'Astar', symbol: 'ASTR', decimals: 18 }
  },

  'centrifuge': {
    name: 'centrifuge',
    displayName: 'Centrifuge',
    type: 'substrate',
    rpcUrl: process.env.CENTRIFUGE_WS_URL || 'wss://rpc.polkadot.centrifuge.io',
    explorerUrl: 'https://centrifuge.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Centrifuge', symbol: 'CFG', decimals: 18 }
  },
  'centrifuge-altair': {
    name: 'centrifuge-altair',
    displayName: 'Centrifuge Altair',
    type: 'substrate',
    rpcUrl: process.env.CENTRIFUGE_ALTAIR_WS_URL || 'wss://altair-rpc.polkadot.centrifuge.io',
    explorerUrl: 'https://altair.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Centrifuge', symbol: 'CFG', decimals: 18 }
  },

  'equilibrium': {
    name: 'equilibrium',
    displayName: 'Equilibrium',
    type: 'substrate',
    rpcUrl: process.env.EQUILIBRIUM_WS_URL || 'wss://rpc.equilibrium.io',
    explorerUrl: 'https://equilibrium.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Equilibrium', symbol: 'EQ', decimals: 18 }
  },
  'equilibrium-testnet': {
    name: 'equilibrium-testnet',
    displayName: 'Equilibrium Testnet',
    type: 'substrate',
    rpcUrl: process.env.EQUILIBRIUM_TESTNET_WS_URL || 'wss://testnet.rpc.equilibrium.io',
    explorerUrl: 'https://testnet.equilibrium.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Equilibrium', symbol: 'EQ', decimals: 18 }
  },

  'sora': {
    name: 'sora',
    displayName: 'Sora',
    type: 'substrate',
    rpcUrl: process.env.SORA_WS_URL || 'wss://ws.sora.org',
    explorerUrl: 'https://sora.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Sora', symbol: 'XOR', decimals: 18 }
  },
  'sora-testnet': {
    name: 'sora-testnet',
    displayName: 'Sora Testnet',
    type: 'substrate',
    rpcUrl: process.env.SORA_TESTNET_WS_URL || 'wss://testnet.sora.org',
    explorerUrl: 'https://testnet.sora.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Sora', symbol: 'XOR', decimals: 18 }
  },

  'kilt': {
    name: 'kilt',
    displayName: 'Kilt',
    type: 'substrate',
    rpcUrl: process.env.KILT_WS_URL || 'wss://spiritnet.kilt.io',
    explorerUrl: 'https://kilt.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Kilt', symbol: 'KILT', decimals: 15 }
  },
  'kilt-peregrine': {
    name: 'kilt-peregrine',
    displayName: 'Kilt Peregrine',
    type: 'substrate',
    rpcUrl: process.env.KILT_PEREGRINE_WS_URL || 'wss://peregrine.kilt.io',
    explorerUrl: 'https://peregrine.kilt.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Kilt', symbol: 'KILT', decimals: 15 }
  },

  'unique': {
    name: 'unique',
    displayName: 'Unique',
    type: 'substrate',
    rpcUrl: process.env.UNIQUE_WS_URL || 'wss://rpc.unique.network',
    explorerUrl: 'https://unique.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Unique', symbol: 'UNQ', decimals: 18 }
  },
  'unique-testnet': {
    name: 'unique-testnet',
    displayName: 'Unique Testnet',
    type: 'substrate',
    rpcUrl: process.env.UNIQUE_TESTNET_WS_URL || 'wss://rpc-testnet.unique.network',
    explorerUrl: 'https://testnet.unique.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Unique', symbol: 'UNQ', decimals: 18 }
  },

  'quartz': {
    name: 'quartz',
    displayName: 'Quartz',
    type: 'substrate',
    rpcUrl: process.env.QUARTZ_WS_URL || 'wss://rpc.quartz.unique.network',
    explorerUrl: 'https://quartz.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Unique', symbol: 'UNQ', decimals: 18 }
  },
  'quartz-testnet': {
    name: 'quartz-testnet',
    displayName: 'Quartz Testnet',
    type: 'substrate',
    rpcUrl: process.env.QUARTZ_TESTNET_WS_URL || 'wss://rpc-testnet.quartz.unique.network',
    explorerUrl: 'https://testnet.quartz.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Unique', symbol: 'UNQ', decimals: 18 }
  },

  'varaverse': {
    name: 'varaverse',
    displayName: 'Varaverse',
    type: 'substrate',
    rpcUrl: process.env.VARAVERSE_WS_URL || 'wss://rpc.vara.network',
    explorerUrl: 'https://vara.subscan.io',
    testnet: false,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Varaverse', symbol: 'VARA', decimals: 12 }
  },
  'varaverse-testnet': {
    name: 'varaverse-testnet',
    displayName: 'Varaverse Testnet',
    type: 'substrate',
    rpcUrl: process.env.VARAVERSE_TESTNET_WS_URL || 'wss://testnet-rpc.vara.network',
    explorerUrl: 'https://testnet.vara.subscan.io',
    testnet: true,
    active: true,
    blockTime: 6,
    nativeCurrency: { name: 'Varaverse', symbol: 'VARA', decimals: 12 }
  },

  // Custom chains
  'custom-1': {
    name: 'custom-1',
    displayName: 'Custom Chain 1',
    type: 'evm',
    rpcUrl: process.env.CUSTOM_1_RPC_URL || 'https://custom-1.example.com',
    chainId: 999999,
    explorerUrl: 'https://custom-1-explorer.example.com',
    testnet: false,
    active: false,
    blockTime: 5,
    nativeCurrency: { name: 'Custom', symbol: 'CUSTOM', decimals: 18 }
  },
  'custom-2': {
    name: 'custom-2',
    displayName: 'Custom Chain 2',
    type: 'substrate',
    rpcUrl: process.env.CUSTOM_2_WS_URL || 'wss://custom-2.example.com',
    explorerUrl: 'https://custom-2-explorer.example.com',
    testnet: false,
    active: false,
    blockTime: 6,
    nativeCurrency: { name: 'Custom', symbol: 'CUSTOM', decimals: 12 }
  },
  'custom-3': {
    name: 'custom-3',
    displayName: 'Custom Chain 3',
    type: 'utxo',
    rpcUrl: process.env.CUSTOM_3_RPC_URL || 'https://custom-3.example.com',
    explorerUrl: 'https://custom-3-explorer.example.com',
    testnet: false,
    active: false,
    blockTime: 120,
    nativeCurrency: { name: 'Custom', symbol: 'CUSTOM', decimals: 8 }
  }
};

export function getChainConfig(chain: SupportedChain): ChainConfig {
  return CHAIN_CONFIGS[chain];
}

export function getActiveChains(): SupportedChain[] {
  return Object.entries(CHAIN_CONFIGS)
    .filter(([_, config]) => config.active)
    .map(([chain]) => chain as SupportedChain);
}

export function getChainsByType(type: 'evm' | 'utxo' | 'substrate'): SupportedChain[] {
  return Object.entries(CHAIN_CONFIGS)
    .filter(([_, config]) => config.type === type && config.active)
    .map(([chain]) => chain as SupportedChain);
}

export function getMainnetChains(): SupportedChain[] {
  return Object.entries(CHAIN_CONFIGS)
    .filter(([_, config]) => config.active && !config.testnet)
    .map(([chain]) => chain as SupportedChain);
}

export function getTestnetChains(): SupportedChain[] {
  return Object.entries(CHAIN_CONFIGS)
    .filter(([_, config]) => config.active && config.testnet)
    .map(([chain]) => chain as SupportedChain);
}
