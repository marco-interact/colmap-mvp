# API Documentation

## Overview

The 3D Visualization Platform provides a RESTful API for managing 3D reconstruction projects, processing videos, and accessing generated models.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string (optional)"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "full_name": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### POST /auth/token
Login and get access token.

**Request Body:**
```
username=string&password=string
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "full_name": "string",
  "is_active": true,
  "created_at": "2023-01-01T00:00:00Z"
}
```

### Projects

#### GET /projects
List all projects for the current user.

**Query Parameters:**
- `skip` (int): Number of projects to skip (default: 0)
- `limit` (int): Maximum number of projects to return (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "name": "string",
    "description": "string",
    "status": "draft|processing|completed|failed|archived",
    "total_frames": 0,
    "processed_frames": 0,
    "reconstruction_quality": 0.0,
    "processing_time": 0.0,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

#### POST /projects
Create a new project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

#### GET /projects/{id}
Get a specific project by ID.

#### PUT /projects/{id}
Update a project.

#### DELETE /projects/{id}
Delete a project and all associated files.

#### POST /projects/{id}/start-reconstruction
Start 3D reconstruction for a project.

**Query Parameters:**
- `quality` (string): Reconstruction quality - "low", "medium", "high", "extreme"

#### GET /projects/{id}/status
Get the current status of a project's reconstruction.

### Files

#### POST /files/upload/video
Upload a video file for 3D reconstruction.

**Request Body:**
- `file`: Video file (multipart/form-data)
- `project_id`: Project ID (form data)

**Response:**
```json
{
  "message": "Video uploaded successfully",
  "file_path": "string",
  "file_size": 0,
  "project_id": 1
}
```

#### POST /files/extract-frames
Extract frames from uploaded video.

**Request Body:**
- `project_id`: Project ID (form data)
- `interval`: Frame extraction interval in seconds (form data)

#### GET /files/download/{project_id}/{file_type}
Download project files.

**File Types:**
- `video`: Original video file
- `frames`: Extracted frames
- `mesh`: Generated 3D mesh
- `textured_mesh`: Textured 3D model
- `point_cloud`: Point cloud data

#### GET /files/list/{project_id}
List all files associated with a project.

### Jobs

#### GET /jobs
List processing jobs with optional filtering.

**Query Parameters:**
- `project_id` (int): Filter by project ID
- `status` (string): Filter by job status
- `job_type` (string): Filter by job type
- `skip` (int): Number of jobs to skip
- `limit` (int): Maximum number of jobs to return

#### GET /jobs/{id}
Get a specific processing job by ID.

#### POST /jobs/{id}/cancel
Cancel a running processing job.

#### GET /jobs/{id}/logs
Get logs for a processing job.

#### GET /jobs/project/{project_id}/status
Get the status of all jobs for a specific project.

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- General endpoints: 10 requests per second
- COLMAP processing endpoints: 2 requests per second

## File Upload Limits

- Maximum file size: 500MB
- Supported video formats: MP4, AVI, MOV, MKV
- Supported image formats: JPG, JPEG, PNG, TIFF

## WebSocket Events

For real-time updates on processing jobs, the API provides WebSocket connections:

**Connection URL:**
```
ws://localhost:8000/ws/jobs/{project_id}
```

**Events:**
- `job_started`: Job has started processing
- `job_progress`: Job progress update
- `job_completed`: Job has completed successfully
- `job_failed`: Job has failed with error




