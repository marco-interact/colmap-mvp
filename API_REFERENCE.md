# 🔌 COLMAP MVP API Reference

Based on [Official COLMAP Documentation](https://colmap.github.io/)

**Backend URL**: `https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run`  
**Frontend URL**: `https://p01--colmap-frontend--xf7lzhrl47hj.code.run`

---

## 🏥 Health & Status Endpoints

### GET `/health`
Health check with database info.

**Response**:
```json
{
  "status": "healthy",
  "service": "colmap-worker",
  "gpu_available": true,
  "timestamp": "2025-10-14T12:00:00",
  "memory_usage": "291.2MB",
  "active_jobs": 0,
  "database_path": "/app/data/colmap_app.db",
  "database_exists": true
}
```

### GET `/readiness`
Kubernetes readiness probe.

### GET `/database/status`
Database connectivity and table counts.

**Response**:
```json
{
  "status": "connected",
  "database_path": "/app/data/colmap_app.db",
  "database_size_mb": 2.45,
  "database_exists": true,
  "tables": {
    "users": 5,
    "projects": 12,
    "scans": 34,
    "processing_jobs": 45
  },
  "timestamp": "2025-10-14T12:00:00"
}
```

---

## 👤 User Management

### POST `/users`
Create a new user.

**Request**:
```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-10-14T12:00:00"
}
```

**cURL Example**:
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### GET `/users/{email}`
Get user by email.

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-10-14T12:00:00"
}
```

---

## 📁 Project Management

### POST `/projects`
Create a new project.

**Request**:
```json
{
  "user_email": "user@example.com",
  "name": "My Building Project",
  "description": "3D model of my house",
  "location": "San Francisco, CA",
  "space_type": "architecture",
  "project_type": "building"
}
```

**Response**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "My Building Project",
  "description": "3D model of my house",
  "location": "San Francisco, CA",
  "status": "active",
  "created_at": "2025-10-14T12:00:00"
}
```

**cURL Example**:
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/projects \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "test@example.com",
    "name": "Test Project",
    "description": "My first COLMAP project"
  }'
```

### GET `/projects/{email}`
Get all projects for a user.

**Response**:
```json
{
  "user_email": "user@example.com",
  "projects": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "My Building Project",
      "description": "3D model of my house",
      "location": "San Francisco, CA",
      "scan_count": 3,
      "status": "active",
      "created_at": "2025-10-14T12:00:00",
      "updated_at": "2025-10-14T14:30:00"
    }
  ]
}
```

**cURL Example**:
```bash
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/projects/test@example.com
```

---

## 📹 Video Upload & Processing

### POST `/upload-video`
Upload a video for 3D reconstruction.

**Form Data**:
- `video` (file): Video file (MP4, MOV, AVI)
- `project_id` (string): UUID of project
- `scan_name` (string): Name for this scan
- `quality` (string): "low" | "medium" | "high"
- `user_email` (string): User's email

**Response**:
```json
{
  "job_id": "770e8400-e29b-41d4-a716-446655440002",
  "scan_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "pending",
  "message": "Video uploaded successfully. Processing will begin shortly.",
  "estimated_time_minutes": 8
}
```

**cURL Example**:
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@my-video.mp4" \
  -F "project_id=660e8400-e29b-41d4-a716-446655440001" \
  -F "scan_name=Office Scan 001" \
  -F "quality=medium" \
  -F "user_email=test@example.com"
```

**Quality Settings**:

| Quality | Frames | Processing Time (A100) | Use Case |
|---------|--------|------------------------|----------|
| `low` | 30 | 5-7 min | Quick preview |
| `medium` | 50 | 8-12 min | Standard quality |
| `high` | 100 | 15-25 min | High detail |

---

## ⚙️ Job Status & Monitoring

### GET `/jobs/{job_id}`
Get job processing status.

**Response** (Processing):
```json
{
  "job_id": "770e8400-e29b-41d4-a716-446655440002",
  "scan_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "processing",
  "progress": 65,
  "current_stage": "Dense Reconstruction",
  "message": "Running multi-view stereo...",
  "started_at": "2025-10-14T12:00:00",
  "elapsed_seconds": 324
}
```

**Response** (Completed):
```json
{
  "job_id": "770e8400-e29b-41d4-a716-446655440002",
  "scan_id": "880e8400-e29b-41d4-a716-446655440003",
  "status": "completed",
  "progress": 100,
  "message": "Reconstruction completed successfully",
  "started_at": "2025-10-14T12:00:00",
  "completed_at": "2025-10-14T12:08:45",
  "processing_time_seconds": 525,
  "results": {
    "point_cloud_url": "/results/770e8400/point_cloud.ply",
    "sparse_model_url": "/results/770e8400/sparse.zip",
    "images_url": "/results/770e8400/images.zip",
    "point_count": 1543256,
    "camera_count": 45
  }
}
```

**cURL Example** (poll every 5 seconds):
```bash
watch -n 5 'curl -s https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/jobs/JOB_ID | jq'
```

**Processing Stages**:
1. Frame Extraction
2. Feature Detection (SIFT)
3. Feature Matching
4. Sparse Reconstruction (SfM)
5. Dense Reconstruction (MVS)
6. Point Cloud Generation

---

## 📊 Scan Management

### GET `/scans/{project_id}`
Get all scans for a project.

