#!/bin/bash

# Manual Worker Service Deployment Script
# This script deploys the COLMAP worker service manually

set -e

echo "🚀 Manual Worker Service Deployment"
echo "==================================="

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null; then
    echo "❌ Not authenticated with gcloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project
PROJECT_ID="colmap-app"
REGION="us-central1"
SERVICE_NAME="colmap-worker"

echo "📋 Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo ""

# Build and push worker image
echo "🔨 Building worker image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME \
  -f ./gcp-deployment/colmap-worker/Dockerfile \
  ./gcp-deployment/colmap-worker

echo "📤 Pushing worker image to registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run (CPU-only for now)
echo "🚀 Deploying worker service to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 8Gi \
  --cpu 4 \
  --port 8080 \
  --timeout 3600 \
  --max-instances 3 \
  --min-instances 0

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo ""
echo "✅ Worker deployment complete!"
echo "🌐 Worker URL: $SERVICE_URL"
echo ""
echo "🧪 Test the worker service:"
echo "  curl $SERVICE_URL/health"
echo ""
echo "🔄 Now redeploy the frontend to connect to the worker:"
echo "  ./deploy-frontend-manual.sh"