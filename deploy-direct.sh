#!/bin/bash

# Direct deployment script for Colmap App Frontend
echo "🚀 Deploying Colmap App Frontend directly..."

# Set variables
PROJECT_ID="colmap-app-1758759622"
REGION="northamerica-south1"
SERVICE_NAME="colmap-frontend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "📋 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🐳 Image: $IMAGE_NAME"

# Step 1: Build Docker image locally (if Docker is available)
echo "📦 Building Docker image..."
if command -v docker &> /dev/null; then
    docker build -f Dockerfile.frontend -t $IMAGE_NAME .
    echo "✅ Docker image built locally"
else
    echo "⚠️  Docker not available locally, will use Cloud Build"
fi

# Step 2: Deploy using gcloud run deploy with source
echo "🚀 Deploying to Cloud Run from source..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production,COLMAP_WORKER_URL=https://colmap-app-64102061337.us-central1.run.app \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300

echo "✅ Deployment completed!"
echo "🌐 Check your deployment: https://console.cloud.google.com/run"
