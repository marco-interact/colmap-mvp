"""
COLMAP 3D Reconstruction Worker Service
FastAPI service for processing videos into 3D models using COLMAP 3.12.6
"""

import os
import shutil
import subprocess
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import cv2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="COLMAP Worker Service",
    description="3D Reconstruction Service powered by COLMAP 3.12.6",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global configuration
UPLOAD_DIR = Path("/app/uploads")
OUTPUT_DIR = Path("/app/outputs")
TEMP_DIR = Path("/app/temp")

# Ensure directories exist
for directory in [UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR]:
    directory.mkdir(exist_ok=True, parents=True)

# Job storage (in production, use Redis or database)
jobs: Dict[str, Dict[str, Any]] = {}

class ProcessingRequest(BaseModel):
    project_id: str
    quality: str = "medium"
    dense_reconstruction: bool = True
    meshing: bool = True
    texturing: bool = False
    frame_extraction_rate: int = 1
    max_image_size: Optional[int] = None
    max_num_features: Optional[int] = None

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
    created_at: datetime
    updated_at: datetime
    results: Optional[Dict[str, Any]] = None

class COLMAPPipeline:
    """Enhanced COLMAP pipeline with comprehensive 3D reconstruction capabilities"""
    
    def __init__(self):
        self.colmap_binary = "colmap"  # Assumes COLMAP is installed and in PATH
        
        # Quality presets
        self.quality_params = {
            "low": {
                "max_image_size": 800,
                "max_num_features": 4000,
                "matcher_options": "--SiftMatching.max_ratio=0.8 --SiftMatching.max_distance=0.7",
                "mapper_options": "--Mapper.ba_refine_focal_length=1 --Mapper.ba_refine_principal_point=0"
            },
            "medium": {
                "max_image_size": 1200,
                "max_num_features": 8000,
                "matcher_options": "--SiftMatching.max_ratio=0.8 --SiftMatching.max_distance=0.7",
                "mapper_options": "--Mapper.ba_refine_focal_length=1 --Mapper.ba_refine_principal_point=0"
            },
            "high": {
                "max_image_size": 1600,
                "max_num_features": 12000,
                "matcher_options": "--SiftMatching.max_ratio=0.8 --SiftMatching.max_distance=0.7",
                "mapper_options": "--Mapper.ba_refine_focal_length=1 --Mapper.ba_refine_principal_point=0"
            },
            "extreme": {
                "max_image_size": 2400,
                "max_num_features": 20000,
                "matcher_options": "--SiftMatching.max_ratio=0.8 --SiftMatching.max_distance=0.7",
                "mapper_options": "--Mapper.ba_refine_focal_length=1 --Mapper.ba_refine_principal_point=0"
            }
        }
    
    async def extract_frames_from_video(
        self, 
        video_path: Path, 
        output_dir: Path, 
        frame_rate: int = 1,
        job_id: str = None
    ) -> Dict[str, Any]:
        """Extract frames from video using OpenCV"""
        try:
            if job_id:
                jobs[job_id]["message"] = "Extracting frames from video..."
                jobs[job_id]["progress"] = 10
            
            # Create images directory
            images_dir = output_dir / "images"
            images_dir.mkdir(exist_ok=True, parents=True)
            
            # Open video
            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                raise Exception(f"Could not open video file: {video_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            logger.info(f"Video stats: {total_frames} frames, {fps} FPS, {duration:.2f}s duration")
            
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Extract frame at specified rate
                if frame_count % frame_rate == 0:
                    frame_filename = f"frame_{extracted_count:06d}.jpg"
                    frame_path = images_dir / frame_filename
                    cv2.imwrite(str(frame_path), frame)
                    extracted_count += 1
                    
                    if job_id and extracted_count % 10 == 0:
                        progress = min(10 + (frame_count / total_frames) * 20, 30)
                        jobs[job_id]["progress"] = int(progress)
                        jobs[job_id]["message"] = f"Extracted {extracted_count} frames..."
                
                frame_count += 1
            
            cap.release()
            
            if job_id:
                jobs[job_id]["progress"] = 30
                jobs[job_id]["message"] = f"Frame extraction completed. {extracted_count} frames extracted."
            
            return {
                "frames_extracted": extracted_count,
                "total_video_frames": total_frames,
                "video_fps": fps,
                "video_duration": duration,
                "images_directory": str(images_dir)
            }
            
        except Exception as e:
            logger.error(f"Frame extraction failed: {e}")
            if job_id:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["message"] = f"Frame extraction failed: {str(e)}"
            raise
    
    async def run_colmap_command(self, command: List[str], job_id: str = None) -> None:
        """Execute COLMAP command with logging"""
        try:
            logger.info(f"Running COLMAP command: {' '.join(command)}")
            
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"COLMAP command failed: {error_msg}")
                raise Exception(f"COLMAP command failed: {error_msg}")
            
            logger.info("COLMAP command completed successfully")
            
        except Exception as e:
            logger.error(f"COLMAP command execution failed: {e}")
            if job_id:
                jobs[job_id]["status"] = "failed"
                jobs[job_id]["message"] = f"COLMAP processing failed: {str(e)}"
            raise
    
    async def feature_extraction(
        self, 
        database_path: Path, 
        images_path: Path, 
        quality: str = "medium",
        job_id: str = None
    ) -> None:
        """Extract SIFT features from images"""
        try:
            if job_id:
                jobs[job_id]["message"] = "Extracting SIFT features..."
                jobs[job_id]["progress"] = 35
            
            params = self.quality_params.get(quality, self.quality_params["medium"])
            
            command = [
                self.colmap_binary, "feature_extractor",
                "--database_path", str(database_path),
                "--image_path", str(images_path),
                "--ImageReader.single_camera", "1",
                "--SiftExtraction.max_image_size", str(params["max_image_size"]),
                "--SiftExtraction.max_num_features", str(params["max_num_features"])
            ]
            
            await self.run_colmap_command(command, job_id)
            
            if job_id:
                jobs[job_id]["progress"] = 45
                jobs[job_id]["message"] = "Feature extraction completed"
            
        except Exception as e:
            raise Exception(f"Feature extraction failed: {str(e)}")
    
    async def feature_matching(
        self, 
        database_path: Path, 
        quality: str = "medium",
        job_id: str = None
    ) -> None:
        """Match features between images"""
        try:
            if job_id:
                jobs[job_id]["message"] = "Matching features between images..."
                jobs[job_id]["progress"] = 50
            
            command = [
                self.colmap_binary, "exhaustive_matcher",
                "--database_path", str(database_path)
            ]
            
            await self.run_colmap_command(command, job_id)
            
            if job_id:
                jobs[job_id]["progress"] = 60
                jobs[job_id]["message"] = "Feature matching completed"
            
        except Exception as e:
            raise Exception(f"Feature matching failed: {str(e)}")
    
    async def sparse_reconstruction(
        self, 
        database_path: Path, 
        images_path: Path, 
        output_path: Path,
        job_id: str = None
    ) -> None:
        """Create sparse 3D reconstruction"""
        try:
            if job_id:
                jobs[job_id]["message"] = "Creating sparse 3D reconstruction..."
                jobs[job_id]["progress"] = 65
            
            sparse_dir = output_path / "sparse"
            sparse_dir.mkdir(exist_ok=True, parents=True)
            
            command = [
                self.colmap_binary, "mapper",
                "--database_path", str(database_path),
                "--image_path", str(images_path),
                "--output_path", str(sparse_dir)
            ]
            
            await self.run_colmap_command(command, job_id)
            
            if job_id:
                jobs[job_id]["progress"] = 75
                jobs[job_id]["message"] = "Sparse reconstruction completed"
            
        except Exception as e:
            raise Exception(f"Sparse reconstruction failed: {str(e)}")
    
    async def dense_reconstruction(
        self, 
        images_path: Path, 
        output_path: Path,
        quality: str = "medium",
        job_id: str = None
    ) -> None:
        """Create dense 3D reconstruction"""
        try:
            if job_id:
                jobs[job_id]["message"] = "Creating dense 3D reconstruction..."
                jobs[job_id]["progress"] = 80
            
            sparse_dir = output_path / "sparse" / "0"
            dense_dir = output_path / "dense"
            dense_dir.mkdir(exist_ok=True, parents=True)
            
            # Image undistortion
            command = [
                self.colmap_binary, "image_undistorter",
                "--image_path", str(images_path),
                "--input_path", str(sparse_dir),
                "--output_path", str(dense_dir),
                "--output_type", "COLMAP"
            ]
            await self.run_colmap_command(command, job_id)
            
            # Patch match stereo
            if job_id:
                jobs[job_id]["message"] = "Running patch match stereo..."
                jobs[job_id]["progress"] = 85
            
            command = [
                self.colmap_binary, "patch_match_stereo",
                "--workspace_path", str(dense_dir),
                "--workspace_format", "COLMAP"
            ]
            await self.run_colmap_command(command, job_id)
            
            # Stereo fusion
            if job_id:
                jobs[job_id]["message"] = "Fusing stereo depth maps..."
                jobs[job_id]["progress"] = 90
            
            command = [
                self.colmap_binary, "stereo_fusion",
                "--workspace_path", str(dense_dir),
                "--workspace_format", "COLMAP",
                "--input_type", "geometric",
                "--output_path", str(dense_dir / "fused.ply")
            ]
            await self.run_colmap_command(command, job_id)
            
            if job_id:
                jobs[job_id]["progress"] = 95
                jobs[job_id]["message"] = "Dense reconstruction completed"
            
        except Exception as e:
            raise Exception(f"Dense reconstruction failed: {str(e)}")
    
    async def create_mesh(
        self, 
        output_path: Path,
        job_id: str = None
    ) -> None:
        """Create mesh from dense point cloud"""
        try:
            if job_id:
                jobs[job_id]["message"] = "Creating mesh from point cloud..."
                jobs[job_id]["progress"] = 97
            
            dense_dir = output_path / "dense"
            input_ply = dense_dir / "fused.ply"
            output_ply = dense_dir / "meshed-poisson.ply"
            
            command = [
                self.colmap_binary, "poisson_mesher",
                "--input_path", str(input_ply),
                "--output_path", str(output_ply)
            ]
            
            await self.run_colmap_command(command, job_id)
            
            if job_id:
                jobs[job_id]["message"] = "Mesh creation completed"
            
        except Exception as e:
            raise Exception(f"Mesh creation failed: {str(e)}")

