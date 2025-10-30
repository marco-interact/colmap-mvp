#!/bin/bash
set -e

echo "🚀 Setting up pod 1tdnzv4w6qosch"
echo "================================"

# Check mount
echo "Checking volume mount..."
mount | grep /workspace || echo "⚠️  No volume at /workspace"
df -h /workspace

# Clone repo
echo "Cloning repo..."
cd /workspace
git clone https://github.com/marco-interact/colmap-mvp.git
cd colmap-mvp

# Setup Python
echo "Setting up Python..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Install COLMAP
echo "Installing COLMAP..."
bash runpod-install-colmap.sh

# Start backend
echo "Starting backend..."
nohup python main.py > backend.log 2>&1 &
sleep 10

echo "Checking backend status..."
tail -n 80 backend.log | grep -E "(initialized|projects|scans|Ready|ERROR)"

# Verify
echo "Verifying backend..."
curl -s http://localhost:8000/health
curl -s http://localhost:8000/api/projects

echo "✅ Setup complete!"

