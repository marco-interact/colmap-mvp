#!/bin/bash

# Deploy Frontend to Google Cloud Run
echo "🚀 Deploying Colmap App Frontend to Google Cloud Run..."

# Set variables
PROJECT_ID="colmap-app"
REGION="northamerica-south1"
SERVICE_NAME="colmap-frontend"

# Build and push the frontend image
echo "📦 Building frontend Docker image..."
docker build -f Dockerfile.frontend -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

echo "⬆️ Pushing image to Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production

echo "✅ Frontend deployed successfully!"
echo "🌐 Your app should be available at: https://colmap-frontend-*.northamerica-south1.run.app"
