#!/bin/bash

# 3D Visualization Platform Setup Script

set -e

echo "🚀 Setting up 3D Visualization Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads output temp colmap_workspace

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 uploads output temp colmap_workspace

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend python -c "
from app.core.database import init_db
import asyncio
asyncio.run(init_db())
print('Database initialized successfully')
"

echo "✅ Setup complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Flower (Celery): http://localhost:5555"
echo ""
echo "📚 Next steps:"
echo "   1. Update .env file with your configuration"
echo "   2. Create your first project"
echo "   3. Upload a video to start 3D reconstruction"
echo ""
echo "🛠️  Useful commands:"
echo "   docker-compose logs -f backend    # View backend logs"
echo "   docker-compose logs -f frontend   # View frontend logs"
echo "   docker-compose down               # Stop all services"
echo "   docker-compose up -d              # Start all services"




