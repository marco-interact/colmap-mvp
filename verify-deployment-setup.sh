#!/bin/bash

# Verify deployment setup and prerequisites

set -euo pipefail

echo "🔍 Verifying COLMAP Worker Deployment Setup"
echo "==========================================="
echo ""

# Check gcloud CLI
echo "1. Checking Google Cloud CLI..."
if command -v gcloud &> /dev/null; then
    echo "   ✅ gcloud CLI installed"
    
    # Check authentication
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        echo "   ✅ Authenticated to Google Cloud"
        ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
        echo "   📧 Active account: $ACCOUNT"
    else
        echo "   ❌ Not authenticated to Google Cloud"
        echo "   🔧 Run: gcloud auth login"
    fi
    
    # Check project
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ -n "$PROJECT_ID" ]; then
        echo "   ✅ Project set: $PROJECT_ID"
    else
        echo "   ❌ No project set"
        echo "   🔧 Run: gcloud config set project <your-project-id>"
    fi
else
    echo "   ❌ gcloud CLI not found"
    echo "   🔧 Install: https://cloud.google.com/sdk/docs/install"
fi

echo ""

# Check Docker
echo "2. Checking Docker..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker installed"
    
    # Test docker access
    if docker info &> /dev/null; then
        echo "   ✅ Docker daemon accessible"
    else
        echo "   ❌ Docker daemon not accessible"
        echo "   🔧 Start Docker Desktop or docker service"
    fi
else
    echo "   ❌ Docker not found"
    echo "   🔧 Install Docker Desktop or Docker Engine"
fi

echo ""

# Check script permissions
echo "3. Checking deployment scripts..."
if [ -x "./deploy-worker-manual.sh" ]; then
    echo "   ✅ deploy-worker-manual.sh is executable"
else
    echo "   ❌ deploy-worker-manual.sh not executable"
    echo "   🔧 Run: chmod +x deploy-worker-manual.sh"
fi

if [ -x "./check-worker-images.sh" ]; then
    echo "   ✅ check-worker-images.sh is executable"
else
    echo "   ❌ check-worker-images.sh not executable" 
    echo "   🔧 Run: chmod +x check-worker-images.sh"
fi

echo ""

# Check GitHub CLI (optional)
echo "4. Checking GitHub CLI (optional)..."
if command -v gh &> /dev/null; then
    echo "   ✅ GitHub CLI installed"
    
    # Check authentication
    if gh auth status &> /dev/null; then
        echo "   ✅ Authenticated to GitHub"
    else
        echo "   ❌ Not authenticated to GitHub"
        echo "   🔧 Run: gh auth login"
    fi
else
    echo "   ⚠️  GitHub CLI not found (optional)"
    echo "   💡 Install for easier secret management: gh secret set COLMAP_WORKER_URL"
fi

echo ""

# Summary
echo "📋 Next Steps:"
echo "1. Fix any ❌ issues above"
echo "2. Check available images: ./check-worker-images.sh"
echo "3. Deploy worker: ./deploy-worker-manual.sh latest"
echo "4. Set GitHub secret with the worker URL"
echo "5. Deploy frontend"
echo ""

echo "📖 For detailed instructions, see: WORKER_DEPLOYMENT_GUIDE.md"
