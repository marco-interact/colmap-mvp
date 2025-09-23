# Deployment Guide

## Overview

This guide covers deploying the 3D Visualization Platform to production environments.

## Prerequisites

- Docker and Docker Compose
- Domain name and SSL certificate
- AWS account (for cloud deployment)
- Minimum 8GB RAM, 4 CPU cores
- 100GB+ storage space

## Production Deployment

### 1. Environment Configuration

Create a production `.env` file:

```bash
# Copy example environment file
cp env.example .env.production

# Edit with production values
nano .env.production
```

**Required Production Settings:**

```env
# Security
SECRET_KEY=your-super-secure-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
POSTGRES_SERVER=your-db-host
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-secure-db-password
POSTGRES_DB=3d_platform_prod

# Redis
REDIS_URL=redis://your-redis-host:6379/0

# File Storage
UPLOAD_DIR=/data/uploads
OUTPUT_DIR=/data/output
TEMP_DIR=/data/temp
MAX_FILE_SIZE=1073741824  # 1GB

# COLMAP
COLMAP_QUALITY=high
MAX_CONCURRENT_JOBS=2

# AWS (for file storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-3d-platform-bucket

# CORS
BACKEND_CORS_ORIGINS=https://your-domain.com
```

### 2. Docker Compose Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
    environment:
      - POSTGRES_SERVER=postgres
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - uploads_data:/app/uploads
      - output_data:/app/output
      - temp_data:/app/temp
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  celery_worker:
    build:
      context: ./backend
      dockerfile: ../docker/backend/Dockerfile
    environment:
      - POSTGRES_SERVER=postgres
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - uploads_data:/app/uploads
      - output_data:/app/output
      - temp_data:/app/temp
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    command: celery -A app.celery_app worker --loglevel=info --concurrency=2

  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/frontend/Dockerfile.prod
    ports:
      - "3000:80"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads_data:
  output_data:
  temp_data:
```

### 3. Production Dockerfile

Create `docker/frontend/Dockerfile.prod`:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4. Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

### 5. SSL Configuration

Add SSL with Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Deployment Commands

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
```

## AWS Deployment

### 1. ECS Deployment

Create ECS task definition and service for containerized deployment.

### 2. RDS Database

Use AWS RDS for PostgreSQL with automated backups.

### 3. ElastiCache Redis

Use AWS ElastiCache for Redis caching.

### 4. S3 Storage

Configure S3 buckets for file storage:

```python
# In your backend configuration
AWS_S3_BUCKET=your-3d-platform-bucket
AWS_S3_REGION=us-east-1
```

### 5. CloudFront CDN

Use CloudFront for static asset delivery.

## Monitoring

### 1. Health Checks

```bash
# Backend health
curl http://your-domain.com/api/v1/health

# Database health
docker-compose exec postgres pg_isready

# Redis health
docker-compose exec redis redis-cli ping
```

### 2. Logging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

### 3. Performance Monitoring

- Use Flower for Celery monitoring: `http://your-domain.com:5555`
- Monitor disk usage for file storage
- Set up alerts for high CPU/memory usage

## Backup Strategy

### 1. Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "backup_$DATE.sql"
aws s3 cp "backup_$DATE.sql" s3://your-backup-bucket/
```

### 2. File Backups

```bash
# Backup uploaded files
tar -czf "uploads_$DATE.tar.gz" uploads/
aws s3 cp "uploads_$DATE.tar.gz" s3://your-backup-bucket/
```

## Scaling

### 1. Horizontal Scaling

- Add more Celery workers for processing
- Use load balancer for multiple backend instances
- Scale Redis with cluster mode

### 2. Vertical Scaling

- Increase server resources (CPU, RAM, storage)
- Optimize COLMAP parameters for your hardware
- Use GPU acceleration for COLMAP processing

## Security

### 1. Network Security

- Use VPC for AWS deployment
- Configure security groups properly
- Enable WAF for DDoS protection

### 2. Application Security

- Use strong passwords and secrets
- Enable HTTPS everywhere
- Regular security updates
- Input validation and sanitization

### 3. Data Security

- Encrypt data at rest
- Use secure file upload validation
- Implement proper access controls




