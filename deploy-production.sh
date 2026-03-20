#!/bin/bash

# 🚀 EVIDEX PRODUCTION DEPLOYMENT SCRIPT
# ===================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}ERROR:${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

# ===================================
# 🚨 PRE-DEPLOYMENT CHECKS
# ===================================

log "🚀 Starting Evidex Production Deployment..."

# Check if .env exists
if [ ! -f ".env" ]; then
    error "❌ .env file not found. Please create it first."
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "❌ Docker is not installed. Please install Docker first."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "❌ Docker Compose is not installed. Please install Docker Compose first."
fi

# Check if required environment variables are set
source .env

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secure-jwt-secret-key-256-bits-long-random-string" ] || [ "$JWT_SECRET" = "demo-super-secure-jwt-secret-key-256-bits-long-random-string-for-testing-only" ]; then
    error "❌ JWT_SECRET is not properly configured in .env"
fi

if [ -z "$DATABASE_URL" ] || [[ "$DATABASE_URL" == *"evidex_user:secure_password"* ]]; then
    error "❌ DATABASE_URL is not properly configured in .env"
fi

if [ -z "$ETHEREUM_PRIVATE_KEY" ] || [[ "$ETHEREUM_PRIVATE_KEY" == *"your-production"* ]] || [[ "$ETHEREUM_PRIVATE_KEY" == *"demo-production"* ]]; then
    error "❌ ETHEREUM_PRIVATE_KEY is not properly configured in .env"
fi

# ===================================
# 🔧 BACKUP PROCEDURES
# ===================================

log "📦 Creating backup of current deployment..."

# Backup current .env if it exists
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    log "✅ Backed up current .env to .env.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Backup database if running
if docker-compose ps | grep -q postgres; then
    log "📊 Creating database backup..."
    docker-compose exec -T postgres pg_dump -U evidex evidex > backup_$(date +%Y%m%d_%H%M%S).sql
    log "✅ Database backup created: backup_$(date +%Y%m%d_%H%M%S).sql"
fi

# ===================================
# 🚀 DEPLOYMENT STEPS
# ===================================

# Step 1: Prepare production environment
log "🔧 Preparing production environment..."

# Copy production environment
cp .env.production-ready .env

# Set proper file permissions
chmod 600 .env
chmod 600 .env.production-ready

log "✅ Production environment prepared"

# Step 2: Build production Docker image
log "🏗️ Building production Docker image..."

docker build -t evidex:production .
if [ $? -ne 0 ]; then
    error "❌ Docker build failed"
fi

log "✅ Docker image built successfully"

# Step 3: Stop existing services
log "🛑 Stopping existing services..."

docker-compose down --remove-orphans || true
log "✅ Existing services stopped"

# Step 4: Start production services
log "🚀 Starting production services..."

# Use production docker-compose file
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    COMPOSE_FILE="docker-compose.yml"
    warning "⚠️ docker-compose.prod.yml not found, using docker-compose.yml"
fi

docker-compose -f $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    error "❌ Failed to start production services"
fi

log "✅ Production services started"

# ===================================
# ⏱️ HEALTH CHECKS
# ===================================

log "🏥 Waiting for services to be ready..."

# Wait for application to start
sleep 30

# Health check function
health_check() {
    local url=$1
    local name=$2
    local max_attempts=$3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            log "✅ $name is healthy (attempt $attempt)"
            return 0
        fi
        
        info "⏳ Waiting for $name... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    warning "⚠️ $name health check failed after $max_attempts attempts"
    return 1
}

# Perform health checks
health_check "http://localhost:3000/health" "Application" 12
health_check "http://localhost:3000/health/db" "Database" 6
health_check "http://localhost:3000/api/analytics/chains" "Chains API" 6

# ===================================
# 📊 POST-DEPLOYMENT VERIFICATION
# ===================================

log "🔍 Verifying deployment..."

# Check if all services are running
if docker-compose ps | grep -q "Up"; then
    log "✅ All services are running"
else
    error "❌ Some services failed to start"
fi

# Test blockchain connections
log "🔗 Testing blockchain connections..."

# Test Ethereum connection
curl -s -X POST "http://localhost:3000/api/analytics/chains" \
    -H "Content-Type: application/json" \
    -d '{"chain": "ethereum", "action": "status"}' > /dev/null

if [ $? -eq 0 ]; then
    log "✅ Ethereum connection test passed"
else
    warning "⚠️ Ethereum connection test failed"
fi

# Test analytics dashboard
curl -s "http://localhost:3000/api/analytics" > /dev/null

if [ $? -eq 0 ]; then
    log "✅ Analytics dashboard test passed"
else
    warning "⚠️ Analytics dashboard test failed"
fi

# ===================================
# 📋 DEPLOYMENT SUMMARY
# ===================================

echo ""
log "🎉 DEPLOYMENT SUMMARY"
echo "=================================="
echo "📦 Application: https://yourdomain.com"
echo "🔍 Admin Dashboard: https://yourdomain.com/admin"
echo "📊 Analytics: https://yourdomain.com/admin/analytics"
echo "🔗 Chain Management: https://yourdomain.com/admin/chains"
echo "🏥 Health Check: https://yourdomain.com/health"
echo "=================================="

echo ""
log "📝 NEXT STEPS:"
echo "1. 🔍 Monitor application logs: docker-compose logs -f"
echo "2. 📊 Check analytics dashboard for chain status"
echo "3. 🔗 Verify all blockchain connections"
echo "4. 👥 Test user workflows (upload/verify evidence)"
echo "5. 📈 Set up monitoring and alerting"
echo "6. 🔒 Review security configuration"
echo "7. 💾 Configure automated backups"
echo "8. 🚨 Set up error notifications"

echo ""
log "✅ Production deployment completed successfully!"
log "📚 For troubleshooting, see PRODUCTION_SETUP.md"
log "🆘 For support, check your monitoring dashboard"

# ===================================
# 🛠️ USEFUL COMMANDS
# ===================================

echo ""
info "🛠️ USEFUL POST-DEPLOYMENT COMMANDS:"
echo ""
echo "📋 View logs:"
echo "  docker-compose logs -f app"
echo ""
echo "🔄 Restart services:"
echo "  docker-compose restart"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose down"
echo ""
echo "📊 Check service status:"
echo "  docker-compose ps"
echo ""
echo "🔧 Access application shell:"
echo "  docker-compose exec app bash"
echo ""
echo "🗄️ Access database:"
echo "  docker-compose exec postgres psql -U evidex evidex"
echo ""
echo "📈 Scale application:"
echo "  docker-compose up -d --scale app=3"

echo ""
log "🚀 Evidex is now running in production mode!"
