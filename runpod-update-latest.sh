#!/bin/bash
# RunPod Update Script - Pull latest code and restart backend

echo "🔄 Updating RunPod backend with latest changes..."
echo ""

# Navigate to project directory
cd /workspace/colmap-mvp

# Stop existing backend processes
echo "⏹️  Stopping existing backend processes..."
pkill -f "python.*main.py"
sleep 2

# Pull latest code from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source venv/bin/activate

# Install any new dependencies
echo "📦 Checking for new dependencies..."
pip install -r requirements.txt --quiet

# Start backend in background with nohup
echo "🚀 Starting backend..."
nohup python main.py > backend.log 2>&1 &

# Get the process ID
BACKEND_PID=$!
echo "   Backend started with PID: $BACKEND_PID"

# Wait a moment for startup
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend is running successfully!"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs: tail -f backend.log"
    echo "   Check status: curl http://localhost:8000/health"
    echo "   Stop backend: pkill -f 'python.*main.py'"
    echo ""
    echo "📊 Latest changes:"
    git log --oneline -5
else
    echo "❌ Backend failed to start. Check backend.log for errors."
    exit 1
fi

