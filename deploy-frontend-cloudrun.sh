#!/bin/bash

# Deploy Frontend to Google Cloud Run
# This script builds and deploys the Next.js frontend as a containerized service

set -e  # Exit on any error

echo "🚀 Starting COLMAP Frontend Deployment to Cloud Run..."

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="colmap-frontend"
IMAGE_NAME="gcr.io/$PROJECT_ID/colmap-frontend"

echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Image: $IMAGE_NAME"

# Step 1: Build and push the container image
echo ""
echo "🐳 Building frontend container..."
gcloud builds submit \
  --config cloudbuild-frontend.yaml \
  --substitutions=_REGION=$REGION,_SERVICE_NAME=$SERVICE_NAME \
  .

echo ""
echo "✅ Frontend deployment initiated!"
echo ""
echo "🔗 Monitor deployment:"
echo "  Console: https://console.cloud.google.com/run?project=$PROJECT_ID"
echo "  Logs: gcloud logs tail /projects/$PROJECT_ID/logs/run.googleapis.com%2Frequests --format='value(textPayload)'"
echo ""
echo "🌐 Once deployed, your frontend will be available at:"
echo "  https://$SERVICE_NAME-[hash].$REGION.run.app"
echo ""

# Wait a moment and get the service URL
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)" 2>/dev/null || echo "Still deploying...")

if [[ $SERVICE_URL != "Still deploying..." ]]; then
    echo "🎉 Deployment complete!"
    echo "🌐 Frontend URL: $SERVICE_URL"
    echo "❤️ Health Check: $SERVICE_URL/api/health"
else
    echo "⏳ Deployment in progress. Check the Cloud Console for updates."
fi
