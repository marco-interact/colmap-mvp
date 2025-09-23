"""
File management service for handling uploads and file operations
"""

import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
import aiofiles
from fastapi import UploadFile
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class FileManager:
    """Service for managing file uploads and operations."""
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.output_dir = Path(settings.OUTPUT_DIR)
        self.temp_dir = Path(settings.TEMP_DIR)
        self.max_file_size = settings.MAX_FILE_SIZE
    
    async def save_uploaded_file(
        self,
        file: UploadFile,
        project_id: int,
        file_type: str
    ) -> Path:
        """
        Save uploaded file to the appropriate directory.
        
        Args:
            file: Uploaded file object
            project_id: Project ID for organization
            file_type: Type of file (videos, images, etc.)
        
        Returns:
            Path to the saved file
        """
        try:
            # Create project directory
            project_dir = self.upload_dir / f"project_{project_id}" / file_type
            project_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            file_extension = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = project_dir / unique_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            logger.info(f"File saved: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to save file: {str(e)}")
            raise
    
    def create_project_directories(self, project_id: int) -> dict:
        """
        Create directory structure for a new project.
        
        Args:
            project_id: Project ID
        
        Returns:
            Dictionary with created directory paths
        """
        try:
            base_dir = self.output_dir / f"project_{project_id}"
            
            directories = {
                "base": base_dir,
                "frames": base_dir / "frames",
                "processed_frames": base_dir / "processed_frames",
                "perspective_frames": base_dir / "perspective_frames",
                "colmap_workspace": base_dir / "colmap_workspace",
                "sparse": base_dir / "colmap_workspace" / "sparse",
                "dense": base_dir / "colmap_workspace" / "dense",
                "meshes": base_dir / "meshes",
                "textures": base_dir / "textures",
                "exports": base_dir / "exports"
            }
            
            # Create all directories
            for dir_path in directories.values():
                dir_path.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Created project directories for project {project_id}")
            return directories
            
        except Exception as e:
            logger.error(f"Failed to create project directories: {str(e)}")
            raise
    
    def cleanup_project_files(self, project_id: int) -> bool:
        """
        Clean up all files associated with a project.
        
        Args:
            project_id: Project ID
        
        Returns:
            True if cleanup successful
        """
        try:
            # Remove upload directory
            upload_project_dir = self.upload_dir / f"project_{project_id}"
            if upload_project_dir.exists():
                shutil.rmtree(upload_project_dir)
            
            # Remove output directory
            output_project_dir = self.output_dir / f"project_{project_id}"
            if output_project_dir.exists():
                shutil.rmtree(output_project_dir)
            
            # Remove temp directory
            temp_project_dir = self.temp_dir / f"project_{project_id}"
            if temp_project_dir.exists():
                shutil.rmtree(temp_project_dir)
            
            logger.info(f"Cleaned up files for project {project_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cleanup project files: {str(e)}")
            return False
    
    def get_file_size(self, file_path: Path) -> int:
        """
        Get file size in bytes.
        
        Args:
            file_path: Path to the file
        
        Returns:
            File size in bytes
        """
        try:
            return file_path.stat().st_size
        except Exception:
            return 0
    
    def validate_file_format(self, filename: str, allowed_formats: list) -> bool:
        """
        Validate file format against allowed formats.
        
        Args:
            filename: Name of the file
            allowed_formats: List of allowed file extensions
        
        Returns:
            True if format is allowed
        """
        file_extension = Path(filename).suffix.lower().lstrip('.')
        return file_extension in allowed_formats
    
    def get_available_space(self) -> int:
        """
        Get available disk space in bytes.
        
        Returns:
            Available space in bytes
        """
        try:
            stat = shutil.disk_usage(self.output_dir)
            return stat.free
        except Exception:
            return 0
    
    def archive_project(self, project_id: int, archive_path: Optional[Path] = None) -> Path:
        """
        Create archive of project files.
        
        Args:
            project_id: Project ID
            archive_path: Optional custom archive path
        
        Returns:
            Path to the created archive
        """
        try:
            if archive_path is None:
                archive_path = self.output_dir / f"project_{project_id}_archive.zip"
            
            project_dir = self.output_dir / f"project_{project_id}"
            
            if not project_dir.exists():
                raise FileNotFoundError(f"Project directory not found: {project_dir}")
            
            # Create archive
            shutil.make_archive(
                str(archive_path.with_suffix('')),
                'zip',
                str(project_dir)
            )
            
            logger.info(f"Created project archive: {archive_path}")
            return archive_path
            
        except Exception as e:
            logger.error(f"Failed to create project archive: {str(e)}")
            raise



