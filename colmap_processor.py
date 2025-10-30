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
    
    def sparse_reconstruction(self, quality: str = "medium") -> Dict:
        """
        Incremental Structure-from-Motion reconstruction
        
        Reference: https://colmap.github.io/tutorial.html#sparse-reconstruction
        
        Process per COLMAP tutorial:
        1. Load extracted data from database into memory
        2. Seed reconstruction from an initial image pair
        3. Incrementally extend scene by registering new images
        4. Triangulate new 3D points
        5. Creates multiple models if not all images register into same model
        
        Output: Binary files in sparse/N/ directory:
        - cameras.bin: Camera intrinsics
        - images.bin: Camera poses (extrinsics)
        - points3D.bin: 3D points
        """
        logger.info(f"Starting sparse reconstruction (quality={quality})")
        
        # Quality-based mapper parameters
        quality_params = {
            "low": {
                "init_min_num_inliers": "50",
                "min_num_matches": "10",
                "filter_max_reproj_error": "8.0"
            },
            "medium": {
                "init_min_num_inliers": "100",
                "min_num_matches": "15",
                "filter_max_reproj_error": "6.0"
            },
            "high": {
                "init_min_num_inliers": "150",
                "min_num_matches": "20",
                "filter_max_reproj_error": "4.0"
            }
        }
        mapper_params = quality_params.get(quality, quality_params["medium"])
        
        cmd = [
            "colmap", "mapper",
            "--database_path", str(self.database_path),
            "--image_path", str(self.images_path),
            "--output_path", str(self.sparse_path),
            
            # Thread Configuration
            "--Mapper.num_threads", "8",
            
            # Initialization
            "--Mapper.init_min_num_inliers", mapper_params["init_min_num_inliers"],
            "--Mapper.init_max_forward_motion", "0.95",
            "--Mapper.init_min_tri_angle", "16.0",
            
            # Bundle Adjustment (refinement)
            "--Mapper.ba_refine_focal_length", "1",      # Refine focal length
            "--Mapper.ba_refine_principal_point", "0",   # Keep principal point
            "--Mapper.ba_refine_extra_params", "1",      # Refine distortion
            
            # Bundle Adjustment Iterations
            "--Mapper.ba_local_max_num_iterations", "40",
            "--Mapper.ba_global_max_num_iterations", "100",
            "--Mapper.ba_global_max_refinements", "5",
            
            # Point Filtering
            "--Mapper.filter_max_reproj_error", mapper_params["filter_max_reproj_error"],
            "--Mapper.filter_min_tri_angle", "1.5",
            "--Mapper.min_num_matches", mapper_params["min_num_matches"],
            
            # Triangulation
            "--Mapper.tri_min_angle", "1.5",
            "--Mapper.tri_ignore_two_view_tracks", "0",  # Include 2-view tracks
            "--Mapper.tri_max_transitivity", "2",
            
            # Multiple Models (per COLMAP tutorial)
            "--Mapper.multiple_models", "1",
            "--Mapper.max_num_models", "10",  # Up to 10 models
            "--Mapper.max_model_overlap", "20",
            
            # Other Options
            "--Mapper.extract_colors", "1",  # RGB colors for points
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            # Parse reconstruction statistics
            stats = self._parse_reconstruction_stats(result.stdout)
            
            # Find best model (most 3D points)
            best_model, model_stats = self._find_best_model()
            logger.info(f"Sparse reconstruction complete: {stats}")
            
            return {
                "model_path": str(best_model) if best_model else None,
                "num_models": model_stats.get("num_models", 0),
                "best_model_points": model_stats.get("points_3d", 0),
                "stats": {**stats, **model_stats}
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Sparse reconstruction failed: {e.stderr}")
            raise
    
    def export_model(self, output_format: str = "PLY", model_dir: Optional[Path] = None) -> str:
        """
        Export reconstruction to various formats
        
        Reference: https://colmap.github.io/tutorial.html#importing-and-exporting
        
        Supported formats (per COLMAP tutorial):
        - PLY: Point cloud for visualization
        - TXT: Text format (cameras.txt, images.txt, points3D.txt)
        - BIN: Binary format (native)
        - NVM: VisualSFM format
        - Bundler: Bundler format
        - VRML: VRML format
        
        Exports the best sparse model to specified format.
        Following COLMAP convention, output goes to workspace root (job_path).
        """
        # Find best sparse model if not specified
        if model_dir is None:
            best_model, _ = self._find_best_model()
            if not best_model:
                raise ValueError("No reconstruction found to export")
            model_dir = best_model
        
        logger.info(f"Exporting model {model_dir} to {output_format} format")
        
        # Handle different output formats
        if output_format == "PLY":
            # Point cloud export
            output_file = self.job_path / "point_cloud.ply"
            
            cmd = [
                "colmap", "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(output_file),
                "--output_type", "PLY",
            ]
        elif output_format == "TXT":
            # Text format export (cameras.txt, images.txt, points3D.txt)
            output_dir = self.job_path / "model_text"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            cmd = [
                "colmap", "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(output_dir),
                "--output_type", "TXT",
            ]
            output_file = output_dir  # Directory for text format
        elif output_format == "BIN":
            # Binary format export
            output_dir = self.job_path / "model_binary"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            cmd = [
                "colmap", "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(output_dir),
                "--output_type", "BIN",
            ]
            output_file = output_dir  # Directory for binary format
        elif output_format == "NVM":
            # VisualSFM NVM format
            output_file = self.job_path / "model.nvm"
            
            cmd = [
                "colmap", "model_converter",
                "--input_path", str(model_dir),
                "--output_path", str(output_file),
                "--output_type", "NVM",
            ]
        else:
            raise ValueError(f"Unsupported export format: {output_format}")
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(f"Exported model to {output_file} ({output_format} format)")
            return str(output_file)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Export failed: {e.stderr}")
            raise
    
    def export_point_cloud(self, output_format: str = "PLY") -> str:
        """
        Convenience wrapper for point cloud export
        """
        return self.export_model(output_format="PLY")
    
    def import_model(self, import_path: Path, input_format: str = "TXT") -> Path:
        """
        Import reconstruction from external format
        
        Reference: https://colmap.github.io/tutorial.html#importing-and-exporting
        
        Supported input formats:
        - TXT: Text format (cameras.txt, images.txt, points3D.txt)
        - BIN: Binary format (cameras.bin, images.bin, points3D.bin)
        - PLY: Point cloud (RGB only, no camera poses)
        
        Output: Imported model in sparse directory as new numbered model.
        """
        logger.info(f"Importing model from {import_path} ({input_format} format)")
        
        # Create import directory in sparse/
        sparse_dirs = sorted(self.sparse_path.glob("[0-9]*"))
        if sparse_dirs:
            next_model_id = max([int(d.name) for d in sparse_dirs]) + 1
        else:
            next_model_id = 0
        
        import_dir = self.sparse_path / str(next_model_id)
        import_dir.mkdir(parents=True, exist_ok=True)
        
        if input_format == "PLY":
            # PLY imports differently - no camera poses
            raise NotImplementedError("PLY import requires manual camera pose setup")
        
        cmd = [
            "colmap", "model_converter",
            "--input_path", str(import_path),
            "--input_type", input_format,
            "--output_path", str(import_dir),
            "--output_type", "BIN",
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(f"Imported model to {import_dir}")
            return import_dir
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Import failed: {e.stderr}")
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
    
    def _parse_reconstruction_stats(self, output: str) -> Dict:
        """
        Parse sparse reconstruction statistics from COLMAP output
        """
        stats = {
            "status": "success" if "Database" in output else "unknown"
        }
        
        # Try to extract statistics from output
        lines = output.split('\n')
        for line in lines:
            # Look for registered images
            if "Registered" in line and "images" in line:
                try:
                    import re
                    match = re.search(r'(\d+)', line)
                    if match:
                        stats["registered_images"] = int(match.group(1))
                except:
                    pass
            
            # Look for reconstructed points
            if "Reconstructed" in line and "points" in line:
                try:
                    import re
                    match = re.search(r'(\d+)', line)
                    if match:
                        stats["reconstructed_points"] = int(match.group(1))
                except:
                    pass
        
        return stats
    
    def inspect_database(self) -> Dict:
        """
        Inspect COLMAP database contents
        Reference: https://colmap.github.io/tutorial.html#database-management
        
        Returns comprehensive database statistics including:
        - Cameras (intrinsic parameters)
        - Images (metadata and registration status)
        - Keypoints (SIFT features per image)
        - Matches (feature correspondences)
        - Two-view geometries (geometrically verified matches)
        """
        if not self.database_path.exists():
            logger.warning(f"Database not found at {self.database_path}")
            return {"status": "not_found", "message": "Database does not exist yet"}
        
        import sqlite3
        
        stats = {
            "status": "success",
            "database_path": str(self.database_path),
        }
        
        try:
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()
            
            # Get camera information
            cursor.execute("SELECT COUNT(*) FROM cameras")
            stats["num_cameras"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT * FROM cameras")
            cameras = cursor.fetchall()
            if cameras:
                stats["cameras"] = []
                for camera in cameras:
                    stats["cameras"].append({
                        "camera_id": camera[0],
                        "model": camera[1],
                        "width": camera[2],
                        "height": camera[3],
                        "params": camera[4]
                    })
            
            # Get image information
            cursor.execute("SELECT COUNT(*) FROM images")
            stats["num_images"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT name, camera_id, prior_qw, prior_qx, prior_qy, prior_qz, prior_tx, prior_ty, prior_tz FROM images")
            images = cursor.fetchall()
            if images:
                stats["images"] = []
                for img in images:
                    stats["images"].append({
                        "name": img[0],
                        "camera_id": img[1],
                        "prior_quaternion": [img[2], img[3], img[4], img[5]],
                        "prior_translation": [img[6], img[7], img[8]]
                    })
            
            # Get keypoint statistics
            cursor.execute("SELECT COUNT(*) FROM keypoints")
            stats["num_keypoints"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT AVG(rows) FROM keypoints")
            avg_keypoints = cursor.fetchone()[0]
            if avg_keypoints:
                stats["avg_keypoints_per_image"] = round(avg_keypoints, 2)
            
            # Get match statistics
            cursor.execute("SELECT COUNT(*) FROM matches")
            stats["num_matches"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT AVG(rows) FROM matches")
            avg_matches = cursor.fetchone()[0]
            if avg_matches:
                stats["avg_matches_per_pair"] = round(avg_matches, 2)
            
            # Get two-view geometry statistics
            cursor.execute("SELECT COUNT(*) FROM two_view_geometries")
            stats["num_two_view_geometries"] = cursor.fetchone()[0]
            
            cursor.execute("SELECT AVG(CAST(rows AS FLOAT)) FROM two_view_geometries WHERE rows > 0")
            avg_inliers = cursor.fetchone()[0]
            if avg_inliers:
                stats["avg_inliers_per_pair"] = round(avg_inliers, 2)
            
            # Calculate verification rate
            if stats["num_matches"] > 0:
                stats["verification_rate"] = round((stats["num_two_view_geometries"] / stats["num_matches"]) * 100, 2)
            
            # Calculate inlier ratio
            if stats["num_two_view_geometries"] > 0 and stats["num_matches"] > 0:
                cursor.execute("SELECT AVG(CAST(tvg.rows AS FLOAT) / CAST(m.rows AS FLOAT)) FROM two_view_geometries tvg JOIN matches m ON tvg.pair_id = m.pair_id WHERE m.rows > 0")
                inlier_ratio = cursor.fetchone()[0]
                if inlier_ratio:
                    stats["avg_inlier_ratio"] = round(inlier_ratio * 100, 2)
            
            conn.close()
            
            logger.info(f"Database inspection complete: {stats['num_cameras']} cameras, {stats['num_images']} images, {stats['num_keypoints']} keypoints")
            
        except Exception as e:
            logger.error(f"Database inspection failed: {e}")
            stats["status"] = "error"
            stats["error"] = str(e)
        
        return stats
    
    def clean_database(self) -> Dict:
        """
        Clean COLMAP database by removing unused data
        Reference: https://colmap.github.io/tutorial.html#database-management
        
        Removes:
        - Images without features
        - Matches for deleted image pairs
        - Orphaned keypoints/descriptors
        
        Benefits:
        - Smaller file size
        - Faster processing
        - Cleaner data structure
        """
        if not self.database_path.exists():
            logger.warning(f"Database not found at {self.database_path}")
            return {"status": "not_found", "message": "Database does not exist yet"}
        
        try:
            import sqlite3
            import tempfile
            
            logger.info("Cleaning database...")
            
            # Create backup
            backup_path = self.database_path.with_suffix('.db.backup')
            shutil.copy2(self.database_path, backup_path)
            logger.info(f"Created backup: {backup_path}")
            
            # Use COLMAP database_cleaner
            # Reference: https://colmap.github.io/cli.html#database-cleaner
            cmd = [
                "colmap", "database_cleaner",
                "--database_path", str(self.database_path),
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False  # Don't fail if database is already clean
            )
            
            if result.returncode == 0:
                logger.info("Database cleaned successfully")
                return {
                    "status": "success",
                    "message": "Database cleaned successfully",
                    "backup_path": str(backup_path)
                }
            else:
                logger.warning(f"Database cleaner returned {result.returncode}: {result.stderr}")
                # Restore backup
                shutil.copy2(backup_path, self.database_path)
                return {
                    "status": "warning",
                    "message": "Database may not need cleaning",
                    "output": result.stdout
                }
                
        except Exception as e:
            logger.error(f"Database cleaning failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def get_camera_for_image(self, image_name: str) -> Optional[Dict]:
        """
        Get camera parameters for a specific image
        Useful for sharing intrinsic parameters between images
        Reference: https://colmap.github.io/tutorial.html#database-management
        
        Returns camera model (PINHOLE, SIMPLE_PINHOLE, etc.) and parameters
        """
        if not self.database_path.exists():
            return None
        
        try:
            import sqlite3
            
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()
            
            # Get image's camera_id
            cursor.execute("SELECT camera_id FROM images WHERE name = ?", (image_name,))
            result = cursor.fetchone()
            
            if not result:
                conn.close()
                return None
            
            camera_id = result[0]
            
            # Get camera details
            cursor.execute("SELECT * FROM cameras WHERE camera_id = ?", (camera_id,))
            camera = cursor.fetchone()
            
            conn.close()
            
            if camera:
                return {
                    "camera_id": camera[0],
                    "model": camera[1],
                    "width": camera[2],
                    "height": camera[3],
                    "params": camera[4]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get camera for image {image_name}: {e}")
            return None
    
    def set_camera_for_images(self, image_names: list, camera_id: int) -> Dict:
        """
        Set the same camera for multiple images
        Useful for sharing intrinsic parameters between images with same camera
        Reference: https://colmap.github.io/tutorial.html#database-management
        
        Args:
            image_names: List of image names to update
            camera_id: Camera ID to assign
        """
        if not self.database_path.exists():
            return {"status": "not_found", "message": "Database does not exist yet"}
        
        try:
            import sqlite3
            
            conn = sqlite3.connect(self.database_path)
            cursor = conn.cursor()
            
            updated_count = 0
            for image_name in image_names:
                cursor.execute("UPDATE images SET camera_id = ? WHERE name = ?", (camera_id, image_name))
                if cursor.rowcount > 0:
                    updated_count += 1
            
            conn.commit()
            conn.close()
            
            logger.info(f"Updated camera for {updated_count} images")
            
            return {
                "status": "success",
                "updated_images": updated_count,
                "total_images": len(image_names)
            }
            
        except Exception as e:
            logger.error(f"Failed to set camera for images: {e}")
            return {"status": "error", "error": str(e)}


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

