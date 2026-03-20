#!/bin/bash

# 📊 EVIDEX Production Monitoring Script
# ====================================

DOMAIN="your-domain.com"
LOG_FILE="/var/log/evidex-monitoring.log"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        log "✅ $service is healthy"
        return 0
    else
        log "❌ $service is unhealthy"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    local unhealthy=$(docker-compose -f docker-compose.production.yml ps -q | xargs docker inspect --format='{{.State.Status}}' | grep -v "running" | wc -l)
    
    if [ "$unhealthy" -eq 0 ]; then
        log "✅ All containers are running"
    else
        log "❌ $unhealthy containers are not running"
    fi
}

# Function to check disk space
check_disk_space() {
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        log "✅ Disk usage: $usage%"
    else
        log "⚠️ Disk usage high: $usage%"
    fi
}

# Function to check memory usage
check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt 80 ]; then
        log "✅ Memory usage: $usage%"
    else
        log "⚠️ Memory usage high: $usage%"
    fi
}

# Main monitoring check
log "🔍 Starting EVIDEX health check..."

check_service "Web Application" "https://$DOMAIN"
check_containers
check_disk_space
check_memory

log "📊 Health check completed"