**Response**:
```json
{
  "project_id": "660e8400-e29b-41d4-a716-446655440001",
  "scans": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "name": "Office Scan 001",
      "status": "completed",
      "video_filename": "office-video.mp4",
      "video_size": 45678901,
      "processing_quality": "medium",
      "point_count": 1543256,
      "processing_time_seconds": 525,
      "created_at": "2025-10-14T12:00:00",
      "updated_at": "2025-10-14T12:08:45"
    }
  ]
}
```

### GET `/scans/{scan_id}/details`
Get detailed scan results.

**Response**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "name": "Office Scan 001",
  "status": "completed",
  "project_name": "My Building Project",
  "project_location": "San Francisco, CA",
  "video_filename": "office-video.mp4",
  "video_size": 45678901,
  "processing_quality": "medium",
  "point_count": 1543256,
  "camera_count": 45,
  "feature_count": 234567,
  "processing_time_seconds": 525,
  "resolution": "1920x1080",
  "file_size_bytes": 98765432,
  "reconstruction_error": 0.45,
  "coverage_percentage": 87.3,
  "processing_stages": [
    {
      "stage": "Frame Extraction",
      "completed_at": "2025-10-14T12:01:30",
      "duration_seconds": 90
    },
    {
      "stage": "Feature Detection",
      "completed_at": "2025-10-14T12:03:45",
      "duration_seconds": 135
    }
  ],
  "results": {
    "point_cloud_url": "/results/770e8400/point_cloud.ply",
    "sparse_model_url": "/results/770e8400/sparse.zip",
    "dense_model_url": "/results/770e8400/dense.zip",
    "images_url": "/results/770e8400/images.zip"
  },
  "created_at": "2025-10-14T12:00:00",
  "updated_at": "2025-10-14T12:08:45"
}
```

---

## 📥 Download Results

### GET `/results/{job_id}/{filename}`
Download processed files.

**Available Files**:
- `point_cloud.ply` - Dense 3D point cloud
- `sparse.zip` - Sparse reconstruction model
- `dense.zip` - Dense reconstruction files
- `images.zip` - Extracted frames

**cURL Example**:
```bash
# Download point cloud
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/results/JOB_ID/point_cloud.ply \
  -o model.ply

# Download sparse model
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/results/JOB_ID/sparse.zip \
  -o sparse-model.zip
```

---

## 🧪 Testing & Development

### POST `/database/init-test-data`
Initialize demo user and project for testing.

**Response**:
```json
{
  "status": "success",
  "message": "Test data initialized",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "project_id": "660e8400-e29b-41d4-a716-446655440001",
  "test_email": "test@colmap.app"
}
```

**cURL Example**:
```bash
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/init-test-data
```

---

## 🔄 Complete Workflow Example

### Step-by-Step Integration

```bash
# 1. Initialize test data
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/init-test-data

# Save the project_id from response

# 2. Upload video
curl -X POST https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/upload-video \
  -F "video=@test-video.mp4" \
  -F "project_id=YOUR_PROJECT_ID" \
  -F "scan_name=Test Scan" \
  -F "quality=low" \
  -F "user_email=test@colmap.app"

# Save the job_id from response

# 3. Monitor processing
watch -n 5 'curl -s https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/jobs/YOUR_JOB_ID | jq .'

# 4. When status === "completed", download results
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/results/YOUR_JOB_ID/point_cloud.ply \
  -o final-model.ply

# 5. View in MeshLab or CloudCompare
# (or load in Three.js viewer on frontend)
```

---

## 📊 Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created (user, project, scan) |
| 400 | Bad Request | Invalid parameters or missing fields |
| 404 | Not Found | Resource doesn't exist |
| 422 | Validation Error | Invalid data format |
| 500 | Server Error | Processing failed, check logs |

---

## 🔒 CORS Configuration

Currently set to `allow_origins=["*"]` for development.

**Production**: Update to specific frontend domain:
```python
allow_origins=["https://p01--colmap-frontend--xf7lzhrl47hj.code.run"]
```

---

## 📈 Rate Limits

**Current**: No rate limits (development mode)

**Recommended for Production**:
- Max 10 video uploads per hour per user
- Max 100 status checks per minute
- Max file size: 500MB per video

---

## 🐛 Error Responses

### Example Error Response:
```json
{
  "detail": "Project not found",
  "error_code": "PROJECT_NOT_FOUND",
  "timestamp": "2025-10-14T12:00:00"
}
```

### Common Errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `User not found` | Email doesn't exist | Create user first |
| `Project not found` | Invalid project_id | Check project_id or create project |
| `Video processing failed` | COLMAP error | Check video quality, reduce frames |
| `Not enough frames` | Video too short | Use longer video (>10 seconds) |

---

## 📚 Additional Resources

- **Official COLMAP Docs**: https://colmap.github.io/
- **Database Setup**: See `DATABASE_SETUP.md`
- **Integration Guide**: See `INTEGRATION_GUIDE.md`
- **Testing**: See `TEST_DEPLOYMENT.md`
- **Deployment**: See `NORTHFLANK_REBUILD.md`

---

## 🚀 Quick Test

```bash
# Health check
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/health

# Database status
curl https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/database/status

# API docs (interactive)
open https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run/docs
```

---

**Base URL**: `https://p01--colmap-worker-gpu--xf7lzhrl47hj.code.run`  
**API Docs**: `/docs` (Swagger UI)  
**ReDoc**: `/redoc` (Alternative API docs)

Reference: [COLMAP Official Documentation](https://colmap.github.io/)

