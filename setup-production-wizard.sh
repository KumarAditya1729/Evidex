#!/bin/bash

# 🚀 EVIDEX PRODUCTION SETUP WIZARD
# ===================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

error() {
    echo -e "${RED}ERROR:${NC} $1"
    exit 1
}

echo -e "${GREEN}🚀 EVIDEX PRODUCTION SETUP WIZARD${NC}"
echo "=================================="
echo ""
echo "This wizard will help you configure production-ready .env file"
echo ""

# Function to generate secure secrets
generate_secret() {
    openssl rand -hex 32 2>/dev/null || date +%s | sha256sum | head -c 64
}

# Function to prompt for input with validation
prompt_input() {
    local prompt=$1
    local var_name=$2
    local is_secret=$3
    local validation_pattern=$4
    
    echo -e "${YELLOW}$prompt${NC}"
    
    if [ "$is_secret" = "true" ]; then
        read -s -p "> " input
        echo ""  # New line after secret input
    else
        read -p "> " input
    fi
    
    # Validate input if pattern provided
    if [ -n "$validation_pattern" ] && [ -n "$input" ]; then
        if ! echo "$input" | grep -E "$validation_pattern" > /dev/null; then
            error "Invalid input format for $prompt"
        fi
    fi
    
    eval "$var_name='$input'"
}

echo ""
echo "📋 STEP 1: CORE CONFIGURATION"
echo "================================"

# Domain Configuration
prompt_input "Enter your production domain (e.g., evidex.com):" "DOMAIN" "false" "^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
NEXT_PUBLIC_APP_URL="https://$DOMAIN"

# Database Configuration
prompt_input "Enter database host:" "DB_HOST" "false"
prompt_input "Enter database port (default 5432):" "DB_PORT" "false" "^[0-9]+$"
DB_PORT=${DB_PORT:-5432}

prompt_input "Enter database name (default evidex):" "DB_NAME" "false"
DB_NAME=${DB_NAME:-evidex}

prompt_input "Enter database username (default evidex_user):" "DB_USER" "false"
DB_USER=${DB_USER:-evidex_user}

prompt_input "Enter database password:" "DB_PASSWORD" "true"

# Redis Configuration
prompt_input "Enter Redis host (default localhost):" "REDIS_HOST" "false"
REDIS_HOST=${REDIS_HOST:-localhost}

prompt_input "Enter Redis port (default 6379):" "REDIS_PORT" "false" "^[0-9]+$"
REDIS_PORT=${REDIS_PORT:-6379}

# RabbitMQ Configuration
prompt_input "Enter RabbitMQ host (default localhost):" "RABBITMQ_HOST" "false"
RABBITMQ_HOST=${RABBITMQ_HOST:-localhost}

prompt_input "Enter RabbitMQ port (default 5672):" "RABBITMQ_PORT" "false" "^[0-9]+$"
RABBITMQ_PORT=${RABBITMQ_PORT:-5672}

echo ""
echo "🔑 STEP 2: SECURITY CONFIGURATION"
echo "=================================="

# Generate secure secrets
JWT_SECRET=$(generate_secret)
PRIVATE_KEY_ENCRYPTION_KEY=$(generate_secret)
WEBHOOK_SECRET=$(generate_secret)

echo "Generated secure secrets..."
echo "✅ JWT Secret: ${JWT_SECRET:0:16}..."
echo "✅ Encryption Key: ${PRIVATE_KEY_ENCRYPTION_KEY:0:16}..."
echo "✅ Webhook Secret: ${WEBHOOK_SECRET:0:16}..."

# Admin Configuration
prompt_input "Enter admin wallet address:" "ADMIN_WALLET" "false" "^0x[a-fA-F0-9]{40}$"

echo ""
echo "🌐 STEP 3: BLOCKCHAIN CONFIGURATION"
echo "=================================="

# Ethereum Configuration
echo "🟢 ETHEREUM SETUP"
prompt_input "Enter Infura Project ID:" "INFURA_ID" "false"
prompt_input "Enter Alchemy API Key (optional):" "ALCHEMY_KEY" "false"
prompt_input "Enter Ethereum private key (0x...):" "ETH_PRIVATE_KEY" "true" "^0x[a-fA-F0-9]{64}$"
prompt_input "Enter Etherscan API Key:" "ETHERSCAN_API_KEY" "false"

# Polygon Configuration
echo ""
echo "🟣 POLYGON SETUP"
prompt_input "Enter Polygon private key (0x...):" "POLYGON_PRIVATE_KEY" "true" "^0x[a-fA-F0-9]{64}$"
prompt_input "Enter Polygonscan API Key:" "POLYGONSCAN_API_KEY" "false"

