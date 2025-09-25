# Manual Deployment Guide for Colmap App

## 🚀 CPU-Only Deployment (No GPU Required)

Since we're having authentication issues with the automated script, here are the manual steps to deploy:

### Step 1: Authenticate with Google Cloud

```bash
# Open browser and authenticate
gcloud auth login

# Set your project
gcloud config set project colmap-app-1758759622

# Verify authentication
gcloud auth list
```

### Step 2: Enable Required APIs

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Deploy Using Cloud Build

```bash
# Deploy the frontend (CPU only - no GPU)
gcloud builds submit --config cloudbuild-simple.yaml --substitutions _TAG_NAME=latest
```

### Step 4: Verify Deployment

```bash
# Check Cloud Run services
gcloud run services list --region=northamerica-south1

# Get service URL
gcloud run services describe colmap-frontend --region=northamerica-south1 --format='value(status.url)'
```

## 📊 Current Configuration (CPU Only)

- **Memory**: 1Gi
- **CPU**: 1 vCPU
- **Port**: 3000
- **Max Instances**: 10
- **Min Instances**: 0
- **Timeout**: 300 seconds
- **No GPU**: CPU-only deployment

## 🔧 Troubleshooting

### Authentication Issues
```bash
# Clear and re-authenticate
gcloud auth revoke --all
gcloud auth login
gcloud auth application-default login
```

### Permission Issues
```bash
# Check current account
gcloud config get-value account

# Check project
gcloud config get-value project
```

### Build Issues
```bash
# Check build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

## 📈 Quota Increase Requests

While the CPU-only deployment is running, you can request quota increases for future GPU deployments:

### 1. GPU Quota Request
- **Service**: Compute Engine API
- **Quota**: GPUs (all regions)
- **Requested**: 1-4 GPUs
- **Justification**: 3D reconstruction and computer vision processing

### 2. Cloud Run Quota Request
- **Service**: Cloud Run API
- **Quota**: CPU allocation
- **Requested**: 4-8 vCPUs
- **Justification**: High-performance 3D processing workloads

### 3. Container Registry Quota
- **Service**: Container Registry API
- **Quota**: Storage
- **Requested**: 100GB
- **Justification**: Large Docker images for ML workloads

## 🎯 Expected Results

After successful deployment:
- ✅ Frontend accessible at: `https://colmap-frontend-[hash].northamerica-south1.run.app`
- ✅ CPU-only processing (no GPU requirements)
- ✅ Auto-scaling based on traffic
- ✅ Production-ready configuration

## 📞 Support

If you encounter issues:
1. Check the [Google Cloud Console](https://console.cloud.google.com/run)
2. Review build logs in Cloud Build
3. Verify billing is enabled
4. Check IAM permissions

