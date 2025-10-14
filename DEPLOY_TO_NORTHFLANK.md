# 🚀 Deploy to Northflank - Step by Step Guide

This guide will walk you through deploying both the **Backend (COLMAP GPU Worker)** and **Frontend (Next.js)** to Northflank.

---

## 📋 Prerequisites

✅ GitHub repository connected to Northflank  
✅ Northflank account with GPU access  
✅ Repository: `marco-interact/colmap-mvp`  

---

## 🎯 Deployment Strategy

We'll deploy **TWO services**:

1. **Backend Service** (GPU) - COLMAP 3D Reconstruction Worker
   - Dockerfile: `Dockerfile.northflank`
   - Port: 8080
   - GPU: NVIDIA T4/L4/A10G
   - Resources: 4 vCPU, 8GB RAM

2. **Frontend Service** - Next.js Web Application
   - Dockerfile: `Dockerfile.frontend`
   - Port: 3000
   - Resources: 1 vCPU, 2GB RAM

---

## 🔧 PART 1: Deploy Backend (GPU Worker)

### Step 1: Create Backend Service

1. **Go to Northflank Dashboard**: https://app.northflank.com
2. Click **"Create Service"**
3. Select **"Deploy from Git Repository"**

### Step 2: Configure Repository

- **Repository**: `marco-interact/colmap-mvp`
- **Branch**: `main`
- **Service Name**: `colmap-worker-gpu`

### Step 3: Configure Build

- **Build Type**: Dockerfile
- **Dockerfile Path**: `Dockerfile.northflank`
- **Build Context**: `/`

### Step 4: Configure Runtime - GPU Instance

**IMPORTANT**: Select GPU Instance!

| Setting | Value |
|---------|-------|
| **Instance Type** | ⚡ **GPU Instance** |
| **GPU Model** | NVIDIA T4 (or L4/A10G) |
| **GPU Count** | 1 |
| **vCPU** | 4 |
| **Memory** | 8 GB |
| **Ephemeral Storage** | 10 GB |

### Step 5: Add Persistent Volumes

Click **"Add Volume"** (twice):

**Volume 1: Data**
- **Name**: `data-volume`
- **Mount Path**: `/app/data`
- **Size**: 20 GB

**Volume 2: Cache**
- **Name**: `cache-volume`
- **Mount Path**: `/app/cache`
- **Size**: 10 GB

### Step 6: Set Environment Variables

Add these environment variables:

```bash
PORT=8080
COLMAP_CPU_ONLY=false
CUDA_VISIBLE_DEVICES=0
NVIDIA_VISIBLE_DEVICES=all
DATABASE_PATH=/app/data/colmap_app.db
STORAGE_DIR=/app/data/results
CACHE_DIR=/app/cache
MAX_CONCURRENT_JOBS=4
MAX_REQUESTS_PER_MINUTE=20
```

### Step 7: Configure Networking

- **Port**: 8080
- **Protocol**: HTTP
- **Public Access**: ✅ Enabled

### Step 8: Configure Health Checks

**Liveness Probe**:
- Path: `/health`
- Port: 8080
- Initial Delay: 60 seconds
- Period: 30 seconds
- Timeout: 30 seconds
- Failure Threshold: 3

**Readiness Probe**:
- Path: `/readiness`
- Port: 8080
- Initial Delay: 30 seconds
- Period: 10 seconds
- Timeout: 10 seconds
- Failure Threshold: 3

### Step 9: Deploy Backend

1. Click **"Create Service"**
2. Wait for build to complete (~15-20 minutes first time)
3. **Copy the backend URL** (you'll need it for frontend)
   - Example: `https://colmap-worker-gpu-xxx.northflank.app`

### Step 10: Verify Backend

Once deployed, test the backend:

```bash
# Replace with your actual URL
BACKEND_URL="https://your-backend-url.northflank.app"

# Check health
curl $BACKEND_URL/health

# Should return:
# {
#   "status": "healthy",
#   "gpu_available": true,
#   ...
# }
```

✅ **Backend is ready when `gpu_available: true`**

---

## 🎨 PART 2: Deploy Frontend (Next.js)

### Step 1: Create Frontend Service

1. In Northflank Dashboard, click **"Create Service"** again
2. Select **"Deploy from Git Repository"**

### Step 2: Configure Repository

- **Repository**: `marco-interact/colmap-mvp` (same repo)
- **Branch**: `main`
- **Service Name**: `colmap-frontend`

### Step 3: Configure Build

- **Build Type**: Dockerfile
- **Dockerfile Path**: `Dockerfile.frontend`
- **Build Context**: `/`

### Step 4: Configure Runtime - Standard Instance

| Setting | Value |
|---------|-------|
| **Instance Type** | Standard (No GPU) |
| **vCPU** | 1-2 |
| **Memory** | 2 GB |
| **Ephemeral Storage** | 2 GB |

### Step 5: Set Environment Variables

**IMPORTANT**: Use the backend URL from Step 9 above!

```bash
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL.northflank.app
```

Replace `YOUR_BACKEND_URL` with your actual backend URL.

### Step 6: Configure Networking

- **Port**: 3000
- **Protocol**: HTTP
- **Public Access**: ✅ Enabled

### Step 7: Configure Health Checks

**Liveness Probe**:
- Path: `/`
- Port: 3000
- Initial Delay: 30 seconds
- Period: 30 seconds

**Readiness Probe**:
- Path: `/`
- Port: 3000
- Initial Delay: 10 seconds
- Period: 10 seconds

### Step 8: Deploy Frontend

1. Click **"Create Service"**
2. Wait for build to complete (~5-10 minutes)
3. **Copy the frontend URL**
   - Example: `https://colmap-frontend-xxx.northflank.app`

### Step 9: Verify Frontend

Visit your frontend URL in a browser:
```
https://your-frontend-url.northflank.app
```

You should see the COLMAP dashboard!

---

## 🔗 PART 3: Connect Frontend & Backend

### Update Backend CORS (Optional)

If you get CORS errors, update the backend to allow your frontend domain:

1. Edit `main.py` (locally)
2. Update CORS origins:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://your-frontend-url.northflank.app",
           "http://localhost:3000"  # for development
       ],
       ...
   )
   ```
3. Commit and push
4. Northflank will auto-redeploy

---

## 📊 Service Overview

After deployment, you'll have:

### Backend Service
- **URL**: `https://colmap-worker-gpu-xxx.northflank.app`
- **API Docs**: `https://colmap-worker-gpu-xxx.northflank.app/docs`
- **Health**: `https://colmap-worker-gpu-xxx.northflank.app/health`
- **GPU**: NVIDIA T4 (16GB VRAM)
- **Processing**: ~6 min per job (medium quality)

