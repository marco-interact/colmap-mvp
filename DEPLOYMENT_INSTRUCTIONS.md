# 🚀 Colmap App Frontend Deployment Instructions

## ✅ Current Status

- **COLMAP Worker**: ✅ Running at [https://colmap-app-64102061337.us-central1.run.app](https://colmap-app-64102061337.us-central1.run.app)
- **Frontend Code**: ✅ Ready and pushed to GitHub
- **Configuration**: ✅ Connected to COLMAP worker
- **Deployment Files**: ✅ All configuration files created

## 🔧 Manual Deployment Steps

Since we're having authentication issues with the automated scripts, here are the **manual steps**:

### Option 1: Google Cloud Console (Recommended)

1. **Go to Cloud Run Console**
   - Visit: https://console.cloud.google.com/run
   - Select project: `colmap-app-1758759622`

2. **Create New Service**
   - Click "Create Service"
   - Choose "Deploy one revision from a source repository"

3. **Configure Source**
   - Connect to GitHub repository: `marco-interact/colmap-app`
   - Select branch: `main`
   - Build type: `Dockerfile`
   - Dockerfile path: `Dockerfile.frontend`

4. **Configure Service**
   - Service name: `colmap-frontend`
   - Region: `northamerica-south1`
   - CPU: `1`
   - Memory: `1Gi`
   - Port: `3000`

5. **Set Environment Variables**
   - `NODE_ENV`: `production`
   - `COLMAP_WORKER_URL`: `https://colmap-app-64102061337.us-central1.run.app`

6. **Deploy**
   - Click "Deploy"
   - Wait for build and deployment to complete

### Option 2: Command Line (After Authentication)

```bash
# 1. Authenticate (open browser)
gcloud auth login

# 2. Set project
gcloud config set project colmap-app-1758759622

# 3. Deploy from source
gcloud run deploy colmap-frontend \
  --source . \
  --region northamerica-south1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --port 3000 \
  --set-env-vars NODE_ENV=production,COLMAP_WORKER_URL=https://colmap-app-64102061337.us-central1.run.app \
  --max-instances 10 \
  --min-instances 0
```

### Option 3: GitHub Actions (Automatic)

The repository includes a GitHub Actions workflow that will automatically deploy when you push to `main`. You just need to:

1. **Set up Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create new service account with roles:
     - Cloud Build Editor
     - Cloud Run Admin
     - Storage Admin

2. **Add GitHub Secret**
   - Go to repository Settings > Secrets
   - Add secret: `GCP_SA_KEY` with the service account JSON key

3. **Push to main**
   - Any push to main will trigger automatic deployment

## 📊 Expected Results

After successful deployment:

- **Frontend URL**: `https://colmap-frontend-[hash].northamerica-south1.run.app`
- **Full Integration**: Frontend ↔ COLMAP Worker
- **Complete Workflow**: Video upload → 3D processing → 3D viewer

## 🔍 Verification Steps

1. **Check Cloud Run Services**
   - Go to: https://console.cloud.google.com/run
   - Verify `colmap-frontend` service is running

2. **Test Frontend**
   - Open the frontend URL
   - Login with: `test@colmap.app` / `password`
   - Create a project and test the workflow

3. **Test Integration**
   - Upload a video file
   - Verify it connects to the COLMAP worker
   - Check 3D viewer functionality

## 🆘 Troubleshooting

### Authentication Issues
```bash
# Clear and re-authenticate
gcloud auth revoke --all
gcloud auth login
gcloud auth application-default login
```

### Permission Issues
- Ensure your account has the necessary IAM roles
- Check that billing is enabled
- Verify all required APIs are enabled

### Build Issues
- Check Cloud Build logs in the console
- Verify Dockerfile.frontend is correct
- Ensure all dependencies are in package.json

## 📞 Support

If you encounter issues:
1. Check the [Google Cloud Console](https://console.cloud.google.com/run)
2. Review build logs in Cloud Build
3. Verify billing and permissions
4. Check the GitHub repository for latest updates