# Initialize COLMAP pipeline
colmap_pipeline = COLMAPPipeline()

@app.get("/")
async def root():
    return {
        "service": "COLMAP Worker",
        "version": "1.0.0",
        "status": "running",
        "colmap_available": shutil.which("colmap") is not None
    }

@app.get("/health")
async def health_check():
    colmap_available = shutil.which("colmap") is not None
    return {
        "status": "healthy" if colmap_available else "unhealthy",
        "colmap_available": colmap_available,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/upload-video")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: str = Form(...)
):
    """Upload video file for processing"""
    try:
        # Validate file type
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")
        
        # Create project directory
        project_dir = UPLOAD_DIR / project_id
        project_dir.mkdir(exist_ok=True, parents=True)
        
        # Save video file
        video_path = project_dir / file.filename
        with open(video_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "success": True,
            "message": "Video uploaded successfully",
            "project_id": project_id,
            "filename": file.filename,
            "size": len(content),
            "path": str(video_path)
        }
        
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Video upload failed: {str(e)}")

@app.post("/extract-frames")
async def extract_frames(
    background_tasks: BackgroundTasks,
    request: ProcessingRequest
):
    """Extract frames from uploaded video"""
    try:
        job_id = str(uuid.uuid4())
        
        # Initialize job
        jobs[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "progress": 0,
            "message": "Starting frame extraction...",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "project_id": request.project_id,
            "type": "frame_extraction"
        }
        
        # Start background task
        background_tasks.add_task(
            extract_frames_task,
            job_id,
            request
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "Frame extraction started"
        }
        
    except Exception as e:
        logger.error(f"Frame extraction request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Frame extraction failed: {str(e)}")

