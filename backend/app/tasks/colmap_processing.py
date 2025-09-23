"""
Celery tasks for COLMAP 3D reconstruction processing
"""

from celery import current_task
from app.celery_app import celery_app
from app.services.colmap_pipeline import COLMAPPipeline
from app.models.job import JobType, JobStatus
from app.core.database import SessionLocal
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="run_colmap_pipeline_task")
def run_colmap_pipeline_task(self, project_id: int, frames_path: str, quality: str = "medium"):
    """
    Run the complete COLMAP reconstruction pipeline.
    
    Args:
        project_id: Project ID
        frames_path: Path to input frames
        quality: Reconstruction quality (low, medium, high, extreme)
    
    Returns:
        Dictionary with paths to generated files
    """
    try:
        # Update task status
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Initializing COLMAP pipeline..."}
        )
        
        # Initialize COLMAP pipeline
        colmap_pipeline = COLMAPPipeline()
        colmap_pipeline.quality = quality
        
        # Set up output directory
        output_dir = Path(f"/app/output/project_{project_id}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Update database
        db = SessionLocal()
        try:
            from app.models.project import Project, ProjectStatus
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.status = ProjectStatus.PROCESSING
                db.commit()
        finally:
            db.close()
        
        # Step 1: Feature extraction (10% of total progress)
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 10, "total": 100, "status": "Extracting features..."}
        )
        
        # Run the full pipeline
        results = colmap_pipeline.run_full_pipeline(
            project_id=project_id,
            frames_path=Path(frames_path),
            output_dir=output_dir
        )
        
        # Update progress through pipeline steps
        pipeline_steps = [
            (20, "Feature extraction completed"),
            (30, "Feature matching completed"),
            (50, "Sparse reconstruction completed"),
            (70, "Dense reconstruction completed"),
            (85, "Mesh generation completed"),
            (95, "Texturing completed")
        ]
        
        for progress, status in pipeline_steps:
            current_task.update_state(
                state="PROGRESS",
                meta={"current": progress, "total": 100, "status": status}
            )
        
        # Update database with results
        db = SessionLocal()
        try:
            from app.models.project import Project, ProjectStatus
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.status = ProjectStatus.COMPLETED
                project.point_cloud_path = results.get("dense_model")
                project.mesh_path = results.get("mesh")
                project.textured_mesh_path = results.get("textured_mesh")
                project.reconstruction_quality = 0.95  # Placeholder quality score
                db.commit()
        finally:
            db.close()
        
        # Complete task
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "COLMAP pipeline completed successfully"}
        )
        
        return results
        
    except Exception as e:
        logger.error(f"COLMAP pipeline failed: {str(e)}")
        
        # Update database with failure
        db = SessionLocal()
        try:
            from app.models.project import Project, ProjectStatus
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.status = ProjectStatus.FAILED
                db.commit()
        finally:
            db.close()
        
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="feature_extraction_task")
def feature_extraction_task(self, project_id: int, frames_path: str, quality: str = "medium"):
    """
    Extract SIFT features from images.
    
    Args:
        project_id: Project ID
        frames_path: Path to input frames
        quality: Processing quality
    
    Returns:
        Path to database with extracted features
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Extracting SIFT features..."}
        )
        
        colmap_pipeline = COLMAPPipeline()
        colmap_pipeline.quality = quality
        
        # Set up workspace
        workspace = Path(f"/app/output/project_{project_id}/colmap_workspace")
        workspace.mkdir(parents=True, exist_ok=True)
        
        database_path = workspace / "database.db"
        
        # Extract features
        colmap_pipeline._extract_features(Path(frames_path), database_path)
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Feature extraction completed"}
        )
        
        return {"database_path": str(database_path)}
        
    except Exception as e:
        logger.error(f"Feature extraction failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="sparse_reconstruction_task")
def sparse_reconstruction_task(self, project_id: int, frames_path: str, database_path: str):
    """
    Perform sparse reconstruction.
    
    Args:
        project_id: Project ID
        frames_path: Path to input frames
        database_path: Path to feature database
    
    Returns:
        Path to sparse reconstruction model
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Performing sparse reconstruction..."}
        )
        
        colmap_pipeline = COLMAPPipeline()
        
        # Set up directories
        workspace = Path(f"/app/output/project_{project_id}/colmap_workspace")
        sparse_dir = workspace / "sparse"
        sparse_dir.mkdir(exist_ok=True)
        
        # Perform sparse reconstruction
        sparse_model_path = colmap_pipeline._sparse_reconstruction(
            Path(frames_path), Path(database_path), sparse_dir
        )
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Sparse reconstruction completed"}
        )
        
        return {"sparse_model_path": str(sparse_model_path)}
        
    except Exception as e:
        logger.error(f"Sparse reconstruction failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="dense_reconstruction_task")
def dense_reconstruction_task(self, project_id: int, frames_path: str, sparse_model_path: str):
    """
    Perform dense reconstruction.
    
    Args:
        project_id: Project ID
        frames_path: Path to input frames
        sparse_model_path: Path to sparse reconstruction model
    
    Returns:
        Path to dense point cloud
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Performing dense reconstruction..."}
        )
        
        colmap_pipeline = COLMAPPipeline()
        
        # Set up directories
        workspace = Path(f"/app/output/project_{project_id}/colmap_workspace")
        dense_dir = workspace / "dense"
        dense_dir.mkdir(exist_ok=True)
        
        # Perform dense reconstruction
        dense_model_path = colmap_pipeline._dense_reconstruction(
            Path(frames_path), Path(sparse_model_path), dense_dir
        )
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Dense reconstruction completed"}
        )
        
        return {"dense_model_path": str(dense_model_path)}
        
    except Exception as e:
        logger.error(f"Dense reconstruction failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="mesh_generation_task")
def mesh_generation_task(self, project_id: int, point_cloud_path: str):
    """
    Generate mesh from point cloud.
    
    Args:
        project_id: Project ID
        point_cloud_path: Path to point cloud file
    
    Returns:
        Path to generated mesh
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Generating mesh..."}
        )
        
        colmap_pipeline = COLMAPPipeline()
        
        # Set up output directory
        output_dir = Path(f"/app/output/project_{project_id}")
        
        # Generate mesh
        mesh_path = colmap_pipeline._generate_mesh(Path(point_cloud_path), output_dir)
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Mesh generation completed"}
        )
        
        return {"mesh_path": str(mesh_path)}
        
    except Exception as e:
        logger.error(f"Mesh generation failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise




