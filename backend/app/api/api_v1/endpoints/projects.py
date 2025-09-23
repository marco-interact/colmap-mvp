"""
Project management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.user import User
from app.services.file_manager import FileManager
from app.services.colmap_pipeline import COLMAPPipeline

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: ProjectStatus
    total_frames: int
    processed_frames: int
    reconstruction_quality: float
    processing_time: float
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new 3D reconstruction project.
    
    Args:
        project_data: Project creation data
        db: Database session
    
    Returns:
        Created project information
    """
    try:
        # Create project in database
        project = Project(
            name=project_data.name,
            description=project_data.description,
            owner_id=1  # TODO: Get from authentication
        )
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # Create project directories
        file_manager = FileManager()
        file_manager.create_project_directories(project.id)
        
        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            status=project.status,
            total_frames=project.total_frames,
            processed_frames=project.processed_frames,
            reconstruction_quality=project.reconstruction_quality,
            processing_time=project.processing_time,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all projects for the current user.
    
    Args:
        skip: Number of projects to skip
        limit: Maximum number of projects to return
        db: Database session
    
    Returns:
        List of projects
    """
    try:
        projects = db.query(Project).offset(skip).limit(limit).all()
        
        return [
            ProjectResponse(
                id=project.id,
                name=project.name,
                description=project.description,
                status=project.status,
                total_frames=project.total_frames,
                processed_frames=project.processed_frames,
                reconstruction_quality=project.reconstruction_quality,
                processing_time=project.processing_time,
                created_at=project.created_at.isoformat(),
                updated_at=project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
            )
            for project in projects
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}"
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific project by ID.
    
    Args:
        project_id: Project ID
        db: Database session
    
    Returns:
        Project information
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        total_frames=project.total_frames,
        processed_frames=project.processed_frames,
        reconstruction_quality=project.reconstruction_quality,
        processing_time=project.processing_time,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a project.
    
    Args:
        project_id: Project ID
        project_data: Project update data
        db: Database session
    
    Returns:
        Updated project information
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    try:
        # Update project fields
        if project_data.name is not None:
            project.name = project_data.name
        if project_data.description is not None:
            project.description = project_data.description
        if project_data.status is not None:
            project.status = project_data.status
        
        db.commit()
        db.refresh(project)
        
        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            status=project.status,
            total_frames=project.total_frames,
            processed_frames=project.processed_frames,
            reconstruction_quality=project.reconstruction_quality,
            processing_time=project.processing_time,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a project and all associated files.
    
    Args:
        project_id: Project ID
        db: Database session
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    try:
        # Clean up project files
        file_manager = FileManager()
        file_manager.cleanup_project_files(project_id)
        
        # Delete project from database
        db.delete(project)
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )


@router.post("/{project_id}/start-reconstruction")
async def start_reconstruction(
    project_id: int,
    quality: str = "medium",
    db: Session = Depends(get_db)
):
    """
    Start 3D reconstruction for a project.
    
    Args:
        project_id: Project ID
        quality: Reconstruction quality (low, medium, high, extreme)
        db: Database session
    
    Returns:
        Reconstruction job information
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if not project.frames_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No frames available for reconstruction"
        )
    
    try:
        # Update project status
        project.status = ProjectStatus.PROCESSING
        db.commit()
        
        # Initialize COLMAP pipeline
        colmap_pipeline = COLMAPPipeline()
        
        # Set quality
        colmap_pipeline.quality = quality
        
        # Start reconstruction (this would typically be done asynchronously with Celery)
        from pathlib import Path
        output_dir = Path(f"/app/output/project_{project_id}")
        
        # TODO: This should be run as a background task
        # results = await colmap_pipeline.run_full_pipeline(
        #     project_id, Path(project.frames_path), output_dir
        # )
        
        return {
            "message": "Reconstruction started",
            "project_id": project_id,
            "quality": quality,
            "status": "processing"
        }
        
    except Exception as e:
        project.status = ProjectStatus.FAILED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start reconstruction: {str(e)}"
        )


@router.get("/{project_id}/status")
async def get_project_status(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the current status of a project's reconstruction.
    
    Args:
        project_id: Project ID
        db: Database session
    
    Returns:
        Project status information
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return {
        "project_id": project_id,
        "status": project.status,
        "progress": {
            "total_frames": project.total_frames,
            "processed_frames": project.processed_frames,
            "percentage": (project.processed_frames / project.total_frames * 100) if project.total_frames > 0 else 0
        },
        "quality": project.reconstruction_quality,
        "processing_time": project.processing_time,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat() if project.updated_at else project.created_at.isoformat()
    }



