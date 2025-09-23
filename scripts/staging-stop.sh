#!/bin/bash

# 3D Visualization Platform - Staging Stop Script
# Stop staging environment services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.staging.yml"
PROJECT_NAME="3d_platform_staging"

echo -e "${BLUE}🛑 Stopping 3D Platform Staging Environment...${NC}\n"

# Function to stop services gracefully
stop_services() {
    echo -e "${YELLOW}📋 Stopping staging services...${NC}"
    
    # Stop all services
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop
    
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to remove containers
remove_containers() {
    echo -e "${YELLOW}🗑️  Removing containers...${NC}"
    
    # Remove containers
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" rm -f
    
    echo -e "${GREEN}✅ Containers removed${NC}"
}

# Function to remove volumes
remove_volumes() {
    echo -e "${YELLOW}💾 Removing volumes...${NC}"
    
    # Remove volumes (this will delete all data!)
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v
    
    echo -e "${GREEN}✅ Volumes removed${NC}"
}

# Function to clean up Docker resources
cleanup_docker() {
    echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused images (optional)
    docker image prune -f
    
    echo -e "${GREEN}✅ Docker cleanup completed${NC}"
}

# Function to show final status
show_status() {
    echo -e "\n${GREEN}✨ Staging environment stopped!${NC}\n"
    
    # Check if any containers are still running
    local running_containers
    running_containers=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q 2>/dev/null || true)
    
    if [ -n "$running_containers" ]; then
        echo -e "${YELLOW}⚠️  Some containers may still be running:${NC}"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    else
        echo -e "${GREEN}✅ All staging containers stopped${NC}"
    fi
    
    echo -e "\n${BLUE}🔧 Next Steps:${NC}"
    echo -e "Restart staging: ${YELLOW}./scripts/staging-deploy.sh${NC}"
    echo -e "Check status:    ${YELLOW}./scripts/staging-status.sh${NC}"
}

# Main stop process
main() {
    # Check if staging is running
    local running_services
    running_services=$(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q 2>/dev/null || true)
    
    if [ -z "$running_services" ]; then
        echo -e "${YELLOW}ℹ️  No staging services are currently running${NC}"
        exit 0
    fi
    
    # Stop services
    stop_services
    
    # Show status
    show_status
}

# Handle script arguments
case "${1:-}" in
    --remove)
        echo -e "${YELLOW}Stopping and removing containers...${NC}"
        stop_services
        remove_containers
        cleanup_docker
        show_status
        ;;
    --clean)
        echo -e "${RED}⚠️  WARNING: This will delete all staging data!${NC}"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            stop_services
            remove_volumes
            cleanup_docker
            show_status
        else
            echo -e "${YELLOW}Operation cancelled${NC}"
            exit 0
        fi
        ;;
    --help)
        echo "Usage: $0 [--remove|--clean|--help]"
        echo "  (no args)  : Stop services gracefully"
        echo "  --remove   : Stop and remove containers"
        echo "  --clean    : Stop, remove containers and DELETE ALL DATA"
        echo "  --help     : Show this help message"
        echo ""
        echo "WARNING: --clean will permanently delete all staging data!"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
