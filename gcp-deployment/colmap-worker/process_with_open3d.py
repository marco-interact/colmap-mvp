#!/usr/bin/env python3
"""
Open3D Post-Processing Pipeline for COLMAP Reconstruction
Enhances point clouds and meshes for optimal web rendering performance.

Pipeline Steps:
1. Load COLMAP outputs (fused.ply, meshed-poisson.ply, meshed-textured.obj)
2. Point Cloud Processing: voxel downsampling, outlier removal, normal estimation
3. Mesh Optimization: quadric decimation, smoothing, UV optimization
4. Export optimized assets for web viewer consumption
5. Generate metadata for API serving

Usage:
    python process_with_open3d.py --input /path/to/colmap/output --output /path/to/processed
"""

import argparse
import json
import logging
import os
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import open3d as o3d

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class Open3DProcessor:
    """Main processor for Open3D optimization pipeline."""
    
    def __init__(self, config: Optional[Dict] = None):
        """Initialize processor with configuration parameters."""
        self.config = config or self.get_default_config()
        
    def get_default_config(self) -> Dict:
        """Get default processing configuration."""
        return {
            'point_cloud': {
                'target_points': 1000000,  # 1M points max for web
                'voxel_size': 0.01,        # Adaptive based on bounding box
                'outlier_nb_neighbors': 20,
                'outlier_std_ratio': 2.0,
                'normal_radius': 0.1,
                'normal_max_nn': 30
            },
            'mesh': {
                'decimation_target_triangles': 500000,  # 500K triangles max
                'smooth_iterations': 1,
                'texture_max_resolution': 2048,
                'generate_uvs': True
            },
            'export': {
                'formats': ['ply', 'glb', 'obj'],
                'compression': True,
                'binary_ply': True
            }
        }
    
    def process_reconstruction(
        self, 
        input_dir: str, 
        output_dir: str,
        scan_id: str
    ) -> Dict:
        """
        Process COLMAP reconstruction outputs with Open3D.
        
        Args:
            input_dir: Directory containing COLMAP outputs
            output_dir: Directory for processed outputs
            scan_id: Unique scan identifier
            
        Returns:
            Dictionary with processing results and file paths
        """
        start_time = time.time()
        results = {
            'scan_id': scan_id,
            'processing_started': time.strftime('%Y-%m-%d %H:%M:%S'),
            'original_files': {},
            'processed_files': {},
            'metrics': {},
            'errors': []
        }
        
        # Create output directory structure
        output_path = Path(output_dir)
        processed_dir = output_path / 'processed'
        processed_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            # Process point cloud
            pc_result = self.process_point_cloud(input_dir, processed_dir, scan_id)
            results['processed_files'].update(pc_result.get('files', {}))
            results['metrics'].update(pc_result.get('metrics', {}))
            
            # Process mesh
            mesh_result = self.process_mesh(input_dir, processed_dir, scan_id)
            results['processed_files'].update(mesh_result.get('files', {}))
            results['metrics'].update(mesh_result.get('metrics', {}))
            
            # Generate metadata
            metadata_path = processed_dir / f'{scan_id}_metadata.json'
            with open(metadata_path, 'w') as f:
                json.dump(results, f, indent=2)
            
            results['processing_time'] = time.time() - start_time
            results['status'] = 'completed'
            
            logger.info(f"Processing completed for scan {scan_id} in {results['processing_time']:.2f}s")
            
        except Exception as e:
            logger.error(f"Processing failed for scan {scan_id}: {str(e)}")
            results['errors'].append(str(e))
            results['status'] = 'failed'
        
        return results
    
    def process_point_cloud(self, input_dir: str, output_dir: Path, scan_id: str) -> Dict:
        """Process point cloud with Open3D optimization."""
        logger.info(f"Processing point cloud for scan {scan_id}")
        
        # Look for COLMAP point cloud outputs
        input_path = Path(input_dir)
        point_cloud_files = [
            input_path / 'dense' / 'fused.ply',
            input_path / 'dense' / 'points.ply', 
            input_path / 'sparse' / 'points3D.ply'
        ]
        
        source_file = None
        for pc_file in point_cloud_files:
            if pc_file.exists():
                source_file = pc_file
                break
        
        if not source_file:
            logger.warning(f"No point cloud file found for scan {scan_id}")
            return {'files': {}, 'metrics': {}}
        
        try:
            # Load point cloud
            logger.info(f"Loading point cloud from {source_file}")
            pcd = o3d.io.read_point_cloud(str(source_file))
            
            original_points = len(pcd.points)
            logger.info(f"Original point cloud: {original_points:,} points")
            
            if original_points == 0:
                logger.warning("Empty point cloud loaded")
                return {'files': {}, 'metrics': {}}
            
            # Calculate adaptive voxel size based on bounding box
            bbox = pcd.get_axis_aligned_bounding_box()
            bbox_size = bbox.get_max_bound() - bbox.get_min_bound()
            max_dimension = np.max(bbox_size)
            
            # Adaptive voxel size: aim for target number of points
            target_points = self.config['point_cloud']['target_points']
            if original_points > target_points:
                # Estimate voxel size to achieve target points
                volume_ratio = target_points / original_points
                linear_ratio = volume_ratio ** (1/3)
                adaptive_voxel_size = max_dimension * (1 - linear_ratio) * 0.1
                voxel_size = max(adaptive_voxel_size, max_dimension / 1000)  # Min voxel size
            else:
                voxel_size = self.config['point_cloud']['voxel_size']
            
            logger.info(f"Using voxel size: {voxel_size:.6f}")
            
            # Step 1: Voxel downsampling
            if original_points > target_points:
                logger.info("Applying voxel downsampling...")
                pcd = pcd.voxel_down_sample(voxel_size)
                logger.info(f"After downsampling: {len(pcd.points):,} points")
            
            # Step 2: Statistical outlier removal
            logger.info("Removing statistical outliers...")
            pcd, outlier_indices = pcd.remove_statistical_outlier(
                nb_neighbors=self.config['point_cloud']['outlier_nb_neighbors'],
                std_ratio=self.config['point_cloud']['outlier_std_ratio']
            )
            outliers_removed = len(outlier_indices)
            logger.info(f"Removed {outliers_removed:,} outliers: {len(pcd.points):,} points remaining")
            
            # Step 3: Normal estimation
            logger.info("Estimating normals...")
            pcd.estimate_normals(
                search_param=o3d.geometry.KDTreeSearchParamHybrid(
                    radius=self.config['point_cloud']['normal_radius'],
                    max_nn=self.config['point_cloud']['normal_max_nn']
                )
            )
            
            # Step 4: Orient normals consistently
            if len(pcd.normals) > 0:
                pcd.orient_normals_consistent_tangent_plane(100)
            
            # Export processed point cloud
            output_files = {}
            metrics = {
                'original_points': original_points,
                'processed_points': len(pcd.points),
                'compression_ratio': len(pcd.points) / original_points if original_points > 0 else 0,
                'outliers_removed': outliers_removed,
                'voxel_size_used': voxel_size
            }
            
            # Export in multiple formats
            formats = self.config['export']['formats']
            
            if 'ply' in formats:
                ply_path = output_dir / f'{scan_id}_pointcloud_optimized.ply'
                success = o3d.io.write_point_cloud(
                    str(ply_path), 
                    pcd, 
                    write_ascii=not self.config['export']['binary_ply']
                )
                if success:
                    output_files['pointcloud_ply'] = str(ply_path)
                    logger.info(f"Exported PLY: {ply_path}")
            
            if 'pcd' in formats:
                pcd_path = output_dir / f'{scan_id}_pointcloud_optimized.pcd'
                success = o3d.io.write_point_cloud(str(pcd_path), pcd)
                if success:
                    output_files['pointcloud_pcd'] = str(pcd_path)
                    logger.info(f"Exported PCD: {pcd_path}")
            
            return {'files': output_files, 'metrics': metrics}
            
        except Exception as e:
            logger.error(f"Point cloud processing failed: {str(e)}")
            raise e
    
    def process_mesh(self, input_dir: str, output_dir: Path, scan_id: str) -> Dict:
        """Process mesh with Open3D optimization."""
        logger.info(f"Processing mesh for scan {scan_id}")
        
        # Look for COLMAP mesh outputs
        input_path = Path(input_dir)
        mesh_files = [
            input_path / 'dense' / 'meshed-poisson.ply',
            input_path / 'dense' / 'meshed-textured.obj',
            input_path / 'dense' / 'meshed.ply'
        ]
        
        source_file = None
        for mesh_file in mesh_files:
            if mesh_file.exists():
                source_file = mesh_file
                break
        
        if not source_file:
            logger.warning(f"No mesh file found for scan {scan_id}")
            return {'files': {}, 'metrics': {}}
        
        try:
            # Load mesh
            logger.info(f"Loading mesh from {source_file}")
            mesh = o3d.io.read_triangle_mesh(str(source_file))
            
            original_vertices = len(mesh.vertices)
            original_triangles = len(mesh.triangles)
            
            logger.info(f"Original mesh: {original_vertices:,} vertices, {original_triangles:,} triangles")
            
            if original_triangles == 0:
                logger.warning("Empty mesh loaded")
                return {'files': {}, 'metrics': {}}
            
            # Step 1: Remove degenerate triangles
            mesh.remove_degenerate_triangles()
            mesh.remove_duplicated_triangles()
            mesh.remove_duplicated_vertices()
            mesh.remove_non_manifold_edges()
            
            # Step 2: Mesh decimation if needed
            target_triangles = self.config['mesh']['decimation_target_triangles']
            if original_triangles > target_triangles:
                logger.info(f"Decimating mesh to {target_triangles:,} triangles...")
                mesh = mesh.simplify_quadric_decimation(target_triangles)
                logger.info(f"After decimation: {len(mesh.vertices):,} vertices, {len(mesh.triangles):,} triangles")
            
            # Step 3: Smooth mesh
            smooth_iterations = self.config['mesh']['smooth_iterations']
            if smooth_iterations > 0:
                logger.info(f"Smoothing mesh ({smooth_iterations} iterations)...")
                mesh = mesh.filter_smooth_laplacian(smooth_iterations)
            
            # Step 4: Compute vertex normals
            mesh.compute_vertex_normals()
            
            # Step 5: Generate UVs if requested and not present
            if self.config['mesh']['generate_uvs'] and len(mesh.triangle_uvs) == 0:
                logger.info("Generating UV coordinates...")
                # Note: Open3D doesn't have built-in UV unwrapping
                # This would require additional libraries like Blender's bmesh or pymeshlab
                pass
            
            # Export processed mesh
            output_files = {}
            metrics = {
                'original_vertices': original_vertices,
                'original_triangles': original_triangles,
                'processed_vertices': len(mesh.vertices),
                'processed_triangles': len(mesh.triangles),
                'vertex_compression_ratio': len(mesh.vertices) / original_vertices if original_vertices > 0 else 0,
                'triangle_compression_ratio': len(mesh.triangles) / original_triangles if original_triangles > 0 else 0
            }
            
            # Export in multiple formats
            formats = self.config['export']['formats']
            
            if 'ply' in formats:
                ply_path = output_dir / f'{scan_id}_mesh_optimized.ply'
                success = o3d.io.write_triangle_mesh(str(ply_path), mesh)
                if success:
                    output_files['mesh_ply'] = str(ply_path)
                    logger.info(f"Exported PLY mesh: {ply_path}")
            
            if 'obj' in formats:
                obj_path = output_dir / f'{scan_id}_mesh_optimized.obj'
                success = o3d.io.write_triangle_mesh(str(obj_path), mesh)
                if success:
                    output_files['mesh_obj'] = str(obj_path)
                    logger.info(f"Exported OBJ mesh: {obj_path}")
            
            if 'glb' in formats:
                # Open3D doesn't support GLB export directly
                # Would need to use other libraries like trimesh or pygltflib
                logger.info("GLB export not yet implemented (requires additional libraries)")
            
            return {'files': output_files, 'metrics': metrics}
            
        except Exception as e:
            logger.error(f"Mesh processing failed: {str(e)}")
            raise e

