# 🚀 Frontend Cloud Run Deployment Guide

## 📋 Overview

This guide walks you through deploying your Next.js frontend to Google Cloud Run as a containerized service, following the exact approach you outlined.

## 🐳 Step 1: Containerized Application ✅

Your frontend is now properly containerized with an optimized multi-stage Dockerfile:

### **Build Stage:**
- Uses Node.js 20 slim image
- Installs dependencies with `npm install`
- Builds production assets with `npm run build`

### **Production Stage:**
- Lightweight Node.js 20 slim runtime
- Non-root user for security (`nextjs:nodejs`)
- Health check endpoint at `/api/health`
- Respects Cloud Run's PORT environment variable

**File:** `Dockerfile.frontend` ✅

## 📦 Step 2: Push to Artifact Registry

### **Option A: Using Cloud Build (Recommended)**

```bash
# Build and deploy using the optimized configuration
gcloud builds submit --config cloudbuild-frontend.yaml .
```

### **Option B: Manual Build and Push**

```bash
# Set your project configuration
export PROJECT_ID="your-project-id"
export REGION="northamerica-south1"

# Build the container image
gcloud builds submit --tag gcr.io/$PROJECT_ID/colmap-frontend .

# Or build locally and push
docker build -f Dockerfile.frontend -t gcr.io/$PROJECT_ID/colmap-frontend .
docker push gcr.io/$PROJECT_ID/colmap-frontend
```

## 🚀 Step 3: Deploy to Cloud Run

### **Automated Deployment (Recommended)**

Use the provided Cloud Build configuration:

```bash
gcloud builds submit --config cloudbuild-frontend.yaml .
```

This will:
- ✅ Build the container with caching
- ✅ Push to Artifact Registry
- ✅ Deploy to Cloud Run with optimized settings

### **Manual Deployment**

```bash
gcloud run deploy colmap-frontend \
  --image gcr.io/$PROJECT_ID/colmap-frontend \
  --platform managed \
  --region northamerica-south1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 80 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,COLMAP_WORKER_URL=https://colmap-app-525587424361.northamerica-south1.run.app \
  --execution-environment gen2
```

### **Using the Deployment Script**

```bash
# Make executable and run
chmod +x deploy-frontend-cloudrun.sh
./deploy-frontend-cloudrun.sh
```

## 🔧 Configuration Details

### **Cloud Run Settings:**
- **Memory:** 1Gi (optimal for Next.js)
- **CPU:** 1 core
- **Concurrency:** 80 requests per instance
- **Scaling:** 0-10 instances (cost-effective)
- **Timeout:** 5 minutes
- **Environment:** Gen2 (better performance)

### **Environment Variables:**
- `NODE_ENV=production`
- `COLMAP_WORKER_URL` - Points to your backend service
- `PORT` - Automatically set by Cloud Run

### **Security:**
- ✅ `--allow-unauthenticated` for public access
- ✅ Non-root container user
- ✅ Minimal attack surface

## 🏗️ Architecture Benefits

### **Server-Side Rendering (SSR):**
- ✅ Perfect for your Next.js app
- ✅ Dynamic rendering in the cloud
- ✅ Better SEO and performance

### **Container Benefits:**
- ✅ Consistent environment
- ✅ Fast cold starts
- ✅ Auto-scaling to zero
- ✅ Built-in load balancing

## 📊 Monitoring & Health Checks

### **Health Endpoint:**
- URL: `https://your-frontend-url/api/health`
- Returns service status, memory usage, uptime

### **Monitoring:**
```bash
# View logs
gcloud logs tail /projects/$PROJECT_ID/logs/run.googleapis.com%2Frequests

# Check service status
gcloud run services describe colmap-frontend --region=northamerica-south1
```

## 🌐 Expected URLs

After deployment, your services will be:

- **Frontend:** `https://colmap-frontend-[hash].northamerica-south1.run.app`
- **Backend:** `https://colmap-app-525587424361.northamerica-south1.run.app`
- **Health Check:** `https://colmap-frontend-[hash].northamerica-south1.run.app/api/health`

## 💰 Cost Considerations

### **Why Cloud Run is Cost-Effective:**
- **Scale to Zero:** No costs when idle
- **Pay per Use:** Only pay for actual requests
- **No Minimum:** No always-on instances required

### **vs Firebase Hosting:**
- **Cloud Run:** Better for SSR, dynamic content, API integration
- **Firebase Hosting:** Better for pure static sites, CDN distribution

Your Next.js app with SSR is **perfect** for Cloud Run! 🎯

## ✅ Verification Steps

1. **Build Success:** Check Cloud Build logs
2. **Service Running:** Visit the Cloud Run service URL
3. **Health Check:** Test `/api/health` endpoint  
4. **Frontend-Backend:** Verify API communication
5. **3D Viewer:** Test the complete COLMAP workflow

## 🚀 Quick Commands

```bash
# Deploy everything
gcloud builds submit --config cloudbuild-frontend.yaml .

# Check deployment status
gcloud run services list --region=northamerica-south1

# Get frontend URL
gcloud run services describe colmap-frontend --region=northamerica-south1 --format="value(status.url)"

# View logs
gcloud logs tail /projects/$(gcloud config get-value project)/logs/run.googleapis.com%2Frequests
```

Your frontend is now ready for Cloud Run deployment! 🌟
