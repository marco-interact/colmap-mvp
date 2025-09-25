"""
Simple COLMAP Worker for Google Cloud Run
This is a simplified version that can be deployed without complex dependencies
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
import json
from datetime import datetime

app = FastAPI(title="COLMAP Worker", version="1.0.0")

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
    return {"message": "COLMAP Worker API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/upload-video", response_model=ProcessingResponse)
async def upload_video(request: ProcessingRequest):
    """Simulate video upload and processing"""
    job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    jobs[job_id] = {
        "status": "queued",
        "project_id": request.project_id,
        "video_url": request.video_url,
        "quality": request.quality,
        "created_at": datetime.now().isoformat(),
        "message": "Video uploaded successfully. Processing will begin shortly."
    }
    
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
    uvicorn.run(app, host="0.0.0.0", port=8080)
