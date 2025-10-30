#!/bin/bash

# RunPod Connection Script
# This script helps you connect to your RunPod GPU instance

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 RunPod Connection Guide${NC}"
echo ""

# Check for SSH key
SSH_KEY="$HOME/.ssh/id_ed25519_interact"
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${YELLOW}⚠️  SSH key not found at $SSH_KEY${NC}"
    echo "Please ensure your SSH key is set up in RunPod dashboard"
    exit 1
fi

echo -e "${GREEN}✅ SSH key found${NC}"
echo ""

# Prompt for RunPod IP
echo -e "${BLUE}Enter your RunPod pod IP address or hostname:${NC}"
read -p "RunPod IP: " RUNPOD_IP

if [ -z "$RUNPOD_IP" ]; then
    echo -e "${YELLOW}No IP provided. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Connecting to RunPod at $RUNPOD_IP...${NC}"
echo ""

# Connect via SSH
ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    root@"$RUNPOD_IP"


