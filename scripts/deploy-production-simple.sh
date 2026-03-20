#!/bin/bash

# 🚀 EVIDEX Production Deployment Script
# =====================================

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

warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

error() {
    echo -e "${RED}ERROR:${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

log "🚀 Starting EVIDEX Production Deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    error ".env.production file not found!"
    exit 1
fi

# Load environment variables
export DATABASE_PASSWORD=pWs8TqYeKoNCt0xE8uivQtWzj
export $(grep -v '^#' .env.production | xargs)

# Stop existing services
log "🛑 Stopping existing services..."
pkill -f "next dev" || true
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Start infrastructure services
log "🏗️ Starting infrastructure services..."
docker-compose -f docker-compose.production.yml up -d postgres redis rabbitmq

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 15

# Check database connection
log "🗄️ Checking database connection..."
docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U evidex_user

# Check Redis connection
log "🔍 Checking Redis connection..."
docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping

# Build application locally (avoiding Docker build issues)
log "🔨 Building application locally..."
npm run build

# Start application
log "🌐 Starting EVIDEX application..."
NODE_ENV=production DATABASE_URL="postgresql://evidex_user:$DATABASE_PASSWORD@localhost:5432/evidex?schema=public&sslmode=require" REDIS_URL="redis://localhost:6379" npm start

log "🎉 EVIDEX Production Deployment Complete!"
echo "=================================="
echo "🌐 Application: https://your-domain.com"
echo "🔍 Admin Dashboard: https://your-domain.com/admin"
echo "📊 Analytics: https://your-domain.com/admin/analytics"
echo "=================================="
echo ""
log "📝 NEXT STEPS:"
echo "1. 🔍 Update your domain in .env.production"
echo "2. 🔒 Setup SSL certificates with Let's Encrypt"
echo "3. 📊 Monitor logs: docker-compose -f docker-compose.production.yml logs -f"
echo "4. 🔧 Check status: docker-compose -f docker-compose.production.yml ps"
echo ""
log "✅ EVIDEX is now running in production mode!"
