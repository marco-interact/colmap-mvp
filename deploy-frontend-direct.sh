#!/bin/bash
set -euo pipefail

# Direct Frontend Deployment Script
# This deploys the frontend directly with environment variables

# --- Configuration ---
SERVICE_NAME="colmap-frontend"
GCP_REGION="us-central1"

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Get COLMAP Worker URL from GitHub secret (you can also pass it as parameter)
COLMAP_WORKER_URL=${1:-"https://colmap-app-64102061337.us-central1.run.app"}

echo "🚀 COLMAP Frontend Direct Deployment"
echo "===================================="
echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $GCP_REGION" 
echo "  Service: $SERVICE_NAME"
echo "  Worker URL: $COLMAP_WORKER_URL"
echo ""

# Check if we have the frontend Dockerfile
if [ ! -f "Dockerfile.frontend" ]; then
    echo "❌ Dockerfile.frontend not found in current directory"
    exit 1
fi

echo "🏗️  Building and deploying frontend with environment variables..."

# Build with docker and deploy
echo "🐳 Building Docker image with build args..."
docker build -f Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_COLMAP_WORKER_URL="${COLMAP_WORKER_URL}" \
  -t "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" .

echo "📦 Pushing Docker image to registry..."
docker push "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
  --region "${GCP_REGION}" \
  --platform "managed" \
  --cpu "1" \
  --memory "1Gi" \
  --timeout "300" \
  --concurrency "80" \
  --max-instances "10" \
  --min-instances "0" \
  --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_COLMAP_WORKER_URL=${COLMAP_WORKER_URL}" \
  --allow-unauthenticated

echo -e "\n✅ Frontend Deployment Complete!"
URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${GCP_REGION}" --format 'value(status.url)')
echo "🚀 Frontend URL: ${URL}"
echo "❤️ Health Check: ${URL}/api/health"
echo "🔗 Worker Integration: Frontend configured to use ${COLMAP_WORKER_URL}"
echo ""

echo "🧪 Testing deployment..."
sleep 30

# Test health endpoint
if curl -f -s "${URL}/api/health" >/dev/null 2>&1; then
    echo "✅ Health check PASSED!"
    echo "🎉 Frontend is running and ready!"
else
    echo "⚠️ Health check failed, but frontend might still be starting..."
    echo "🔗 Check in Cloud Console: https://console.cloud.google.com/run"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Open frontend: ${URL}"
echo "2. Test COLMAP workflow: Upload video → 3D processing → View results"
echo "3. Monitor both services in Cloud Console"
echo ""
echo "🎯 Complete Integration URLs:"
echo "  Frontend: ${URL}"
echo "  Worker: ${COLMAP_WORKER_URL}"
