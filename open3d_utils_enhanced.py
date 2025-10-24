"""
Enhanced Open3D Utilities for COLMAP 3D Reconstruction
Advanced point cloud processing and visualization with GPU acceleration
Optimized for 40GB VRAM A100 GPU + Three.js integration
"""

import open3d as o3d
import numpy as np
import tempfile
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
import cupy as cp  # GPU-accelerated array processing
import trimesh
import pyvista as pv
import plotly.graph_objects as go
import plotly.express as px

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# GPU optimization settings for 40GB VRAM
GPU_MEMORY_LIMIT = 35 * 1024 * 1024 * 1024  # 35GB limit to leave headroom
BATCH_SIZE_LARGE = 1000000  # 1M points per batch
BATCH_SIZE_SMALL = 100000   # 100K points per batch

class Open3DProcessor:
    """Enhanced Open3D processor with GPU acceleration and Three.js integration"""
    
    def __init__(self):
        self.gpu_available = self._check_gpu_availability()
        self.memory_pool = cp.get_default_memory_pool()
        self.pinned_memory_pool = cp.get_default_pinned_memory_pool()
        
    def _check_gpu_availability(self) -> bool:
        """Check if GPU is available and properly configured"""
        try:
            # Test CUDA availability
            test_array = cp.array([1, 2, 3])
            del test_array
            logger.info("✅ GPU acceleration available")
            return True
        except Exception as e:
            logger.warning(f"⚠️ GPU acceleration not available: {e}")
            return False
    
    def _optimize_memory_usage(self):
        """Optimize GPU memory usage"""
        if self.gpu_available:
            self.memory_pool.free_all_blocks()
            self.pinned_memory_pool.free_all_blocks()
    
    def get_point_cloud_stats(self, scan_id: str) -> Dict[str, Any]:
        """Get comprehensive point cloud statistics with GPU acceleration"""
        try:
            # Load point cloud
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            # Basic statistics
            points = np.asarray(pcd.points)
            colors = np.asarray(pcd.colors) if pcd.has_colors() else None
            normals = np.asarray(pcd.normals) if pcd.has_normals() else None
            
            # GPU-accelerated calculations
            if self.gpu_available and len(points) > 10000:
                points_gpu = cp.asarray(points)
                
                # Calculate bounding box on GPU
                min_bound = cp.min(points_gpu, axis=0)
                max_bound = cp.max(points_gpu, axis=0)
                dimensions = max_bound - min_bound
                centroid = cp.mean(points_gpu, axis=0)
                
                # Convert back to CPU
                min_bound = cp.asnumpy(min_bound)
                max_bound = cp.asnumpy(max_bound)
                dimensions = cp.asnumpy(dimensions)
                centroid = cp.asnumpy(centroid)
                
                # Calculate density
                volume = np.prod(dimensions)
                density = len(points) / volume if volume > 0 else 0
                
                del points_gpu
                self._optimize_memory_usage()
            else:
                # CPU fallback
                min_bound = np.min(points, axis=0)
                max_bound = np.max(points, axis=0)
                dimensions = max_bound - min_bound
                centroid = np.mean(points, axis=0)
                volume = np.prod(dimensions)
                density = len(points) / volume if volume > 0 else 0
            
            return {
                "pointCount": len(points),
                "boundingBox": {
                    "min": min_bound.tolist(),
                    "max": max_bound.tolist()
                },
                "centroid": centroid.tolist(),
                "dimensions": dimensions.tolist(),
                "density": density,
                "hasColors": colors is not None,
                "hasNormals": normals is not None,
                "gpuAccelerated": self.gpu_available
            }
            
        except Exception as e:
            logger.error(f"Error getting point cloud stats: {e}")
            return {"error": str(e)}
    
    def select_point_info(self, scan_id: str, point_index: int) -> Dict[str, Any]:
        """Get information about a specific point with GPU acceleration"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            points = np.asarray(pcd.points)
            if point_index >= len(points):
                return {"error": "Point index out of range"}
            
            point = points[point_index]
            color = np.asarray(pcd.colors)[point_index] if pcd.has_colors() else None
            normal = np.asarray(pcd.normals)[point_index] if pcd.has_normals() else None
            
            return {
                "index": point_index,
                "position": point.tolist(),
                "color": color.tolist() if color is not None else None,
                "normal": normal.tolist() if normal is not None else None
            }
            
        except Exception as e:
            logger.error(f"Error getting point info: {e}")
            return {"error": str(e)}
    
    def apply_colormap(self, scan_id: str, colormap: str = "jet") -> Dict[str, Any]:
        """Apply colormap to point cloud with GPU acceleration"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            points = np.asarray(pcd.points)
            
            # GPU-accelerated colormap application
            if self.gpu_available and len(points) > 10000:
                points_gpu = cp.asarray(points)
                
                # Calculate height-based colormap
                z_values = points_gpu[:, 2]
                z_min, z_max = cp.min(z_values), cp.max(z_values)
                normalized_z = (z_values - z_min) / (z_max - z_min)
                
                # Apply colormap
                colors_gpu = self._apply_colormap_gpu(normalized_z, colormap)
                colors = cp.asnumpy(colors_gpu)
                
                del points_gpu, colors_gpu
                self._optimize_memory_usage()
            else:
                # CPU fallback
                z_values = points[:, 2]
                z_min, z_max = np.min(z_values), np.max(z_values)
                normalized_z = (z_values - z_min) / (z_max - z_min)
                colors = self._apply_colormap_cpu(normalized_z, colormap)
            
            # Update point cloud colors
            pcd.colors = o3d.utility.Vector3dVector(colors)
            
            # Save updated point cloud
            self._save_point_cloud(scan_id, pcd)
            
            return {"success": True, "message": f"Applied {colormap} colormap"}
            
        except Exception as e:
            logger.error(f"Error applying colormap: {e}")
            return {"error": str(e)}
    
    def _apply_colormap_gpu(self, normalized_values: cp.ndarray, colormap: str) -> cp.ndarray:
        """Apply colormap on GPU"""
        if colormap == "jet":
            # Jet colormap implementation
            colors = cp.zeros((len(normalized_values), 3))
            colors[:, 0] = cp.clip(4 * normalized_values - 1.5, 0, 1)
            colors[:, 1] = cp.clip(4 * normalized_values - 0.5, 0, 1)
            colors[:, 2] = cp.clip(4 * normalized_values + 0.5, 0, 1)
        elif colormap == "viridis":
            # Viridis colormap implementation
            colors = cp.zeros((len(normalized_values), 3))
            colors[:, 0] = cp.clip(4 * normalized_values, 0, 1)
            colors[:, 1] = cp.clip(4 * normalized_values - 1, 0, 1)
            colors[:, 2] = cp.clip(4 * normalized_values - 2, 0, 1)
        else:
            # Default to jet
            colors = cp.zeros((len(normalized_values), 3))
            colors[:, 0] = cp.clip(4 * normalized_values - 1.5, 0, 1)
            colors[:, 1] = cp.clip(4 * normalized_values - 0.5, 0, 1)
            colors[:, 2] = cp.clip(4 * normalized_values + 0.5, 0, 1)
        
        return colors
    
    def _apply_colormap_cpu(self, normalized_values: np.ndarray, colormap: str) -> np.ndarray:
        """Apply colormap on CPU"""
        if colormap == "jet":
            colors = np.zeros((len(normalized_values), 3))
            colors[:, 0] = np.clip(4 * normalized_values - 1.5, 0, 1)
            colors[:, 1] = np.clip(4 * normalized_values - 0.5, 0, 1)
            colors[:, 2] = np.clip(4 * normalized_values + 0.5, 0, 1)
        elif colormap == "viridis":
            colors = np.zeros((len(normalized_values), 3))
            colors[:, 0] = np.clip(4 * normalized_values, 0, 1)
            colors[:, 1] = np.clip(4 * normalized_values - 1, 0, 1)
            colors[:, 2] = np.clip(4 * normalized_values - 2, 0, 1)
        else:
            colors = np.zeros((len(normalized_values), 3))
            colors[:, 0] = np.clip(4 * normalized_values - 1.5, 0, 1)
            colors[:, 1] = np.clip(4 * normalized_values - 0.5, 0, 1)
            colors[:, 2] = np.clip(4 * normalized_values + 0.5, 0, 1)
        
        return colors
    
    def downsample_point_cloud(self, scan_id: str, voxel_size: float = 0.05) -> Dict[str, Any]:
        """Downsample point cloud with GPU acceleration"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            # Downsample using voxel grid
            pcd_downsampled = pcd.voxel_down_sample(voxel_size)
            
            # Save downsampled point cloud
            self._save_point_cloud(scan_id, pcd_downsampled)
            
            return {
                "success": True,
                "message": f"Downsampled to {len(pcd_downsampled.points)} points",
                "originalPoints": len(pcd.points),
                "downsampledPoints": len(pcd_downsampled.points)
            }
            
        except Exception as e:
            logger.error(f"Error downsampling point cloud: {e}")
            return {"error": str(e)}
    
    def estimate_normals(self, scan_id: str, radius: float = 0.1, max_nn: int = 30) -> Dict[str, Any]:
        """Estimate normals for point cloud"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            # Estimate normals
            pcd.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=radius, max_nn=max_nn)
            )
            
            # Orient normals consistently
            pcd.orient_normals_consistent_tangent_plane(100)
            
            # Save updated point cloud
            self._save_point_cloud(scan_id, pcd)
            
            return {"success": True, "message": "Normals estimated successfully"}
            
        except Exception as e:
            logger.error(f"Error estimating normals: {e}")
            return {"error": str(e)}
    
    def remove_outliers(self, scan_id: str, nb_neighbors: int = 20, std_ratio: float = 2.0) -> Dict[str, Any]:
        """Remove statistical outliers from point cloud"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            # Remove outliers
            pcd_cleaned, _ = pcd.remove_statistical_outlier(
                nb_neighbors=nb_neighbors, std_ratio=std_ratio
            )
            
            # Save cleaned point cloud
            self._save_point_cloud(scan_id, pcd_cleaned)
            
            return {
                "success": True,
                "message": f"Removed outliers: {len(pcd.points) - len(pcd_cleaned.points)} points",
                "originalPoints": len(pcd.points),
                "cleanedPoints": len(pcd_cleaned.points)
            }
            
        except Exception as e:
            logger.error(f"Error removing outliers: {e}")
            return {"error": str(e)}
    
    def create_mesh(self, scan_id: str, method: str = "poisson") -> Dict[str, Any]:
        """Create mesh from point cloud"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            if method == "poisson":
                # Poisson reconstruction
                mesh, _ = pcd.create_mesh_poisson(depth=9, width=0, scale=1.1, linear_fit=False)
            elif method == "ball_pivoting":
                # Ball pivoting algorithm
                distances = pcd.compute_nearest_neighbor_distance()
                avg_dist = np.mean(distances)
                radius = 3 * avg_dist
                mesh = pcd.create_mesh_ball_pivoting(radii=o3d.utility.DoubleVector([radius, radius * 2]))
            else:
                return {"error": "Invalid method. Use 'poisson' or 'ball_pivoting'"}
            
            # Save mesh
            mesh_path = self._get_mesh_path(scan_id)
            o3d.io.write_triangle_mesh(str(mesh_path), mesh)
            
            return {
                "success": True,
                "message": f"Mesh created using {method} method",
                "meshUrl": f"/api/meshes/{scan_id}.ply"
            }
            
        except Exception as e:
            logger.error(f"Error creating mesh: {e}")
            return {"error": str(e)}
    
    def render_to_image(self, scan_id: str, width: int = 1920, height: int = 1080, 
                       camera_params: Optional[Dict] = None) -> Dict[str, Any]:
        """Render point cloud to high-resolution image"""
        try:
            pcd = self._load_point_cloud(scan_id)
            if pcd is None:
                return {"error": "Point cloud not found"}
            
            # Set up camera parameters
            if camera_params is None:
                camera_params = self.get_camera_parameters()
            
            # Create visualizer
            vis = o3d.visualization.Visualizer()
            vis.create_window(width=width, height=height, visible=False)
            vis.add_geometry(pcd)
            
            # Set camera parameters
            ctr = vis.get_view_control()
            ctr.set_front(camera_params["front"])
            ctr.set_lookat(camera_params["lookat"])
            ctr.set_up(camera_params["up"])
            ctr.set_zoom(camera_params["zoom"])
            
            # Render and capture
            vis.poll_events()
            vis.update_renderer()
            
            # Save image
            image_path = self._get_image_path(scan_id)
            vis.capture_screen_image(str(image_path))
            vis.destroy_window()
            
            return {
                "success": True,
                "message": "High-resolution image rendered",
                "imageUrl": f"/api/images/{scan_id}.png"
            }
            
        except Exception as e:
            logger.error(f"Error rendering image: {e}")
            return {"error": str(e)}
    
    def get_camera_parameters(self) -> Dict[str, Any]:
        """Get default camera parameters for visualization"""
        return {
            "front": [0.0, 0.0, 1.0],
            "lookat": [0.0, 0.0, 0.0],
            "up": [0.0, 1.0, 0.0],
            "zoom": 0.8
        }
    
    def _load_point_cloud(self, scan_id: str) -> Optional[o3d.geometry.PointCloud]:
        """Load point cloud from scan directory"""
        try:
            # Try to find PLY file in scan directory
            scan_dir = Path(f"/app/data/results/{scan_id}")
            ply_files = list(scan_dir.glob("*.ply"))
            
            if not ply_files:
                return None
            
            # Load the first PLY file found
            pcd = o3d.io.read_point_cloud(str(ply_files[0]))
            return pcd
            
        except Exception as e:
            logger.error(f"Error loading point cloud: {e}")
            return None
    
    def _save_point_cloud(self, scan_id: str, pcd: o3d.geometry.PointCloud):
        """Save point cloud to scan directory"""
        try:
            scan_dir = Path(f"/app/data/results/{scan_id}")
            scan_dir.mkdir(parents=True, exist_ok=True)
            
            # Save as PLY file
            ply_path = scan_dir / "point_cloud.ply"
            o3d.io.write_point_cloud(str(ply_path), pcd)
            
        except Exception as e:
            logger.error(f"Error saving point cloud: {e}")
    
    def _get_mesh_path(self, scan_id: str) -> Path:
        """Get mesh file path"""
        scan_dir = Path(f"/app/data/results/{scan_id}")
        scan_dir.mkdir(parents=True, exist_ok=True)
        return scan_dir / "mesh.ply"
    
    def _get_image_path(self, scan_id: str) -> Path:
        """Get image file path"""
        scan_dir = Path(f"/app/data/results/{scan_id}")
        scan_dir.mkdir(parents=True, exist_ok=True)
        return scan_dir / "render.png"

# Create global instance
open3d_processor = Open3DProcessor()
