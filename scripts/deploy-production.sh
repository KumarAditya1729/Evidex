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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing services
log "🛑 Stopping existing services..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Build and start services
log "🏗️ Building and starting production services..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
log "🏥 Performing health checks..."

# Check web service
if curl -f -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200"; then
    log "✅ Web service is healthy"
else
    warning "⚠️ Web service health check failed"
fi

# Check database
if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U evidex_user; then
    log "✅ Database is healthy"
else
    warning "⚠️ Database health check failed"
fi

# Check Redis
if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q "PONG"; then
    log "✅ Redis is healthy"
else
    warning "⚠️ Redis health check failed"
fi

# Run database migrations
log "🗄️ Running database migrations..."
docker-compose -f docker-compose.production.yml exec web pnpm --filter @evidex/database db:migrate

# Show deployment summary
echo ""
log "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================="
echo "🌐 Application: https://your-domain.com"
echo "🔍 Admin Dashboard: https://your-domain.com/admin"
echo "📊 Analytics: https://your-domain.com/admin/analytics"
echo "🔗 Chain Management: https://your-domain.com/admin/chains"
echo "=================================="
echo ""
log "📝 NEXT STEPS:"
echo "1. 🔍 Update nginx.conf with your actual domain"
echo "2. 🔒 Setup SSL certificates with ./scripts/setup-ssl.sh"
echo "3. 📊 Monitor logs: docker-compose -f docker-compose.production.yml logs -f"
echo "4. 🔧 Check status: docker-compose -f docker-compose.production.yml ps"
echo ""
log "✅ EVIDEX is now running in production mode!"
