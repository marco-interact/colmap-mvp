"""
COLMAP Pipeline Implementation
Based on the official COLMAP repository: https://github.com/colmap/colmap.git
Implements the complete Structure-from-Motion and Multi-View Stereo pipeline.
"""

import os
import subprocess
import logging
import asyncio
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import shutil

logger = logging.getLogger(__name__)

class COLMAPPipeline:
    """
    COLMAP 3D Reconstruction Pipeline
    Implements the complete SfM + MVS workflow as described in the COLMAP documentation.
    """
    
    def __init__(self, workspace_dir: str = "/tmp/colmap_workspace"):
        self.workspace_dir = Path(workspace_dir)
        self.workspace_dir.mkdir(parents=True, exist_ok=True)
        
    async def extract_frames(
        self, 
        video_path: str, 
        output_dir: str, 
        frame_rate: float = 1.0,
        job_id: str = None
    ) -> Dict:
        """
        Extract frames from video using FFmpeg.
        This is the first step in the COLMAP pipeline.
        """
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # FFmpeg command to extract frames
            cmd = [
                'ffmpeg', '-i', video_path,
                '-vf', f'fps={frame_rate}',
                '-q:v', '2',  # High quality
                str(output_path / 'frame_%06d.jpg'),
                '-y'  # Overwrite existing files
            ]
            
            logger.info(f"Extracting frames from {video_path} at {frame_rate} fps")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Count extracted frames
            frame_files = list(output_path.glob('frame_*.jpg'))
            frame_count = len(frame_files)
            
            logger.info(f"Extracted {frame_count} frames to {output_dir}")
            
            return {
                'success': True,
                'frame_count': frame_count,
                'output_dir': str(output_path),
                'frames': [str(f) for f in frame_files]
            }
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Frame extraction failed: {e.stderr}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Frame extraction error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def feature_extraction(
        self, 
        images_dir: str, 
        database_path: str,
        quality: str = 'medium',
        job_id: str = None
    ) -> Dict:
        """
        Extract SIFT features from images.
        This is the second step in COLMAP's SfM pipeline.
        """
        try:
            # COLMAP feature extraction command
            cmd = [
                'colmap', 'feature_extractor',
                '--database_path', database_path,
                '--image_path', images_dir,
                '--ImageReader.single_camera', '1',
                '--SiftExtraction.use_gpu', '1' if self._gpu_available() else '0'
            ]
            
            # Add quality-specific parameters
            if quality == 'high':
                cmd.extend([
                    '--SiftExtraction.max_image_size', '3200',
                    '--SiftExtraction.max_num_features', '8192'
                ])
            elif quality == 'medium':
                cmd.extend([
                    '--SiftExtraction.max_image_size', '1600',
                    '--SiftExtraction.max_num_features', '4096'
                ])
            else:  # low
                cmd.extend([
                    '--SiftExtraction.max_image_size', '800',
                    '--SiftExtraction.max_num_features', '2048'
                ])
            
            logger.info(f"Extracting SIFT features from {images_dir}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            logger.info("Feature extraction completed successfully")
            return {'success': True, 'database_path': database_path}
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Feature extraction failed: {e.stderr}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Feature extraction error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def feature_matching(
        self, 
        database_path: str,
        quality: str = 'medium',
        job_id: str = None
    ) -> Dict:
        """
        Match features between images.
        This is the third step in COLMAP's SfM pipeline.
        """
        try:
            # COLMAP feature matching command
            cmd = [
                'colmap', 'exhaustive_matcher',
                '--database_path', database_path,
                '--SiftMatching.use_gpu', '1' if self._gpu_available() else '0'
            ]
            
            # Add quality-specific parameters
            if quality == 'high':
                cmd.extend([
                    '--SiftMatching.max_ratio', '0.6',
                    '--SiftMatching.max_distance', '0.7',
                    '--SiftMatching.cross_check', '1'
                ])
            elif quality == 'medium':
                cmd.extend([
                    '--SiftMatching.max_ratio', '0.7',
                    '--SiftMatching.max_distance', '0.8',
                    '--SiftMatching.cross_check', '1'
                ])
            else:  # low
                cmd.extend([
                    '--SiftMatching.max_ratio', '0.8',
                    '--SiftMatching.max_distance', '0.9',
                    '--SiftMatching.cross_check', '0'
                ])
            
            logger.info(f"Matching features in database {database_path}")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            logger.info("Feature matching completed successfully")
            return {'success': True, 'database_path': database_path}
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Feature matching failed: {e.stderr}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Feature matching error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def sparse_reconstruction(
        self, 
        database_path: str, 
        images_path: str, 
        output_path: str,
        job_id: str = None
    ) -> Dict:
        """
        Perform sparse 3D reconstruction.
        This is the fourth step in COLMAP's SfM pipeline.
        """
        try:
            output_dir = Path(output_path)
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # COLMAP sparse reconstruction command
            cmd = [
                'colmap', 'mapper',
                '--database_path', database_path,
                '--image_path', images_path,
                '--output_path', str(output_dir),
                '--Mapper.num_threads', str(os.cpu_count() or 4),
                '--Mapper.init_min_num_inliers', '100',
                '--Mapper.abs_pose_max_error', '12',
                '--Mapper.abs_pose_min_num_inliers', '30',
                '--Mapper.ba_refine_focal_length', '1',
                '--Mapper.ba_refine_principal_point', '0',
                '--Mapper.ba_refine_extra_params', '1'
            ]
            
            logger.info(f"Performing sparse reconstruction")
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            
            # Check if reconstruction was successful
            sparse_dir = output_dir / '0'  # COLMAP creates numbered subdirectories
            if sparse_dir.exists():
                logger.info("Sparse reconstruction completed successfully")
                return {
                    'success': True, 
                    'output_path': str(output_dir),
                    'sparse_path': str(sparse_dir)
                }
            else:
                logger.error("Sparse reconstruction failed - no output directory created")
                return {'success': False, 'error': 'No reconstruction output generated'}
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Sparse reconstruction failed: {e.stderr}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Sparse reconstruction error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def dense_reconstruction(
        self, 
        images_path: str, 
        output_path: str,
        quality: str = 'medium',
        job_id: str = None
    ) -> Dict:
        """
        Perform dense 3D reconstruction using Multi-View Stereo.
        This is the fifth step in COLMAP's MVS pipeline.
        """
        try:
            output_dir = Path(output_path)
            dense_dir = output_dir / 'dense'
            dense_dir.mkdir(parents=True, exist_ok=True)
            
            # Step 1: Image undistortion
            undistort_cmd = [
                'colmap', 'image_undistorter',
                '--image_path', images_path,
                '--input_path', str(output_dir / '0'),  # Sparse reconstruction output
                '--output_path', str(dense_dir),
                '--output_type', 'COLMAP'
            ]
            
            logger.info("Undistorting images for dense reconstruction")
            result = subprocess.run(undistort_cmd, capture_output=True, text=True, check=True)
            
            # Step 2: Patch match stereo
            patch_match_cmd = [
                'colmap', 'patch_match_stereo',
                '--workspace_path', str(dense_dir),
                '--workspace_format', 'COLMAP',
                '--PatchMatchStereo.geom_consistency', '1'
            ]
            
            # Add quality-specific parameters
            if quality == 'high':
                patch_match_cmd.extend([
                    '--PatchMatchStereo.max_image_size', '3200',
                    '--PatchMatchStereo.window_radius', '9',
                    '--PatchMatchStereo.window_step', '1'
                ])
            elif quality == 'medium':
                patch_match_cmd.extend([
                    '--PatchMatchStereo.max_image_size', '1600',
                    '--PatchMatchStereo.window_radius', '7',
                    '--PatchMatchStereo.window_step', '1'
                ])
            else:  # low
                patch_match_cmd.extend([
                    '--PatchMatchStereo.max_image_size', '800',
                    '--PatchMatchStereo.window_radius', '5',
                    '--PatchMatchStereo.window_step', '2'
                ])
            
            logger.info("Performing patch match stereo")
            result = subprocess.run(patch_match_cmd, capture_output=True, text=True, check=True)
            
            # Step 3: Stereo fusion
            stereo_fusion_cmd = [
                'colmap', 'stereo_fusion',
                '--workspace_path', str(dense_dir),
                '--workspace_format', 'COLMAP',
                '--input_type', 'geometric',
                '--output_path', str(dense_dir / 'fused.ply')
            ]
            
            logger.info("Fusing stereo depth maps")
            result = subprocess.run(stereo_fusion_cmd, capture_output=True, text=True, check=True)
            
            # Check if dense reconstruction was successful
            fused_ply = dense_dir / 'fused.ply'
            if fused_ply.exists():
                logger.info("Dense reconstruction completed successfully")
                return {
                    'success': True,
                    'output_path': str(dense_dir),
                    'point_cloud': str(fused_ply)
                }
            else:
                logger.error("Dense reconstruction failed - no point cloud generated")
                return {'success': False, 'error': 'No dense point cloud generated'}
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Dense reconstruction failed: {e.stderr}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Dense reconstruction error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def create_mesh(
        self, 
        output_path: str,
        job_id: str = None
    ) -> Dict:
        """
        Create mesh from dense point cloud using Poisson reconstruction.
        This is the sixth step in COLMAP's pipeline.
        """
        try:
            output_dir = Path(output_path)
            dense_dir = output_dir / 'dense'
            mesh_dir = output_dir / 'mesh'
            mesh_dir.mkdir(parents=True, exist_ok=True)
            
            # Poisson reconstruction
            poisson_cmd = [
                'colmap', 'poisson_mesher',
                '--input_path', str(dense_dir / 'fused.ply'),
                '--output_path', str(mesh_dir / 'meshed-poisson.ply')
            ]
            
            logger.info("Creating mesh using Poisson reconstruction")
            result = subprocess.run(poisson_cmd, capture_output=True, text=True, check=True)
            
            # Check if mesh was created successfully
            mesh_ply = mesh_dir / 'meshed-poisson.ply'
            if mesh_ply.exists():
                logger.info("Mesh creation completed successfully")
                return {
                    'success': True,
                    'output_path': str(mesh_dir),
                    'mesh': str(mesh_ply)
                }
            else:
                logger.error("Mesh creation failed - no mesh generated")
                return {'success': False, 'error': 'No mesh generated'}
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Mesh creation failed: {e.stderr}")
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f"Mesh creation error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _gpu_available(self) -> bool:
        """Check if GPU is available for COLMAP processing."""
        try:
            result = subprocess.run(['nvidia-smi'], capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
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
        """
        Run the complete COLMAP pipeline from video to 3D model.
        This orchestrates all the steps in the correct order.
        """
        try:
            project_dir = self.workspace_dir / project_id
            project_dir.mkdir(parents=True, exist_ok=True)
            
            # Step 1: Extract frames
            frames_dir = project_dir / 'frames'
            frames_result = await self.extract_frames(video_path, str(frames_dir), frame_rate, job_id)
            if not frames_result['success']:
                return frames_result
            
            # Step 2: Feature extraction
            database_path = str(project_dir / 'database.db')
            features_result = await self.feature_extraction(str(frames_dir), database_path, quality, job_id)
            if not features_result['success']:
                return features_result
            
            # Step 3: Feature matching
            matching_result = await self.feature_matching(database_path, quality, job_id)
            if not matching_result['success']:
                return matching_result
            
            # Step 4: Sparse reconstruction
            sparse_result = await self.sparse_reconstruction(
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
            
            # Step 5: Dense reconstruction (if requested)
            if dense_reconstruction:
                dense_result = await self.dense_reconstruction(
                    str(frames_dir), str(project_dir), quality, job_id
                )
                if dense_result['success']:
                    results['dense_reconstruction'] = True
                    results['dense_path'] = dense_result['output_path']
                    results['point_cloud'] = dense_result['point_cloud']
                else:
                    logger.warning(f"Dense reconstruction failed: {dense_result.get('error')}")
            
            # Step 6: Mesh creation (if requested and dense reconstruction succeeded)
            if meshing and dense_reconstruction and results.get('dense_reconstruction'):
                mesh_result = await self.create_mesh(str(project_dir), job_id)
                if mesh_result['success']:
                    results['meshing'] = True
                    results['mesh_path'] = mesh_result['output_path']
                    results['mesh'] = mesh_result['mesh']
                else:
                    logger.warning(f"Mesh creation failed: {mesh_result.get('error')}")
            
            logger.info(f"COLMAP pipeline completed successfully for project {project_id}")
            return results
            
        except Exception as e:
            logger.error(f"COLMAP pipeline failed: {str(e)}")
            return {'success': False, 'error': str(e)}
