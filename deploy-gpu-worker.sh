#!/bin/bash

# Deploy GPU-Accelerated COLMAP Worker to Google Cloud Run
# Requires Google Cloud CLI to be installed and authenticated

set -e

# Configuration
PROJECT_ID="colmap-app"
SERVICE_NAME="colmap-gpu-worker"
REGION="us-central1"
REPOSITORY="colmap-repo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Ensure we're in the right project
log_info "Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Create Cloud Storage bucket for results (if doesn't exist)
log_info "Setting up Cloud Storage bucket..."
if ! gsutil ls gs://colmap-processing-bucket >/dev/null 2>&1; then
    log_info "Creating storage bucket..."
    gsutil mb gs://colmap-processing-bucket
    gsutil iam ch allUsers:objectViewer gs://colmap-processing-bucket
else
    log_info "Storage bucket already exists"
fi

# Enable required APIs
log_info "Enabling Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com

# Create Artifact Registry repository (if doesn't exist)
log_info "Setting up Artifact Registry..."
if ! gcloud artifacts repositories describe $REPOSITORY --location=$REGION >/dev/null 2>&1; then
    log_info "Creating Artifact Registry repository..."
    gcloud artifacts repositories create $REPOSITORY \
        --repository-format=docker \
        --location=$REGION \
        --description="COLMAP GPU Worker Docker images"
else
    log_info "Artifact Registry repository already exists"
fi

# Configure Docker authentication
log_info "Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push Docker image
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:latest"

log_info "Building GPU-enabled Docker image..."
docker build \
    -f Dockerfile.gpu-worker \
    -t $IMAGE_URL \
    .

log_info "Pushing Docker image to Artifact Registry..."
docker push $IMAGE_URL

# Deploy to Cloud Run with GPU
log_info "Deploying to Cloud Run with GPU acceleration..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_URL \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --timeout 3600 \
    --concurrency 1 \
    --max-instances 3 \
    --min-instances 0 \
    --execution-environment gen2 \
    --gpu 1 \
    --gpu-type nvidia-tesla-t4 \
    --set-env-vars STORAGE_BUCKET=colmap-processing-bucket,NVIDIA_VISIBLE_DEVICES=all,NVIDIA_DRIVER_CAPABILITIES=compute,utility \
    --port 8080

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

log_success "GPU-enabled COLMAP Worker deployed successfully!"
log_info "Service URL: $SERVICE_URL"
log_info "Health Check: $SERVICE_URL/health"

# Test the deployment
log_info "Testing deployment health..."
if curl -f "$SERVICE_URL/health" >/dev/null 2>&1; then
    log_success "Health check passed! GPU Worker is running."
else
    log_warning "Health check failed. Check Cloud Run logs for details."
    log_info "View logs with: gcloud run logs tail $SERVICE_NAME --region=$REGION"
fi

log_success "Deployment complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   Service: $SERVICE_NAME"
echo "   URL: $SERVICE_URL"
echo "   Region: $REGION"
echo "   GPU: NVIDIA Tesla T4"
echo "   Memory: 4GB"
echo "   CPU: 2"
echo "   Storage: gs://colmap-processing-bucket"
echo ""
echo "🧪 Test with:"
echo "   curl $SERVICE_URL/health"
echo ""
echo "📊 Monitor with:"
echo "   gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION"
