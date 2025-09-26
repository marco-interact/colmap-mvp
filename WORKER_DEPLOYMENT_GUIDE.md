# 🚀 COLMAP Worker Manual Deployment Guide

## 📋 Overview

This guide shows you how to manually deploy your COLMAP Worker with GPU acceleration to Google Cloud Run using pre-built images from GitHub Container Registry (GHCR).

## 🛠️ Prerequisites

### 1. **Google Cloud Authentication**
```bash
# Login to Google Cloud
gcloud auth login

# Set your project (replace with your actual project ID)
gcloud config set project <your-gcp-project-id>

# Verify your configuration
gcloud config list
```

### 2. **Make Script Executable**
```bash
chmod +x deploy-worker-manual.sh
```

## 🎯 Usage

### **Deploy Latest Version**
```bash
./deploy-worker-manual.sh latest
```

### **Deploy Specific Git SHA**
```bash
./deploy-worker-manual.sh 1a2b3c4d
```

### **Deploy Specific Version Tag**
```bash
./deploy-worker-manual.sh v2.0.0
```

## ⚙️ Configuration Details

### **GPU Configuration:**
- **Type**: NVIDIA Tesla P4
- **Count**: 1 GPU
- **Memory**: 8Gi RAM
- **CPU**: 2 cores
- **Concurrency**: 1 (optimal for GPU workloads)

### **Cloud Run Settings:**
- **Region**: `us-central1`
- **Platform**: Managed
- **Timeout**: 1 hour (3600 seconds)
- **Access**: Unauthenticated (public API)

### **Image Source:**
- **Registry**: GitHub Container Registry (GHCR)
- **Base URL**: `ghcr.io/marco-interact/colmap-app/colmap-worker`

## 🔍 Available Image Tags

To see available image tags, check your GitHub Container Registry:
- Visit: https://github.com/marco-interact/colmap-app/pkgs/container/colmap-app%2Fcolmap-worker

Common tags:
- `latest` - Most recent build
- `main` - Latest from main branch
- `<git-sha>` - Specific commit (e.g., `1a2b3c4d`)
- `v2.0.0` - Version tags

## ✅ After Deployment

### **1. Get Service URL**
The script will output the service URL:
```
🚀 Service URL: https://colmap-worker-abc123.us-central1.run.app
```

### **2. Test the Deployment**
```bash
# Test health endpoint
curl https://colmap-worker-abc123.us-central1.run.app/health

# Test root endpoint
curl https://colmap-worker-abc123.us-central1.run.app/
```

### **3. Set GitHub Secret**
```bash
# Set the worker URL for frontend deployment
gh secret set COLMAP_WORKER_URL -b "https://colmap-worker-abc123.us-central1.run.app"
```

### **4. Verify in Cloud Console**
Visit [Google Cloud Run Console](https://console.cloud.google.com/run) to see your deployed service.

## 🐛 Troubleshooting

### **Common Issues:**

#### **Authentication Error**
```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login
```

#### **Permission Denied**
```bash
# Check your IAM roles - you need:
# - Cloud Run Admin
# - Service Account User
# - Storage Admin (for container registry)
```

#### **GPU Not Available**
```bash
# Check GPU availability in your region
gcloud compute accelerator-types list --filter="zone:us-central1"
```

#### **Image Not Found**
```bash
# Check if the image exists in GHCR
docker pull ghcr.io/marco-interact/colmap-app/colmap-worker:latest
```

### **Debug Commands:**
```bash
# Check service status
gcloud run services describe colmap-worker --region=us-central1

# View logs
gcloud logs tail /projects/$(gcloud config get-value project)/logs/run.googleapis.com%2Frequests

# List all Cloud Run services
gcloud run services list --region=us-central1
```

## 💰 Cost Considerations

### **GPU Pricing:**
- GPU usage is charged per second
- Tesla P4 costs ~$0.60/hour when running
- Service scales to zero when idle (no GPU costs)

### **Memory & CPU:**
- 8Gi RAM + 2 CPU cores
- Charged only when processing requests

## 🚀 Next Steps

1. **Deploy Worker**: `./deploy-worker-manual.sh latest`
2. **Get URL**: Copy from script output
3. **Set Secret**: `gh secret set COLMAP_WORKER_URL -b "URL"`
4. **Deploy Frontend**: Use the frontend deployment workflow
5. **Test Integration**: Verify frontend-backend communication

## 🔄 Updating the Deployment

To update to a new version:

```bash
# Deploy new image tag
./deploy-worker-manual.sh <new-tag>

# The URL stays the same, no need to update secrets
```

## 📞 Support

- **Cloud Run Console**: https://console.cloud.google.com/run
- **GitHub Container Registry**: https://github.com/marco-interact/colmap-app/pkgs/container/colmap-app%2Fcolmap-worker
- **Documentation**: Check the DEPLOYMENT_COMPLETE.md file
