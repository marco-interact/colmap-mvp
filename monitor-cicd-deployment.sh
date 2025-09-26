#!/bin/bash

# Monitor COLMAP Worker CI/CD Deployment
# This script helps track the GitHub Actions deployment and extract the service URL

echo "🔍 Monitoring COLMAP Worker CI/CD Pipeline..."
echo "📍 Repository: marco-interact/colmap-app"
echo "🌟 Triggered by: Changes to gcp-deployment/colmap-worker/"
echo ""

echo "📋 What's happening:"
echo "  1. ⚡ COLMAP Worker CI: Building & Testing (Fast Dockerfile.app)"
echo "  2. 🚀 Deploy Worker: Deploying to Cloud Run with GPU configuration"
echo "  3. 📝 URL Generation: New service URL will be printed by GitHub Actions"
echo ""

echo "🌐 Monitor deployment:"
echo "  • GitHub Actions: https://github.com/marco-interact/colmap-app/actions"
echo "  • Google Cloud Console: https://console.cloud.google.com/run"
echo ""

echo "📝 Next Steps After Deployment:"
echo "  1. Wait for the deployment workflow to complete"
echo "  2. Copy the service URL from the workflow output"
echo "  3. Create GitHub secret: COLMAP_WORKER_URL with the new URL"
echo "  4. Deploy frontend using the updated worker URL"
echo ""

echo "🔧 To create the GitHub secret after getting the URL:"
echo "  gh secret set COLMAP_WORKER_URL -b \"https://your-new-worker-url\""
echo ""

echo "🎯 Expected Worker URL format:"
echo "  https://colmap-worker-[hash].[region].run.app"
echo ""

echo "✅ Worker v2.0.0 Features:"
echo "  • GPU detection and acceleration support"
echo "  • Enhanced health monitoring and logging"
echo "  • Comprehensive test suite validation"
echo "  • Production-ready Cloud Run configuration"
echo ""

echo "⏳ Monitoring deployment... Check GitHub Actions for real-time status!"
