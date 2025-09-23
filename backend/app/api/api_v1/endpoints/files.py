"""
File upload and management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from pathlib import Path

from app.core.database import get_db
from app.core.config import settings
from app.models.project import Project
from app.services.video_processor import VideoProcessor
from app.services.file_manager import FileManager

router = APIRouter()


@router.post("/upload/video")
async def upload_video(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a video file for 3D reconstruction.
    
    Args:
        project_id: ID of the project to associate the video with
        file: Video file to upload
        db: Database session
    
    Returns:
        Upload result with file path and metadata
    """
    # Validate file format
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.ALLOWED_VIDEO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format. Allowed formats: {settings.ALLOWED_VIDEO_FORMATS}"
        )
    
    # Check file size
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Save uploaded file
        file_manager = FileManager()
        video_path = await file_manager.save_uploaded_file(file, project_id, "videos")
        
        # Update project with video path
        project.video_path = str(video_path)
        db.commit()
        
        return {
            "message": "Video uploaded successfully",
            "file_path": str(video_path),
            "file_size": file.size,
            "project_id": project_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/extract-frames")
async def extract_frames(
    project_id: int = Form(...),
    interval: float = Form(1.0),
    db: Session = Depends(get_db)
):
    """
    Extract frames from uploaded video.
    
    Args:
        project_id: ID of the project
        interval: Frame extraction interval in seconds
        db: Database session
    
    Returns:
        Frame extraction result
    """
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.video_path or not os.path.exists(project.video_path):
        raise HTTPException(status_code=400, detail="No video file found for this project")
    
    try:
        # Initialize video processor
        video_processor = VideoProcessor()
        
        # Extract frames
        frames_path = await video_processor.extract_frames(
            video_path=project.video_path,
            project_id=project_id,
            interval=interval
        )
        
        # Update project
        project.frames_path = str(frames_path)
        project.total_frames = len(list(Path(frames_path).glob("*.jpg")))
        db.commit()
        
        return {
            "message": "Frames extracted successfully",
            "frames_path": str(frames_path),
            "total_frames": project.total_frames,
            "interval": interval
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame extraction failed: {str(e)}")


@router.get("/download/{project_id}/{file_type}")
async def download_file(
    project_id: int,
    file_type: str,
    db: Session = Depends(get_db)
):
    """
    Download project files (video, frames, models, etc.).
    
    Args:
        project_id: ID of the project
        file_type: Type of file to download (video, frames, mesh, etc.)
        db: Database session
    
    Returns:
        File download response
    """
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Determine file path based on type
    file_path = None
    if file_type == "video" and project.video_path:
        file_path = project.video_path
    elif file_type == "frames" and project.frames_path:
        file_path = project.frames_path
    elif file_type == "mesh" and project.mesh_path:
        file_path = project.mesh_path
    elif file_type == "textured_mesh" and project.textured_mesh_path:
        file_path = project.textured_mesh_path
    elif file_type == "point_cloud" and project.point_cloud_path:
        file_path = project.point_cloud_path
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"{file_type} file not found")
    
    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type='application/octet-stream'
    )


@router.get("/list/{project_id}")
async def list_project_files(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    List all files associated with a project.
    
    Args:
        project_id: ID of the project
        db: Database session
    
    Returns:
        List of project files with metadata
    """
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    files = []
    
    # Check each file type
    file_types = [
        ("video", project.video_path),
        ("frames", project.frames_path),
        ("point_cloud", project.point_cloud_path),
        ("mesh", project.mesh_path),
        ("textured_mesh", project.textured_mesh_path)
    ]
    
    for file_type, file_path in file_types:
        if file_path and os.path.exists(file_path):
            stat = os.stat(file_path)
            files.append({
                "type": file_type,
                "path": file_path,
                "size": stat.st_size,
                "modified": stat.st_mtime
            })
    
    return {
        "project_id": project_id,
        "files": files
    }



