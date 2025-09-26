#!/bin/bash

# Get COLMAP Worker URL - Helper Script

echo "🔍 Finding COLMAP Worker URL..."
echo ""

echo "📋 Option 1: GitHub Actions (Most Recent Deployment)"
echo "  Visit: https://github.com/marco-interact/colmap-app/actions"
echo "  Look for: 'Deploy Worker to Cloud Run' job output"
echo ""

echo "📋 Option 2: Google Cloud Console"
echo "  Visit: https://console.cloud.google.com/run"
echo "  Find: 'colmap-worker' service"
echo ""

echo "📋 Option 3: Command Line (if gcloud is configured)"
echo "  Run: gcloud run services describe colmap-worker --region=us-central1 --format='value(status.url)'"
echo ""

echo "🧪 Testing Current Known URLs..."
echo ""

# Test the existing URL from documentation
EXISTING_URL="https://colmap-app-525587424361.us-central1.run.app"
echo "Testing existing URL: $EXISTING_URL"

if curl -f -s "$EXISTING_URL/health" > /dev/null 2>&1; then
    echo "✅ Current worker is ACTIVE at: $EXISTING_URL"
    echo ""
    echo "📝 You can use this URL for the GitHub secret:"
    echo "   gh secret set COLMAP_WORKER_URL -b \"$EXISTING_URL\""
    echo ""
    
    # Get health info
    echo "🏥 Health Check Response:"
    curl -s "$EXISTING_URL/health" | jq . 2>/dev/null || curl -s "$EXISTING_URL/health"
    echo ""
else
    echo "❌ Existing URL not responding - check GitHub Actions for new deployment URL"
    echo ""
fi

echo "⏳ If CI/CD is still running, wait for it to complete and check:"
echo "   https://github.com/marco-interact/colmap-app/actions"
echo ""

echo "🎯 The final URL format will be:"
echo "   https://colmap-worker-[hash].us-central1.run.app"
