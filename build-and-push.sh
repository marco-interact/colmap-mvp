#!/bin/bash
# Build Docker image locally and push to GitHub Container Registry
# Run this script to manually build and push the image

set -e

echo "🐳 Building Docker image..."
docker build -t colmap-mvp:latest .

echo "📦 Tagging for GitHub Container Registry..."
docker tag colmap-mvp:latest ghcr.io/marco-interact/colmap-mvp:latest

echo "🔐 Logging in to GitHub Container Registry..."
echo "You'll need a GitHub Personal Access Token with write:packages scope"
echo "Create one at: https://github.com/settings/tokens/new?scopes=write:packages"
echo ""
read -p "Enter your GitHub username: " GITHUB_USER
read -sp "Enter your GitHub PAT: " GITHUB_TOKEN
echo ""

echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

echo "⬆️  Pushing to GitHub Container Registry..."
docker push ghcr.io/marco-interact/colmap-mvp:latest

echo "✅ Done! Image pushed to: ghcr.io/marco-interact/colmap-mvp:latest"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/marco-interact/colmap-mvp/packages"
echo "2. Make the package public"
echo "3. Update Northflank to use: ghcr.io/marco-interact/colmap-mvp:latest"

