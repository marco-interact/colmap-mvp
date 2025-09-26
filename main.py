"""
COLMAP Worker for Google Cloud Run
Optimized for cloud deployment with proper health checks and logging
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import json
import logging
from datetime import datetime
from typing import Optional

# Configure logging for Cloud Run
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI with Cloud Run optimizations
app = FastAPI(
    title="COLMAP Worker",
    version="1.0.0",
    description="3D Reconstruction Service using COLMAP",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for Cloud Run
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessingRequest(BaseModel):
    project_id: str
    video_url: str
    quality: str = "medium"
    dense_reconstruction: bool = True
    meshing: bool = True

class ProcessingResponse(BaseModel):
    job_id: str
    status: str
    message: str
    created_at: str

# In-memory job storage (in production, use a database)
jobs = {}

@app.get("/")
async def root():
    """Root endpoint for Cloud Run health checks"""
    logger.info("Root endpoint accessed")
    return {
        "message": "COLMAP Worker API", 
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Kubernetes-style health check endpoint"""
    return {
        "status": "healthy", 
        "service": "colmap-worker",
        "timestamp": datetime.now().isoformat(),
        "memory_usage": _get_memory_usage()
    }

@app.get("/readiness")
async def readiness_check():
    """Cloud Run readiness probe"""
    return {"status": "ready", "timestamp": datetime.now().isoformat()}

def _get_memory_usage():
    """Get basic memory usage info for monitoring"""
    try:
        import psutil
        return f"{psutil.Process().memory_info().rss / 1024 / 1024:.1f}MB"
    except ImportError:
        return "N/A"

@app.post("/upload-video", response_model=ProcessingResponse)
async def upload_video(request: ProcessingRequest):
    """Process video upload for 3D reconstruction"""
    job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    logger.info(f"New job created: {job_id} for project: {request.project_id}")
    
    jobs[job_id] = {
        "status": "queued",
        "project_id": request.project_id,
        "video_url": request.video_url,
        "quality": request.quality,
        "created_at": datetime.now().isoformat(),
        "message": "Video uploaded successfully. Processing will begin shortly."
    }
    
    logger.info(f"Job {job_id} queued successfully")
    
    return ProcessingResponse(
        job_id=job_id,
        status="queued",
        message="Video uploaded successfully. Processing will begin shortly.",
        created_at=jobs[job_id]["created_at"]
    )

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get processing job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    # Simulate processing progress
    if job["status"] == "queued":
        job["status"] = "processing"
        job["message"] = "Extracting frames from video..."
    elif job["status"] == "processing":
        job["status"] = "completed"
        job["message"] = "3D reconstruction completed successfully!"
        job["results"] = {
            "point_cloud_url": f"/models/{job_id}/pointcloud.ply",
            "mesh_url": f"/models/{job_id}/mesh.obj",
            "thumbnail_url": f"/models/{job_id}/thumbnail.jpg"
        }
    
    return job

@app.get("/download/{project_id}/{file_type}")
async def download_file(project_id: str, file_type: str):
    """Download processed 3D model files"""
    # In production, this would serve actual files from storage
    return {
        "message": f"Download endpoint for {file_type} in project {project_id}",
        "file_type": file_type,
        "project_id": project_id,
        "note": "This is a mock endpoint. In production, this would serve actual 3D model files."
    }

if __name__ == "__main__":
    # Cloud Run provides PORT environment variable
    port = int(os.getenv("PORT", 8080))
    
    logger.info(f"Starting COLMAP Worker on port {port}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        log_level="info",
        access_log=True
    )
