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
        """
        Initialize COLMAP processor with standard workspace structure
        Reference: https://colmap.github.io/tutorial.html#data-structure
        """
        self.job_path = Path(job_path)
        
        # Standard COLMAP workspace structure
        # Reference: https://colmap.github.io/tutorial.html#data-structure
        self.images_path = self.job_path / "images"        # Extracted frames
        self.database_path = self.job_path / "database.db" # SQLite database
        self.sparse_path = self.job_path / "sparse"        # Sparse models (0/, 1/, etc.)
        self.dense_path = self.job_path / "dense"          # Dense reconstruction
        
        # Create directories
        self._create_directories()
    
    def _create_directories(self):
        """
        Create COLMAP workspace directory structure
        Following: https://colmap.github.io/tutorial.html#data-structure
        """
        self.images_path.mkdir(parents=True, exist_ok=True)
        self.sparse_path.mkdir(parents=True, exist_ok=True)
        self.dense_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Created COLMAP workspace at {self.job_path}")
    
    def extract_frames(self, video_path: str, max_frames: int = 50, frame_interval: int = 2, quality: str = "medium") -> int:
        """
        Extract frames from video using ffmpeg
        
        Following COLMAP best practices:
        Reference: https://colmap.github.io/tutorial.html#data-structure
        
        Recommendations from tutorial:
        - Images identified by relative path (preserved in nested folders)
        - Preserve folder structure for later processing
        - Consider down-sampling frame rate for video input
        - Different viewpoints (not just camera rotation)
        """
        logger.info(f"Extracting frames from {video_path} (quality={quality})")
        
        # Quality-based scaling
        scale_map = {
            "low": "1280:-2",
            "medium": "1920:-2", 
            "high": "3840:-2"
        }
        scale = scale_map.get(quality, "1920:-2")
        
        # Extract frames with uniform naming (COLMAP requirement)
        # Format: %06d for frame numbering
        output_pattern = self.images_path / "frame_%06d.jpg"
        
        cmd = [
            "ffmpeg", "-i", video_path,
            "-vf", f"fps=1/{frame_interval},scale={scale}",
            "-frames:v", str(max_frames),
            "-q:v", "2",  # High quality JPEG (1-31, lower = better)
            "-y",  # Overwrite existing files
            str(output_pattern)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Count extracted frames
            frame_count = len(list(self.images_path.glob("*.jpg")))
            logger.info(f"Extracted {frame_count} frames to {self.images_path}")
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
            
            # SIFT Extraction Parameters
            # Reference: https://colmap.github.io/tutorial.html#feature-detection-and-extraction
            "--SiftExtraction.use_gpu", "1" if use_gpu else "0",
            "--SiftExtraction.domain_size_pooling", "1",  # Better feature distribution
            "--SiftExtraction.estimate_affine_shape", "1",  # Viewpoint invariance
            "--SiftExtraction.max_num_features", params["max_num_features"],
            "--SiftExtraction.max_image_size", params["max_image_size"],
            
            # Image Reader (for video sequences)
            "--ImageReader.single_camera", "1",  # All frames from same camera
            
            # Additional quality parameters
            "--SiftExtraction.first_octave", "-1",  # Start at full resolution
            "--SiftExtraction.num_octaves", "4",    # Multi-scale pyramid
            "--SiftExtraction.octave_resolution", "3",  # Scales per octave
            "--SiftExtraction.peak_threshold", "0.0067",  # Feature threshold
            "--SiftExtraction.edge_threshold", "10.0",    # Edge filter
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
    
    def match_features(self, matching_type: str = "sequential", use_gpu: bool = True, quality: str = "medium") -> Dict:
        """
        Match features between images with geometric verification
        
        Reference: https://colmap.github.io/tutorial.html#feature-matching-and-geometric-verification
        
        Matching strategies per COLMAP tutorial:
        - sequential_matcher: Best for video sequences (ordered frames)
        - exhaustive_matcher: Best for unordered images (all pairs)
        - spatial_matcher: Best for geotagged images
        
        Geometric verification is automatic via RANSAC and stored in two_view_geometries table.
        """
        logger.info(f"Matching features with {matching_type} matcher (quality={quality})")
        
        # Quality-based match limits
        quality_params = {
            "low": {"max_num_matches": "32768"},
            "medium": {"max_num_matches": "65536"},
            "high": {"max_num_matches": "131072"}
        }
        match_params = quality_params.get(quality, quality_params["medium"])
        
        if matching_type == "sequential":
            # Best for video sequences (frames in order)
            # Reference: https://colmap.github.io/tutorial.html#feature-matching-and-geometric-verification
            cmd = [
                "colmap", "sequential_matcher",
                "--database_path", str(self.database_path),
                
                # Sequential-specific parameters
                "--SequentialMatching.overlap", "10",  # Match 10 adjacent frames
                "--SequentialMatching.quadratic_overlap", "0",  # Linear overlap
                
                # SIFT Matching Parameters
                "--SiftMatching.use_gpu", "1" if use_gpu else "0",
                "--SiftMatching.guided_matching", "1",  # Use epipolar geometry
                "--SiftMatching.cross_check", "1",  # Bidirectional matching
                "--SiftMatching.max_num_matches", match_params["max_num_matches"],
                
                # Geometric Verification (automatic)
                "--SiftMatching.max_ratio", "0.8",  # Lowe's ratio test
                "--SiftMatching.max_distance", "0.7",  # Descriptor distance
                "--SiftMatching.max_error", "4.0",  # RANSAC threshold (pixels)
                "--SiftMatching.confidence", "0.999",  # RANSAC confidence
                "--SiftMatching.min_num_inliers", "15",  # Min matches per pair
                "--SiftMatching.min_inlier_ratio", "0.25",  # Quality threshold
            ]
        else:  # exhaustive_matcher
            # Best for unordered image collections
            # Reference: https://colmap.github.io/tutorial.html#feature-matching-and-geometric-verification
            cmd = [
                "colmap", "exhaustive_matcher",
                "--database_path", str(self.database_path),
                
                # SIFT Matching Parameters
                "--SiftMatching.use_gpu", "1" if use_gpu else "0",
                "--SiftMatching.guided_matching", "1",  # Use epipolar geometry
                "--SiftMatching.cross_check", "1",  # Bidirectional matching
                "--SiftMatching.max_num_matches", match_params["max_num_matches"],
                
                # Geometric Verification (automatic)
                "--SiftMatching.max_ratio", "0.8",  # Lowe's ratio test
                "--SiftMatching.max_distance", "0.7",  # Descriptor distance
                "--SiftMatching.max_error", "4.0",  # RANSAC threshold (pixels)
                "--SiftMatching.confidence", "0.999",  # RANSAC confidence
                "--SiftMatching.min_num_inliers", "15",  # Min matches per pair
                "--SiftMatching.min_inlier_ratio", "0.25",  # Quality threshold
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
        
        Exports the best sparse model to PLY format in the job root directory.
        Following COLMAP convention, output goes to workspace root (job_path).
        """
        # Find best sparse model
        best_model, _ = self._find_best_model()
        
        if not best_model:
            raise ValueError("No reconstruction found to export")
        
        # Export to job root (not exports/ subdirectory) per COLMAP convention
        output_file = self.job_path / f"point_cloud.{output_format.lower()}"
        
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
        """
        Find the best sparse reconstruction model
        
        COLMAP creates multiple reconstructions (0/, 1/, etc.) when not all 
        images register into the same model. This function selects the model
        with the most 3D points as the best reconstruction.
        
        Reference: https://colmap.github.io/tutorial.html#sparse-reconstruction
        """
        sparse_dirs = sorted(self.sparse_path.glob("[0-9]*"))
        
        if not sparse_dirs:
            return None, {}
        
        best_model = sparse_dirs[0]  # Default to first
        best_points = 0
        
        for sparse_dir in sparse_dirs:
            points3d_file = sparse_dir / "points3D.bin"
            if points3d_file.exists():
                # Count points (approximate by file size)
                # Each point in binary format: id (uint64) + xyz (3x float32) + rgb (uint8x3) + error (float32) + 2x track (int64)
                # Total: 8 + 12 + 3 + 4 + 16 = ~43 bytes + alignment ≈ 48 bytes
                point_count = points3d_file.stat().st_size // 48
                if point_count > best_points:
                    best_points = point_count
                    best_model = sparse_dir
        
        stats = {
            "num_models": len(sparse_dirs),
            "points_3d": best_points,
            "model_id": best_model.name
        }
        
        logger.info(f"Found {len(sparse_dirs)} models, best is {best_model.name} with {best_points} points")
        return best_model, stats
    
    def _parse_feature_stats(self, output: str) -> Dict:
        """
        Parse feature extraction statistics from COLMAP output
        Extracts: num_images, total_features, avg_features_per_image
        """
        stats = {
            "status": "success" if "Database" in output else "unknown"
        }
        
        # Try to extract statistics from output
        lines = output.split('\n')
        for i, line in enumerate(lines):
            # Look for database stats
            if "Database:" in line and i + 1 < len(lines):
                # Next line often has image count
                try:
                    num_images = len(list(self.images_path.glob("*.jpg")))
                    stats["num_images"] = num_images
                except:
                    pass
                break
        
        # Count features in database
        try:
            if self.database_path.exists():
                import sqlite3
                conn = sqlite3.connect(self.database_path)
                cursor = conn.cursor()
                
                # Count keypoints
                cursor.execute("SELECT COUNT(*) FROM keypoints")
                stats["total_keypoints"] = cursor.fetchone()[0]
                
                # Count images
                cursor.execute("SELECT COUNT(*) FROM images")
                stats["num_images"] = cursor.fetchone()[0]
                
                if stats["num_images"] > 0:
                    stats["avg_features_per_image"] = stats["total_keypoints"] // stats["num_images"]
                
                conn.close()
                logger.info(f"Feature stats: {stats['num_images']} images, {stats['total_keypoints']} keypoints")
        except Exception as e:
            logger.warning(f"Could not parse feature stats from database: {e}")
        
        return stats
    
    def _parse_match_stats(self, output: str) -> Dict:
        """
        Parse feature matching statistics from COLMAP output
        Extracts: matched_pairs, verification_rate
        """
        stats = {
            "status": "success" if "Database" in output else "unknown"
        }
        
        # Try to extract statistics from output
        lines = output.split('\n')
        for line in lines:
            # Look for match count
            if "Matched" in line and "pairs" in line:
                try:
                    # Extract number from "Matched X image pairs"
                    import re
                    match = re.search(r'(\d+)', line)
                    if match:
                        stats["matched_pairs"] = int(match.group(1))
                except:
                    pass
        
        # Count matches in database
        try:
            if self.database_path.exists():
                import sqlite3
                conn = sqlite3.connect(self.database_path)
                cursor = conn.cursor()
                
                # Count two-view geometries (verified matches)
                cursor.execute("SELECT COUNT(*) FROM two_view_geometries")
                stats["verified_pairs"] = cursor.fetchone()[0]
                
                conn.close()
                logger.info(f"Match stats: {stats.get('verified_pairs', 'unknown')} verified pairs")
        except Exception as e:
            logger.warning(f"Could not parse match stats from database: {e}")
        
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

