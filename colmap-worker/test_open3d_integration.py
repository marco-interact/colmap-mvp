#!/usr/bin/env python3
"""
Test script for Open3D integration with COLMAP pipeline
Creates sample data and validates the processing workflow
"""

import json
import tempfile
import shutil
from pathlib import Path
import time
import numpy as np

try:
    import open3d as o3d
    from process_with_open3d import Open3DProcessor
    OPEN3D_AVAILABLE = True
except ImportError as e:
    print(f"Open3D not available: {e}")
    OPEN3D_AVAILABLE = False

def create_sample_point_cloud(num_points: int = 10000) -> o3d.geometry.PointCloud:
    """Create a sample point cloud for testing."""
    # Create a sphere of points with some noise
    phi = np.random.uniform(0, 2 * np.pi, num_points)
    costheta = np.random.uniform(-1, 1, num_points)
    theta = np.arccos(costheta)
    
    r = np.random.normal(1.0, 0.1, num_points)  # Add noise to radius
    
    x = r * np.sin(theta) * np.cos(phi)
    y = r * np.sin(theta) * np.sin(phi)
    z = r * np.cos(theta)
    
    points = np.column_stack((x, y, z))
    
    # Add some outliers
    num_outliers = int(num_points * 0.05)  # 5% outliers
    outlier_indices = np.random.choice(num_points, num_outliers, replace=False)
    for idx in outlier_indices:
        points[idx] = np.random.uniform(-3, 3, 3)  # Random outliers
    
    # Create colors (gradient based on height)
    colors = np.zeros_like(points)
    colors[:, 0] = (z - z.min()) / (z.max() - z.min())  # Red channel
    colors[:, 1] = 0.5  # Green channel
    colors[:, 2] = 1 - colors[:, 0]  # Blue channel
    
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.colors = o3d.utility.Vector3dVector(colors)
    
    return pcd

def create_sample_mesh() -> o3d.geometry.TriangleMesh:
    """Create a sample mesh for testing."""
    # Create a UV sphere mesh
    mesh = o3d.geometry.TriangleMesh.create_sphere(radius=1.0, resolution=50)
    mesh.compute_vertex_normals()
    
    # Add some vertex colors
    vertices = np.asarray(mesh.vertices)
    colors = np.zeros_like(vertices)
    colors[:, 0] = (vertices[:, 2] - vertices[:, 2].min()) / (vertices[:, 2].max() - vertices[:, 2].min())
    colors[:, 1] = 0.5
    colors[:, 2] = 1 - colors[:, 0]
    mesh.vertex_colors = o3d.utility.Vector3dVector(colors)
    
    return mesh

