# Google Cloud Platform Deployment for COLMAP Platform

This directory contains the configuration and deployment scripts for running the COLMAP 3D Reconstruction Platform on Google Cloud Platform.

## 🏗️ Architecture

The application is deployed using:

- **Google Cloud Run**: Serverless container platform for both frontend and backend
- **Google Cloud Build**: CI/CD pipeline for building and deploying containers
- **Google Container Registry**: Storage for Docker images
- **Google Cloud Storage**: File storage for videos and 3D models

## 📋 Prerequisites

1. **Google Cloud Account**: With billing enabled
2. **Google Cloud CLI**: Installed and authenticated
3. **Docker**: For local testing (optional)

## 🚀 Quick Deployment

### 1. Set up Google Cloud Project

```bash
# Create project (if not already done)
gcloud projects create colmap-app-$(date +%s) --name="COLMAP Platform"

# Set active project
gcloud config set project YOUR_PROJECT_ID

# Enable billing (required for Cloud Run)
# Go to: https://console.cloud.google.com/billing
```

### 2. Deploy the Application

```bash
# Run the deployment script
./deploy.sh
```

### 3. Manual Deployment Steps

If you prefer manual deployment:

```bash
# Enable required services
gcloud services enable cloudbuild.googleapis.com run.googleapis.com container.googleapis.com

# Build and deploy COLMAP worker
gcloud builds submit --tag gcr.io/$PROJECT_ID/colmap-worker ./colmap-worker
gcloud run deploy colmap-worker --image gcr.io/$PROJECT_ID/colmap-worker --platform managed --region us-central1 --allow-unauthenticated --memory 4Gi --cpu 2

# Build and deploy frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/colmap-frontend ./frontend
gcloud run deploy colmap-frontend --image gcr.io/$PROJECT_ID/colmap-frontend --platform managed --region us-central1 --allow-unauthenticated --memory 2Gi --cpu 1
```

## 🔧 Configuration

### Environment Variables

The COLMAP worker requires these environment variables:

```bash
# Set in Cloud Run service
PYTHONPATH=/app
COLMAP_BINARY_PATH=/usr/local/bin/colmap
```

### Resource Allocation

- **COLMAP Worker**: 4GB RAM, 2 CPU cores, 1-hour timeout
- **Frontend**: 2GB RAM, 1 CPU core, standard timeout
- **Storage**: Google Cloud Storage for file persistence

## 📊 Monitoring

### View Logs

```bash
# COLMAP worker logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=colmap-worker" --limit 50

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=colmap-frontend" --limit 50
```

### Monitor Performance

```bash
# Check service status
gcloud run services list

# Get service details
gcloud run services describe colmap-worker --region=us-central1
gcloud run services describe colmap-frontend --region=us-central1
```

## 💰 Cost Optimization

### Auto-scaling Configuration

- **COLMAP Worker**: Scales to 0 when idle, max 10 instances
- **Frontend**: Scales to 0 when idle, max 5 instances
- **Cold Start**: ~10-30 seconds for COLMAP worker

### Storage Optimization

- Use Google Cloud Storage for large files
- Implement lifecycle policies for old files
- Compress 3D models before storage

## 🔒 Security

### Authentication

- Cloud Run services are publicly accessible
- Consider implementing authentication for production
- Use IAM for service-to-service communication

### Network Security

- All traffic uses HTTPS
- No VPC configuration required for basic setup
- Consider VPC for advanced networking needs

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**: Check Cloud Build logs
2. **Memory Issues**: Increase memory allocation
3. **Timeout Issues**: Increase timeout settings
4. **Permission Issues**: Check IAM roles

### Debug Commands

```bash
# Check build status
gcloud builds list --limit 10

# View build logs
gcloud builds log BUILD_ID

# Test service endpoints
curl https://colmap-worker-xxx.run.app/health
curl https://colmap-frontend-xxx.run.app/
```

## 📈 Scaling

### Horizontal Scaling

- Cloud Run automatically scales based on traffic
- Configure max instances based on budget
- Use Cloud Scheduler for batch processing

### Vertical Scaling

- Increase memory/CPU for heavy COLMAP processing
- Use Cloud Run Jobs for long-running tasks
- Consider Cloud Compute for persistent workloads

## 🔄 CI/CD Pipeline

### Automated Deployment

The `cloudbuild.yaml` file defines the CI/CD pipeline:

1. Build frontend and backend containers
2. Push to Container Registry
3. Deploy to Cloud Run
4. Run health checks

### Manual Triggers

```bash
# Trigger build manually
gcloud builds submit --config cloudbuild.yaml .
```

## 📝 Next Steps

1. **Set up monitoring**: Cloud Monitoring and Alerting
2. **Configure domains**: Custom domain mapping
3. **Implement authentication**: Firebase Auth or similar
4. **Add database**: Cloud SQL or Firestore
5. **Set up backup**: Cloud Storage lifecycle policies

## 🆘 Support

For issues with this deployment:

1. Check Google Cloud Console logs
2. Review Cloud Build build logs
3. Verify service configurations
4. Test endpoints manually

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Build Documentation](https://cloud.google.com/build/docs)
- [COLMAP Documentation](https://colmap.github.io/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
