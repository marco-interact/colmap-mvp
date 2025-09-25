#!/bin/bash

# Deploy Colmap App Frontend to Google Cloud Run (CPU Only - No GPU)
echo "🚀 Deploying Colmap App Frontend to Google Cloud Run (CPU Only)..."

# Set variables
PROJECT_ID="colmap-app-1758759622"
REGION="northamerica-south1"
SERVICE_NAME="colmap-frontend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# Step 1: Authenticate with Google Cloud
echo "🔐 Authenticating with Google Cloud..."
gcloud auth login --no-launch-browser

# Step 2: Set project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Step 3: Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Step 4: Build and push using Cloud Build (CPU only)
echo "📦 Building and pushing Docker image (CPU only)..."
gcloud builds submit --tag $IMAGE_NAME

# Step 5: Deploy to Cloud Run (CPU only - no GPU)
echo "🚀 Deploying to Cloud Run (CPU only)..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production \
  --max-instances 10 \
  --min-instances 0

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at: https://$SERVICE_NAME-*.$REGION.run.app"
echo "📊 Check your deployment: https://console.cloud.google.com/run"
