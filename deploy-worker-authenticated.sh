#!/bin/bash
set -euo pipefail

# Deploy COLMAP Worker with proper authentication for frontend access

# --- Configuration ---
SERVICE_NAME="colmap-worker"
GCP_REGION="us-central1"

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

ACCOUNT=$(gcloud config get-value account 2>/dev/null)

echo "🚀 COLMAP Worker Authenticated Deploy"
echo "====================================="
echo "📋 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $GCP_REGION"
echo "  Service: $SERVICE_NAME"
echo "  Account: $ACCOUNT"
echo ""

# Check if service already exists
if gcloud run services describe "${SERVICE_NAME}" --region="${GCP_REGION}" >/dev/null 2>&1; then
    echo "🔄 Service exists, updating..."
    DEPLOY_CMD="deploy"
else
    echo "🆕 Creating new service..."
    DEPLOY_CMD="deploy"
fi

echo "🏗️  Building and deploying using Cloud Build..."

# Deploy without --allow-unauthenticated initially
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${GCP_REGION}" \
  --platform "managed" \
  --cpu "2" \
  --memory "4Gi" \
  --timeout "3600" \
  --concurrency "10" \
  --max-instances "5" \
  --min-instances "0"

echo "🔑 Setting up authentication..."

# Add the current user as an invoker
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region="${GCP_REGION}" \
  --member="user:${ACCOUNT}" \
  --role="roles/run.invoker"

# Try to allow public access (may fail due to org policy)
echo "🌐 Attempting to enable public access..."
if gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region="${GCP_REGION}" \
  --member="allUsers" \
  --role="roles/run.invoker" 2>/dev/null; then
    echo "✅ Public access enabled"
    PUBLIC_ACCESS="Yes"
else
    echo "⚠️  Public access blocked by organization policy"
    echo "🔐 Service requires authentication"
    PUBLIC_ACCESS="No"
fi

echo -e "\n✅ Deployment complete!"
URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${GCP_REGION}" --format 'value(status.url)')
echo "🚀 Service URL: ${URL}"

if [ "$PUBLIC_ACCESS" = "Yes" ]; then
    echo "❤️ Health Check: ${URL}/health"
    echo ""
    echo "🧪 Testing public access..."
    if curl -f -s "${URL}/health" >/dev/null 2>&1; then
        echo "✅ Public health check PASSED!"
    else
        echo "⚠️ Public health check failed, trying authenticated..."
    fi
else
    echo "🔐 Health Check (authenticated): curl -H 'Authorization: Bearer \$(gcloud auth print-access-token)' ${URL}/health"
fi

echo ""
echo "📝 Next Steps:"
if [ "$PUBLIC_ACCESS" = "Yes" ]; then
    echo "1. Test the URL: curl ${URL}/health"
    echo "2. Set GitHub secret: gh secret set COLMAP_WORKER_URL -b \"${URL}\""
else
    echo "1. Test with auth: curl -H 'Authorization: Bearer \$(gcloud auth print-access-token)' ${URL}/health"
    echo "2. ⚠️  For frontend to work, you may need to configure authentication or request org policy change"
    echo "3. Alternative: Set GitHub secret with auth header handling"
fi

echo ""
echo "🎯 Worker URL for GitHub secret:"
echo "   ${URL}"
