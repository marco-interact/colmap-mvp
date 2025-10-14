# Northflank GPU Deployment Guide

Complete guide for deploying the COLMAP 3D Reconstruction Platform to Northflank with GPU support.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Repository Configuration](#repository-configuration)
4. [Northflank Service Configuration](#northflank-service-configuration)
5. [Deployment](#deployment)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)
8. [Optimization Tips](#optimization-tips)

---

## Prerequisites

### 1. Northflank Account
- Sign up at [northflank.com](https://northflank.com)
- Verify your email and complete account setup
- Ensure you have access to GPU instances (may require plan upgrade)

### 2. GitHub Repository
- Repository: `https://github.com/marco-interact/colmap-mvp.git`
- Ensure repository is accessible (public or connected to Northflank)

### 3. Required Knowledge
- Basic Docker understanding
- Familiarity with REST APIs
- Understanding of GPU computing (helpful but not required)

---

## Initial Setup

### Step 1: Push Code to GitHub

From your local repository:

```bash
cd /Users/marco.aurelio/Desktop/colmap-mvp

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: COLMAP MVP with GPU support"

# Add remote
git remote add origin https://github.com/marco-interact/colmap-mvp.git

# Push to GitHub
git push -u origin main
```

### Step 2: Verify Files

Ensure these files are in your repository:
- ✅ `Dockerfile.northflank` - GPU-optimized container
- ✅ `main.py` - FastAPI application
- ✅ `database.py` - Database layer
- ✅ `requirements.txt` - Python dependencies
- ✅ `northflank.json` - Northflank configuration
- ✅ `.env.example` - Environment template

---

## Repository Configuration

### Configure .gitignore

Ensure sensitive files are not pushed:

```gitignore
# Environment files
.env
.env.local

# Database
*.db
*.db-journal
/data/

# Python
__pycache__/
venv/
*.pyc
```

### Optional: Google Cloud Storage

If using GCS for file storage:

1. Create a GCS bucket:
```bash
gsutil mb gs://colmap-processing-bucket
```

2. Create service account credentials:
```bash
gcloud iam service-accounts create colmap-worker \
    --display-name="COLMAP Worker"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:colmap-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

gcloud iam service-accounts keys create gcs-key.json \
    --iam-account=colmap-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

3. Add credentials to Northflank as secret (we'll do this later)

---

## Northflank Service Configuration

### Step 1: Create New Service

1. Log in to [Northflank Dashboard](https://app.northflank.com)
2. Click **"Create Service"**
3. Select **"Deploy from Git Repository"**

### Step 2: Connect GitHub Repository

1. Click **"Connect GitHub"** (if not already connected)
2. Authorize Northflank to access your repositories
3. Select repository: `marco-interact/colmap-mvp`
4. Branch: `main`

### Step 3: Build Configuration

Configure the build settings:

| Setting | Value |
|---------|-------|
| **Build Type** | Dockerfile |
| **Dockerfile Path** | `Dockerfile.northflank` |
| **Build Context** | `/` |
| **Build Arguments** | None needed |

### Step 4: Runtime Configuration

#### Basic Settings
- **Service Name**: `colmap-worker-gpu`
- **Region**: Choose closest to your users

#### Compute Resources

**IMPORTANT**: Select GPU instance!

| Resource | Setting |
|----------|---------|
| **Instance Type** | **GPU Instance** |
| **GPU Type** | NVIDIA T4 (recommended) or A10G |
| **GPU Count** | 1 |
| **CPU** | 2-4 vCPUs |
| **Memory** | 4-8 GB |
| **Storage** | 10 GB ephemeral |

#### Scaling Configuration

| Setting | Value |
|---------|-------|
| **Min Replicas** | 1 |
| **Max Replicas** | 3 |
| **Autoscaling** | Enabled |
| **Target CPU** | 80% |
| **Target Memory** | 80% |

### Step 5: Environment Variables

Add these environment variables in Northflank:

#### Required Variables

```env
PORT=8080
COLMAP_CPU_ONLY=false
CUDA_VISIBLE_DEVICES=0
NVIDIA_VISIBLE_DEVICES=all
NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics
```

#### Optional but Recommended

```env
# Database
DATABASE_PATH=/app/data/colmap_app.db

# Processing Configuration
MAX_CONCURRENT_JOBS=4
MAX_REQUESTS_PER_MINUTE=20
MAX_FRAMES_LOW=30
MAX_FRAMES_MEDIUM=50
MAX_FRAMES_HIGH=100

# Google Cloud Storage (if using)
STORAGE_BUCKET=colmap-processing-bucket
GCS_PROJECT_ID=your-project-id
```

#### Secrets (if using GCS)

For Google Cloud credentials:
1. Click **"Add Secret"**
2. Name: `GOOGLE_APPLICATION_CREDENTIALS`
3. Upload your `gcs-key.json` file
4. Mount path: `/app/secrets/gcs-key.json`

### Step 6: Networking Configuration

| Setting | Value |
|---------|-------|
| **Port** | 8080 |
| **Protocol** | HTTP |
| **Public Access** | Enabled |
| **Custom Domain** | Optional |

### Step 7: Health Checks

Configure health and readiness checks:

#### Liveness Probe
- **Path**: `/health`
- **Port**: 8080
- **Initial Delay**: 60 seconds
- **Period**: 30 seconds
- **Timeout**: 10 seconds
- **Success Threshold**: 1
- **Failure Threshold**: 3

#### Readiness Probe
- **Path**: `/readiness`
- **Port**: 8080
- **Initial Delay**: 30 seconds
- **Period**: 10 seconds
- **Timeout**: 5 seconds
- **Success Threshold**: 1
- **Failure Threshold**: 3

---

## Deployment

### Step 1: Review Configuration

Double-check all settings, especially:
- ✅ GPU instance selected
- ✅ Dockerfile path: `Dockerfile.northflank`
- ✅ Environment variables set
- ✅ Health checks configured

### Step 2: Deploy

1. Click **"Create Service"** or **"Deploy"**
2. Monitor the build logs

### Step 3: Build Process

The build will take **15-20 minutes** on first deployment:

```
[1/8] Installing system dependencies...
[2/8] Installing Ceres Solver...
[3/8] Building COLMAP with GPU support...
[4/8] Installing Python dependencies...
[5/8] Copying application files...
[6/8] Setting up directories...
[7/8] Configuring user permissions...
[8/8] Build complete!
```

### Step 4: Deployment Logs

Watch for these key messages:

```
✓ Container started
✓ Health check passed
✓ GPU detected: NVIDIA T4
✓ COLMAP Worker ready on port 8080
```

---

## Testing & Verification

### 1. Check Service Health

Get your service URL from Northflank (e.g., `https://colmap-worker-gpu-xxx.northflank.app`)

```bash
# Health check
curl https://your-service-url.northflank.app/health

# Expected response:
{
  "status": "healthy",
  "service": "colmap-worker",
  "gpu_status": true,
  "active_gpu_jobs": 0,
  "max_gpu_jobs": 4
}
```

### 2. Verify GPU

```bash
curl https://your-service-url.northflank.app/

# Check that gpu_enabled: true
{
  "message": "COLMAP Worker API",
  "status": "running",
  "version": "1.0.0",
  "gpu_enabled": true
}
```

### 3. Test Video Upload

```bash
# Upload a test video
curl -X POST https://your-service-url.northflank.app/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=test-project-123" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@example.com"

# Response:
{
  "job_id": "uuid-here",
  "scan_id": "scan-uuid",
  "status": "pending",
  "message": "Video uploaded successfully"
}
```

### 4. Check Processing Status

```bash
# Replace JOB_ID with the ID from previous step
curl https://your-service-url.northflank.app/jobs/JOB_ID

# Monitor progress:
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 40,
  "current_stage": "Feature Detection",
  "message": "Detecting features in images..."
}
```

---

## Troubleshooting

### Issue: Build Fails

**Symptom**: Build fails during COLMAP compilation

**Solutions**:
1. Check if GPU instance is selected (not CPU)
2. Increase build timeout in Northflank settings
3. Check Docker build logs for specific errors
4. Ensure Dockerfile path is correct: `Dockerfile.northflank`

### Issue: GPU Not Detected

**Symptom**: `gpu_enabled: false` in health check

**Solutions**:
1. Verify GPU instance type is selected
2. Check environment variables:
   ```env
   NVIDIA_VISIBLE_DEVICES=all
   CUDA_VISIBLE_DEVICES=0
   ```
3. Check container logs for CUDA errors
4. Restart the service

### Issue: Out of Memory

**Symptom**: Container crashes or OOM errors

**Solutions**:
1. Increase memory allocation (8GB recommended)
2. Reduce `MAX_CONCURRENT_JOBS` to 2
3. Use "low" quality for testing
4. Check for memory leaks in logs

### Issue: Slow Processing

**Symptom**: Processing takes longer than expected

**Solutions**:
1. Verify GPU is being used (check logs for "GPU detected")
2. Ensure `COLMAP_CPU_ONLY=false`
3. Check GPU utilization in Northflank metrics
4. Consider upgrading to A10G GPU for better performance

### Issue: Health Check Failing

**Symptom**: Service shows as unhealthy

**Solutions**:
1. Increase initial delay to 90 seconds (COLMAP takes time to load)
2. Check if port 8080 is correct
3. Verify application started (check logs)
4. Test health endpoint manually

---

## Optimization Tips

### 1. Cost Optimization

- **Scale to Zero**: Configure min replicas to 0 for development
- **Autoscaling**: Use autoscaling to handle variable load
- **Instance Size**: Start with T4 GPU, upgrade to A10G if needed
- **Processing Queue**: Implement job queuing for batch processing

### 2. Performance Optimization

- **Frame Count**: Adjust based on quality needs
  - Low: 30 frames (~3 min)
  - Medium: 50 frames (~6 min)
  - High: 100 frames (~15 min)

- **Concurrent Jobs**: Balance based on GPU memory
  - T4 (16GB): 2-4 concurrent jobs
  - A10G (24GB): 4-6 concurrent jobs

- **Caching**: Use build cache for faster deployments
  ```dockerfile
  # Already configured in Dockerfile.northflank
  --mount=type=cache,target=/var/cache/apt
  ```

### 3. Reliability

- **Health Checks**: Properly configured (already done)
- **Graceful Shutdown**: Handle termination signals
- **Retry Logic**: Implement exponential backoff for failed jobs
- **Monitoring**: Set up alerts for GPU utilization, memory, errors

### 4. Security

- **Environment Variables**: Use Northflank secrets for sensitive data
- **API Rate Limiting**: Already implemented (20 req/min)
- **CORS Configuration**: Update for production domains
- **Authentication**: Add API key authentication for production

---

## Next Steps

### 1. Deploy Frontend

Deploy the Next.js frontend separately:
- Use standard Node.js instance (no GPU needed)
- Configure CORS to allow frontend domain
- Set `WORKER_URL` environment variable

### 2. Add Monitoring

- Set up Northflank metrics
- Configure log aggregation
- Add error tracking (Sentry, etc.)

### 3. Production Hardening

- Add authentication middleware
- Implement proper job persistence (Redis, PostgreSQL)
- Set up file storage (S3, GCS)
- Configure CDN for model downloads

### 4. CI/CD

Connect GitHub Actions for automated deployments:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Northflank
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Northflank Deployment
        run: |
          curl -X POST https://api.northflank.com/v1/projects/$PROJECT_ID/services/$SERVICE_ID/build
```

---

## Support Resources

- **Northflank Docs**: https://northflank.com/docs
- **COLMAP Documentation**: https://colmap.github.io/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **CUDA Documentation**: https://docs.nvidia.com/cuda/

## Need Help?

1. Check Northflank logs for detailed error messages
2. Review COLMAP documentation for processing issues
3. Open GitHub issue for application bugs
4. Contact Northflank support for platform issues

---

**Ready to deploy? Follow the steps above and you'll have a GPU-powered 3D reconstruction service running in minutes!** 🚀

