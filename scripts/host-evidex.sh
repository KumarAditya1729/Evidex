#!/bin/bash

# 🌐 EVIDEX Hosting Setup Script
# ================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

log "🌐 Starting EVIDEX Hosting Setup..."

# Check if Docker services are running
log "🔍 Checking infrastructure services..."
if ! docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
    error "Docker services are not running!"
    log "Starting Docker services..."
    docker-compose -f docker-compose.production.yml up -d postgres redis
    sleep 10
fi

# Check database connection
log "🗄️ Testing database connection..."
if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U evidex_user; then
    log "✅ Database connection successful"
else
    error "❌ Database connection failed"
fi

# Check Redis connection
log "🔍 Testing Redis connection..."
if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    log "✅ Redis connection successful"
else
    error "❌ Redis connection failed"
fi

# Stop any existing Next.js processes
log "🛑 Stopping existing Next.js processes..."
pkill -f "next" || true

# Start EVIDEX in production mode
log "🚀 Starting EVIDEX in production mode..."
cd apps/web

# Set production environment
export NODE_ENV=production
export DATABASE_URL="postgresql://evidex_user:pWs8TqYeKoNCt0xE8uivQtWzj@localhost:5435/evidex?schema=public&sslmode=require"
export REDIS_URL="redis://localhost:6381"
export NEXT_PUBLIC_APP_URL="http://localhost:3001"
export JWT_SECRET="420817147043fb8d1ee5a2cb48b1cdd0ae8bc08c27feac3e53e2a86a478cc143"

# Start the application
log "🌐 Starting EVIDEX application..."
npm run dev

log "🎉 EVIDEX is now hosted!"
echo "=================================="
echo "🌐 Application: http://localhost:3001"
echo "👑 Admin Dashboard: http://localhost:3001/admin"
echo "📊 Analytics: http://localhost:3001/admin/analytics"
echo "🔍 API Documentation: http://localhost:3001/api"
echo "=================================="
echo ""
log "📝 Hosting Information:"
echo "• Environment: Production"
echo "• Database: PostgreSQL (port 5435)"
echo "• Cache: Redis (port 6381)"
echo "• Application: Next.js (port 3001)"
echo "• Mode: Production-ready"
echo ""
log "🎯 Next Steps:"
echo "1. 🌐 Access application at http://localhost:3001"
echo "2. 👑 Login as admin to test features"
echo "3. 📤 Upload evidence to test multi-chain"
echo "4. 🔍 Verify evidence to test blockchain"
echo "5. 📊 Monitor admin dashboard"
echo ""
log "✅ EVIDEX hosting setup complete!"