# Bitcoin Configuration
echo ""
echo "🟠 BITCOIN SETUP"
prompt_input "Enter Bitcoin private key (WIF format):" "BTC_WIF" "true" "^[1-9A-HJ-NP-Za-km-z]{52}$"

# Polkadot Configuration
echo ""
echo "🟣 POLKADOT SETUP"
prompt_input "Enter Polkadot mnemonic (12 words):" "POLKADOT_MNEMONIC" "true"

echo ""
echo "📊 STEP 4: ADDITIONAL CHAINS"
echo "================================"

echo "Configure additional chains? (y/n)"
read -p "> " configure_more

if [ "$configure_more" = "y" ] || [ "$configure_more" = "Y" ]; then
    # BSC
    prompt_input "Enter BSC private key (0x...):" "BSC_PRIVATE_KEY" "true" "^0x[a-fA-F0-9]{64}$"
    prompt_input "Enter Bscscan API Key:" "BSCSCAN_API_KEY" "false"
    
    # Arbitrum
    prompt_input "Enter Arbitrum private key (0x...):" "ARBITRUM_PRIVATE_KEY" "true" "^0x[a-fA-F0-9]{64}$"
    prompt_input "Enter Arbiscan API Key:" "ARBISCAN_API_KEY" "false"
fi

echo ""
echo "📝 STEP 5: CREATE PRODUCTION .ENV"
echo "=================================="

# Create production .env file
cat > .env << EOF
# ===================================
# 🚀 EVIDEX PRODUCTION CONFIGURATION
# ===================================

# Core Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
JWT_SECRET=$JWT_SECRET
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public&sslmode=require
REDIS_URL=redis://$REDIS_HOST:$REDIS_PORT
RABBITMQ_URL=amqp://guest:guest@$RABBITMQ_HOST:$RABBITMQ_PORT

# IPFS / Pinata Production
PINATA_JWT=your-production-pinata-jwt-token

# ===================================
# 🟢 ETHEREUM ECOSYSTEM - MAINNET ONLY
# ===================================

# Ethereum Mainnet - Primary RPC
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/$INFURA_ID
ETHEREUM_BACKUP_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY
ETHEREUM_PRIVATE_KEY=$ETH_PRIVATE_KEY
ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY

# ===================================
# 🟣 POLYGON ECOSYSTEM - MAINNET ONLY
# ===================================

# Polygon Mainnet - Primary RPC
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_BACKUP_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/$ALCHEMY_KEY
POLYGON_PRIVATE_KEY=$POLYGON_PRIVATE_KEY
POLYGONSCAN_API_KEY=$POLYGONSCAN_API_KEY

# ===================================
# 🟠 BITCOIN ECOSYSTEM - MAINNET ONLY
# ===================================

# Bitcoin Mainnet - Primary RPC
BITCOIN_RPC_URL=https://blockstream.info/api
BITCOIN_BACKUP_RPC_URL=https://mempool.space/api
BITCOIN_WIF=$BTC_WIF

# ===================================
# 🟣 POLKADOT ECOSYSTEM - MAINNET ONLY
# ===================================

# Polkadot Mainnet - Primary WebSocket
POLKADOT_WS_URL=wss://rpc.polkadot.io
POLKADOT_BACKUP_WS_URL=wss://rpc.polkadot.io
POLKADOT_MNEMONIC="$POLKADOT_MNEMONIC"
POLKADOT_SCAN_API_URL=https://polkadot.api.subscan.io/api/v2/scan/extrinsic
POLKADOT_EXPLORER_BASE_URL=https://polkadot.subscan.io/extrinsic/
POLKADOT_REMARK_PREFIX=EVIDEX
POLKADOT_USE_PALLET=true
POLKADOT_PALLET_NAME=evidence
POLKADOT_SUBMIT_EXTRINSIC=submitEvidence
POLKADOT_ENABLE_REMARK_FALLBACK=true
SUBSCAN_API_KEY=your-production-subscan-api-key

# ===================================
# 🎛 ADMIN & SYSTEM CONFIGURATION
# ===================================

# Production Admin Wallet
ADMIN_WALLET_ADDRESS=$ADMIN_WALLET

EOF

# Add additional chains if configured
if [ -n "$BSC_PRIVATE_KEY" ]; then
    cat >> .env << EOF

# ===================================
# 🟡 BNB CHAIN ECOSYSTEM - MAINNET ONLY
# ===================================

