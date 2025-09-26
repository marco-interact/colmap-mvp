#!/bin/bash

# Setup Google Cloud Storage for COLMAP processing
# Creates buckets and configures permissions

set -e

PROJECT_ID="colmap-app"
BUCKET_NAME="colmap-processing-bucket"
REGION="us-central1"

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

# Set project
log_info "Setting up Google Cloud project..."
gcloud config set project $PROJECT_ID

# Enable Storage API
log_info "Enabling Cloud Storage API..."
gcloud services enable storage.googleapis.com

# Create main processing bucket
log_info "Creating processing bucket..."
if gsutil ls gs://$BUCKET_NAME >/dev/null 2>&1; then
    log_warning "Bucket $BUCKET_NAME already exists"
else
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$BUCKET_NAME
    log_success "Created bucket: gs://$BUCKET_NAME"
fi

# Set bucket lifecycle policy to clean up temporary files
log_info "Setting up lifecycle policy..."
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 7,
          "matchesPrefix": ["temp/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["uploads/"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://$BUCKET_NAME
rm lifecycle.json
log_success "Lifecycle policy configured"

# Configure CORS for web access
log_info "Configuring CORS policy..."
cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://$BUCKET_NAME
rm cors.json
log_success "CORS policy configured"

# Set IAM permissions
log_info "Setting up IAM permissions..."

# Allow Cloud Run service to read/write
SERVICE_ACCOUNT="colmap-gpu-worker@$PROJECT_ID.iam.gserviceaccount.com"

# Grant Storage Object Admin to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/storage.objectAdmin"

# Allow public read access to results (optional - for direct file serving)
log_warning "Setting public read access for results folder..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME/results

log_success "Cloud Storage setup complete!"
echo ""
echo "📋 Storage Configuration:"
echo "   Bucket: gs://$BUCKET_NAME"
echo "   Region: $REGION"
echo "   Lifecycle: Temp files deleted after 7 days, uploads after 30 days"
echo "   CORS: Enabled for web access"
echo "   Permissions: Service account has object admin access"
echo ""
echo "🔧 Test storage with:"
echo "   gsutil ls gs://$BUCKET_NAME"
echo "   echo 'test' | gsutil cp - gs://$BUCKET_NAME/test.txt"
echo "   gsutil rm gs://$BUCKET_NAME/test.txt"
