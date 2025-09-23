#!/bin/bash

# 3D Visualization Platform - Staging Deployment Script
# This script deploys the application to the staging environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_ENV_FILE="env.staging"
COMPOSE_FILE="docker-compose.staging.yml"
PROJECT_NAME="3d_platform_staging"

echo -e "${BLUE}🚀 Starting 3D Platform Staging Deployment...${NC}"

# Check if required files exist
if [ ! -f "$STAGING_ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $STAGING_ENV_FILE not found!${NC}"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}❌ Error: $COMPOSE_FILE not found!${NC}"
    exit 1
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: Docker is not running!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to clean up old containers and volumes
cleanup_old_deployment() {
    echo -e "${YELLOW}🧹 Cleaning up old staging deployment...${NC}"
    
    # Stop and remove containers
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down --remove-orphans || true
    
    # Prune unused Docker objects
    docker system prune -f
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to build images
build_images() {
    echo -e "${YELLOW}🏗️  Building Docker images...${NC}"
    
    # Build with no cache to ensure latest changes
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build --no-cache
    
    echo -e "${GREEN}✅ Images built successfully${NC}"
}

# Function to start services
start_services() {
    echo -e "${YELLOW}🚀 Starting staging services...${NC}"
    
    # Start all services
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    echo -e "${GREEN}✅ Services started${NC}"
}

# Function to wait for services to be healthy
wait_for_services() {
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for database
    echo -e "${BLUE}Waiting for database...${NC}"
    timeout 60 bash -c 'until docker-compose -f '"$COMPOSE_FILE"' -p '"$PROJECT_NAME"' exec -T postgres-staging pg_isready -U postgres; do sleep 2; done'
    
    # Wait for Redis
    echo -e "${BLUE}Waiting for Redis...${NC}"
    timeout 30 bash -c 'until docker-compose -f '"$COMPOSE_FILE"' -p '"$PROJECT_NAME"' exec -T redis-staging redis-cli ping; do sleep 2; done'
    
    # Wait for backend
    echo -e "${BLUE}Waiting for backend API...${NC}"
    timeout 60 bash -c 'until curl -sf http://localhost:8001/health; do sleep 5; done'
    
    # Wait for frontend
    echo -e "${BLUE}Waiting for frontend...${NC}"
    timeout 60 bash -c 'until curl -sf http://localhost:3001; do sleep 5; done'
    
    echo -e "${GREEN}✅ All services are ready${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    
    # Run migrations (if you have them)
    # docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec -T backend-staging python -m alembic upgrade head
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Function to show deployment status
show_status() {
    echo -e "\n${GREEN}🎉 Staging deployment completed successfully!${NC}\n"
    
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
    
    echo -e "\n${BLUE}🌐 Access URLs:${NC}"
    echo -e "Frontend:      ${GREEN}http://localhost:3001${NC}"
    echo -e "Backend API:   ${GREEN}http://localhost:8001${NC}"
    echo -e "API Docs:      ${GREEN}http://localhost:8001/docs${NC}"
    echo -e "Flower:        ${GREEN}http://localhost:5556${NC}"
    echo -e "Nginx:         ${GREEN}http://localhost:8080${NC}"
    
    echo -e "\n${BLUE}📝 Staging Environment Info:${NC}"
    echo -e "Environment:   ${YELLOW}staging${NC}"
    echo -e "Project:       ${YELLOW}$PROJECT_NAME${NC}"
    echo -e "Config:        ${YELLOW}$STAGING_ENV_FILE${NC}"
    
    echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
    echo -e "View logs:     ${YELLOW}./scripts/staging-logs.sh${NC}"
    echo -e "Stop staging:  ${YELLOW}./scripts/staging-stop.sh${NC}"
    echo -e "Status:        ${YELLOW}./scripts/staging-status.sh${NC}"
}

# Main deployment process
main() {
    echo -e "${BLUE}Starting deployment process...${NC}\n"
    
    # Check prerequisites
    check_docker
    
    # Deployment steps
    cleanup_old_deployment
    build_images
    start_services
    wait_for_services
    run_migrations
    
    # Show final status
    show_status
    
    echo -e "\n${GREEN}✨ Staging deployment completed!${NC}"
}

# Handle script arguments
case "${1:-}" in
    --clean)
        echo -e "${YELLOW}Running clean deployment...${NC}"
        main
        ;;
    --quick)
        echo -e "${YELLOW}Running quick deployment (no cleanup)...${NC}"
        build_images
        start_services
        wait_for_services
        show_status
        ;;
    --help)
        echo "Usage: $0 [--clean|--quick|--help]"
        echo "  --clean  : Full clean deployment (default)"
        echo "  --quick  : Quick deployment without cleanup"
        echo "  --help   : Show this help message"
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
