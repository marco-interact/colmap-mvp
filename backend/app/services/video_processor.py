"""
Video processing service for frame extraction and preprocessing
"""

import os
import asyncio
import ffmpeg
from pathlib import Path
from typing import Optional, List
import cv2
import numpy as np
from PIL import Image
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class VideoProcessor:
    """Service for processing video files and extracting frames."""
    
    def __init__(self):
        self.temp_dir = Path(settings.TEMP_DIR)
        self.output_dir = Path(settings.OUTPUT_DIR)
        self.frame_interval = settings.FRAME_EXTRACTION_INTERVAL
    
    async def extract_frames(
        self,
        video_path: str,
        project_id: int,
        interval: float = 1.0,
        max_resolution: int = 1920
    ) -> Path:
        """
        Extract frames from video at specified intervals.
        
        Args:
            video_path: Path to the input video file
            project_id: Project ID for organizing output
            interval: Frame extraction interval in seconds
            max_resolution: Maximum frame resolution (width)
        
        Returns:
            Path to the directory containing extracted frames
        """
        try:
            # Create output directory
            frames_dir = self.output_dir / f"project_{project_id}" / "frames"
            frames_dir.mkdir(parents=True, exist_ok=True)
            
            # Get video information
            probe = ffmpeg.probe(video_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            duration = float(probe['format']['duration'])
            fps = eval(video_info['r_frame_rate'])
            
            logger.info(f"Video duration: {duration}s, FPS: {fps}")
            
            # Calculate frame extraction times
            frame_times = []
            current_time = 0.0
            while current_time < duration:
                frame_times.append(current_time)
                current_time += interval
            
            # Extract frames using ffmpeg
            frame_count = 0
            for i, time in enumerate(frame_times):
                output_path = frames_dir / f"frame_{i:06d}.jpg"
                
                # Use ffmpeg to extract frame at specific time
                (
                    ffmpeg
                    .input(video_path, ss=time)
                    .filter('scale', max_resolution, -1)
                    .output(str(output_path), vframes=1, q=2)
                    .overwrite_output()
                    .run(quiet=True)
                )
                
                frame_count += 1
                
                # Log progress every 10 frames
                if frame_count % 10 == 0:
                    logger.info(f"Extracted {frame_count} frames...")
            
            logger.info(f"Frame extraction completed. Total frames: {frame_count}")
            return frames_dir
            
        except Exception as e:
            logger.error(f"Frame extraction failed: {str(e)}")
            raise
    
    async def preprocess_frames(
        self,
        frames_dir: Path,
        project_id: int,
        enhance_quality: bool = True
    ) -> Path:
        """
        Preprocess extracted frames for better COLMAP reconstruction.
        
        Args:
            frames_dir: Directory containing extracted frames
            project_id: Project ID
            enhance_quality: Whether to apply quality enhancement
        
        Returns:
            Path to the preprocessed frames directory
        """
        try:
            # Create preprocessed frames directory
            processed_dir = self.output_dir / f"project_{project_id}" / "processed_frames"
            processed_dir.mkdir(parents=True, exist_ok=True)
            
            frame_files = sorted(frames_dir.glob("*.jpg"))
            
            for i, frame_path in enumerate(frame_files):
                # Load image
                image = cv2.imread(str(frame_path))
                
                if enhance_quality:
                    # Apply image enhancement
                    image = self._enhance_image(image)
                
                # Save processed frame
                output_path = processed_dir / f"frame_{i:06d}.jpg"
                cv2.imwrite(str(output_path), image, [cv2.IMWRITE_JPEG_QUALITY, 95])
                
                # Log progress
                if (i + 1) % 10 == 0:
                    logger.info(f"Processed {i + 1}/{len(frame_files)} frames...")
            
            logger.info(f"Frame preprocessing completed. Processed {len(frame_files)} frames.")
            return processed_dir
            
        except Exception as e:
            logger.error(f"Frame preprocessing failed: {str(e)}")
            raise
    
    def _enhance_image(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance image quality for better feature detection.
        
        Args:
            image: Input image as numpy array
        
        Returns:
            Enhanced image
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge channels and convert back to BGR
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # Apply slight sharpening
        kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        
        # Blend original and sharpened image
        result = cv2.addWeighted(enhanced, 0.7, sharpened, 0.3, 0)
        
        return result
    
    async def convert_360_to_perspective(
        self,
        frames_dir: Path,
        project_id: int,
        output_resolution: tuple = (1920, 1080)
    ) -> Path:
        """
        Convert 360° frames to perspective views for COLMAP processing.
        
        Args:
            frames_dir: Directory containing 360° frames
            project_id: Project ID
            output_resolution: Output resolution (width, height)
        
        Returns:
            Path to the perspective frames directory
        """
        try:
            # Create perspective frames directory
            perspective_dir = self.output_dir / f"project_{project_id}" / "perspective_frames"
            perspective_dir.mkdir(parents=True, exist_ok=True)
            
            frame_files = sorted(frames_dir.glob("*.jpg"))
            
            for i, frame_path in enumerate(frame_files):
                # Load 360° image
                image = cv2.imread(str(frame_path))
                height, width = image.shape[:2]
                
                # Extract multiple perspective views
                views = self._extract_perspective_views(image, output_resolution)
                
                # Save each perspective view
                for j, view in enumerate(views):
                    output_path = perspective_dir / f"frame_{i:06d}_view_{j}.jpg"
                    cv2.imwrite(str(output_path), view, [cv2.IMWRITE_JPEG_QUALITY, 95])
                
                # Log progress
                if (i + 1) % 10 == 0:
                    logger.info(f"Converted {i + 1}/{len(frame_files)} frames to perspective views...")
            
            logger.info(f"360° to perspective conversion completed.")
            return perspective_dir
            
        except Exception as e:
            logger.error(f"360° to perspective conversion failed: {str(e)}")
            raise
    
    def _extract_perspective_views(
        self,
        equirectangular_image: np.ndarray,
        output_resolution: tuple
    ) -> List[np.ndarray]:
        """
        Extract multiple perspective views from an equirectangular 360° image.
        
        Args:
            equirectangular_image: 360° image in equirectangular projection
            output_resolution: Desired output resolution (width, height)
        
        Returns:
            List of perspective view images
        """
        views = []
        height, width = equirectangular_image.shape[:2]
        
        # Define viewing angles (azimuth, elevation)
        view_angles = [
            (0, 0),      # Front
            (90, 0),     # Right
            (180, 0),    # Back
            (270, 0),    # Left
            (0, 30),     # Front-up
            (0, -30),    # Front-down
        ]
        
        for azimuth, elevation in view_angles:
            # Convert angles to radians
            az_rad = np.radians(azimuth)
            el_rad = np.radians(elevation)
            
            # Create perspective view
            view = self._equirectangular_to_perspective(
                equirectangular_image,
                az_rad,
                el_rad,
                output_resolution
            )
            views.append(view)
        
        return views
    
    def _equirectangular_to_perspective(
        self,
        equirectangular_image: np.ndarray,
        azimuth: float,
        elevation: float,
        output_resolution: tuple
    ) -> np.ndarray:
        """
        Convert equirectangular 360° image to perspective view.
        
        Args:
            equirectangular_image: Input 360° image
            azimuth: Azimuth angle in radians
            elevation: Elevation angle in radians
            output_resolution: Output resolution (width, height)
        
        Returns:
            Perspective view image
        """
        height, width = equirectangular_image.shape[:2]
        out_width, out_height = output_resolution
        
        # Create output image
        perspective = np.zeros((out_height, out_width, 3), dtype=np.uint8)
        
        # Field of view (in radians)
        fov = np.radians(90)
        
        # Calculate pixel mapping
        for y in range(out_height):
            for x in range(out_width):
                # Convert pixel coordinates to normalized coordinates
                x_norm = (x - out_width / 2) / (out_width / 2)
                y_norm = (y - out_height / 2) / (out_height / 2)
                
                # Calculate ray direction
                ray_az = azimuth + np.arctan(x_norm * np.tan(fov / 2))
                ray_el = elevation + np.arctan(y_norm * np.tan(fov / 2))
                
                # Convert to equirectangular coordinates
                equi_x = int((ray_az + np.pi) / (2 * np.pi) * width) % width
                equi_y = int((np.pi / 2 - ray_el) / np.pi * height)
                
                # Clamp y coordinate
                equi_y = max(0, min(height - 1, equi_y))
                
                # Sample pixel
                perspective[y, x] = equirectangular_image[equi_y, equi_x]
        
        return perspective



