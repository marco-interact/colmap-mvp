# 🚀 Northflank Deployment Guide - CPU-Based COLMAP

**Date:** October 22, 2025  
**Configuration:** CPU-optimized COLMAP processing  
**Repository:** https://github.com/marco-interact/colmap-mvp

---

## 📋 Overview

This guide covers deploying the COLMAP MVP backend to Northflank with CPU-based 3D reconstruction processing.

### Architecture
- **Backend:** FastAPI + COLMAP (CPU-only mode)
- **Compute:** 2 vCPUs, 4GB RAM (minimum)
- **Storage:** 10GB ephemeral (scalable)
- **Database:** SQLite (can upgrade to PostgreSQL)

---

## 🎯 Quick Setup

### Prerequisites
1. Northflank account (https://northflank.com)
2. GitHub repository connected
3. Docker knowledge (basic)

### Deployment Steps

#### 1. Connect GitHub Repository

1. Log into Northflank
2. Go to **Projects** → **Create New Project**
3. Name: `colmap-mvp`
4. Click **Create Project**

#### 2. Create the Service

1. Click **Add Service** → **Deployment**
2. **Select Source:**
   - Type: GitHub
   - Repository: `marco-interact/colmap-mvp`
   - Branch: `main`

3. **Build Configuration:**
   - Build Type: **Dockerfile**
   - Dockerfile Path: `/Dockerfile`
   - Build Context: `/`
   - Docker Build Engine: **Kaniko** (recommended)

4. **Runtime Settings:**
   - **Plan:** `nf-compute-50` or higher
   - **Resources:**
     - **CPU:** 2.0 vCPUs (minimum, 4.0 recommended)
     - **RAM:** 4GB (minimum, 8GB recommended for better performance)
   - **Storage:** 10GB ephemeral (increase for production)
   - **Instances:** 1 (can scale up)

5. **Port Configuration:**
   - **Internal Port:** 8000
   - **Protocol:** HTTP
   - **Public Access:** Enabled
   - **Domain:** (Northflank will auto-generate)

#### 3. Set Environment Variables

Add these in the **Environment** section:

| Variable | Value | Description |
|----------|-------|-------------|
| `COLMAP_CPU_ONLY` | `1` | **Required** - Force CPU mode |
| `PORT` | `8000` | HTTP port |
| `STORAGE_DIR` | `/app/data/results` | Results storage |
| `CACHE_DIR` | `/app/data/cache` | Temporary cache |
| `PYTHONUNBUFFERED` | `1` | Python logging |

**Optional but recommended:**

| Variable | Value | Description |
|----------|-------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |
| `MAX_WORKERS` | `1` | Uvicorn workers |
| `ALLOWED_ORIGINS` | `*` | CORS origins |

#### 4. Configure Health Checks

**Liveness Probe:**
```json
{
  "path": "/health",
  "port": 8000,
  "initialDelaySeconds": 40,
  "periodSeconds": 30,
  "timeoutSeconds": 10
}
```

**Readiness Probe:**
```json
{
  "path": "/readiness",
  "port": 8000,
  "initialDelaySeconds": 30,
  "periodSeconds": 10,
  "timeoutSeconds": 5
}
```

#### 5. Deploy

1. Click **Create Deployment**
2. Wait for build to complete (~5-10 minutes first time)
3. Check **Logs** for any errors
4. Once healthy, copy the generated URL

---

## 🔍 Verify Deployment

### Check Health

```bash
# Replace with your Northflank URL
curl https://your-app.northflank.app/health | jq
```

Expected response:
```json
{
  "status": "healthy",
  "service": "colmap-worker",
  "gpu_available": false,
  "timestamp": "2025-10-22T...",
  "memory_usage": "150.2MB",
  "active_jobs": 0
}
```

### Check COLMAP Installation

```bash
curl https://your-app.northflank.app/colmap/check | jq
```

Expected response:
```json
{
  "colmap_installed": true,
  "colmap_version": "COLMAP 3.12.6",
  "opencv_installed": true,
  "opencv_version": "4.10.0",
  "cpu_mode": true,
  "status": "ready"
}
```

### Test Reconstruction

```bash
# Upload a test video
curl -X POST https://your-app.northflank.app/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=test" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@example.com"
```

---

## ⚙️ Configuration Options

### Resource Sizing

#### Small (Development)
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Storage:** 10GB
- **Cost:** ~$20/month
- **Use case:** Testing, demos

#### Medium (Production)
- **CPU:** 4 vCPUs
- **RAM:** 8GB
- **Storage:** 20GB
- **Cost:** ~$40/month
- **Use case:** Small to medium traffic

#### Large (High-Performance)
- **CPU:** 8 vCPUs
- **RAM:** 16GB
- **Storage:** 50GB
- **Cost:** ~$80/month
- **Use case:** High traffic, multiple concurrent jobs

### Processing Performance (CPU Mode)

| Quality | Frames | Processing Time | RAM Usage |
|---------|--------|----------------|-----------|
| Low | 40-50 | 5-10 min | 2-4 GB |
| Medium | 60-80 | 15-25 min | 4-8 GB |
| High | 80-120 | 30-60 min | 8-16 GB |

---

## 🗄️ Database Configuration

### SQLite (Default - Ephemeral)
```python
# Current setup in database.py
DATABASE_PATH = "/tmp/colmap_app.db"
```

⚠️ **Warning:** SQLite on ephemeral storage will lose data on restart!

### Upgrade to PostgreSQL (Recommended for Production)

1. **Create Northflank Addon:**
   - Go to **Addons** → **Create Addon**
   - Type: **PostgreSQL**
   - Plan: Choose based on needs
   - Name: `colmap-postgres`

2. **Update Environment Variables:**
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

3. **Update `database.py`:**
   ```python
   # Switch from SQLite to PostgreSQL
   import psycopg2
   # ... update connection logic
   ```

---

## 📦 Persistent Storage

### Ephemeral Storage (Default)
- **Pros:** Fast, included
- **Cons:** Lost on restart
- **Use for:** Temporary cache only

### Persistent Volumes (Recommended)

1. **Create Volume in Northflank:**
   - Go to **Volumes** → **Create Volume**
   - Name: `colmap-results`
   - Size: 50GB (adjust based on needs)

2. **Mount to Deployment:**
   - Edit deployment
   - Add volume mount:
     - Volume: `colmap-results`
     - Mount path: `/app/data/results`

3. **Update Environment:**
   ```
   STORAGE_DIR=/app/data/results
   ```

### Cloud Storage (Best for Production)

**Option 1: AWS S3**
```python
# Install: pip install boto3
# Configure S3 bucket for results
```

**Option 2: Google Cloud Storage**
```python
# Install: pip install google-cloud-storage
# Configure GCS bucket
```

---

## 🔐 Security & Best Practices

### Environment Secrets

Use Northflank **Secrets** instead of plain environment variables for:
- Database passwords
- API keys
- Authentication tokens

### CORS Configuration

Update `main.py` for production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.com",
        "https://www.your-frontend.com"
    ],  # Don't use "*" in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

