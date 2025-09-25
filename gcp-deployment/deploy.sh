#!/bin/bash

# Google Cloud Deployment Script for COLMAP Platform
# This script deploys the COLMAP application to Google Cloud Run

set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="colmap-app"

echo "🚀 Deploying COLMAP Platform to Google Cloud..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"

# Enable required services
echo "📋 Enabling required services..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    container.googleapis.com \
    storage.googleapis.com \
    compute.googleapis.com

# Build and deploy COLMAP worker
echo "🔧 Building COLMAP worker..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/colmap-worker \
    ./colmap-worker

echo "🚀 Deploying COLMAP worker to Cloud Run..."
gcloud run deploy colmap-worker \
    --image gcr.io/$PROJECT_ID/colmap-worker \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --timeout 3600 \
    --max-instances 10 \
    --set-env-vars="PYTHONPATH=/app"

# Build and deploy frontend
echo "🎨 Building frontend..."
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/colmap-frontend \
    ./frontend

echo "🚀 Deploying frontend to Cloud Run..."
gcloud run deploy colmap-frontend \
    --image gcr.io/$PROJECT_ID/colmap-frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 1 \
    --max-instances 5

# Get service URLs
WORKER_URL=$(gcloud run services describe colmap-worker --region=$REGION --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe colmap-frontend --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed!"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔧 Worker URL: $WORKER_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend environment variables with the worker URL"
echo "2. Test the COLMAP processing pipeline"
echo "3. Set up monitoring and logging"

