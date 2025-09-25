#!/bin/bash

# Deploy Colmap App Frontend to Google Cloud Run
echo "🚀 Deploying Colmap App Frontend to Google Cloud Run..."

# Set variables
PROJECT_ID="colmap-app-1758759622"
REGION="northamerica-south1"
SERVICE_NAME="colmap-frontend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# Step 1: Authenticate with Google Cloud
echo "🔐 Authenticating with Google Cloud..."
gcloud auth login
gcloud config set project $PROJECT_ID

# Step 2: Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Step 3: Build and push using Cloud Build
echo "📦 Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME

# Step 4: Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: https://$SERVICE_NAME-*.$REGION.run.app"
