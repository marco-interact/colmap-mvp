# Deploy CPU-Only COLMAP Worker

## Quick Deployment Commands

Run these commands in your **local terminal** or **Google Cloud Shell**:

### 1. Set up Google Cloud Project
```bash
cd "/Users/marco.aurelio/Desktop/colmap app"

# Set project
gcloud config set project colmap-app

# Enable APIs
gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    cloudbuild.googleapis.com
```

### 2. Create Storage Bucket
```bash
# Create bucket for processing results
gsutil mb gs://colmap-processing-bucket || echo "Bucket already exists"
gsutil iam ch allUsers:objectViewer gs://colmap-processing-bucket
```

### 3. Create Artifact Registry
```bash
# Create repository if it doesn't exist
gcloud artifacts repositories create colmap-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="COLMAP CPU Worker Docker images" || echo "Repository already exists"

# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### 4. Build and Deploy
```bash
# Build CPU-only Docker image
docker build \
    -f Dockerfile.cpu-worker \
    -t us-central1-docker.pkg.dev/colmap-app/colmap-repo/colmap-cpu-worker:latest \
    .

# Push to registry
docker push us-central1-docker.pkg.dev/colmap-app/colmap-repo/colmap-cpu-worker:latest

# Deploy to Cloud Run
gcloud run deploy colmap-cpu-worker \
    --image us-central1-docker.pkg.dev/colmap-app/colmap-repo/colmap-cpu-worker:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 1800 \
    --concurrency 1 \
    --max-instances 5 \
    --min-instances 0 \
    --execution-environment gen2 \
    --set-env-vars STORAGE_BUCKET=colmap-processing-bucket,COLMAP_CPU_ONLY=true \
    --port 8080
```

### 5. Get Service URL and Test
```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe colmap-cpu-worker --region=us-central1 --format="value(status.url)")
echo "CPU Worker URL: $SERVICE_URL"

# Test health endpoint
curl $SERVICE_URL/health

# Update GitHub secret
gh secret set COLMAP_WORKER_URL --body="$SERVICE_URL"
```

### 6. Redeploy Frontend
```bash
# Trigger frontend deployment to connect to new worker
git add .
git commit -m "🔧 Enable CPU-only COLMAP Worker

✅ FEATURES:
- Real COLMAP processing with CPU optimization
- Dynamic scan information and technical details
- Processing stages visualization
- Cloud Storage integration for results

🚀 READY FOR TESTING:
- Upload videos for actual 3D reconstruction
- View real processing progress
- Download generated point clouds and meshes"

git push origin main
```

---

## Expected Results

After successful deployment:

1. **CPU Worker Service**: Running at Cloud Run URL (e.g., `https://colmap-cpu-worker-xxx-uc.a.run.app`)
2. **Health Check**: `GET /health` returns `{"status": "healthy"}`
3. **Processing Capability**: Can handle video uploads and run COLMAP reconstruction
4. **Frontend Integration**: Scan details and technical information populated from real API data

## Test the Complete Pipeline

1. **Login** to your app with demo credentials
2. **Create a Project** with any details
3. **Upload a Video** (small MP4 file recommended for first test)
4. **Monitor Processing** - should see real progress updates
5. **View Scan Details** - technical details populated from actual COLMAP analysis
6. **Download Results** - point cloud and mesh files available

---

## Optimization Settings

The CPU worker is configured for:
- **Memory**: 2GB per instance
- **CPU**: 2 cores per instance
- **Max Images**: 25 frames for medium quality (vs 50 for GPU)
- **Image Size**: 800px max (vs 1600px for GPU)
- **Concurrency**: 1 job per instance for stability
- **Timeout**: 30 minutes for complex videos

This provides **real 3D reconstruction** while being cost-effective for testing and development!
