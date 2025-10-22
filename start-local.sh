#!/bin/bash
# Local Development Startup Script
# Single Port Access: http://localhost:3000

echo "🚀 Starting COLMAP MVP - Local Development"
echo "=========================================="
echo ""

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Backend (FastAPI on port 8000)
echo "🔧 Starting Backend Service (port 8000)..."
cd "$(dirname "$0")"
export COLMAP_CPU_ONLY=1  # Use CPU mode for M2 Mac
/Users/marco.aurelio/Desktop/colmap-mvp/venv-local/bin/python3 main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start. Check backend.log"
    exit 1
fi

# Initialize demo data
echo "📦 Setting up demo data..."
curl -X POST http://localhost:8000/database/setup-demo -H "Content-Type: application/json" 2>&1 | grep -q "success" && echo "✅ Demo data initialized" || echo "⚠️  Demo data may already exist"

# Start Frontend (Next.js on port 3000)
echo "🎨 Starting Frontend Service (port 3000)..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "✅ COLMAP MVP is running!"
echo "=========================================="
echo ""
echo "🌐 Access your app at: http://localhost:3000"
echo ""
echo "📧 Demo login: demo@colmap.app"
echo ""
echo "📋 Logs:"
echo "  - Backend:  tail -f backend.log"
echo "  - Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "  lsof -ti:8000 | xargs kill -9"
echo "  lsof -ti:3000 | xargs kill -9"
echo ""
