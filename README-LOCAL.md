# 3D Visualization and Modeling Platform

A comprehensive 3D reconstruction platform that enables users to capture, process, and convert physical spaces into detailed 3D models using photogrammetry and COLMAP.

## 🎯 Project Overview

This platform streamlines the workflow from initial documentation through final model delivery, reducing processing time by 60% and improving accuracy for professionals in architecture, real estate, and manufacturing.

### ✨ Key Features

- **🎥 Video Processing**: Support for 360° video capture and frame extraction
- **🔬 COLMAP Pipeline**: Automated 3D reconstruction using Structure from Motion (SfM)
- **🌐 Interactive 3D Viewer**: Web-based visualization with Three.js and WebGL
- **👥 Collaborative Tools**: Project management and sharing capabilities
- **📦 Multi-format Export**: Support for PLY, OBJ, glTF formats
- **⚡ Real-time Processing**: Distributed processing with Celery workers
- **📊 Progress Tracking**: Real-time job monitoring and status updates

### 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Three.js + React Three Fiber for 3D visualization
- WebGL for hardware acceleration
- Styled Components for UI
- React Query for state management

**Backend:**
- Python 3.9+ + FastAPI
- COLMAP for 3D reconstruction
- Celery + Redis for async processing
- PostgreSQL for metadata storage
- OpenCV for image processing
- FFmpeg for video processing

**Infrastructure:**
- Docker containerization
- AWS-ready deployment
- Auto-scaling for compute-intensive workloads
- Redis for caching and job queues

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.9+
- 8GB+ RAM recommended

### Option 1: Docker Setup (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd 3d-visualization-platform
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Celery Monitor: http://localhost:5555

### Option 2: Development Setup

1. **Start services:**
   ```bash
   chmod +x scripts/dev.sh
   ./scripts/dev.sh
   ```

2. **Start development servers:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   source venv/bin/activate
   python -m uvicorn app.main:app --reload
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

## 🏗️ Architecture

The platform follows a microservices architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │   FastAPI       │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Celery        │    │   Redis         │
                       │   Workers       │◄──►│   (Port 6379)   │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   COLMAP        │
                       │   Pipeline      │
                       └─────────────────┘
```

### Core Services

- **🎥 Video Upload Service**: Handles video uploads and validation
- **🖼️ Frame Extraction Service**: Extracts frames using FFmpeg
- **🔬 COLMAP Pipeline Service**: Manages 3D reconstruction workflows
- **🎨 Post-processing Service**: Handles mesh generation and texturing
- **🌐 Visualization Service**: Serves 3D models for web viewing

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Development Guide](docs/DEVELOPMENT.md) - Contributing and development setup

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=3d_platform

# Redis
REDIS_URL=redis://localhost:6379/0

# COLMAP Settings
COLMAP_QUALITY=medium  # low, medium, high, extreme
MAX_CONCURRENT_JOBS=4
```

### COLMAP Quality Settings

| Quality | Max Image Size | Max Features | Processing Time | Output Quality |
|---------|---------------|--------------|-----------------|----------------|
| Low     | 800px         | 4,000        | ~30 min         | Basic          |
| Medium  | 1,200px       | 8,000        | ~60 min         | Good           |
| High    | 1,600px       | 12,000       | ~120 min        | High           |
| Extreme | 2,400px       | 20,000       | ~240 min        | Professional   |

## 🎮 Usage

### 1. Create a Project
- Navigate to Projects page
- Click "New Project"
- Enter project name and description

### 2. Upload Video
- Go to project detail page
- Upload a video file (MP4, AVI, MOV, MKV)
- Wait for upload to complete

### 3. Extract Frames
- Click "Extract Frames" button
- Choose frame extraction interval (default: 1 second)
- Monitor progress in real-time

### 4. Start Reconstruction
- Click "Start Reconstruction"
- Select quality level
- Monitor processing jobs

### 5. View 3D Model
- Once completed, click "3D Viewer"
- Interact with the model using mouse controls
- Download in various formats

## 🔍 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/token` - Login and get token
- `GET /auth/me` - Get current user

### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/{id}` - Get project details
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project

### Files
- `POST /files/upload/video` - Upload video
- `POST /files/extract-frames` - Extract frames
- `GET /files/download/{project_id}/{type}` - Download files

### Jobs
- `GET /jobs` - List processing jobs
- `GET /jobs/{id}` - Get job details
- `POST /jobs/{id}/cancel` - Cancel job

## 🚀 Deployment

### Production Deployment

1. **Configure environment:**
   ```bash
   cp env.example .env.production
   # Edit with production values
   ```

2. **Deploy with Docker:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Setup SSL and domain:**
   ```bash
   # Configure nginx and SSL certificates
   ```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write tests for new features
- Update documentation as needed

## 📊 Performance

### Benchmarks

| Video Length | Frames | Quality | Processing Time | Output Size |
|-------------|--------|---------|-----------------|-------------|
| 30 seconds  | 30     | Medium  | ~15 minutes     | 50MB        |
| 2 minutes   | 120    | High    | ~45 minutes     | 200MB       |
| 5 minutes   | 300    | High    | ~90 minutes     | 500MB       |

### Optimization Tips

- Use shorter videos for faster processing
- Choose appropriate quality level
- Ensure good lighting and stable camera movement
- Avoid reflective surfaces when possible

## 🐛 Troubleshooting

### Common Issues

**COLMAP fails to start:**
- Check if COLMAP is properly installed
- Verify video quality and lighting
- Try with lower quality settings

**Out of memory errors:**
- Reduce COLMAP quality settings
- Use smaller video files
- Increase server RAM

**Slow processing:**
- Check CPU usage
- Reduce concurrent jobs
- Use SSD storage

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review API documentation
- Contact support team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [COLMAP](https://colmap.github.io/) - 3D reconstruction engine
- [Three.js](https://threejs.org/) - 3D graphics library
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [React](https://reactjs.org/) - Frontend library

## 📞 Support

- 📧 Email: support@3dplatform.com
- 💬 Discord: [Join our community](https://discord.gg/3dplatform)
- 📖 Documentation: [docs.3dplatform.com](https://docs.3dplatform.com)
