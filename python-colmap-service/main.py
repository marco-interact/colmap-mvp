"""
COLMAP 3D Reconstruction Microservice
Python FastAPI service for handling COLMAP processing
Integrates with Laravel frontend via REST API
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil
import tempfile
import uuid
import json
from datetime import datetime
import asyncio
import subprocess
import logging
from pathlib import Path

# Import our existing COLMAP pipeline
from colmap_pipeline import COLMAPPipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="COLMAP 3D Reconstruction Service",
    description="Python microservice for COLMAP 3D reconstruction processing",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Laravel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://localhost", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# In-memory job storage (in production, use Redis or database)
jobs = {}

class JobStatus(BaseModel):
    id: str
    status: str  # pending, processing, completed, failed
    progress: int
    message: str
    created_at: datetime
    updated_at: datetime
    results: Optional[dict] = None

class ProcessingRequest(BaseModel):
    project_id: str
    quality: str = "medium"  # low, medium, high, extreme
    max_image_size: Optional[int] = None
    max_num_features: Optional[int] = None
    dense_reconstruction: bool = True
    meshing: bool = True
    texturing: bool = False

class VideoProcessingRequest(BaseModel):
    project_id: str
    frame_extraction_rate: int = 1  # Extract 1 frame per second
    quality: str = "medium"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "COLMAP 3D Reconstruction Service",
        "status": "running",
        "version": "1.0.0",
        "colmap_available": shutil.which("colmap") is not None
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    colmap_path = shutil.which("colmap")
    return {
        "status": "healthy",
        "colmap_installed": colmap_path is not None,
        "colmap_path": colmap_path,
        "upload_dir": str(UPLOAD_DIR.absolute()),
        "output_dir": str(OUTPUT_DIR.absolute()),
        "active_jobs": len([j for j in jobs.values() if j.status == "processing"])
    }

@app.post("/upload-video")
async def upload_video(
    project_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """Upload video file for frame extraction"""
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Only MP4, AVI, MOV, MKV are supported."
        )
    
    # Create project directory
    project_dir = UPLOAD_DIR / project_id
    project_dir.mkdir(exist_ok=True, parents=True)
    
    # Save uploaded video
    video_path = project_dir / file.filename
    
    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Video uploaded successfully: {video_path}")
        
        return {
            "message": "Video uploaded successfully",
            "project_id": project_id,
            "filename": file.filename,
            "size": video_path.stat().st_size,
            "path": str(video_path)
        }
    
    except Exception as e:
        logger.error(f"Error uploading video: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")

@app.post("/extract-frames")
async def extract_frames(
    request: VideoProcessingRequest,
    background_tasks: BackgroundTasks
):
    """Extract frames from uploaded video"""
    job_id = str(uuid.uuid4())
    
    # Initialize job
    jobs[job_id] = JobStatus(
        id=job_id,
        status="pending",
        progress=0,
        message="Starting frame extraction...",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Add background task
    background_tasks.add_task(
        process_frame_extraction,
        job_id,
        request.project_id,
        request.frame_extraction_rate
    )
    
    return {
        "job_id": job_id,
        "message": "Frame extraction started",
        "status": "pending"
    }

@app.post("/start-reconstruction")
async def start_reconstruction(
    request: ProcessingRequest,
    background_tasks: BackgroundTasks
):
    """Start COLMAP 3D reconstruction process"""
    job_id = str(uuid.uuid4())
    
    # Initialize job
    jobs[job_id] = JobStatus(
        id=job_id,
        status="pending",
        progress=0,
        message="Starting COLMAP reconstruction...",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # Add background task
    background_tasks.add_task(
        process_colmap_reconstruction,
        job_id,
        request
    )
    
    return {
        "job_id": job_id,
        "message": "COLMAP reconstruction started",
        "status": "pending"
    }

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return jobs[job_id]

@app.get("/jobs")
async def list_jobs():
    """List all jobs"""
    return {"jobs": list(jobs.values())}

@app.get("/download/{project_id}/{file_type}")
async def download_file(project_id: str, file_type: str):
    """Download processed files"""
    project_output = OUTPUT_DIR / project_id
    
    file_mapping = {
        "model": "model.ply",
        "dense": "dense_reconstruction.ply", 
        "sparse": "sparse_reconstruction.ply",
        "mesh": "mesh.ply",
        "textured": "textured_mesh.obj"
    }
    
    if file_type not in file_mapping:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    file_path = project_output / file_mapping[file_type]
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=file_mapping[file_type],
        media_type='application/octet-stream'
    )

async def process_frame_extraction(job_id: str, project_id: str, frame_rate: int):
    """Background task for frame extraction"""
    try:
        # Update job status
        jobs[job_id].status = "processing"
        jobs[job_id].message = "Extracting frames from video..."
        jobs[job_id].updated_at = datetime.now()
        
        project_dir = UPLOAD_DIR / project_id
        images_dir = project_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        # Find video file
        video_files = list(project_dir.glob("*.mp4")) + list(project_dir.glob("*.avi")) + \
                     list(project_dir.glob("*.mov")) + list(project_dir.glob("*.mkv"))
        
        if not video_files:
            raise Exception("No video file found")
        
        video_path = video_files[0]
        
        # Extract frames using ffmpeg
        cmd = [
            "ffmpeg", "-i", str(video_path),
            "-vf", f"fps={frame_rate}",
            "-q:v", "2",  # High quality
            str(images_dir / "frame_%04d.jpg")
        ]
        
        jobs[job_id].progress = 25
        jobs[job_id].message = "Running ffmpeg frame extraction..."
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        # Count extracted frames
        frame_count = len(list(images_dir.glob("*.jpg")))
        
        jobs[job_id].status = "completed"
        jobs[job_id].progress = 100
        jobs[job_id].message = f"Frame extraction completed. {frame_count} frames extracted."
        jobs[job_id].results = {
            "frames_extracted": frame_count,
            "images_directory": str(images_dir)
        }
        jobs[job_id].updated_at = datetime.now()
        
        logger.info(f"Frame extraction completed for job {job_id}: {frame_count} frames")
        
    except Exception as e:
        logger.error(f"Frame extraction failed for job {job_id}: {e}")
        jobs[job_id].status = "failed"
        jobs[job_id].message = f"Frame extraction failed: {str(e)}"
        jobs[job_id].updated_at = datetime.now()

async def process_colmap_reconstruction(job_id: str, request: ProcessingRequest):
    """Background task for COLMAP reconstruction"""
    try:
        # Update job status
        jobs[job_id].status = "processing"
        jobs[job_id].message = "Initializing COLMAP pipeline..."
        jobs[job_id].updated_at = datetime.now()
        
        # Set up directories
        project_dir = UPLOAD_DIR / request.project_id
        images_dir = project_dir / "images"
        output_dir = OUTPUT_DIR / request.project_id
        output_dir.mkdir(exist_ok=True, parents=True)
        
        if not images_dir.exists() or not list(images_dir.glob("*.jpg")):
            raise Exception("No images found. Please extract frames first.")
        
        # Initialize COLMAP pipeline
        pipeline = COLMAPPipeline(
            images_path=str(images_dir),
            output_path=str(output_dir)
        )
        
        # Configure quality settings
        quality_settings = {
            "low": {"max_image_size": 800, "max_num_features": 4000},
            "medium": {"max_image_size": 1200, "max_num_features": 8000},
            "high": {"max_image_size": 1600, "max_num_features": 12000},
            "extreme": {"max_image_size": 2400, "max_num_features": 20000}
        }
        
        settings = quality_settings.get(request.quality, quality_settings["medium"])
        pipeline.max_image_size = request.max_image_size or settings["max_image_size"]
        pipeline.max_num_features = request.max_num_features or settings["max_num_features"]
        
        # Step 1: Feature extraction
        jobs[job_id].progress = 10
        jobs[job_id].message = "Extracting features..."
        pipeline.extract_features()
        
        # Step 2: Feature matching
        jobs[job_id].progress = 30
        jobs[job_id].message = "Matching features..."
        pipeline.match_features()
        
        # Step 3: Sparse reconstruction
        jobs[job_id].progress = 50
        jobs[job_id].message = "Creating sparse reconstruction..."
        pipeline.sparse_reconstruction()
        
        results = {
            "sparse_model": str(output_dir / "sparse_reconstruction.ply"),
            "feature_extraction": "completed",
            "feature_matching": "completed",
            "sparse_reconstruction": "completed"
        }
        
        # Step 4: Dense reconstruction (optional)
        if request.dense_reconstruction:
            jobs[job_id].progress = 70
            jobs[job_id].message = "Creating dense reconstruction..."
            pipeline.dense_reconstruction()
            results["dense_reconstruction"] = "completed"
            results["dense_model"] = str(output_dir / "dense_reconstruction.ply")
        
        # Step 5: Meshing (optional)
        if request.meshing:
            jobs[job_id].progress = 85
            jobs[job_id].message = "Generating mesh..."
            pipeline.create_mesh()
            results["meshing"] = "completed"
            results["mesh_model"] = str(output_dir / "mesh.ply")
        
        # Step 6: Texturing (optional)
        if request.texturing:
            jobs[job_id].progress = 95
            jobs[job_id].message = "Applying textures..."
            pipeline.texture_mesh()
            results["texturing"] = "completed"
            results["textured_model"] = str(output_dir / "textured_mesh.obj")
        
        jobs[job_id].status = "completed"
        jobs[job_id].progress = 100
        jobs[job_id].message = "COLMAP reconstruction completed successfully!"
        jobs[job_id].results = results
        jobs[job_id].updated_at = datetime.now()
        
        logger.info(f"COLMAP reconstruction completed for job {job_id}")
        
    except Exception as e:
        logger.error(f"COLMAP reconstruction failed for job {job_id}: {e}")
        jobs[job_id].status = "failed"
        jobs[job_id].message = f"COLMAP reconstruction failed: {str(e)}"
        jobs[job_id].updated_at = datetime.now()

@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a job"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    if job.status == "processing":
        job.status = "cancelled"
        job.message = "Job cancelled by user"
        job.updated_at = datetime.now()
    
    return {"message": "Job cancelled", "job_id": job_id}

# Vercel serverless handler
def handler(request, context):
    """Vercel serverless function handler"""
    return app

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,  # Different port from Laravel
        reload=True,
        log_level="info"
    )
