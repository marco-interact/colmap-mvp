#!/usr/bin/env python3
"""
COLMAP Processing Pipeline
Implements video -> 3D point cloud reconstruction
Based on: https://colmap.github.io/tutorial.html
"""

import subprocess
import os
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple
import shutil

logger = logging.getLogger(__name__)


class COLMAPProcessor:
    """COLMAP 3D Reconstruction Processor"""
    
    def __init__(self, job_path: str):
        self.job_path = Path(job_path)
        self.images_path = self.job_path / "images"
        self.database_path = self.job_path / "database.db"
        self.sparse_path = self.job_path / "sparse"
        self.dense_path = self.job_path / "dense"
        self.exports_path = self.job_path / "exports"
        
        # Create directories
        self._create_directories()
    
    def _create_directories(self):
        """Create required directory structure"""
        self.images_path.mkdir(parents=True, exist_ok=True)
        self.sparse_path.mkdir(parents=True, exist_ok=True)
        self.dense_path.mkdir(parents=True, exist_ok=True)
        self.exports_path.mkdir(parents=True, exist_ok=True)
    
    def extract_frames(self, video_path: str, max_frames: int = 50, frame_interval: int = 2) -> int:
        """
        Extract frames from video using ffmpeg
        Based on: https://colmap.github.io/tutorial.html#data-structure
        """
        logger.info(f"Extracting frames from {video_path}")
        
        # Calculate frame rate based on desired frame count
        cmd = [
            "ffmpeg", "-i", video_path,
            "-vf", f"fps=1/{frame_interval},scale=1920:-2",
            "-frames:v", str(max_frames),
            "-q:v", "2",  # High quality JPEG
            str(self.images_path / "frame_%06d.jpg")
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Count extracted frames
            frame_count = len(list(self.images_path.glob("*.jpg")))
            logger.info(f"Extracted {frame_count} frames")
            return frame_count
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Frame extraction failed: {e.stderr}")
            raise
    
    def extract_features(self, quality: str = "medium", use_gpu: bool = True) -> Dict:
        """
        Extract SIFT features from images
        Reference: https://colmap.github.io/tutorial.html#feature-detection-and-extraction
        """
        logger.info(f"Extracting features with quality={quality}")
        
        # Quality-based parameters
        quality_params = {
            "low": {
                "max_num_features": "16384",
                "max_image_size": "2048"
            },
            "medium": {
                "max_num_features": "32768",
                "max_image_size": "4096"
            },
            "high": {
                "max_num_features": "65536",
                "max_image_size": "8192"
            }
        }
        
        params = quality_params.get(quality, quality_params["medium"])
        
        cmd = [
            "colmap", "feature_extractor",
            "--database_path", str(self.database_path),
            "--image_path", str(self.images_path),
            "--SiftExtraction.use_gpu", "1" if use_gpu else "0",
            "--SiftExtraction.domain_size_pooling", "1",
            "--SiftExtraction.estimate_affine_shape", "1",
            "--SiftExtraction.max_num_features", params["max_num_features"],
            "--SiftExtraction.max_image_size", params["max_image_size"],
            "--ImageReader.single_camera", "1",  # Video sequences
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Parse statistics
            stats = self._parse_feature_stats(result.stdout)
            logger.info(f"Feature extraction complete: {stats}")
            return stats
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Feature extraction failed: {e.stderr}")
            raise
    
    def match_features(self, matching_type: str = "sequential", use_gpu: bool = True) -> Dict:
        """
        Match features between images
        Reference: https://colmap.github.io/tutorial.html#feature-matching-and-geometric-verification
        """
        logger.info(f"Matching features with {matching_type} matcher")
        
        if matching_type == "sequential":
            # Best for video sequences
            cmd = [
                "colmap", "sequential_matcher",
                "--database_path", str(self.database_path),
                "--SequentialMatching.overlap", "10",
                "--SiftMatching.use_gpu", "1" if use_gpu else "0",
                "--SiftMatching.guided_matching", "1",
                "--SiftMatching.cross_check", "1",
            ]
        else:  # exhaustive
            cmd = [
                "colmap", "exhaustive_matcher",
                "--database_path", str(self.database_path),
                "--SiftMatching.use_gpu", "1" if use_gpu else "0",
                "--SiftMatching.guided_matching", "1",
                "--SiftMatching.cross_check", "1",
            ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Parse match statistics
            stats = self._parse_match_stats(result.stdout)
            logger.info(f"Feature matching complete: {stats}")
            return stats
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Feature matching failed: {e.stderr}")
            raise
    
    def sparse_reconstruction(self) -> Dict:
        """
        Incremental Structure-from-Motion reconstruction
        Reference: https://colmap.github.io/tutorial.html#sparse-reconstruction
        """
        logger.info("Starting sparse reconstruction")
        
        cmd = [
            "colmap", "mapper",
            "--database_path", str(self.database_path),
            "--image_path", str(self.images_path),
            "--output_path", str(self.sparse_path),
            "--Mapper.num_threads", "8",
            "--Mapper.init_min_num_inliers", "100",
            "--Mapper.extract_colors", "1",
            "--Mapper.ba_refine_focal_length", "1",
            "--Mapper.ba_refine_extra_params", "1",
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Find best model
            best_model, stats = self._find_best_model()
            logger.info(f"Sparse reconstruction complete: {stats}")
            return {
                "model_path": str(best_model),
                "stats": stats
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Sparse reconstruction failed: {e.stderr}")
            raise
    
    def export_point_cloud(self, output_format: str = "PLY") -> str:
        """
        Export reconstruction to point cloud format
        Reference: https://colmap.github.io/tutorial.html#importing-and-exporting
        """
        # Find best sparse model
        best_model, _ = self._find_best_model()
        
        if not best_model:
            raise ValueError("No reconstruction found to export")
        
        output_file = self.exports_path / f"point_cloud.{output_format.lower()}"
        
        cmd = [
            "colmap", "model_converter",
            "--input_path", str(best_model),
            "--output_path", str(output_file),
            "--output_type", output_format,
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(f"Exported point cloud to {output_file}")
            return str(output_file)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Export failed: {e.stderr}")
            raise
    
    def _find_best_model(self) -> Tuple[Optional[Path], Dict]:
        """Find the best sparse reconstruction model"""
        sparse_dirs = sorted(self.sparse_path.glob("[0-9]*"))
        
        if not sparse_dirs:
            return None, {}
        
        best_model = sparse_dirs[0]  # Default to first
        best_points = 0
        
        for sparse_dir in sparse_dirs:
            points3d_file = sparse_dir / "points3D.bin"
            if points3d_file.exists():
                # Count points (approximate by file size)
                point_count = points3d_file.stat().st_size // 48  # ~48 bytes per point
                if point_count > best_points:
                    best_points = point_count
                    best_model = sparse_dir
        
        stats = {
            "num_models": len(sparse_dirs),
            "points_3d": best_points,
            "model_id": best_model.name
        }
        
        return best_model, stats
    
    def _parse_feature_stats(self, output: str) -> Dict:
        """Parse feature extraction statistics from output"""
        stats = {}
        
        # Simple parsing - can be enhanced
        if "Extracted features from" in output:
            stats["status"] = "success"
        else:
            stats["status"] = "unknown"
        
        return stats
    
    def _parse_match_stats(self, output: str) -> Dict:
        """Parse feature matching statistics from output"""
        stats = {}
        
        # Simple parsing - can be enhanced
        if "Matched image pairs" in output:
            stats["status"] = "success"
        else:
            stats["status"] = "unknown"
        
        return stats


def process_video_to_pointcloud(
    job_id: str,
    video_path: str,
    quality: str = "medium",
    max_frames: int = 50
) -> Dict:
    """
    Complete pipeline: Video -> 3D Point Cloud
    """
    job_path = f"/workspace/{job_id}"
    processor = COLMAPProcessor(job_path)
    
    # Step 1: Extract frames
    frame_count = processor.extract_frames(video_path, max_frames=max_frames)
    
    # Step 2: Extract features
    feature_stats = processor.extract_features(quality=quality, use_gpu=True)
    
    # Step 3: Match features
    match_stats = processor.match_features(matching_type="sequential", use_gpu=True)
    
    # Step 4: Sparse reconstruction
    recon_result = processor.sparse_reconstruction()
    
    # Step 5: Export point cloud
    ply_file = processor.export_point_cloud(output_format="PLY")
    
    return {
        "job_id": job_id,
        "frame_count": frame_count,
        "feature_stats": feature_stats,
        "match_stats": match_stats,
        "reconstruction": recon_result,
        "output_file": ply_file
    }

