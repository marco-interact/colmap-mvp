#!/bin/bash
set -euo pipefail

# Deploy COLMAP Worker by building from local Dockerfile
# This approach doesn't require pre-built images from GHCR

# --- Configuration ---
SERVICE_NAME="colmap-worker"
GCP_REGION="us-central1"

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "🚀 COLMAP Worker Local Build & Deploy"
echo "====================================="
echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $GCP_REGION"
echo "  Service: $SERVICE_NAME"
echo ""

# Check if we have the Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found in current directory"
    exit 1
fi

echo "🏗️  Building and deploying using Cloud Build..."
echo "This will build the container in the cloud, so no local Docker needed!"
echo ""

# Use Cloud Build to build and deploy
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${GCP_REGION}" \
  --platform "managed" \
  --cpu "2" \
  --memory "4Gi" \
  --timeout "3600" \
  --concurrency "10" \
  --max-instances "5" \
  --min-instances "0" \
  --allow-unauthenticated

echo -e "\n✅ Deployment complete!"
URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${GCP_REGION}" --format 'value(status.url)')
echo "🚀 Service URL: ${URL}"
echo "❤️ Health Check: ${URL}/health"
echo ""
echo "📝 Next Steps:"
echo "1. Test the URL: curl ${URL}/health"
echo "2. Set GitHub secret: gh secret set COLMAP_WORKER_URL -b \"${URL}\""
echo "3. Deploy frontend with updated worker URL"
echo ""
echo "🎯 Use this URL for your GitHub secret:"
echo "   gh secret set COLMAP_WORKER_URL -b \"${URL}\""
