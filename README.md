# COLMAP 3D Reconstruction Platform

A Google Cloud-based 3D reconstruction platform using COLMAP for photogrammetry and 3D model generation.

## 🏗️ Architecture

- **Backend**: FastAPI Python application
- **Deployment**: Google Cloud Run
- **Build**: Google Cloud Build
- **Storage**: Google Cloud Storage
- **Processing**: COLMAP 3D reconstruction pipeline

## 🚀 Quick Start

### Prerequisites
- Google Cloud Platform account
- Google Cloud CLI installed and authenticated
- Docker (for local testing)

### Deployment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/marco-interact/colmap-app.git
   cd colmap-app
   ```

2. **Deploy to Google Cloud**:
   The project is configured for automatic deployment via Google Cloud Build.
   Simply push to the main branch and the build will trigger automatically.

3. **Manual deployment** (if needed):
   ```bash
   gcloud builds submit --config cloudbuild.yaml .
   ```

## 📁 Project Structure

```
├── Dockerfile              # Container configuration
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── cloudbuild.yaml        # Google Cloud Build configuration
├── gcp-deployment/        # Additional deployment files
└── README.md              # This file
```

## 🔧 API Endpoints

- `GET /` - Health check
- `GET /health` - Service status
- `POST /upload-video` - Upload video for processing
- `GET /jobs/{job_id}` - Check processing status
- `GET /download/{project_id}/{file_type}` - Download processed models

## 🌐 Deployment

The application is automatically deployed to Google Cloud Run when changes are pushed to the main branch.

**Service URL**: https://colmap-app-525587424361.northamerica-south1.run.app

## 📊 Features

- **Video Upload**: Support for MP4, MOV, AVI formats
- **3D Reconstruction**: COLMAP-based photogrammetry
- **Multiple Outputs**: Point clouds, meshes, textures
- **Quality Settings**: Low, medium, high, extreme quality options
- **Auto-scaling**: Scales to 0 when idle (cost-effective)

## 🛠️ Development

### Local Testing
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python main.py
```

### Docker Testing
```bash
# Build container
docker build -t colmap-worker .

# Run container
docker run -p 8080:8080 colmap-worker
```

## 📈 Performance

- **Memory**: 1GB RAM (configurable)
- **CPU**: 1 core (configurable)
- **Timeout**: 20 minutes for processing
- **Auto-scaling**: 0-10 instances based on demand

## 🔒 Security

- HTTPS only
- No persistent storage of uploaded files
- Automatic cleanup of temporary files
- IAM-based access control

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.
