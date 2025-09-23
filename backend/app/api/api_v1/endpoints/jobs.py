"""
Processing job management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.job import ProcessingJob, JobType, JobStatus

router = APIRouter()


class JobResponse(BaseModel):
    id: int
    job_type: JobType
    status: JobStatus
    progress: float
    error_message: Optional[str]
    parameters: Optional[dict]
    started_at: Optional[str]
    completed_at: Optional[str]
    duration: Optional[float]
    cpu_usage: Optional[float]
    memory_usage: Optional[float]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[JobResponse])
async def list_jobs(
    project_id: Optional[int] = None,
    status: Optional[JobStatus] = None,
    job_type: Optional[JobType] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List processing jobs with optional filtering.
    
    Args:
        project_id: Filter by project ID
        status: Filter by job status
        job_type: Filter by job type
        skip: Number of jobs to skip
        limit: Maximum number of jobs to return
        db: Database session
    
    Returns:
        List of processing jobs
    """
    try:
        query = db.query(ProcessingJob)
        
        if project_id:
            query = query.filter(ProcessingJob.project_id == project_id)
        if status:
            query = query.filter(ProcessingJob.status == status)
        if job_type:
            query = query.filter(ProcessingJob.job_type == job_type)
        
        jobs = query.offset(skip).limit(limit).all()
        
        return [
            JobResponse(
                id=job.id,
                job_type=job.job_type,
                status=job.status,
                progress=job.progress,
                error_message=job.error_message,
                parameters=job.parameters,
                started_at=job.started_at.isoformat() if job.started_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
                duration=job.duration,
                cpu_usage=job.cpu_usage,
                memory_usage=job.memory_usage,
                created_at=job.created_at.isoformat(),
                updated_at=job.updated_at.isoformat() if job.updated_at else job.created_at.isoformat()
            )
            for job in jobs
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list jobs: {str(e)}"
        )


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific processing job by ID.
    
    Args:
        job_id: Job ID
        db: Database session
    
    Returns:
        Job information
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return JobResponse(
        id=job.id,
        job_type=job.job_type,
        status=job.status,
        progress=job.progress,
        error_message=job.error_message,
        parameters=job.parameters,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        duration=job.duration,
        cpu_usage=job.cpu_usage,
        memory_usage=job.memory_usage,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat() if job.updated_at else job.created_at.isoformat()
    )


@router.post("/{job_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_job(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Cancel a running processing job.
    
    Args:
        job_id: Job ID
        db: Database session
    
    Returns:
        Cancellation result
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.status not in [JobStatus.PENDING, JobStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job cannot be cancelled in its current status"
        )
    
    try:
        job.status = JobStatus.CANCELLED
        db.commit()
        
        # TODO: Implement actual job cancellation logic
        # This would involve stopping the Celery task
        
        return {
            "message": "Job cancelled successfully",
            "job_id": job_id,
            "status": job.status
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel job: {str(e)}"
        )


@router.get("/{job_id}/logs")
async def get_job_logs(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get logs for a processing job.
    
    Args:
        job_id: Job ID
        db: Database session
    
    Returns:
        Job logs
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # TODO: Implement actual log retrieval
    # This would involve reading from log files or a logging service
    
    return {
        "job_id": job_id,
        "logs": [
            f"Job {job.job_type} started at {job.started_at}",
            f"Status: {job.status}",
            f"Progress: {job.progress * 100:.1f}%"
        ],
        "error_message": job.error_message
    }


@router.get("/project/{project_id}/status")
async def get_project_jobs_status(
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the status of all jobs for a specific project.
    
    Args:
        project_id: Project ID
        db: Database session
    
    Returns:
        Project jobs status summary
    """
    try:
        jobs = db.query(ProcessingJob).filter(ProcessingJob.project_id == project_id).all()
        
        status_summary = {
            "total_jobs": len(jobs),
            "by_status": {},
            "by_type": {},
            "overall_progress": 0.0
        }
        
        total_progress = 0.0
        
        for job in jobs:
            # Count by status
            status_summary["by_status"][job.status] = status_summary["by_status"].get(job.status, 0) + 1
            
            # Count by type
            status_summary["by_type"][job.job_type] = status_summary["by_type"].get(job.job_type, 0) + 1
            
            # Calculate overall progress
            total_progress += job.progress
        
        if jobs:
            status_summary["overall_progress"] = total_progress / len(jobs)
        
        return status_summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project jobs status: {str(e)}"
        )



