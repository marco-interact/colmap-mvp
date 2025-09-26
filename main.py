"""
COLMAP Worker for Google Cloud Run
GPU-Accelerated 3D Reconstruction Service
Optimized for cloud deployment with proper health checks and logging
"""

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import os
import json
import logging
import subprocess
import asyncio
import tempfile
import shutil
import cv2
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import uuid
import zipfile
from google.cloud import storage

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

# Cloud Storage client
storage_client = storage.Client()
BUCKET_NAME = os.getenv("STORAGE_BUCKET", "colmap-processing-bucket")

class COLMAPProcessor:
    """Handles COLMAP 3D reconstruction pipeline"""
    
    def __init__(self, work_dir: str):
        self.work_dir = Path(work_dir)
        self.work_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.images_dir = self.work_dir / "images"
        self.database_path = self.work_dir / "database.db"
        self.sparse_dir = self.work_dir / "sparse"
        self.dense_dir = self.work_dir / "dense"
        
        for d in [self.images_dir, self.sparse_dir, self.dense_dir]:
            d.mkdir(exist_ok=True)
    
    def extract_frames(self, video_path: str, max_frames: int = 50) -> int:
        """Extract frames from video for reconstruction"""
        logger.info(f"Extracting frames from {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        # Calculate frame interval to get desired number of frames
        interval = max(1, frame_count // max_frames)
        
        extracted = 0
        frame_idx = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % interval == 0:
                frame_path = self.images_dir / f"frame_{extracted:06d}.jpg"
                cv2.imwrite(str(frame_path), frame)
                extracted += 1
                
            frame_idx += 1
            
        cap.release()
        logger.info(f"Extracted {extracted} frames")
        return extracted
    
    def run_feature_extraction(self) -> bool:
        """Run COLMAP feature extraction"""
        logger.info("Running feature extraction")
        
        cmd = [
            "colmap", "feature_extractor",
            "--database_path", str(self.database_path),
            "--image_path", str(self.images_dir),
            "--ImageReader.single_camera", "1",
            "--SiftExtraction.use_gpu", "1",
            "--SiftExtraction.max_image_size", "1600"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                logger.error(f"Feature extraction failed: {result.stderr}")
                return False
            return True
        except Exception as e:
            logger.error(f"Feature extraction error: {e}")
            return False
    
    def run_feature_matching(self) -> bool:
        """Run COLMAP feature matching"""
        logger.info("Running feature matching")
        
        cmd = [
            "colmap", "exhaustive_matcher",
            "--database_path", str(self.database_path),
            "--SiftMatching.use_gpu", "1"
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                logger.error(f"Feature matching failed: {result.stderr}")
                return False
            return True
        except Exception as e:
            logger.error(f"Feature matching error: {e}")
            return False
    
    def run_sparse_reconstruction(self) -> bool:
        """Run COLMAP sparse reconstruction"""
        logger.info("Running sparse reconstruction")
        
        cmd = [
            "colmap", "mapper",
            "--database_path", str(self.database_path),
            "--image_path", str(self.images_dir),
            "--output_path", str(self.sparse_dir)
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
            if result.returncode != 0:
                logger.error(f"Sparse reconstruction failed: {result.stderr}")
                return False
            return True
        except Exception as e:
            logger.error(f"Sparse reconstruction error: {e}")
            return False
    
    def run_dense_reconstruction(self) -> bool:
        """Run COLMAP dense reconstruction"""
        logger.info("Running dense reconstruction")
        
        # Find the sparse model directory (usually named '0')
        sparse_model_dir = None
        for d in self.sparse_dir.iterdir():
            if d.is_dir() and (d / "cameras.bin").exists():
                sparse_model_dir = d
                break
        
        if not sparse_model_dir:
            logger.error("No valid sparse model found")
            return False
        
        # Image undistortion
        cmd_undistort = [
            "colmap", "image_undistorter",
            "--image_path", str(self.images_dir),
            "--input_path", str(sparse_model_dir),
            "--output_path", str(self.dense_dir),
            "--output_type", "COLMAP"
        ]
        
        try:
            result = subprocess.run(cmd_undistort, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                logger.error(f"Image undistortion failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Image undistortion error: {e}")
            return False
        
        # Dense stereo matching
        cmd_stereo = [
            "colmap", "patch_match_stereo",
            "--workspace_path", str(self.dense_dir),
            "--workspace_format", "COLMAP",
            "--PatchMatchStereo.geom_consistency", "1"
        ]
        
        try:
            result = subprocess.run(cmd_stereo, capture_output=True, text=True, timeout=1800)
            if result.returncode != 0:
                logger.error(f"Dense stereo failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Dense stereo error: {e}")
            return False
        
        # Stereo fusion
        cmd_fusion = [
            "colmap", "stereo_fusion",
            "--workspace_path", str(self.dense_dir),
            "--workspace_format", "COLMAP",
            "--input_type", "geometric",
            "--output_path", str(self.dense_dir / "fused.ply")
        ]
        
        try:
            result = subprocess.run(cmd_fusion, capture_output=True, text=True, timeout=600)
            if result.returncode != 0:
                logger.error(f"Stereo fusion failed: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"Stereo fusion error: {e}")
            return False
        
        return True

async def process_video_pipeline(job_id: str, video_path: str, quality: str = "medium"):
    """Complete COLMAP processing pipeline"""
    
    jobs[job_id]["status"] = "processing"
    jobs[job_id]["current_stage"] = "Frame Extraction"
    jobs[job_id]["progress"] = 10
    
    work_dir = f"/tmp/colmap_{job_id}"
    processor = COLMAPProcessor(work_dir)
    
    try:
        # Stage 1: Extract frames
        jobs[job_id]["message"] = "Extracting frames from video..."
        max_frames = 30 if quality == "low" else 50 if quality == "medium" else 100
        frame_count = processor.extract_frames(video_path, max_frames)
        
        if frame_count < 10:
            raise Exception("Not enough frames extracted for reconstruction")
        
        jobs[job_id]["progress"] = 20
        
        # Stage 2: Feature extraction
        jobs[job_id]["current_stage"] = "Feature Detection"
        jobs[job_id]["message"] = "Detecting features in images..."
        if not processor.run_feature_extraction():
            raise Exception("Feature extraction failed")
        
        jobs[job_id]["progress"] = 40
        
        # Stage 3: Feature matching
        jobs[job_id]["current_stage"] = "Feature Matching"
        jobs[job_id]["message"] = "Matching features between images..."
        if not processor.run_feature_matching():
            raise Exception("Feature matching failed")
        
        jobs[job_id]["progress"] = 60
        
        # Stage 4: Sparse reconstruction
        jobs[job_id]["current_stage"] = "Sparse Reconstruction"
        jobs[job_id]["message"] = "Creating sparse 3D model..."
        if not processor.run_sparse_reconstruction():
            raise Exception("Sparse reconstruction failed")
        
        jobs[job_id]["progress"] = 80
        
        # Stage 5: Dense reconstruction (if requested)
        if quality in ["medium", "high"]:
            jobs[job_id]["current_stage"] = "Dense Reconstruction"
            jobs[job_id]["message"] = "Creating dense point cloud..."
            if not processor.run_dense_reconstruction():
                logger.warning("Dense reconstruction failed, using sparse model")
        
        jobs[job_id]["progress"] = 95
        
        # Stage 6: Upload results to Cloud Storage
        jobs[job_id]["current_stage"] = "Uploading Results"
        jobs[job_id]["message"] = "Saving results..."
        
        results_urls = await upload_results_to_storage(job_id, processor)
        
        # Complete
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["current_stage"] = "Complete"
        jobs[job_id]["message"] = "3D reconstruction completed successfully!"
        jobs[job_id]["results"] = results_urls
        
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["message"] = f"Processing failed: {str(e)}"
    
    finally:
        # Cleanup
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)

async def upload_results_to_storage(job_id: str, processor: COLMAPProcessor) -> Dict[str, str]:
    """Upload results to Google Cloud Storage"""
    results = {}
    
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Upload point cloud if exists
        ply_files = list(processor.dense_dir.glob("*.ply"))
        if ply_files:
            ply_path = ply_files[0]
            blob_name = f"results/{job_id}/point_cloud.ply"
            blob = bucket.blob(blob_name)
            blob.upload_from_filename(str(ply_path))
            results["point_cloud_url"] = f"gs://{BUCKET_NAME}/{blob_name}"
        
        # Create and upload sparse model zip
        sparse_models = list(processor.sparse_dir.glob("*/"))
        if sparse_models:
            zip_path = processor.work_dir / "sparse_model.zip"
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for model_dir in sparse_models:
                    for file in model_dir.iterdir():
                        if file.is_file():
                            zipf.write(file, f"sparse/{model_dir.name}/{file.name}")
            
            blob_name = f"results/{job_id}/sparse_model.zip"
            blob = bucket.blob(blob_name)
            blob.upload_from_filename(str(zip_path))
            results["sparse_model_url"] = f"gs://{BUCKET_NAME}/{blob_name}"
        
    except Exception as e:
        logger.error(f"Failed to upload results: {e}")
        # Return local paths as fallback
        results["error"] = "Upload failed - results available locally"
    
    return results

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

@app.post("/upload-video")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    project_id: str = Form(...),
    scan_name: str = Form(...),
    quality: str = Form("medium")
):
    """Upload video and start 3D reconstruction"""
    
    # Validate file
    if not video.content_type or not video.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    job_id = str(uuid.uuid4())
    
    logger.info(f"Starting video upload and processing job {job_id}")
    
    # Save uploaded video temporarily
    temp_video_path = f"/tmp/upload_{job_id}.mp4"
    
    try:
        with open(temp_video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Create job entry
        jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "message": "Video uploaded, processing queued",
            "created_at": datetime.now().isoformat(),
            "project_id": project_id,
            "scan_name": scan_name,
            "quality": quality,
            "progress": 0,
            "current_stage": "Queued"
        }
        
        # Start background processing
        background_tasks.add_task(process_video_pipeline, job_id, temp_video_path, quality)
        
        return {
            "job_id": job_id,
            "status": "queued",
            "message": "Video uploaded successfully, processing started"
        }
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get processing job status"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    logger.info(f"Status check for job {job_id}: {job['status']}")
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "message": job["message"],
        "created_at": job["created_at"],
        "progress": job.get("progress", 0),
        "current_stage": job.get("current_stage", "Unknown"),
        "results": job.get("results", None)
    }

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