### Rate Limiting

Add rate limiting to prevent abuse:
```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
```

---

## 📊 Monitoring & Logging

### View Logs

```bash
# Northflank CLI
nf logs deployment colmap-backend --follow

# Or use Northflank dashboard:
# Project → Service → Logs
```

### Key Metrics to Monitor

1. **CPU Usage**
   - Should be high during processing
   - Idle: <10%
   - Processing: 80-95%

2. **Memory Usage**
   - Watch for OOM errors
   - Increase if consistently >80%

3. **Response Time**
   - Health check: <100ms
   - Upload: <5s
   - Processing: 5-60 min (normal)

4. **Active Jobs**
   - Monitor concurrent processing
   - Queue if needed

### Set Up Alerts

In Northflank:
1. Go to **Monitoring** → **Alerts**
2. Create alerts for:
   - High CPU (>90% for 10 min)
   - High memory (>85%)
   - Pod restarts (>3 in 1 hour)
   - Health check failures

---

## 🔄 CI/CD with GitHub Actions

### Option 1: Auto-deploy on Push

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Northflank

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Trigger Northflank Deployment
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.NORTHFLANK_API_TOKEN }}" \
            https://api.northflank.com/v1/projects/${{ secrets.PROJECT_ID }}/services/${{ secrets.SERVICE_ID }}/build
```

### Option 2: Use Northflank Auto-deploy

Enable in Northflank:
1. Service Settings → **CI/CD**
2. Enable **Auto-deploy on push to main**
3. Optional: Set deployment branch patterns

---

## 🐛 Troubleshooting

### Build Fails

**Error:** "COLMAP compilation failed"
```bash
# Check build logs
# Ensure all dependencies are in Dockerfile
# Verify Ubuntu version compatibility
```

**Solution:**
- Check Dockerfile line by line
- Test locally: `docker build -t colmap-test .`
- Check Northflank build logs

### Runtime Errors

**Error:** "Module not found"
```bash
# Missing Python dependency
```

**Solution:**
- Add to `requirements.txt`
- Rebuild deployment

**Error:** "Out of memory"
```bash
# Reconstruction job killed
```

**Solution:**
- Increase RAM allocation
- Reduce frame count or quality
- Add swap space

### Performance Issues

**Slow processing:**
- Increase CPU allocation
- Check concurrent job limits
- Monitor resource usage

**High costs:**
- Reduce always-on instances
- Use spot instances (if available)
- Implement auto-scaling

---

## 💰 Cost Optimization

### Development
```
Plan: nf-compute-50
Resources: 2 CPU, 4GB RAM
Cost: ~$20/month
Strategy: Scale down when not in use
```

### Production
```
Plan: nf-compute-100
Resources: 4 CPU, 8GB RAM
Cost: ~$40/month
Strategy: Auto-scale based on demand
```

### Tips to Reduce Costs
1. **Use auto-scaling** - Scale to 0 during off-hours
2. **Optimize images** - Use lighter base images
3. **Cache builds** - Enable Docker layer caching
4. **Monitor usage** - Set up billing alerts

---

## 📚 Additional Resources

- **Northflank Docs:** https://northflank.com/docs
- **COLMAP Docs:** https://colmap.github.io
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Docker Best Practices:** https://docs.docker.com/develop/dev-best-practices/

---

## ✅ Deployment Checklist

- [ ] GitHub repository connected
- [ ] Dockerfile tested locally
- [ ] Environment variables set
- [ ] Health checks configured
- [ ] Database configured (PostgreSQL recommended)
- [ ] Persistent storage configured (if needed)
- [ ] CORS configured for frontend domain
- [ ] Monitoring and alerts set up
- [ ] Tested upload and processing
- [ ] Documentation updated with deployment URL

---

**Status:** Ready for deployment ✅  
**Last Updated:** October 22, 2025  
**Contact:** marco-interact/colmap-mvp


