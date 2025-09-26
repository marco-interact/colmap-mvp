#!/bin/bash
set -euo pipefail

# This script manually deploys a specific Docker image tag of the colmap-worker
# to Google Cloud Run.

# --- Configuration ---
SERVICE_NAME="colmap-worker"
GCP_REGION="us-central1"
IMAGE_BASE_URL="ghcr.io/marco-interact/colmap-app/colmap-worker"

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
FULL_IMAGE_URL="${IMAGE_BASE_URL}:${IMAGE_TAG}"

echo "Deploying ${FULL_IMAGE_URL} to Cloud Run service '${SERVICE_NAME}' in region '${GCP_REGION}'..."

gcloud run deploy "${SERVICE_NAME}" \
  --image "${FULL_IMAGE_URL}" \
  --region "${GCP_REGION}" \
  --platform "managed" \
  --cpu "2" \
  --memory "8Gi" \
  --accelerator "type=nvidia-tesla-p4,count=1" \
  --timeout "3600" \
  --concurrency "1" \
  --allow-unauthenticated

echo -e "\n✅ Deployment complete."
URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${GCP_REGION}" --format 'value(status.url)')
echo "🚀 Service URL: ${URL}"
