#!/bin/bash

# Simple deployment script for Colmap App Frontend
echo "🚀 Deploying Colmap App Frontend..."

# Set variables
PROJECT_ID="colmap-app-1758759622"
REGION="northamerica-south1"
SERVICE_NAME="colmap-frontend"

# Deploy using Cloud Build
echo "📦 Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild-simple.yaml --substitutions _TAG_NAME=latest

echo "✅ Deployment completed!"
echo "🌐 Check your Cloud Run services: https://console.cloud.google.com/run"