def test_open3d_integration():
    """Test the complete Open3D integration workflow."""
    print("="*60)
    print("TESTING OPEN3D INTEGRATION")
    print("="*60)
    
    if not OPEN3D_AVAILABLE:
        print("❌ Open3D not available - cannot run tests")
        return False
    
    print("✅ Open3D available")
    
    # Create temporary directory structure
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Set up directory structure similar to COLMAP output
        input_dir = temp_path / "input"
        dense_dir = input_dir / "dense"
        sparse_dir = input_dir / "sparse"
        
        dense_dir.mkdir(parents=True)
        sparse_dir.mkdir(parents=True)
        
        print(f"📁 Created test directories in {temp_path}")
        
        # 1. Create sample point cloud (simulating COLMAP dense reconstruction)
        print("🔄 Creating sample point cloud...")
        sample_pcd = create_sample_point_cloud(50000)  # 50K points
        dense_ply_path = dense_dir / "fused.ply"
        o3d.io.write_point_cloud(str(dense_ply_path), sample_pcd)
        print(f"✅ Sample point cloud saved: {dense_ply_path}")
        
        # 2. Create sample mesh (simulating COLMAP meshing)
        print("🔄 Creating sample mesh...")
        sample_mesh = create_sample_mesh()
        mesh_ply_path = dense_dir / "meshed-poisson.ply"
        o3d.io.write_triangle_mesh(str(mesh_ply_path), sample_mesh)
        print(f"✅ Sample mesh saved: {mesh_ply_path}")
        
        # 3. Test Open3D processor
        print("🔄 Initializing Open3D processor...")
        config = {
            'point_cloud': {
                'target_points': 25000,  # Downsample to 25K
                'outlier_std_ratio': 1.5
            },
            'mesh': {
                'decimation_target_triangles': 1000
            }
        }
        processor = Open3DProcessor(config)
        print("✅ Open3D processor initialized")
        
        # 4. Run processing
        print("🔄 Running Open3D processing...")
        start_time = time.time()
        
        results = processor.process_reconstruction(
            str(input_dir),
            str(temp_path),
            "test_scan"
        )
        
        processing_time = time.time() - start_time
        print(f"✅ Processing completed in {processing_time:.2f}s")
        
        # 5. Validate results
        print("🔄 Validating results...")
        
        if results['status'] == 'completed':
            print("✅ Processing status: COMPLETED")
            
            # Check metrics
            metrics = results.get('metrics', {})
            if metrics:
                print("\n📊 Processing Metrics:")
                for key, value in metrics.items():
                    if isinstance(value, float):
                        print(f"   {key}: {value:.4f}")
                    else:
                        print(f"   {key}: {value:,}")
            
            # Check output files
            processed_files = results.get('processed_files', {})
            if processed_files:
                print("\n📁 Generated Files:")
                for key, path in processed_files.items():
                    file_path = Path(path)
                    if file_path.exists():
                        size_mb = file_path.stat().st_size / (1024 * 1024)
                        print(f"   ✅ {key}: {file_path.name} ({size_mb:.2f} MB)")
                    else:
                        print(f"   ❌ {key}: {file_path.name} (NOT FOUND)")
            
            # Test file loading
            print("\n🔄 Validating optimized files...")
            processed_dir = temp_path / 'processed'
            
            optimized_pcd_path = processed_dir / 'test_scan_pointcloud_optimized.ply'
            if optimized_pcd_path.exists():
                try:
                    optimized_pcd = o3d.io.read_point_cloud(str(optimized_pcd_path))
                    print(f"   ✅ Optimized point cloud: {len(optimized_pcd.points):,} points")
                except Exception as e:
                    print(f"   ❌ Failed to load optimized point cloud: {e}")
            
            optimized_mesh_path = processed_dir / 'test_scan_mesh_optimized.ply'
            if optimized_mesh_path.exists():
                try:
                    optimized_mesh = o3d.io.read_triangle_mesh(str(optimized_mesh_path))
                    print(f"   ✅ Optimized mesh: {len(optimized_mesh.vertices):,} vertices, {len(optimized_mesh.triangles):,} triangles")
                except Exception as e:
                    print(f"   ❌ Failed to load optimized mesh: {e}")
            
            print("\n🎉 Open3D integration test PASSED!")
            return True
            
        else:
            print(f"❌ Processing failed: {results.get('errors', ['Unknown error'])}")
            return False

def test_configuration_profiles():
    """Test different quality profiles for Open3D processing."""
    if not OPEN3D_AVAILABLE:
        return
    
    print("\n" + "="*60)
    print("TESTING CONFIGURATION PROFILES")
    print("="*60)
    
    # Load configuration
    config_path = Path(__file__).parent / "open3d_config.json"
    if config_path.exists():
        with open(config_path) as f:
            full_config = json.load(f)
        
        profiles = full_config.get('quality_profiles', {})
        print(f"📋 Found {len(profiles)} quality profiles:")
        
        for profile_name, profile_config in profiles.items():
            pc_config = profile_config.get('point_cloud', {})
            mesh_config = profile_config.get('mesh', {})
            
            print(f"\n   {profile_name}:")
            print(f"      Point Cloud: {pc_config.get('target_points', 'N/A'):,} points")
            print(f"      Mesh: {mesh_config.get('decimation_target_triangles', 'N/A'):,} triangles")
        
        print("\n✅ Configuration profiles loaded successfully")
    else:
        print("❌ Configuration file not found")

def main():
    """Run all tests."""
    print("COLMAP + Open3D Integration Test Suite")
    print("Validating the complete processing pipeline\n")
    
    # Test 1: Basic integration
    success = test_open3d_integration()
    
    # Test 2: Configuration profiles
    test_configuration_profiles()
    
    print("\n" + "="*60)
    if success:
        print("🎉 ALL TESTS PASSED - Open3D integration is working correctly!")
        print("\nNext steps:")
        print("1. Build Docker container: docker build -f Dockerfile.open3d -t colmap-open3d .")
        print("2. Test API endpoints")
        print("3. Integrate with frontend 3D viewer")
    else:
        print("❌ TESTS FAILED - Please check the errors above")
    print("="*60)

if __name__ == "__main__":
    main()
