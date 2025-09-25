"""
PyCOLMAP Pipeline Implementation
Uses the official PyCOLMAP Python bindings for COLMAP functionality.
Based on: https://github.com/colmap/colmap.git
"""

import os
import logging
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import cv2

try:
    import pycolmap
    PYCOLMAP_AVAILABLE = True
except ImportError:
    PYCOLMAP_AVAILABLE = False
    pycolmap = None

logger = logging.getLogger(__name__)

class PyCOLMAPPipeline:
    """
    PyCOLMAP 3D Reconstruction Pipeline
    Uses official PyCOLMAP Python bindings for Structure-from-Motion and Multi-View Stereo.
    """
    
    def __init__(self, workspace_dir: str = "/tmp/colmap_workspace"):
        if not PYCOLMAP_AVAILABLE:
            raise ImportError("PyCOLMAP is not available. Install with: pip install pycolmap")
        
        self.workspace_dir = Path(workspace_dir)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        
    async def extract_frames(
        self, 
        video_path: str, 
        output_dir: str, 
        frame_rate: float = 1.0,
        job_id: str = None
    ) -> Dict:
        """Extract frames from video using OpenCV."""
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_interval = int(fps / frame_rate)
            
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % frame_interval == 0:
                    frame_filename = output_path / f'frame_{extracted_count:06d}.jpg'
                    cv2.imwrite(str(frame_filename), frame)
                    extracted_count += 1
                
                frame_count += 1
            
            cap.release()
            
            logger.info(f"Extracted {extracted_count} frames from {video_path}")
            return {
                'success': True,
                'frame_count': extracted_count,
                'output_dir': str(output_path)
            }
            
        except Exception as e:
            logger.error(f"Frame extraction failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def import_images(
        self,
        images_dir: str,
        database_path: str,
        job_id: str = None
    ) -> Dict:
        """Import images into COLMAP database."""
        try:
            # Import images using PyCOLMAP
            pycolmap.import_images(
                database_path=database_path,
                image_path=images_dir,
                camera_mode=pycolmap.CameraMode.AUTO,
                image_list=None
            )
            
            logger.info(f"Imported images from {images_dir} to {database_path}")
            return {'success': True, 'database_path': database_path}
            
        except Exception as e:
            logger.error(f"Image import failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def extract_features(
        self,
        database_path: str,
        images_dir: str,
        quality: str = 'medium',
        job_id: str = None
    ) -> Dict:
        """Extract SIFT features using PyCOLMAP."""
        try:
            # Configure SIFT extraction options
            sift_options = pycolmap.SiftExtractionOptions()
            
            if quality == 'high':
                sift_options.max_image_size = 3200
                sift_options.max_num_features = 8192
            elif quality == 'medium':
                sift_options.max_image_size = 1600
                sift_options.max_num_features = 4096
            else:  # low
                sift_options.max_image_size = 800
                sift_options.max_num_features = 2048
            
            # Extract features
            pycolmap.extract_features(
                database_path=database_path,
                image_path=images_dir,
                options=sift_options
            )
            
            logger.info("SIFT feature extraction completed")
            return {'success': True, 'database_path': database_path}
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def match_features(
        self,
        database_path: str,
        quality: str = 'medium',
        job_id: str = None
    ) -> Dict:
        """Match features between images using PyCOLMAP."""
        try:
            # Configure matching options
            matching_options = pycolmap.ExhaustiveMatchingOptions()
            
            if quality == 'high':
                matching_options.max_ratio = 0.6
                matching_options.max_distance = 0.7
                matching_options.cross_check = True
            elif quality == 'medium':
                matching_options.max_ratio = 0.7
                matching_options.max_distance = 0.8
                matching_options.cross_check = True
            else:  # low
                matching_options.max_ratio = 0.8
                matching_options.max_distance = 0.9
                matching_options.cross_check = False
            
            # Match features
            pycolmap.match_exhaustive(
                database_path=database_path,
                options=matching_options
            )
            
            logger.info("Feature matching completed")
            return {'success': True, 'database_path': database_path}
            
        except Exception as e:
            logger.error(f"Feature matching failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def incremental_mapping(
        self,
        database_path: str,
        images_dir: str,
        output_dir: str,
        job_id: str = None
    ) -> Dict:
        """Perform incremental Structure-from-Motion mapping."""
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Configure incremental mapper options
            mapper_options = pycolmap.IncrementalMapperOptions()
            mapper_options.ba_refine_focal_length = True
            mapper_options.ba_refine_principal_point = False
            mapper_options.ba_refine_extra_params = True
            
            # Run incremental mapping
            reconstruction_manager = pycolmap.ReconstructionManager(output_dir)
            
            pycolmap.incremental_mapping(
                database_path=database_path,
                image_path=images_dir,
                output_path=output_dir,
                options=mapper_options
            )
            
            # Check if reconstruction was successful
            reconstruction_dirs = list(output_path.glob('*'))
            if reconstruction_dirs:
                sparse_path = str(reconstruction_dirs[0])
                logger.info("Incremental mapping completed successfully")
                return {
                    'success': True,
                    'output_path': output_dir,
                    'sparse_path': sparse_path
                }
            else:
                logger.error("Incremental mapping failed - no output generated")
                return {'success': False, 'error': 'No reconstruction output generated'}
            
        except Exception as e:
            logger.error(f"Incremental mapping failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def dense_reconstruction(
        self,
        images_dir: str,
        sparse_dir: str,
        output_dir: str,
        quality: str = 'medium',
        job_id: str = None
    ) -> Dict:
        """Perform dense Multi-View Stereo reconstruction."""
        try:
            dense_path = Path(output_dir) / 'dense'
            dense_path.mkdir(parents=True, exist_ok=True)
            
            # Step 1: Image undistortion
            pycolmap.undistort_images(
                image_path=images_dir,
                input_path=sparse_dir,
                output_path=str(dense_path),
                output_type=pycolmap.CopyType.COLMAP
            )
            
            # Step 2: Patch match stereo
            patch_match_options = pycolmap.PatchMatchOptions()
            
            if quality == 'high':
                patch_match_options.max_image_size = 3200
                patch_match_options.window_radius = 9
                patch_match_options.window_step = 1
            elif quality == 'medium':
                patch_match_options.max_image_size = 1600
                patch_match_options.window_radius = 7
                patch_match_options.window_step = 1
            else:  # low
                patch_match_options.max_image_size = 800
                patch_match_options.window_radius = 5
                patch_match_options.window_step = 2
            
            pycolmap.patch_match_stereo(
                workspace_path=str(dense_path),
                workspace_format=pycolmap.CopyType.COLMAP,
                options=patch_match_options
            )
            
            # Step 3: Stereo fusion
            stereo_fusion_options = pycolmap.StereoFusionOptions()
            fused_ply = dense_path / 'fused.ply'
            
            pycolmap.stereo_fusion(
                workspace_path=str(dense_path),
                workspace_format=pycolmap.CopyType.COLMAP,
                input_type=pycolmap.CopyType.GEOMETRIC,
                output_path=str(fused_ply),
                options=stereo_fusion_options
            )
            
            if fused_ply.exists():
                logger.info("Dense reconstruction completed successfully")
                return {
                    'success': True,
                    'output_path': str(dense_path),
                    'point_cloud': str(fused_ply)
                }
            else:
                logger.error("Dense reconstruction failed - no point cloud generated")
                return {'success': False, 'error': 'No dense point cloud generated'}
            
        except Exception as e:
            logger.error(f"Dense reconstruction failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def create_mesh(
        self,
        point_cloud_path: str,
        output_dir: str,
        job_id: str = None
    ) -> Dict:
        """Create mesh from dense point cloud using Poisson reconstruction."""
        try:
            mesh_path = Path(output_dir) / 'mesh'
            mesh_path.mkdir(parents=True, exist_ok=True)
            
            # Poisson meshing options
            poisson_options = pycolmap.PoissonMeshingOptions()
            mesh_ply = mesh_path / 'meshed-poisson.ply'
            
            pycolmap.poisson_meshing(
                input_path=point_cloud_path,
                output_path=str(mesh_ply),
                options=poisson_options
            )
            
            if mesh_ply.exists():
                logger.info("Mesh creation completed successfully")
                return {
                    'success': True,
                    'output_path': str(mesh_path),
                    'mesh': str(mesh_ply)
                }
            else:
                logger.error("Mesh creation failed - no mesh generated")
                return {'success': False, 'error': 'No mesh generated'}
            
        except Exception as e:
            logger.error(f"Mesh creation failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def run_complete_pipeline(
        self,
        video_path: str,
        project_id: str,
        quality: str = 'medium',
        dense_reconstruction: bool = True,
        meshing: bool = True,
        frame_rate: float = 1.0,
        job_id: str = None
    ) -> Dict:
        """Run the complete PyCOLMAP pipeline from video to 3D model."""
        try:
            project_dir = self.workspace_dir / project_id
            project_dir.mkdir(parents=True, exist_ok=True)
            
            # Step 1: Extract frames
            frames_dir = project_dir / 'frames'
            frames_result = await self.extract_frames(video_path, str(frames_dir), frame_rate, job_id)
            if not frames_result['success']:
                return frames_result
            
            # Step 2: Import images
            database_path = str(project_dir / 'database.db')
            import_result = await self.import_images(str(frames_dir), database_path, job_id)
            if not import_result['success']:
                return import_result
            
            # Step 3: Extract features
            features_result = await self.extract_features(database_path, str(frames_dir), quality, job_id)
            if not features_result['success']:
                return features_result
            
            # Step 4: Match features
            matching_result = await self.match_features(database_path, quality, job_id)
            if not matching_result['success']:
                return matching_result
            
            # Step 5: Incremental mapping (SfM)
            sparse_result = await self.incremental_mapping(
                database_path, str(frames_dir), str(project_dir / 'sparse'), job_id
            )
            if not sparse_result['success']:
                return sparse_result
            
            results = {
                'success': True,
                'sparse_reconstruction': True,
                'sparse_path': sparse_result['sparse_path'],
                'frame_count': frames_result['frame_count']
            }
            
            # Step 6: Dense reconstruction (MVS)
            if dense_reconstruction:
                dense_result = await self.dense_reconstruction(
                    str(frames_dir), sparse_result['sparse_path'], str(project_dir), quality, job_id
                )
                if dense_result['success']:
                    results['dense_reconstruction'] = True
                    results['dense_path'] = dense_result['output_path']
                    results['point_cloud'] = dense_result['point_cloud']
                else:
                    logger.warning(f"Dense reconstruction failed: {dense_result.get('error')}")
            
            # Step 7: Mesh creation
            if meshing and dense_reconstruction and results.get('dense_reconstruction'):
                mesh_result = await self.create_mesh(
                    results['point_cloud'], str(project_dir), job_id
                )
                if mesh_result['success']:
                    results['meshing'] = True
                    results['mesh_path'] = mesh_result['output_path']
                    results['mesh'] = mesh_result['mesh']
                else:
                    logger.warning(f"Mesh creation failed: {mesh_result.get('error')}")
            
            logger.info(f"PyCOLMAP pipeline completed successfully for project {project_id}")
            return results
            
        except Exception as e:
            logger.error(f"PyCOLMAP pipeline failed: {str(e)}")
            return {'success': False, 'error': str(e)}
