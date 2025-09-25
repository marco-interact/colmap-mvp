#!/bin/bash

# Setup script for GitHub Actions integration with Google Cloud Run
# This script creates a service account and sets up the necessary permissions

PROJECT_ID="colmap-app-1758759622"
SERVICE_ACCOUNT_NAME="github-actions-deployer"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo "🚀 Setting up GitHub Actions integration..."

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable iam.googleapis.com

# Create service account
echo "👤 Creating service account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --description="Service account for GitHub Actions deployment" \
    --display-name="GitHub Actions Deployer"

# Grant necessary roles
echo "🔐 Granting IAM roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Create and download key
echo "🔑 Creating service account key..."
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the contents of '$KEY_FILE'"
echo "2. Go to your GitHub repository settings"
echo "3. Navigate to Settings > Secrets and variables > Actions"
echo "4. Add a new repository secret named 'GCP_SA_KEY'"
echo "5. Paste the key file contents as the secret value"
echo "6. Delete the key file for security: rm $KEY_FILE"
echo ""
echo "🚀 Your GitHub Actions workflow will now automatically deploy on push to main!"