# BSC Mainnet - Primary RPC
BSC_RPC_URL=https://bsc-dataseed1.binance.org
BSC_BACKUP_RPC_URL=https://bsc-dataseed2.binance.org
BSC_PRIVATE_KEY=$BSC_PRIVATE_KEY
BSCSCAN_API_KEY=$BSCSCAN_API_KEY
EOF
fi

if [ -n "$ARBITRUM_PRIVATE_KEY" ]; then
    cat >> .env << EOF

# ===================================
# 🔵 ARBITRUM ECOSYSTEM - MAINNET ONLY
# ===================================

# Arbitrum One Mainnet - Primary RPC
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_BACKUP_RPC_URL=https://arb1.arbitrum.io/rpc
ARBITRUM_PRIVATE_KEY=$ARBITRUM_PRIVATE_KEY
ARBISCAN_API_KEY=$ARBISCAN_API_KEY
EOF
fi

# Add security configuration
cat >> .env << EOF

# ===================================
# 🔒 SECURITY CONFIGURATION
# ===================================

# Production Security Settings
ENABLE_ANALYTICS=true
ENABLE_TESTNETS=false
ENABLE_CHAIN_SWITCH=true
DEFAULT_CHAIN=ethereum

# Rate Limiting (production values)
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=900000

# Private Key Encryption
PRIVATE_KEY_ENCRYPTION_KEY=$PRIVATE_KEY_ENCRYPTION_KEY

# Webhook Security
WEBHOOK_SECRET=$WEBHOOK_SECRET

# CORS Production Domain
ALLOWED_ORIGINS=$NEXT_PUBLIC_APP_URL,https://www.$DOMAIN,https://app.$DOMAIN

# ===================================
# 📊 MONITORING & LOGGING
# ===================================

# Production Logging
LOG_LEVEL=warn
ENABLE_CHAIN_LOGGING=true

# Analytics Configuration
ANALYTICS_REFRESH_INTERVAL=60000

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000
CHAIN_HEALTH_TIMEOUT=10000

# ===================================
# 🚀 PERFORMANCE CONFIGURATION
# ===================================

# Caching
CACHE_TTL=300
MAX_CACHE_SIZE=1000

# Database Pooling
DB_POOL_MIN=10
DB_POOL_MAX=50

# Connection Timeouts
RPC_TIMEOUT=30000
DB_TIMEOUT=10000

# ===================================
# 🎯 PRODUCTION DEPLOYMENT SETTINGS
# ===================================

# Maintenance Mode (set to true during maintenance)
MAINTENANCE_MODE=false

# Feature Flags
ENABLE_EVIDENCE_UPLOAD=true
ENABLE_EVIDENCE_VERIFY=true
ENABLE_ANALYTICS_DASHBOARD=true
ENABLE_CHAIN_MANAGEMENT=true
EOF

# Set secure file permissions
chmod 600 .env

echo ""
log "✅ Production .env file created successfully!"
echo ""
echo "📋 CONFIGURATION SUMMARY:"
echo "=================================="
echo "🌐 Domain: $NEXT_PUBLIC_APP_URL"
echo "🗄️ Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "🔴 Redis: $REDIS_HOST:$REDIS_PORT"
echo "🐰 RabbitMQ: $RABBITMQ_HOST:$RABBITMQ_PORT"
echo "🟢 Ethereum: Configured"
echo "🟣 Polygon: Configured"
echo "🟠 Bitcoin: Configured"
echo "🟣 Polkadot: Configured"

if [ -n "$BSC_PRIVATE_KEY" ]; then
    echo "🟡 BSC: Configured"
fi

if [ -n "$ARBITRUM_PRIVATE_KEY" ]; then
    echo "🔵 Arbitrum: Configured"
fi

echo ""
echo "🚀 NEXT STEPS:"
echo "1. 🔍 Review generated .env file"
echo "2. 📧 Add any missing API keys"
echo "3. 🚀 Run production deployment: npm run build && npm start"
echo "4. 📊 Monitor: http://localhost:3000/admin"
echo "5. 🔗 Test: Upload and verify evidence"

echo ""
log "🎉 Production setup completed!"
echo ""
warning "⚠️ IMPORTANT SECURITY NOTES:"
echo "- Keep your .env file secure and never commit to version control"
echo "- Store backup copies in a secure location"
echo "- Use hardware wallets for production private keys"
echo "- Regularly rotate your secrets"

echo ""
info "📚 For deployment help, see: PRODUCTION_SETUP.md"
info "🆘 For issues, check: LIVE_DEMO_GUIDE.md"
