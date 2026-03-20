#!/bin/bash

# 🚀 EVIDEX VERCEL DEPLOYMENT SCRIPT
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

echo -e "${GREEN}🚀 EVIDEX VERCEL DEPLOYMENT SCRIPT${NC}"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    error "❌ Please run this script from the project root directory"
fi

echo ""
echo "📋 DEPLOYMENT STEPS:"
echo "=================================="

# Step 1: Build the project
echo "🏗️ Step 1: Building project..."
npm run build
if [ $? -ne 0 ]; then
    error "❌ Build failed"
fi
log "✅ Build completed successfully"

# Step 2: Deploy to Vercel
echo ""
echo "🚀 Step 2: Deploying to Vercel..."
echo "This will deploy your Evidex platform to production."
echo ""

# Deploy with production flag
vercel --prod

if [ $? -ne 0 ]; then
    error "❌ Deployment failed"
fi

log "✅ Deployment completed successfully"

echo ""
echo "📋 POST-DEPLOYMENT SETUP:"
echo "=================================="
echo ""
echo "🔧 Next, you need to:"
echo "1. Go to your Vercel Dashboard"
echo "2. Navigate to your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the following environment variables:"
echo ""
echo "📝 REQUIRED ENVIRONMENT VARIABLES:"
echo "=================================="
echo "NODE_ENV=production"
echo "NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app"
echo "JWT_SECRET=your-super-secure-jwt-secret-key"
echo "DATABASE_URL=your-production-database-url"
echo "REDIS_URL=your-production-redis-url"
echo "PINATA_JWT=your-production-pinata-jwt"
echo "ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
echo "ETHEREUM_PRIVATE_KEY=your-production-ethereum-private-key"
echo "POLYGON_RPC_URL=https://polygon-rpc.com"
echo "POLYGON_PRIVATE_KEY=your-production-polygon-private-key"
echo "BITCOIN_RPC_URL=https://blockstream.info/api"
echo "BITCOIN_WIF=your-production-bitcoin-wif"
echo "POLKADOT_WS_URL=wss://rpc.polkadot.io"
echo "POLKADOT_MNEMONIC=\"your production polkadot mnemonic\""
echo "ADMIN_WALLET_ADDRESS=0x7014B1Ed9825905Ce8FD0D8744896Eab2C6DB6F3"
echo ""
echo "📊 DATABASE OPTIONS:"
echo "=================================="
echo "1. Neon (Recommended): https://neon.tech (Free tier available)"
echo "2. Supabase: https://supabase.com (Free tier available)"
echo "3. Railway: https://railway.app (PostgreSQL hosting)"
echo ""
echo "🔗 REDIS OPTIONS:"
echo "=================================="
echo "1. Upstash: https://upstash.com (Free Redis hosting)"
echo "2. Redis Cloud: https://redislabs.com (Free tier available)"
echo ""
echo "📧 IPFS/PINATA:"
echo "=================================="
echo "1. Get free account at: https://pinata.cloud"
echo "2. Generate JWT token in dashboard"
echo ""

echo "🎯 DEPLOYMENT SUMMARY:"
echo "=================================="
echo "✅ Application deployed to Vercel"
echo "✅ Build optimized for production"
echo "✅ Global CDN enabled"
echo "✅ SSL certificates automatic"
echo "✅ Custom domain ready"
echo ""
echo "📱 NEXT STEPS:"
echo "1. Configure environment variables in Vercel Dashboard"
echo "2. Setup production database (Neon/Supabase recommended)"
echo "3. Configure Redis (Upstash recommended)"
echo "4. Test all functionality"
echo "5. Setup custom domain (optional)"
echo ""
echo "🔍 USEFUL COMMANDS:"
echo "=================================="
echo "vercel logs          # View deployment logs"
echo "vercel domains       # Manage custom domains"
echo "vercel env ls        # List environment variables"
echo "vercel env add       # Add environment variable"
echo "vercel --prod        # Redeploy to production"
echo ""
echo "📚 FOR HELP:"
echo "=================================="
echo "📖 Full guide: PRODUCTION_HOSTING_GUIDE.md"
echo "🆘 Vercel docs: https://vercel.com/docs"
echo "💬 Support: https://vercel.com/help"
echo ""
log "🎉 Your Evidex platform is now live on Vercel!"
echo ""
warning "⚠️ Remember to configure your environment variables in the Vercel Dashboard before testing!"
