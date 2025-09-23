"""
Celery tasks for video processing
"""

from celery import current_task
from app.celery_app import celery_app
from app.services.video_processor import VideoProcessor
from app.services.file_manager import FileManager
from app.models.job import JobType, JobStatus
from app.core.database import SessionLocal
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="extract_frames_task")
def extract_frames_task(self, project_id: int, video_path: str, interval: float = 1.0):
    """
    Extract frames from video file.
    
    Args:
        project_id: Project ID
        video_path: Path to video file
        interval: Frame extraction interval in seconds
    
    Returns:
        Path to extracted frames directory
    """
    try:
        # Update task status
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Starting frame extraction..."}
        )
        
        # Initialize services
        video_processor = VideoProcessor()
        file_manager = FileManager()
        
        # Create project directories
        file_manager.create_project_directories(project_id)
        
        # Extract frames
        frames_path = video_processor.extract_frames(
            video_path=video_path,
            project_id=project_id,
            interval=interval
        )
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 50, "total": 100, "status": "Frames extracted, preprocessing..."}
        )
        
        # Preprocess frames
        processed_frames_path = video_processor.preprocess_frames(
            frames_dir=frames_path,
            project_id=project_id,
            enhance_quality=True
        )
        
        # Update database
        db = SessionLocal()
        try:
            from app.models.project import Project
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.frames_path = str(processed_frames_path)
                project.total_frames = len(list(Path(processed_frames_path).glob("*.jpg")))
                db.commit()
        finally:
            db.close()
        
        # Complete task
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Frame extraction completed"}
        )
        
        return {
            "frames_path": str(processed_frames_path),
            "total_frames": project.total_frames if project else 0
        }
        
    except Exception as e:
        logger.error(f"Frame extraction failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="convert_360_frames_task")
def convert_360_frames_task(self, project_id: int, frames_path: str):
    """
    Convert 360° frames to perspective views.
    
    Args:
        project_id: Project ID
        frames_path: Path to 360° frames
    
    Returns:
        Path to perspective frames directory
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Converting 360° frames..."}
        )
        
        video_processor = VideoProcessor()
        
        perspective_frames_path = video_processor.convert_360_to_perspective(
            frames_dir=Path(frames_path),
            project_id=project_id,
            output_resolution=(1920, 1080)
        )
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "360° conversion completed"}
        )
        
        return {"perspective_frames_path": str(perspective_frames_path)}
        
    except Exception as e:
        logger.error(f"360° conversion failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise


@celery_app.task(bind=True, name="validate_video_task")
def validate_video_task(self, video_path: str):
    """
    Validate video file for processing.
    
    Args:
        video_path: Path to video file
    
    Returns:
        Validation results
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Validating video..."}
        )
        
        import ffmpeg
        
        # Get video information
        probe = ffmpeg.probe(video_path)
        video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        
        duration = float(probe['format']['duration'])
        width = int(video_info['width'])
        height = int(video_info['height'])
        fps = eval(video_info['r_frame_rate'])
        
        # Validate video quality
        validation_results = {
            "duration": duration,
            "resolution": f"{width}x{height}",
            "fps": fps,
            "is_valid": True,
            "recommendations": []
        }
        
        # Add recommendations based on video properties
        if duration < 10:
            validation_results["recommendations"].append("Video is very short, consider longer capture")
        
        if width < 1280 or height < 720:
            validation_results["recommendations"].append("Low resolution, higher resolution recommended")
        
        if fps < 24:
            validation_results["recommendations"].append("Low frame rate, consider higher FPS")
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Video validation completed"}
        )
        
        return validation_results
        
    except Exception as e:
        logger.error(f"Video validation failed: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise




