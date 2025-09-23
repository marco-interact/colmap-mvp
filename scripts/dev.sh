#!/bin/bash

# Development Environment Setup Script

set -e

echo "🔧 Setting up development environment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Start only the required services for development
echo "🚀 Starting development services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

echo "✅ Development environment ready!"
echo ""
echo "🚀 To start development:"
echo "   Backend: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload"
echo "   Frontend: cd frontend && npm start"
echo ""
echo "🌐 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"




