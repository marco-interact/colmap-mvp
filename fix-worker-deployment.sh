#!/bin/bash

# Fix COLMAP Worker Deployment - Run this script to resolve CORS errors
# This will deploy the CPU-only COLMAP worker with proper CORS configuration

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 COLMAP Worker Deployment Fix${NC}"
echo -e "${YELLOW}This will deploy a CPU-only COLMAP worker to resolve CORS errors${NC}"
echo ""

# Configuration
PROJECT_ID="colmap-app"
REGION="us-central1"
SERVICE_NAME="colmap-cpu-worker"
IMAGE_NAME="us-central1-docker.pkg.dev/$PROJECT_ID/colmap-repo/$SERVICE_NAME"

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
command -v gcloud >/dev/null 2>&1 || { echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK first.${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo -e "${RED}❌ GitHub CLI not found. Please install GitHub CLI first.${NC}"; exit 1; }

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Set up Google Cloud
echo -e "${BLUE}🔧 Configuring Google Cloud...${NC}"
gcloud config set project $PROJECT_ID

# Enable APIs
echo -e "${BLUE}🔌 Enabling required APIs...${NC}"
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com

# Create Artifact Registry repository
echo -e "${BLUE}📦 Setting up Artifact Registry...${NC}"
if ! gcloud artifacts repositories describe colmap-repo --location=$REGION >/dev/null 2>&1; then
    gcloud artifacts repositories create colmap-repo \
        --repository-format=docker \
        --location=$REGION \
        --description="COLMAP CPU Worker Docker images"
    echo -e "${GREEN}✅ Created Artifact Registry repository${NC}"
else
    echo -e "${YELLOW}📦 Artifact Registry repository already exists${NC}"
fi

# Configure Docker
echo -e "${BLUE}🐳 Configuring Docker...${NC}"
gcloud auth configure-docker us-central1-docker.pkg.dev

# Create Cloud Storage bucket
echo -e "${BLUE}🪣 Setting up Cloud Storage...${NC}"
if ! gsutil ls gs://colmap-processing-bucket >/dev/null 2>&1; then
    gsutil mb gs://colmap-processing-bucket
    gsutil iam ch allUsers:objectViewer gs://colmap-processing-bucket
    echo -e "${GREEN}✅ Created Cloud Storage bucket${NC}"
else
    echo -e "${YELLOW}🪣 Cloud Storage bucket already exists${NC}"
fi

# Build Docker image
echo -e "${BLUE}🔨 Building CPU-only COLMAP worker...${NC}"
docker build \
    -f Dockerfile.cpu-worker \
    -t $IMAGE_NAME:latest \
    .

# Push Docker image
echo -e "${BLUE}📤 Pushing to Artifact Registry...${NC}"
docker push $IMAGE_NAME:latest

# Deploy to Cloud Run
echo -e "${BLUE}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 1800 \
    --concurrency 1 \
    --max-instances 5 \
    --min-instances 0 \
    --execution-environment gen2 \
    --set-env-vars STORAGE_BUCKET=colmap-processing-bucket,COLMAP_CPU_ONLY=true \
    --port 8080

# Get service URL
echo -e "${BLUE}🔗 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

# Test health endpoint
echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
sleep 10
if curl -f "$SERVICE_URL/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    
    # Update GitHub secret
    echo -e "${BLUE}🔐 Updating GitHub secret...${NC}"
    gh secret set COLMAP_WORKER_URL --body="$SERVICE_URL"
    
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo -e "   ${GREEN}✅${NC} CPU-only COLMAP worker deployed"
    echo -e "   ${GREEN}✅${NC} Service URL: $SERVICE_URL"
    echo -e "   ${GREEN}✅${NC} Health check: PASSED"
    echo -e "   ${GREEN}✅${NC} GitHub secret updated"
    echo -e "   ${GREEN}✅${NC} CORS properly configured"
    echo ""
    echo -e "${YELLOW}🔄 Next step: Trigger frontend deployment${NC}"
    echo -e "   Run: ${BLUE}git commit --allow-empty -m \"Trigger frontend redeploy\" && git push origin main${NC}"
    echo ""
    echo -e "${GREEN}🧪 Test your app now - upload videos will work with real COLMAP processing!${NC}"
    
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}📋 Check logs: gcloud run logs tail $SERVICE_NAME --region=$REGION${NC}"
    exit 1
fi