### Frontend Service
- **URL**: `https://colmap-frontend-xxx.northflank.app`
- **Dashboard**: Web interface for uploads
- **3D Viewer**: Built-in model viewer

---

## 🧪 Testing the Full Stack

### 1. Test Backend API

```bash
BACKEND_URL="https://your-backend-url.northflank.app"

# Check GPU status
curl $BACKEND_URL/health | jq .gpu_available

# Upload test video (replace with actual video file)
curl -X POST "$BACKEND_URL/upload-video" \
  -F "video=@test-video.mp4" \
  -F "project_id=test-001" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@example.com"
```

### 2. Test Frontend

1. Open: `https://your-frontend-url.northflank.app`
2. Click **"Upload Video"**
3. Select a video file
4. Monitor processing status
5. View 3D model when complete

---

## 🔍 Monitoring & Logs

### View Logs

**In Northflank Dashboard**:
1. Go to your service
2. Click **"Logs"** tab
3. Watch real-time logs

**Key log messages to look for**:

**Backend**:
```
GPU detected via nvidia-smi: Tesla T4
Starting COLMAP Worker on port 8080
GPU Available: True
```

**Frontend**:
```
Ready on http://0.0.0.0:3000
```

### Check Metrics

Monitor in Northflank:
- **CPU Usage**: Should be 50-80% during processing
- **Memory Usage**: 4-6 GB for backend
- **GPU Utilization**: 80-100% during COLMAP processing
- **Network**: Incoming requests

---

## ⚙️ Scaling Configuration

### Backend Autoscaling

Configure in Northflank:
- **Min Replicas**: 1 (always on)
- **Max Replicas**: 3 (during high load)
- **Target CPU**: 80%
- **Target Memory**: 80%

### Frontend Autoscaling

- **Min Replicas**: 1
- **Max Replicas**: 5
- **Target CPU**: 70%

---

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `gpu_available: false`
- **Fix**: Verify GPU instance is selected
- Check environment: `NVIDIA_VISIBLE_DEVICES=all`

**Issue**: Build timeout
- **Fix**: Increase build timeout to 30 minutes (first build)

**Issue**: Out of memory
- **Fix**: Reduce `MAX_CONCURRENT_JOBS` to 2

### Frontend Issues

**Issue**: 502 Bad Gateway
- **Fix**: Check if backend URL in env vars is correct

**Issue**: CORS errors
- **Fix**: Update CORS origins in backend `main.py`

**Issue**: Build fails
- **Fix**: Verify `output: 'standalone'` in `next.config.js`

---

## 💰 Cost Estimation

### Backend (GPU Instance)
- **T4 GPU**: ~$0.35/hour
- **Running 24/7**: ~$252/month
- **Recommendation**: Scale to 0 when idle (set min replicas to 0)

### Frontend (Standard Instance)
- **1 vCPU, 2GB RAM**: ~$0.02/hour
- **Running 24/7**: ~$15/month

**Total estimated**: $267/month for 24/7 operation  
**With smart scaling**: $50-100/month

---

## 🎉 You're Done!

Your COLMAP MVP is now running on Northflank with:

✅ GPU-accelerated 3D reconstruction backend  
✅ Modern Next.js frontend  
✅ Persistent storage for results  
✅ Auto-scaling capabilities  
✅ Health monitoring  
✅ Production-ready deployment  

---

## 📞 Need Help?

- **Northflank Docs**: https://northflank.com/docs
- **COLMAP Issues**: Check `/health` endpoint for GPU status
- **Frontend Issues**: Check browser console and network tab

---

**Happy 3D Reconstructing!** 🚀

