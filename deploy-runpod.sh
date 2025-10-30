#!/bin/bash

# RunPod Deployment Script
# Deploys COLMAP backend to RunPod GPU instance

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying COLMAP Backend to RunPod${NC}"
echo ""

# Check for RunPod IP
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./deploy-runpod.sh <runpod-ip-or-hostname>${NC}"
    echo ""
    echo "Example: ./deploy-runpod.sh abc123.runpod.io"
    exit 1
fi

RUNPOD_IP="$1"
SSH_KEY="$HOME/.ssh/id_ed25519_interact"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using SSH key: $SSH_KEY${NC}"
echo -e "${BLUE}📦 Target: $RUNPOD_IP${NC}"
echo ""

# Test connection
echo -e "${BLUE}Testing connection...${NC}"
if ! ssh -i "$SSH_KEY" \
    -o ConnectTimeout=10 \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    root@"$RUNPOD_IP" "echo 'Connected successfully'" 2>/dev/null; then
    echo -e "${RED}❌ Failed to connect to RunPod${NC}"
    echo "Please verify:"
    echo "  1. RunPod pod is running"
    echo "  2. SSH access is enabled in RunPod dashboard"
    echo "  3. Your SSH public key is added to RunPod"
    exit 1
fi

echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# Upload files
echo -e "${BLUE}📤 Uploading deployment files...${NC}"
rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'venv*' \
    --exclude '__pycache__' \
    --exclude '*.db' \
    --exclude 'data/results' \
    --exclude '.next' \
    ./ root@"$RUNPOD_IP":/workspace/colmap-demo/

echo ""
echo -e "${GREEN}✅ Files uploaded${NC}"
echo ""

# Deploy on RunPod
echo -e "${BLUE}🔧 Setting up on RunPod...${NC}"
ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    root@"$RUNPOD_IP" << 'ENDSSH'
cd /workspace/colmap-demo

echo "📦 Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq colmap python3-pip python3-venv > /dev/null 2>&1 || true

echo "🐍 Setting up Python environment..."
python3 -m venv venv || true
source venv/bin/activate

echo "📚 Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "✅ Setup complete!"
echo ""
echo "To start the service, run:"
echo "  cd /workspace/colmap-demo"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
ENDSSH

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Connect: ./connect-runpod.sh $RUNPOD_IP"
echo "  2. Start service: cd /workspace/colmap-demo && source venv/bin/activate && python main.py"
echo "  3. Access API: http://$RUNPOD_IP:8000"
echo ""