def main():
    """Command-line interface for Open3D post-processing."""
    parser = argparse.ArgumentParser(
        description='Open3D Post-Processing Pipeline for COLMAP Reconstruction'
    )
    parser.add_argument(
        '--input', 
        required=True,
        help='Input directory containing COLMAP reconstruction outputs'
    )
    parser.add_argument(
        '--output',
        required=True, 
        help='Output directory for processed files'
    )
    parser.add_argument(
        '--scan-id',
        default='scan',
        help='Unique scan identifier'
    )
    parser.add_argument(
        '--config',
        help='JSON configuration file path'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load configuration if provided
    config = None
    if args.config and os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config = json.load(f)
    
    # Initialize processor
    processor = Open3DProcessor(config)
    
    # Process reconstruction
    results = processor.process_reconstruction(
        args.input,
        args.output, 
        args.scan_id
    )
    
    # Print results
    print("\n" + "="*50)
    print("OPEN3D PROCESSING RESULTS")
    print("="*50)
    print(f"Scan ID: {results['scan_id']}")
    print(f"Status: {results['status']}")
    print(f"Processing Time: {results.get('processing_time', 0):.2f}s")
    
    if results.get('metrics'):
        print("\nMetrics:")
        for key, value in results['metrics'].items():
            if isinstance(value, float):
                print(f"  {key}: {value:.4f}")
            else:
                print(f"  {key}: {value:,}")
    
    if results.get('processed_files'):
        print("\nProcessed Files:")
        for key, path in results['processed_files'].items():
            print(f"  {key}: {path}")
    
    if results.get('errors'):
        print("\nErrors:")
        for error in results['errors']:
            print(f"  - {error}")
    
    print("="*50)
    
    # Exit with appropriate code
    exit(0 if results['status'] == 'completed' else 1)

if __name__ == '__main__':
    main()
