#!/bin/bash

# 3D Visualization Platform - Staging Logs Script
# View logs from staging environment services

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.staging.yml"
PROJECT_NAME="3d_platform_staging"

echo -e "${BLUE}📋 3D Platform Staging Logs${NC}\n"

# Function to show available services
show_services() {
    echo -e "${YELLOW}Available services:${NC}"
    echo "  all              - All services"
    echo "  backend          - Backend API"
    echo "  frontend         - React frontend"
    echo "  postgres         - PostgreSQL database"
    echo "  redis            - Redis cache"
    echo "  celery-worker    - Celery worker"
    echo "  celery-beat      - Celery scheduler"
    echo "  flower           - Celery monitoring"
    echo "  nginx            - Nginx proxy"
}

# Function to follow logs
follow_logs() {
    local service=${1:-all}
    local lines=${2:-100}
    
    if [ "$service" = "all" ]; then
        echo -e "${GREEN}Following logs for all services (last $lines lines)...${NC}"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f --tail="$lines"
    else
        # Map service names to container names
        case $service in
            "backend")
                service_name="backend-staging"
                ;;
            "frontend")
                service_name="frontend-staging"
                ;;
            "postgres")
                service_name="postgres-staging"
                ;;
            "redis")
                service_name="redis-staging"
                ;;
            "celery-worker")
                service_name="celery-worker-staging"
                ;;
            "celery-beat")
                service_name="celery-beat-staging"
                ;;
            "flower")
                service_name="flower-staging"
                ;;
            "nginx")
                service_name="nginx-staging"
                ;;
            *)
                echo -e "${RED}❌ Unknown service: $service${NC}"
                show_services
                exit 1
                ;;
        esac
        
        echo -e "${GREEN}Following logs for $service (last $lines lines)...${NC}"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f --tail="$lines" "$service_name"
    fi
}

# Handle script arguments
case "${1:-}" in
    --help)
        echo "Usage: $0 [service] [--lines N] [--help]"
        echo ""
        show_services
        echo ""
        echo "Options:"
        echo "  --lines N  : Show last N lines (default: 100)"
        echo "  --help     : Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Show all services logs"
        echo "  $0 backend            # Show backend logs"
        echo "  $0 backend --lines 50 # Show last 50 lines of backend logs"
        exit 0
        ;;
    --lines)
        follow_logs "all" "$2"
        ;;
    "")
        follow_logs "all" 100
        ;;
    *)
        # Check if it's a lines argument
        if [[ "$2" == "--lines" ]]; then
            follow_logs "$1" "$3"
        else
            follow_logs "$1" 100
        fi
        ;;
esac
