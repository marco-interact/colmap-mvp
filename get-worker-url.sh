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

# Get current worker URL dynamically
echo "🔍 Getting current worker URL from Cloud Run..."
CURRENT_URL=$(gcloud run services describe colmap-worker --region us-central1 --format 'value(status.url)' 2>/dev/null)

if [ -n "$CURRENT_URL" ]; then
    echo "✅ Current worker URL: $CURRENT_URL"
    echo ""
    echo "🧪 Testing worker service..."
    
    if curl -f -s "$CURRENT_URL/health" > /dev/null 2>&1; then
        echo "✅ Worker service is ACTIVE and responding"
        echo ""
        echo "🏥 Health Check Response:"
        curl -s "$CURRENT_URL/health" | jq . 2>/dev/null || curl -s "$CURRENT_URL/health"
        echo ""
    else
        echo "❌ Worker service not responding - may be starting up"
        echo ""
    fi
else
    echo "❌ Could not get worker URL - service may not be deployed yet"
    echo "   Check GitHub Actions: https://github.com/marco-interact/colmap-app/actions"
    echo ""
fi

echo "⏳ If CI/CD is still running, wait for it to complete and check:"
echo "   https://github.com/marco-interact/colmap-app/actions"
echo ""

echo "🎯 The final URL format will be:"
echo "   https://colmap-worker-[hash].us-central1.run.app"
