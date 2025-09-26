#!/bin/bash
set -euo pipefail

# This script manually deploys a specific Docker image tag of the colmap-worker
# to Google Cloud Run by pulling from GHCR and pushing to GCR.

# --- Configuration ---
SERVICE_NAME="colmap-worker"
GCP_REGION="us-central1"
GHCR_IMAGE_BASE="ghcr.io/marco-interact/colmap-app/colmap-worker"

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

GCR_IMAGE_BASE="gcr.io/${PROJECT_ID}/colmap-worker"

# --- Script ---

# Check if an image tag is provided as an argument.
if [ -z "$1" ]; then
  echo "Error: No image tag provided."
  echo "Usage: ./deploy-worker-manual.sh <image-tag>"
  echo "Example: ./deploy-worker-manual.sh latest"
  echo "Example: ./deploy-worker-manual.sh 1a2b3c4d"
  exit 1
fi

IMAGE_TAG=$1
GHCR_IMAGE_URL="${GHCR_IMAGE_BASE}:${IMAGE_TAG}"
GCR_IMAGE_URL="${GCR_IMAGE_BASE}:${IMAGE_TAG}"

echo "🔄 Pulling image from GHCR: ${GHCR_IMAGE_URL}"
echo "📦 Will push to GCR: ${GCR_IMAGE_URL}"
echo "🚀 Deploying to Cloud Run service '${SERVICE_NAME}' in region '${GCP_REGION}'..."
echo ""

# Configure Docker to use gcloud as a credential helper
echo "🔑 Configuring Docker authentication..."
gcloud auth configure-docker

# Pull from GHCR
echo "⬇️  Pulling image from GitHub Container Registry..."
docker pull "${GHCR_IMAGE_URL}"

# Tag for GCR
echo "🏷️  Tagging image for Google Container Registry..."
docker tag "${GHCR_IMAGE_URL}" "${GCR_IMAGE_URL}"

# Push to GCR
echo "⬆️  Pushing image to Google Container Registry..."
docker push "${GCR_IMAGE_URL}"

echo "🚀 Deploying to Cloud Run..."

gcloud run deploy "${SERVICE_NAME}" \
  --image "${GCR_IMAGE_URL}" \
  --region "${GCP_REGION}" \
  --platform "managed" \
  --cpu "2" \
  --memory "8Gi" \
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
