# 3D Visualization Platform - Staging Environment

This document describes how to set up and manage the staging environment for the 3D Visualization Platform.

## 🏗️ Staging Architecture

The staging environment replicates the production setup with the following services:

- **Frontend** (React + Nginx): Port 3001
- **Backend API** (FastAPI): Port 8001
- **Database** (PostgreSQL): Port 5433
- **Redis Cache**: Port 6380
- **Celery Worker**: Background processing
- **Celery Beat**: Task scheduling
- **Flower**: Celery monitoring (Port 5556)
- **Nginx Proxy**: Main entry point (Port 8080)

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3001, 8001, 8080, 5433, 6380, 5556 available

### Deploy Staging Environment

```bash
# Deploy staging environment
./scripts/staging-deploy.sh

# Quick deployment (no cleanup)
./scripts/staging-deploy.sh --quick

# Clean deployment (removes old data)
./scripts/staging-deploy.sh --clean
```

### Access Staging Environment

Once deployed, access the staging environment at:

- **Main Application**: http://localhost:8080
- **Frontend Only**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Celery Monitoring**: http://localhost:5556
- **Staging Info**: http://localhost:8080/staging-info

## 🔧 Management Commands

### Check Status

```bash
# Show detailed status of all services
./scripts/staging-status.sh
```

### View Logs

```bash
# View all services logs
./scripts/staging-logs.sh

# View specific service logs
./scripts/staging-logs.sh backend
./scripts/staging-logs.sh frontend
./scripts/staging-logs.sh postgres

# View last 50 lines
./scripts/staging-logs.sh backend --lines 50
```

### Stop Staging Environment

```bash
# Stop services gracefully
./scripts/staging-stop.sh

# Stop and remove containers
./scripts/staging-stop.sh --remove

# Stop and delete ALL data (destructive!)
./scripts/staging-stop.sh --clean
```

## 📋 Environment Configuration

### Staging Environment Variables

The staging environment uses `env.staging` for configuration:

```bash
# Database
POSTGRES_DB=3d_platform_staging
POSTGRES_PASSWORD=staging_password_2024!

# API URLs
REACT_APP_API_URL=http://localhost:8001/api/v1

# COLMAP Settings
COLMAP_QUALITY=medium
MAX_CONCURRENT_JOBS=2

# File Upload
MAX_FILE_SIZE=1073741824  # 1GB
```

### Staging-Specific Features

- **Isolated Data**: Separate database and volumes
- **Different Ports**: No conflicts with development
- **Production Builds**: Optimized Docker images
- **Load Balancing**: Nginx reverse proxy
- **Monitoring**: Health checks and metrics
- **Security**: Non-root containers in production mode

## 🧪 Testing in Staging

### Manual Testing Workflow

1. **Deploy Staging**:
   ```bash
   ./scripts/staging-deploy.sh
   ```

2. **Access Application**: http://localhost:8080

3. **Login**: Use demo credentials
   - Username: `demo`
   - Password: `demo123`

4. **Test User Flow**:
   - Create project
   - Upload video (up to 1GB)
   - Process with COLMAP
   - View 3D model
   - Test measurements

5. **Monitor Processing**:
   - Check Celery jobs: http://localhost:5556
   - View logs: `./scripts/staging-logs.sh celery-worker`

### API Testing

```bash
# Health check
curl http://localhost:8001/health

# API documentation
open http://localhost:8001/docs

# Test authentication
curl -X POST "http://localhost:8001/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username":"demo","password":"demo123"}'
```

## 📊 Monitoring & Debugging

### Service Health Checks

All services include health checks:

```bash
# Check individual service health
docker-compose -f docker-compose.staging.yml ps

# View detailed container status
./scripts/staging-status.sh
```

### Log Management

```bash
# Follow all logs in real-time
./scripts/staging-logs.sh

# Filter logs for errors
./scripts/staging-logs.sh backend | grep ERROR

# Export logs to file
./scripts/staging-logs.sh > staging-logs-$(date +%Y%m%d).log
```

### Resource Usage

```bash
# View resource consumption
docker stats $(docker-compose -f docker-compose.staging.yml ps -q)

# Check disk usage
docker system df
```

## 🔒 Security Features

### Production Security

- Non-root user in containers
- Security headers via Nginx
- Rate limiting on API endpoints
- File upload size restrictions
- Network isolation

### Staging-Specific Security

- Separate credentials from production
- Isolated network namespace
- Development SSL certificates
- Test data only

## 🗄️ Database Management

### Staging Database

- **Host**: postgres-staging
- **Port**: 5433 (external)
- **Database**: `3d_platform_staging`
- **User**: `postgres`
- **Password**: See `env.staging`

### Database Operations

```bash
# Connect to staging database
docker-compose -f docker-compose.staging.yml exec postgres-staging psql -U postgres -d 3d_platform_staging

# Backup staging data
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_dump -U postgres 3d_platform_staging > staging_backup.sql

# Restore staging data
docker-compose -f docker-compose.staging.yml exec -T postgres-staging psql -U postgres -d 3d_platform_staging < staging_backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :8080 -i :8001 -i :3001

# Stop conflicting services
./scripts/staging-stop.sh
```

#### Container Build Failures
```bash
# Rebuild with no cache
docker-compose -f docker-compose.staging.yml build --no-cache

# Clean Docker system
docker system prune -a
```

#### Database Connection Issues
```bash
# Check database logs
./scripts/staging-logs.sh postgres

# Verify database is ready
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_isready -U postgres
```

#### COLMAP Processing Issues
```bash
# Check worker logs
./scripts/staging-logs.sh celery-worker

# Verify COLMAP installation
docker-compose -f docker-compose.staging.yml exec backend-staging colmap --help
```

### Getting Help

1. Check service status: `./scripts/staging-status.sh`
2. Review logs: `./scripts/staging-logs.sh [service]`
3. Verify configuration: `cat env.staging`
4. Test health endpoints: `curl http://localhost:8001/health`

## 📝 Staging Checklist

Before deploying to production, verify in staging:

- [ ] All services start successfully
- [ ] Authentication works with demo users
- [ ] Project creation and management
- [ ] Video upload (various sizes up to 1GB)
- [ ] COLMAP processing completes
- [ ] 3D viewer loads models correctly
- [ ] Measurement tools function properly
- [ ] API endpoints respond correctly
- [ ] Error handling works appropriately
- [ ] Performance is acceptable
- [ ] Logs are properly formatted
- [ ] Health checks pass consistently

## 🔄 CI/CD Integration

The staging environment can be integrated with CI/CD pipelines:

```bash
# In your CI/CD pipeline
./scripts/staging-deploy.sh --clean
sleep 30
./scripts/staging-status.sh
# Run automated tests
./scripts/staging-stop.sh
```

This staging environment provides a production-like testing environment for thorough validation before deploying to production.
