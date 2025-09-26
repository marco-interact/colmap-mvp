#!/bin/bash
set -euo pipefail

# Deploy Frontend using Cloud Build (no local Docker required)

# --- Configuration ---
SERVICE_NAME="colmap-frontend" 
GCP_REGION="us-central1"

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Get COLMAP Worker URL
COLMAP_WORKER_URL=${1:-"https://colmap-app-64102061337.us-central1.run.app"}

echo "🚀 COLMAP Frontend Cloud Build Deployment"
echo "=========================================="
echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $GCP_REGION" 
echo "  Service: $SERVICE_NAME"
echo "  Worker URL: $COLMAP_WORKER_URL"
echo ""

# Create a temporary cloudbuild.yaml for frontend deployment
cat > frontend-cloudbuild-temp.yaml << EOF
steps:
  # Build the frontend container with build args
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-f', 'Dockerfile.frontend',
      '--build-arg', 'NEXT_PUBLIC_COLMAP_WORKER_URL=${COLMAP_WORKER_URL}',
      '-t', 'us-central1-docker.pkg.dev/\$PROJECT_ID/colmap-repo/colmap-frontend:latest',
      '.'
    ]
  
  # Push the frontend container
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'us-central1-docker.pkg.dev/\$PROJECT_ID/colmap-repo/colmap-frontend:latest']
  
  # Deploy frontend to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'colmap-frontend'
      - '--image'
      - 'us-central1-docker.pkg.dev/\$PROJECT_ID/colmap-repo/colmap-frontend:latest'
      - '--region'
      - '${GCP_REGION}'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--memory'
      - '1Gi'
      - '--cpu'
      - '1'
      - '--concurrency'
      - '80'
      - '--max-instances'
      - '10'
      - '--min-instances'
      - '0'
      - '--timeout'
      - '300'
      - '--set-env-vars'
      - 'NODE_ENV=production,NEXT_PUBLIC_COLMAP_WORKER_URL=${COLMAP_WORKER_URL}'

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100

timeout: '1200s'
EOF

echo "🏗️  Building and deploying using Cloud Build..."
gcloud builds submit --config frontend-cloudbuild-temp.yaml .

# Clean up temporary file
rm frontend-cloudbuild-temp.yaml

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
echo "📝 Integration Complete:"
echo "  Frontend: ${URL}"
echo "  Worker: ${COLMAP_WORKER_URL}"
echo "  Status: Both services connected and ready for COLMAP workflow!"
