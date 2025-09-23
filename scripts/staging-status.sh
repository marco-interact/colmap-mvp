#!/bin/bash

# 3D Visualization Platform - Staging Status Script
# Check status of staging environment services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.staging.yml"
PROJECT_NAME="3d_platform_staging"

echo -e "${BLUE}📊 3D Platform Staging Status${NC}\n"

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local description=$3
    
    printf "%-20s" "$description:"
    
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Unhealthy${NC}"
        return 1
    fi
}

# Function to check Docker container status
check_container_status() {
    local container_name=$1
    local description=$2
    
    printf "%-20s" "$description:"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")
        case $status in
            "running")
                echo -e "${GREEN}✅ Running${NC}"
                return 0
                ;;
            "exited")
                echo -e "${RED}❌ Exited${NC}"
                return 1
                ;;
            "restarting")
                echo -e "${YELLOW}🔄 Restarting${NC}"
                return 1
                ;;
            *)
                echo -e "${RED}❌ $status${NC}"
                return 1
                ;;
        esac
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

# Function to get resource usage
get_resource_usage() {
    echo -e "\n${BLUE}💻 Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" \
        $(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q) 2>/dev/null || \
        echo "No containers running"
}

# Function to show service URLs
show_service_urls() {
    echo -e "\n${BLUE}🌐 Service URLs:${NC}"
    echo -e "Frontend:      ${GREEN}http://localhost:3001${NC}"
    echo -e "Backend API:   ${GREEN}http://localhost:8001${NC}"
    echo -e "API Docs:      ${GREEN}http://localhost:8001/docs${NC}"
    echo -e "Health Check:  ${GREEN}http://localhost:8001/health${NC}"
    echo -e "Flower:        ${GREEN}http://localhost:5556${NC}"
    echo -e "Nginx Proxy:   ${GREEN}http://localhost:8080${NC}"
    echo -e "Staging Info:  ${GREEN}http://localhost:8080/staging-info${NC}"
}

# Function to show Docker Compose status
show_compose_status() {
    echo -e "\n${BLUE}🐳 Docker Compose Status:${NC}"
    if docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps 2>/dev/null; then
        return 0
    else
        echo -e "${RED}❌ No staging services running${NC}"
        return 1
    fi
}

# Function to show disk usage
show_disk_usage() {
    echo -e "\n${BLUE}💾 Docker Volume Usage:${NC}"
    docker system df
}

# Main status check
main() {
    # Check Docker Compose services
    if ! show_compose_status; then
        echo -e "\n${YELLOW}💡 To start staging environment, run:${NC}"
        echo -e "   ${GREEN}./scripts/staging-deploy.sh${NC}"
        exit 1
    fi
    
    # Check individual container status
    echo -e "\n${BLUE}📦 Container Status:${NC}"
    check_container_status "3d_platform_postgres_staging" "Database"
    check_container_status "3d_platform_redis_staging" "Redis"
    check_container_status "3d_platform_backend_staging" "Backend API"
    check_container_status "3d_platform_frontend_staging" "Frontend"
    check_container_status "3d_platform_celery_worker_staging" "Celery Worker"
    check_container_status "3d_platform_celery_beat_staging" "Celery Beat"
    check_container_status "3d_platform_flower_staging" "Flower"
    check_container_status "3d_platform_nginx_staging" "Nginx"
    
    # Check service health
    echo -e "\n${BLUE}🏥 Service Health:${NC}"
    check_service_health "backend" "http://localhost:8001/health" "Backend API"
    check_service_health "frontend" "http://localhost:3001" "Frontend"
    check_service_health "flower" "http://localhost:5556" "Flower"
    check_service_health "nginx" "http://localhost:8080/staging-info" "Nginx Proxy"
    
    # Show service URLs
    show_service_urls
    
    # Show resource usage
    get_resource_usage
    
    # Show disk usage
    show_disk_usage
    
    echo -e "\n${GREEN}✨ Status check completed!${NC}"
    echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
    echo -e "View logs:     ${YELLOW}./scripts/staging-logs.sh${NC}"
    echo -e "Deploy:        ${YELLOW}./scripts/staging-deploy.sh${NC}"
    echo -e "Stop services: ${YELLOW}./scripts/staging-stop.sh${NC}"
}

# Handle script arguments
case "${1:-}" in
    --help)
        echo "Usage: $0 [--help]"
        echo "  --help : Show this help message"
        echo ""
        echo "This script checks the status of all staging services and provides"
        echo "information about their health, resource usage, and access URLs."
        exit 0
        ;;
    *)
        main
        ;;
esac
