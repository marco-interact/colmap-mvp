"""
COLMAP pipeline service for 3D reconstruction
"""

import os
import subprocess
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
import json
import shutil

logger = logging.getLogger(__name__)


class COLMAPPipeline:
    """Service for managing COLMAP 3D reconstruction pipeline."""
    
    def __init__(self):
        # Use locally installed COLMAP 3.12.6
        self.colmap_binary = "colmap"  # COLMAP is now in PATH
        self.workspace_dir = Path("/tmp/colmap_workspace")
        self.max_image_size = 1600
        self.quality = "medium"
        
        # COLMAP parameters based on quality setting
        self.quality_params = {
            "low": {
                "feature_extraction": {
                    "SiftExtraction.max_image_size": 800,
                    "SiftExtraction.max_num_features": 4000,
                    "SiftExtraction.upright": 0
                },
                "feature_matching": {
                    "SiftMatching.guided_matching": 1,
                    "SiftMatching.max_ratio": 0.8,
                    "SiftMatching.max_distance": 0.7
                },
                "sparse_reconstruction": {
                    "Mapper.ba_refine_focal_length": 1,
                    "Mapper.ba_refine_principal_point": 0,
                    "Mapper.ba_refine_extra_params": 1
                },
                "dense_reconstruction": {
                    "PatchMatchStereo.max_image_size": 800,
                    "PatchMatchStereo.window_radius": 5,
                    "PatchMatchStereo.window_step": 1
                }
            },
            "medium": {
                "feature_extraction": {
                    "SiftExtraction.max_image_size": 1200,
                    "SiftExtraction.max_num_features": 8000,
                    "SiftExtraction.upright": 0
                },
                "feature_matching": {
                    "SiftMatching.guided_matching": 1,
                    "SiftMatching.max_ratio": 0.8,
                    "SiftMatching.max_distance": 0.7
                },
                "sparse_reconstruction": {
                    "Mapper.ba_refine_focal_length": 1,
                    "Mapper.ba_refine_principal_point": 0,
                    "Mapper.ba_refine_extra_params": 1
                },
                "dense_reconstruction": {
                    "PatchMatchStereo.max_image_size": 1200,
                    "PatchMatchStereo.window_radius": 7,
                    "PatchMatchStereo.window_step": 1
                }
            },
            "high": {
                "feature_extraction": {
                    "SiftExtraction.max_image_size": 1600,
                    "SiftExtraction.max_num_features": 12000,
                    "SiftExtraction.upright": 0
                },
                "feature_matching": {
                    "SiftMatching.guided_matching": 1,
                    "SiftMatching.max_ratio": 0.8,
                    "SiftMatching.max_distance": 0.7
                },
                "sparse_reconstruction": {
                    "Mapper.ba_refine_focal_length": 1,
                    "Mapper.ba_refine_principal_point": 0,
                    "Mapper.ba_refine_extra_params": 1
                },
                "dense_reconstruction": {
                    "PatchMatchStereo.max_image_size": 1600,
                    "PatchMatchStereo.window_radius": 9,
                    "PatchMatchStereo.window_step": 1
                }
            },
            "extreme": {
                "feature_extraction": {
                    "SiftExtraction.max_image_size": 2400,
                    "SiftExtraction.max_num_features": 20000,
                    "SiftExtraction.upright": 0
                },
                "feature_matching": {
                    "SiftMatching.guided_matching": 1,
                    "SiftMatching.max_ratio": 0.8,
                    "SiftMatching.max_distance": 0.7
                },
                "sparse_reconstruction": {
                    "Mapper.ba_refine_focal_length": 1,
                    "Mapper.ba_refine_principal_point": 0,
                    "Mapper.ba_refine_extra_params": 1
                },
                "dense_reconstruction": {
                    "PatchMatchStereo.max_image_size": 2400,
                    "PatchMatchStereo.window_radius": 11,
                    "PatchMatchStereo.window_step": 1
                }
            }
        }
    
    async def run_full_pipeline(
        self,
        project_id: int,
        frames_path: Path,
        output_dir: Path
    ) -> Dict[str, str]:
        """
        Run the complete COLMAP reconstruction pipeline.
        
        Args:
            project_id: Project ID
            frames_path: Path to input frames
            output_dir: Output directory for results
        
        Returns:
            Dictionary with paths to generated files
        """
        try:
            # Create workspace directory
            workspace = output_dir / "colmap_workspace"
            workspace.mkdir(parents=True, exist_ok=True)
            
            # Set up directories
            database_path = workspace / "database.db"
            sparse_dir = workspace / "sparse"
            dense_dir = workspace / "dense"
            
            sparse_dir.mkdir(exist_ok=True)
            dense_dir.mkdir(exist_ok=True)
            
            results = {}
            
            # Step 1: Feature extraction
            logger.info("Starting feature extraction...")
            await self._extract_features(frames_path, database_path)
            results["features_extracted"] = "completed"
            
            # Step 2: Feature matching
            logger.info("Starting feature matching...")
            await self._match_features(database_path)
            results["features_matched"] = "completed"
            
            # Step 3: Sparse reconstruction
            logger.info("Starting sparse reconstruction...")
            sparse_model_path = await self._sparse_reconstruction(
                frames_path, database_path, sparse_dir
            )
            results["sparse_model"] = str(sparse_model_path)
            
            # Step 4: Dense reconstruction
            logger.info("Starting dense reconstruction...")
            dense_model_path = await self._dense_reconstruction(
                frames_path, sparse_model_path, dense_dir
            )
            results["dense_model"] = str(dense_model_path)
            
            # Step 5: Mesh generation
            logger.info("Starting mesh generation...")
            mesh_path = await self._generate_mesh(dense_model_path, output_dir)
            results["mesh"] = str(mesh_path)
            
            # Step 6: Texturing
            logger.info("Starting texturing...")
            textured_mesh_path = await self._texture_mesh(
                mesh_path, sparse_model_path, frames_path, output_dir
            )
            results["textured_mesh"] = str(textured_mesh_path)
            
            logger.info("COLMAP pipeline completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"COLMAP pipeline failed: {str(e)}")
            raise
    
    async def _extract_features(self, images_path: Path, database_path: Path) -> None:
        """Extract SIFT features from images."""
        params = self.quality_params[self.quality]["feature_extraction"]
        
        cmd = [
            self.colmap_binary, "feature_extractor",
            "--database_path", str(database_path),
            "--image_path", str(images_path),
            "--ImageReader.single_camera", "1"
        ]
        
        # Add quality-specific parameters
        for param, value in params.items():
            cmd.extend([f"--{param}", str(value)])
        
        await self._run_command(cmd)
    
    async def _match_features(self, database_path: Path) -> None:
        """Match features between images."""
        params = self.quality_params[self.quality]["feature_matching"]
        
        cmd = [
            self.colmap_binary, "exhaustive_matcher",
            "--database_path", str(database_path)
        ]
        
        # Add quality-specific parameters
        for param, value in params.items():
            cmd.extend([f"--{param}", str(value)])
        
        await self._run_command(cmd)
    
    async def _sparse_reconstruction(
        self,
        images_path: Path,
        database_path: Path,
        sparse_dir: Path
    ) -> Path:
        """Perform sparse reconstruction."""
        params = self.quality_params[self.quality]["sparse_reconstruction"]
        
        cmd = [
            self.colmap_binary, "mapper",
            "--database_path", str(database_path),
            "--image_path", str(images_path),
            "--output_path", str(sparse_dir)
        ]
        
        # Add quality-specific parameters
        for param, value in params.items():
            cmd.extend([f"--{param}", str(value)])
        
        await self._run_command(cmd)
        
        # Find the generated model directory
        model_dirs = list(sparse_dir.glob("*"))
        if not model_dirs:
            raise RuntimeError("No sparse model generated")
        
        # Return the first (and typically only) model directory
        return model_dirs[0]
    
    async def _dense_reconstruction(
        self,
        images_path: Path,
        sparse_model_path: Path,
        dense_dir: Path
    ) -> Path:
        """Perform dense reconstruction."""
        params = self.quality_params[self.quality]["dense_reconstruction"]
        
        # Step 1: Image undistortion
        undistorted_dir = dense_dir / "undistorted"
        undistorted_dir.mkdir(exist_ok=True)
        
        cmd = [
            self.colmap_binary, "image_undistorter",
            "--image_path", str(images_path),
            "--input_path", str(sparse_model_path),
            "--output_path", str(undistorted_dir),
            "--output_type", "COLMAP"
        ]
        
        await self._run_command(cmd)
        
        # Step 2: Patch match stereo
        cmd = [
            self.colmap_binary, "patch_match_stereo",
            "--workspace_path", str(undistorted_dir),
            "--workspace_format", "COLMAP",
            "--PatchMatchStereo.geom_consistency", "1"
        ]
        
        # Add quality-specific parameters
        for param, value in params.items():
            cmd.extend([f"--{param}", str(value)])
        
        await self._run_command(cmd)
        
        # Step 3: Stereo fusion
        cmd = [
            self.colmap_binary, "stereo_fusion",
            "--workspace_path", str(undistorted_dir),
            "--workspace_format", "COLMAP",
            "--input_type", "geometric",
            "--output_path", str(dense_dir / "fused.ply")
        ]
        
        await self._run_command(cmd)
        
        return dense_dir / "fused.ply"
    
    async def _generate_mesh(self, point_cloud_path: Path, output_dir: Path) -> Path:
        """Generate mesh from point cloud."""
        mesh_dir = output_dir / "meshes"
        mesh_dir.mkdir(exist_ok=True)
        
        mesh_path = mesh_dir / "mesh.ply"
        
        # Use Poisson reconstruction for mesh generation
        cmd = [
            self.colmap_binary, "poisson_mesher",
            "--input_path", str(point_cloud_path),
            "--output_path", str(mesh_path)
        ]
        
        await self._run_command(cmd)
        
        return mesh_path
    
    async def _texture_mesh(
        self,
        mesh_path: Path,
        sparse_model_path: Path,
        images_path: Path,
        output_dir: Path
    ) -> Path:
        """Apply texture to mesh."""
        texture_dir = output_dir / "textures"
        texture_dir.mkdir(exist_ok=True)
        
        textured_mesh_path = texture_dir / "textured_mesh.obj"
        
        cmd = [
            self.colmap_binary, "texture_mapper",
            "--input_path", str(mesh_path),
            "--input_type", "PLY",
            "--images_path", str(images_path),
            "--sparse_path", str(sparse_model_path),
            "--output_path", str(textured_mesh_path)
        ]
        
        await self._run_command(cmd)
        
        return textured_mesh_path
    
    async def _run_command(self, cmd: List[str]) -> None:
        """Run a COLMAP command asynchronously."""
        try:
            logger.info(f"Running command: {' '.join(cmd)}")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"Command failed: {error_msg}")
                raise RuntimeError(f"COLMAP command failed: {error_msg}")
            
            logger.info("Command completed successfully")
            
        except Exception as e:
            logger.error(f"Failed to run command: {str(e)}")
            raise
    
    def get_reconstruction_stats(self, sparse_model_path: Path) -> Dict:
        """Get statistics about the reconstruction."""
        try:
            cameras_file = sparse_model_path / "cameras.bin"
            images_file = sparse_model_path / "images.bin"
            points_file = sparse_model_path / "points3D.bin"
            
            stats = {
                "num_cameras": 0,
                "num_images": 0,
                "num_points": 0
            }
            
            if cameras_file.exists():
                # Read cameras.bin (binary format)
                # This is a simplified version - in production, you'd use COLMAP's Python bindings
                stats["num_cameras"] = 1  # Placeholder
            
            if images_file.exists():
                # Read images.bin
                stats["num_images"] = len(list(images_file.parent.glob("*.jpg")))  # Placeholder
            
            if points_file.exists():
                # Read points3D.bin
                stats["num_points"] = 1000  # Placeholder
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get reconstruction stats: {str(e)}")
            return {"error": str(e)}
    
    async def export_model(
        self,
        sparse_model_path: Path,
        output_path: Path,
        format: str = "PLY"
    ) -> Path:
        """Export model in specified format."""
        try:
            if format.upper() == "PLY":
                # Export as PLY point cloud
                cmd = [
                    self.colmap_binary, "model_converter",
                    "--input_path", str(sparse_model_path),
                    "--output_path", str(output_path),
                    "--output_type", "PLY"
                ]
            elif format.upper() == "OBJ":
                # Export as OBJ mesh
                cmd = [
                    self.colmap_binary, "model_converter",
                    "--input_path", str(sparse_model_path),
                    "--output_path", str(output_path),
                    "--output_type", "OBJ"
                ]
            else:
                raise ValueError(f"Unsupported export format: {format}")
            
            await self._run_command(cmd)
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to export model: {str(e)}")
            raise



