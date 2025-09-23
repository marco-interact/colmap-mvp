"""
Demo jobs API endpoints for local development
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter()

# Mock jobs data
DEMO_JOBS = [
    {
        "id": "job_001",
        "project_id": "1",
        "type": "colmap_processing",
        "status": "completed",
        "progress": 100,
        "created_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "updated_at": datetime.now().isoformat(),
        "duration": 2700,  # 45 minutes in seconds
        "details": {
            "quality": "high",
            "frames_processed": 120,
            "points_generated": 45000
        }
    },
    {
        "id": "job_002", 
        "project_id": "2",
        "type": "frame_extraction",
        "status": "running",
        "progress": 75,
        "created_at": (datetime.now() - timedelta(minutes=30)).isoformat(),
        "updated_at": (datetime.now() - timedelta(minutes=5)).isoformat(),
        "duration": 1500,  # 25 minutes so far
        "details": {
            "frames_extracted": 90,
            "total_frames": 120
        }
    }
]

@router.get("/jobs")
async def list_jobs(project_id: Optional[str] = None):
    """List processing jobs."""
    jobs = DEMO_JOBS
    
    if project_id:
        jobs = [job for job in jobs if job["project_id"] == project_id]
    
    return {
        "jobs": jobs,
        "total": len(jobs)
    }

@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get job details."""
    job = next((job for job in DEMO_JOBS if job["id"] == job_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running job."""
    job = next((job for job in DEMO_JOBS if job["id"] == job_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] in ["completed", "failed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Job cannot be cancelled")
    
    job["status"] = "cancelled"
    job["updated_at"] = datetime.now().isoformat()
    
    return {
        "message": "Job cancelled successfully",
        "job_id": job_id
    }

@router.get("/jobs/{job_id}/progress")
async def get_job_progress(job_id: str):
    """Get real-time job progress."""
    job = next((job for job in DEMO_JOBS if job["id"] == job_id), None)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Simulate progress updates for running jobs
    if job["status"] == "running":
        # Randomly increase progress slightly
        job["progress"] = min(100, job["progress"] + random.randint(0, 5))
        job["updated_at"] = datetime.now().isoformat()
        
        if job["progress"] >= 100:
            job["status"] = "completed"
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "updated_at": job["updated_at"]
    }

