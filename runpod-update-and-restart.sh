#!/bin/bash
# RunPod Update and Restart Script
# Run this in your RunPod terminal

set -e

echo "🔄 Pulling latest code from GitHub..."
cd /workspace/colmap-mvp
git pull origin main

echo "🛑 Stopping existing processes..."
pkill python || true
pkill cloudflared || true
sleep 2

echo "🗑️ Cleaning old database..."
rm -f /workspace/database.db

echo "⚡ Activating virtual environment..."
source venv/bin/activate

echo "🚀 Starting backend..."
nohup python main.py > backend.log 2>&1 &
sleep 3

echo "📋 Checking backend logs..."
tail -20 backend.log

echo "🧪 Testing backend locally..."
curl -s http://localhost:8000/api/projects | jq .

echo "🌐 Starting Cloudflare tunnel..."
nohup cloudflared tunnel --url http://localhost:8000 > cloudflared.log 2>&1 &
sleep 5

echo "🔗 Getting tunnel URL..."
grep "https://" cloudflared.log | grep trycloudflare | head -1

echo "✅ Done! Copy the tunnel URL above and update Vercel with it."

