"""
Demo projects API endpoints for local development
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

router = APIRouter()

# Maximum file size (1GB)
MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB

# Mock projects data
DEMO_PROJECTS = {
    "1": {
        "id": 1,
        "name": "ITECSA Nave Industrial",
        "description": "Render de sitio de obra para Desarrollo Inmobiliario ITECSA",
        "location": "Playa del Carmen",
        "status": "completed",
        "created_at": "2025-08-26T10:00:00",
        "updated_at": "2025-08-26T15:30:00",
        "scans": [
            {
                "id": "1",
                "name": "Scan Principal",
                "status": "completed",
                "video_file": "nave_industrial_360.mp4",
                "frames_extracted": 120,
                "processing_progress": 100,
                "model_ready": True,
                "created_at": "2025-08-26T10:30:00"
            }
        ]
    },
    "2": {
        "id": 2,
        "name": "Casa Residencial Tulum",
        "description": "Escaneo 3D completo de propiedad residencial para documentación arquitectónica",
        "location": "Tulum, Quintana Roo",
        "status": "processing",
        "created_at": "2025-08-25T09:00:00",
        "updated_at": "2025-08-25T14:20:00",
        "scans": []
    },
    "3": {
        "id": 3,
        "name": "Centro Comercial Plaza Maya",
        "description": "Levantamiento digital de espacios comerciales para renovación",
        "location": "Cancún, Quintana Roo",
        "status": "draft",
        "created_at": "2025-08-24T08:00:00",
        "updated_at": "2025-08-24T12:15:00",
        "scans": []
    }
}

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None

class ScanCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    status: str
    created_at: str
    updated_at: str
    scans: List[dict]

@router.get("/projects", response_model=List[dict])
async def list_projects():
    """List all projects."""
    projects = []
    for project_data in DEMO_PROJECTS.values():
        projects.append({
            "id": str(project_data["id"]),
            "title": project_data["name"],
            "description": project_data["description"],
            "location": project_data["location"],
            "status": project_data["status"],
            "updatedAt": project_data["updated_at"][:10],  # Format as date
            "thumbnail": None
        })
    return projects

@router.post("/projects", response_model=dict)
async def create_project(project: ProjectCreate):
    """Create a new project."""
    new_id = str(len(DEMO_PROJECTS) + 1)
    new_project = {
        "id": int(new_id),
        "name": project.name,
        "description": project.description,
        "location": project.location,
        "status": "draft",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "scans": []
    }
    
    DEMO_PROJECTS[new_id] = new_project
    
    return {
        "id": new_id,
        "title": new_project["name"],
        "description": new_project["description"],
        "location": new_project["location"],
        "status": new_project["status"],
        "updatedAt": new_project["updated_at"][:10],
        "thumbnail": None
    }

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get project details."""
    if project_id not in DEMO_PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = DEMO_PROJECTS[project_id]
    return ProjectResponse(**project)

@router.post("/projects/{project_id}/scans")
async def create_scan(project_id: str, scan: ScanCreate):
    """Create a new scan for a project."""
    if project_id not in DEMO_PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = DEMO_PROJECTS[project_id]
    new_scan = {
        "id": str(len(project["scans"]) + 1),
        "name": scan.name,
        "description": scan.description,
        "status": "draft",
        "video_file": None,
        "frames_extracted": 0,
        "processing_progress": 0,
        "model_ready": False,
        "created_at": datetime.now().isoformat()
    }
    
    project["scans"].append(new_scan)
    project["updated_at"] = datetime.now().isoformat()
    
    return new_scan

@router.post("/projects/{project_id}/upload-video")
async def upload_video(project_id: str, file: UploadFile = File(...)):
    """Upload video for processing with 1GB size limit."""
    if project_id not in DEMO_PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Video file size ({file.size / (1024*1024):.1f} MB) exceeds maximum allowed size (1GB)"
        )
    
    # In a real implementation, this would save the file and start processing
    return {
        "message": f"Video {file.filename} uploaded successfully (Size: {(file.size / (1024*1024)):.1f} MB)",
        "filename": file.filename,
        "size": file.size if hasattr(file, 'size') else 0,
        "status": "uploaded",
        "max_size_mb": MAX_FILE_SIZE / (1024*1024)
    }

@router.post("/projects/{project_id}/start-processing")
async def start_processing(project_id: str, quality: str = "medium"):
    """Start COLMAP processing for a project."""
    if project_id not in DEMO_PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = DEMO_PROJECTS[project_id]
    project["status"] = "processing"
    project["updated_at"] = datetime.now().isoformat()
    
    return {
        "message": "COLMAP processing started",
        "project_id": project_id,
        "quality": quality,
        "status": "processing"
    }

@router.get("/projects/{project_id}/3d-model")
async def get_3d_model(project_id: str):
    """Get 3D model data for viewer."""
    if project_id not in DEMO_PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Return mock 3D model data
    return {
        "model_url": f"/static/models/{project_id}/model.ply",
        "format": "PLY",
        "points": 45000,
        "file_size": "12.3 MB",
        "quality": "high",
        "processing_time": "45 minutes"
    }
