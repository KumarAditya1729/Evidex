#!/bin/bash

# 🚀 EVIDEX DEMO DEPLOYMENT SCRIPT
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

log "🚀 Starting Evidex Demo Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    source .env
    log "✅ Environment variables loaded from .env"
else
    warning "⚠️ .env file not found, using defaults"
fi

# Backup current .env if it exists
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log "✅ Backed up current .env"
fi

# Build the application
log "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

log "✅ Application built successfully"

# Start services
log "🚀 Starting services..."

# Stop existing services
docker-compose down --remove-orphans || true

# Start new services
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

log "✅ Services started successfully"

# Wait for services to be ready
log "⏳ Waiting for services to be ready..."
sleep 30

# Health checks
log "🏥 Performing health checks..."

# Check application health
if curl -f -s -o /dev/null -w "%{http_code}" "http://localhost:3000/health" | grep -q "200"; then
    log "✅ Application is healthy"
else
    warning "⚠️ Application health check failed, but deployment continues"
fi

# Check database health
if curl -f -s -o /dev/null -w "%{http_code}" "http://localhost:3000/health/db" | grep -q "200"; then
    log "✅ Database is healthy"
else
    warning "⚠️ Database health check failed, but deployment continues"
fi

# Show deployment summary
echo ""
log "🎉 DEPLOYMENT SUMMARY"
echo "=================================="
echo "📦 Application: http://localhost:3000"
echo "🔍 Admin Dashboard: http://localhost:3000/admin"
echo "📊 Analytics: http://localhost:3000/admin/analytics"
echo "🔗 Chain Management: http://localhost:3000/admin/chains"
echo "🏥 Health Check: http://localhost:3000/health"
echo "=================================="

echo ""
log "📝 NEXT STEPS:"
echo "1. 🔍 Monitor logs: docker-compose logs -f"
echo "2. 📊 Check analytics dashboard"
echo "3. 🔗 Verify chain management"
echo "4. 👥 Test user workflows"
echo "5. 📈 Monitor performance"

echo ""
log "✅ Demo deployment completed successfully!"
echo ""
info "🛠️ Useful commands:"
echo "  docker-compose logs -f app"
echo "  docker-compose ps"
echo "  docker-compose restart"
echo "  docker-compose down"

echo ""
warning "⚠️ This is a demo deployment with placeholder values."
warning "⚠️ For production, replace all placeholder credentials with real values."
