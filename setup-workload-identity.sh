#!/bin/bash

# Setup script for GitHub Actions with Workload Identity Federation (more secure)
# This avoids the need for service account keys

PROJECT_ID="colmap-app"
PROJECT_NUMBER="64102061337"
WORKLOAD_IDENTITY_POOL_ID="github-actions-pool"
WORKLOAD_IDENTITY_PROVIDER_ID="github-actions-provider"
SERVICE_ACCOUNT_NAME="github-actions-deployer"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
REPO_OWNER="marco-interact"
REPO_NAME="colmap-app"

echo "🚀 Setting up Workload Identity Federation for GitHub Actions..."

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com
gcloud services enable sts.googleapis.com

# Create Workload Identity Pool
echo "🔐 Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create $WORKLOAD_IDENTITY_POOL_ID \
    --location="global" \
    --description="Pool for GitHub Actions" \
    --display-name="GitHub Actions Pool" || echo "Pool might already exist"

# Create Workload Identity Provider
echo "🔗 Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc $WORKLOAD_IDENTITY_PROVIDER_ID \
    --workload-identity-pool=$WORKLOAD_IDENTITY_POOL_ID \
    --location="global" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --attribute-condition="assertion.repository_owner=='${REPO_OWNER}'" || echo "Provider might already exist"

# Allow GitHub Actions to impersonate the service account
echo "🎭 Setting up service account impersonation..."
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
    --role roles/iam.workloadIdentityUser \
    --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$WORKLOAD_IDENTITY_POOL_ID/attribute.repository/${REPO_OWNER}/${REPO_NAME}"

# Get the Workload Identity Provider resource name
WORKLOAD_IDENTITY_PROVIDER=$(gcloud iam workload-identity-pools providers describe $WORKLOAD_IDENTITY_PROVIDER_ID \
    --workload-identity-pool=$WORKLOAD_IDENTITY_POOL_ID \
    --location="global" \
    --format="value(name)")

echo "✅ Setup complete!"
echo ""
echo "📋 GitHub Secrets to add:"
echo "1. Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/secrets/actions"
echo "2. Add these repository secrets:"
echo ""
echo "   WIF_PROVIDER: $WORKLOAD_IDENTITY_PROVIDER"
echo "   WIF_SERVICE_ACCOUNT: $SERVICE_ACCOUNT_EMAIL"
echo "   GCP_PROJECT_ID: $PROJECT_ID"
echo ""
echo "🚀 Your GitHub Actions workflow will now use Workload Identity Federation!"
echo "This is more secure as it doesn't require service account keys."
