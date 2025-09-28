#!/bin/bash

# Manual Frontend Deployment Script
# This script deploys the frontend service manually without GitHub Actions

set -e

echo "🚀 Manual Frontend Deployment"
echo "============================="

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
    echo "❌ Not authenticated with gcloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
PROJECT_ID="colmap-app"
REGION="us-central1"
SERVICE_NAME="colmap-frontend"

echo "📋 Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo ""

# Build and push image
echo "🔨 Building frontend image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --build-arg NEXT_PUBLIC_COLMAP_WORKER_URL="" \
  -f Dockerfile.frontend .

echo "📤 Pushing image to registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --max-instances 10 \
  --min-instances 0

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend URL: $SERVICE_URL"
echo ""
echo "🧪 Test the deployment:"
echo "  curl $SERVICE_URL"
