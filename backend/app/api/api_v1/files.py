"""
Demo files API endpoints for local development
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List
import os
import tempfile

router = APIRouter()

# Maximum file size (1GB)
MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB

@router.post("/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file with 1GB size limit."""
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file.size / (1024*1024):.1f} MB) exceeds maximum allowed size (1GB)"
        )
    
    # Create a temporary file to simulate upload
    temp_dir = tempfile.gettempdir()
    file_path = os.path.join(temp_dir, file.filename)
    
    # In a real implementation, you would save the file properly
    return {
        "filename": file.filename,
        "size": file.size if hasattr(file, 'size') else 0,
        "content_type": file.content_type,
        "message": f"File uploaded successfully (Size: {(file.size / (1024*1024)):.1f} MB)",
        "max_size_mb": MAX_FILE_SIZE / (1024*1024)
    }

@router.get("/files/project/{project_id}")
async def list_project_files(project_id: str):
    """List files for a project."""
    # Return mock file data
    return {
        "project_id": project_id,
        "files": [
            {
                "type": "video",
                "filename": "input_video.mp4",
                "size": 157286400,  # ~150MB
                "modified": 1693046400,  # Unix timestamp
                "url": f"/files/download/{project_id}/video"
            },
            {
                "type": "frames",
                "filename": "extracted_frames.zip",
                "size": 52428800,  # ~50MB
                "modified": 1693050000,
                "url": f"/files/download/{project_id}/frames"
            },
            {
                "type": "model",
                "filename": "3d_model.ply",
                "size": 12582912,  # ~12MB
                "modified": 1693053600,
                "url": f"/files/download/{project_id}/model"
            }
        ]
    }

@router.get("/files/download/{project_id}/{file_type}")
async def download_file(project_id: str, file_type: str):
    """Download a project file."""
    # In a real implementation, this would return the actual file
    return {
        "message": f"Download would start for {file_type} file of project {project_id}",
        "project_id": project_id,
        "file_type": file_type
    }

@router.post("/files/extract-frames/{project_id}")
async def extract_frames(project_id: str, interval: float = 1.0):
    """Extract frames from uploaded video."""
    return {
        "message": "Frame extraction started",
        "project_id": project_id,
        "interval": interval,
        "status": "processing"
    }
