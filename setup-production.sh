#!/bin/bash

# 🔧 EVIDEX PRODUCTION CONFIGURATION SETUP
# ===================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Evidex Production Configuration Setup${NC}"
echo "=================================="

# Function to generate random strings
generate_secret() {
    openssl rand -hex 32
}

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    echo -e "${YELLOW}$prompt${NC}"
    if [ -n "$default" ]; then
        echo -e "Default: $default"
    fi
    read -p "> " input
    
    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi
    
    eval "$var_name='$input'"
}

echo ""
echo "🚨 SECURITY WARNING: Never commit actual secrets to version control!"
echo "🚨 This script will create a production-ready .env file"
echo ""

# Core Configuration
echo ""
echo "📋 Core Configuration"
echo "-------------------"

prompt_input "Enter your production domain:" "yourdomain.com" "DOMAIN"
prompt_input "Enter your database host:" "localhost" "DB_HOST"
prompt_input "Enter your database password:" "your_secure_db_password" "DB_PASSWORD"
prompt_input "Enter your Redis host:" "localhost" "REDIS_HOST"
prompt_input "Enter your RabbitMQ host:" "localhost" "RABBITMQ_HOST"

# Blockchain Configuration
echo ""
echo "🔗 Blockchain Configuration"
echo "-------------------------"

prompt_input "Enter your Infura Project ID:" "YOUR_INFURA_PROJECT_ID" "INFURA_ID"
prompt_input "Enter your Alchemy API Key:" "YOUR_ALCHEMY_KEY" "ALCHEMY_KEY"
prompt_input "Enter your Ethereum private key:" "0x..." "ETH_PRIVATE_KEY"
prompt_input "Enter your Polygon private key:" "0x..." "POLYGON_PRIVATE_KEY"
prompt_input "Enter your BSC private key:" "0x..." "BSC_PRIVATE_KEY"

# API Keys
echo ""
echo "🔑 API Keys"
echo "-----------"

prompt_input "Enter your Etherscan API Key:" "your-etherscan-api-key" "ETHERSCAN_API_KEY"
prompt_input "Enter your Polygonscan API Key:" "your-polygonscan-api-key" "POLYGONSCAN_API_KEY"
prompt_input "Enter your Bscscan API Key:" "your-bscscan-api-key" "BSCSCAN_API_KEY"

# Security
echo ""
echo "🔒 Security Configuration"
echo "----------------------"

JWT_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)
WEBHOOK_SECRET=$(generate_secret)

echo "Generated JWT_SECRET: $JWT_SECRET"
echo "Generated ENCRYPTION_KEY: $ENCRYPTION_KEY"
echo "Generated WEBHOOK_SECRET: $WEBHOOK_SECRET"

# Create production .env file
echo ""
echo "📝 Creating production .env file..."

cat > .env << EOF
# ===================================
# 🚀 EVIDEX PRODUCTION CONFIGURATION
# ===================================

# Core Production Settings
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN
JWT_SECRET=$JWT_SECRET
DATABASE_URL=postgresql://evidex_user:$DB_PASSWORD@$DB_HOST:5432/evidex?schema=public&sslmode=require
REDIS_URL=redis://$REDIS_HOST:6379
RABBITMQ_URL=amqp://evidex_user:secure_password@$RABBITMQ_HOST:5672

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
# 🟡 BNB CHAIN ECOSYSTEM - MAINNET ONLY
# ===================================

# BSC Mainnet - Primary RPC
BSC_RPC_URL=https://bsc-dataseed1.binance.org
BSC_BACKUP_RPC_URL=https://bsc-dataseed2.binance.org
BSC_PRIVATE_KEY=$BSC_PRIVATE_KEY
BSCSCAN_API_KEY=$BSCSCAN_API_KEY

# ===================================
# 🎛 ADMIN & SYSTEM CONFIGURATION
# ===================================

# Production Admin Wallet
ADMIN_WALLET_ADDRESS=0x0000000000000000000000000000000000000000

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
PRIVATE_KEY_ENCRYPTION_KEY=$ENCRYPTION_KEY

# Webhook Security
WEBHOOK_SECRET=$WEBHOOK_SECRET

# CORS Production Domain
ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN,https://app.$DOMAIN

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

# Set file permissions
chmod 600 .env

echo ""
echo -e "${GREEN}✅ Production .env file created successfully!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Review the generated .env file"
echo "2. Add any additional blockchain configurations if needed"
echo "3. Run: ./deploy-production.sh"
echo ""
echo "🚨 IMPORTANT:"
echo "- Keep your .env file secure"
echo "- Never commit it to version control"
echo "- Store backup copies safely"
echo ""
echo -e "${GREEN}🚀 Ready for production deployment!${NC}"