@app.post("/start-reconstruction")
async def start_reconstruction(
    background_tasks: BackgroundTasks,
    request: ProcessingRequest
):
    """Start COLMAP 3D reconstruction pipeline"""
    try:
        job_id = str(uuid.uuid4())
        
        # Initialize job
        jobs[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "progress": 0,
            "message": "Starting COLMAP reconstruction pipeline...",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "project_id": request.project_id,
            "type": "reconstruction",
            "parameters": request.dict()
        }
        
        # Start background task
        background_tasks.add_task(
            reconstruction_task,
            job_id,
            request
        )
        
        return {
            "success": True,
            "job_id": job_id,
            "message": "COLMAP reconstruction started"
        }
        
    except Exception as e:
        logger.error(f"Reconstruction request failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reconstruction failed: {str(e)}")

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status and progress"""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    job["updated_at"] = datetime.now()
    
    return {
        "success": True,
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "created_at": job["created_at"].isoformat(),
        "updated_at": job["updated_at"].isoformat(),
        "results": job.get("results")
    }

@app.get("/download/{project_id}/{file_type}")
async def download_file(project_id: str, file_type: str):
    """Download processed files"""
    try:
        output_dir = OUTPUT_DIR / project_id
        
        file_map = {
            "sparse": output_dir / "sparse" / "0" / "points3D.ply",
            "dense": output_dir / "dense" / "fused.ply",
            "mesh": output_dir / "dense" / "meshed-poisson.ply"
        }
        
        if file_type not in file_map:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        file_path = file_map[file_type]
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=str(file_path),
            filename=f"{project_id}_{file_type}.ply",
            media_type="application/octet-stream"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(status_code=500, detail=f"File download failed: {str(e)}")

# Background task functions
async def extract_frames_task(job_id: str, request: ProcessingRequest):
    """Background task for frame extraction"""
    try:
        jobs[job_id]["status"] = "running"
        jobs[job_id]["updated_at"] = datetime.now()
        
        project_dir = UPLOAD_DIR / request.project_id
        output_dir = OUTPUT_DIR / request.project_id
        output_dir.mkdir(exist_ok=True, parents=True)
        
        # Find video file
        video_files = list(project_dir.glob("*.mp4")) + list(project_dir.glob("*.avi")) + list(project_dir.glob("*.mov"))
        if not video_files:
            raise Exception("No video file found in project directory")
        
        video_path = video_files[0]
        
        # Extract frames
        results = await colmap_pipeline.extract_frames_from_video(
            video_path=video_path,
            output_dir=output_dir,
            frame_rate=request.frame_extraction_rate,
            job_id=job_id
        )
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["message"] = f"Frame extraction completed. {results['frames_extracted']} frames extracted."
        jobs[job_id]["results"] = results
        jobs[job_id]["updated_at"] = datetime.now()
        
    except Exception as e:
        logger.error(f"Frame extraction task failed: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["message"] = f"Frame extraction failed: {str(e)}"
        jobs[job_id]["updated_at"] = datetime.now()

async def reconstruction_task(job_id: str, request: ProcessingRequest):
    """Background task for COLMAP reconstruction"""
    try:
        jobs[job_id]["status"] = "running"
        jobs[job_id]["updated_at"] = datetime.now()
        
        output_dir = OUTPUT_DIR / request.project_id
        images_dir = output_dir / "images"
        database_path = output_dir / "database.db"
        
        # Check if images exist
        if not images_dir.exists() or not list(images_dir.glob("*.jpg")):
            raise Exception("No images found. Please extract frames first.")
        
        # Feature extraction
        await colmap_pipeline.feature_extraction(
            database_path=database_path,
            images_path=images_dir,
            quality=request.quality,
            job_id=job_id
        )
        
        # Feature matching
        await colmap_pipeline.feature_matching(
            database_path=database_path,
            quality=request.quality,
            job_id=job_id
        )
        
        # Sparse reconstruction
        await colmap_pipeline.sparse_reconstruction(
            database_path=database_path,
            images_path=images_dir,
            output_path=output_dir,
            job_id=job_id
        )
        
        results = {"sparse_reconstruction": True}
        
        # Dense reconstruction (if requested)
        if request.dense_reconstruction:
            await colmap_pipeline.dense_reconstruction(
                images_path=images_dir,
                output_path=output_dir,
                quality=request.quality,
                job_id=job_id
            )
            results["dense_reconstruction"] = True
        
        # Meshing (if requested)
        if request.meshing:
            await colmap_pipeline.create_mesh(
                output_path=output_dir,
                job_id=job_id
            )
            results["meshing"] = True
        
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["message"] = "COLMAP reconstruction completed successfully!"
        jobs[job_id]["results"] = results
        jobs[job_id]["updated_at"] = datetime.now()
        
    except Exception as e:
        logger.error(f"COLMAP reconstruction failed: {e}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["message"] = f"COLMAP reconstruction failed: {str(e)}"
        jobs[job_id]["updated_at"] = datetime.now()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8001, 
        reload=True,
        workers=1
    )
