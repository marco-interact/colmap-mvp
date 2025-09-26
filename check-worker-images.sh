#!/bin/bash

# Check available COLMAP Worker images in GitHub Container Registry

set -euo pipefail

IMAGE_BASE_URL="ghcr.io/marco-interact/colmap-app/colmap-worker"

echo "🔍 Checking available COLMAP Worker images..."
echo "📦 Registry: ${IMAGE_BASE_URL}"
echo ""

echo "🌐 Available images and tags:"
echo "Visit: https://github.com/marco-interact/colmap-app/pkgs/container/colmap-app%2Fcolmap-worker"
echo ""

echo "🏷️ Common tags to try:"
echo "  • latest        - Most recent build"
echo "  • main          - Latest from main branch"
echo "  • v2.0.0        - Version 2.0.0"
echo "  • <git-sha>     - Specific commit hash"
echo ""

echo "🧪 Testing common tags..."

# Test if latest exists
echo -n "  latest: "
if docker pull "${IMAGE_BASE_URL}:latest" >/dev/null 2>&1; then
    echo "✅ Available"
else
    echo "❌ Not found"
fi

# Test if main exists  
echo -n "  main: "
if docker pull "${IMAGE_BASE_URL}:main" >/dev/null 2>&1; then
    echo "✅ Available"
else
    echo "❌ Not found"
fi

echo ""
echo "💡 Usage examples:"
echo "  ./deploy-worker-manual.sh latest"
echo "  ./deploy-worker-manual.sh main"
echo "  ./deploy-worker-manual.sh 1a2b3c4d"
echo ""

echo "🔍 To see all available tags, visit the GitHub Container Registry URL above."
