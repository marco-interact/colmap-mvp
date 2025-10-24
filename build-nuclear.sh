#!/bin/bash

# ========================================
# NUCLEAR BUILD SCRIPT
# Builds complete COLMAP + Open3D + Three.js image
# ========================================

set -e

echo "🚀 NUCLEAR BUILD: Complete COLMAP + Open3D + Three.js Integration"
echo "================================================================"

# Build the complete image locally
echo "🐳 Building complete Docker image..."
docker build -t ghcr.io/marco-interact/colmap-mvp:latest \
    -t ghcr.io/marco-interact/colmap-mvp:nuclear-$(date +%Y%m%d-%H%M%S) \
    -f Dockerfile.nuclear .

echo "✅ Build completed successfully!"

# Push to GitHub Container Registry
echo "📤 Pushing to GitHub Container Registry..."
docker push ghcr.io/marco-interact/colmap-mvp:latest
docker push ghcr.io/marco-interact/colmap-mvp:nuclear-$(date +%Y%m%d-%H%M%S)

echo "🎯 NUCLEAR BUILD COMPLETE!"
echo "Image: ghcr.io/marco-interact/colmap-mvp:latest"
echo "Ready for Northflank deployment!"
