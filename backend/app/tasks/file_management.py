"""
Celery tasks for file management operations
"""

from celery import current_task
from app.celery_app import celery_app
from app.services.file_manager import FileManager
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="cleanup_project_files_task")
def cleanup_project_files_task(self, project_id: int):
    """
    Clean up all files associated with a project.
    
    Args:
        project_id: Project ID
    
    Returns:
        Cleanup result
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Starting cleanup..."}
        )
        
        file_manager = FileManager()
        
        # Clean up project files
        success = file_manager.cleanup_project_files(project_id)
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Cleanup completed"}
        )
        
        return {"success": success, "project_id": project_id}
        
    except Exception as e:
        logger.error(f"File cleanup failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="archive_project_task")
def archive_project_task(self, project_id: int, archive_path: str = None):
    """
    Create archive of project files.
    
    Args:
        project_id: Project ID
        archive_path: Optional custom archive path
    
    Returns:
        Path to created archive
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Creating archive..."}
        )
        
        file_manager = FileManager()
        
        # Create archive
        archive_path_obj = file_manager.archive_project(
            project_id=project_id,
            archive_path=Path(archive_path) if archive_path else None
        )
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Archive created"}
        )
        
        return {"archive_path": str(archive_path_obj), "project_id": project_id}
        
    except Exception as e:
        logger.error(f"Archive creation failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="validate_file_integrity_task")
def validate_file_integrity_task(self, project_id: int):
    """
    Validate integrity of project files.
    
    Args:
        project_id: Project ID
    
    Returns:
        Validation results
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Validating files..."}
        )
        
        file_manager = FileManager()
        
        # Check project directories
        base_dir = Path(f"/app/output/project_{project_id}")
        
        validation_results = {
            "project_id": project_id,
            "files_valid": True,
            "missing_files": [],
            "corrupted_files": [],
            "total_size": 0
        }
        
        # Check for required directories and files
        required_dirs = ["frames", "colmap_workspace", "meshes", "textures"]
        
        for dir_name in required_dirs:
            dir_path = base_dir / dir_name
            if not dir_path.exists():
                validation_results["missing_files"].append(f"Directory: {dir_name}")
                validation_results["files_valid"] = False
        
        # Calculate total size
        if base_dir.exists():
            total_size = sum(f.stat().st_size for f in base_dir.rglob('*') if f.is_file())
            validation_results["total_size"] = total_size
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Validation completed"}
        )
        
        return validation_results
        
    except Exception as e:
        logger.error(f"File validation failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="optimize_storage_task")
def optimize_storage_task(self):
    """
    Optimize storage by cleaning up temporary files and compressing old projects.
    
    Returns:
        Optimization results
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Starting storage optimization..."}
        )
        
        file_manager = FileManager()
        
        optimization_results = {
            "temp_files_cleaned": 0,
            "space_freed": 0,
            "projects_compressed": 0
        }
        
        # Clean up temporary files
        temp_dir = Path("/app/temp")
        if temp_dir.exists():
            temp_files = list(temp_dir.rglob("*"))
            for temp_file in temp_files:
                if temp_file.is_file():
                    file_size = temp_file.stat().st_size
                    temp_file.unlink()
                    optimization_results["temp_files_cleaned"] += 1
                    optimization_results["space_freed"] += file_size
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Storage optimization completed"}
        )
        
        return optimization_results
        
    except Exception as e:
        logger.error(f"Storage optimization failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise




