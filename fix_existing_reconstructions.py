#!/usr/bin/env python3
"""
Re-export existing sparse reconstructions to pick the best model (with most points).
This fixes reconstructions that were exported from the wrong sparse model directory.
"""

import subprocess
import sys
from pathlib import Path
import zipfile

def find_best_sparse_model(sparse_zip_path):
    """Find the sparse model directory with the most points"""
    if not sparse_zip_path.exists():
        return None
    
    # Extract zip to temporary directory
    temp_dir = sparse_zip_path.parent / "temp_sparse"
    temp_dir.mkdir(exist_ok=True)
    
    with zipfile.ZipFile(sparse_zip_path, 'r') as zip_ref:
        zip_ref.extractall(temp_dir)
    
    # Find all sparse models
    sparse_dir = temp_dir / "sparse"
    if not sparse_dir.exists():
        return None
    
    models = []
    for d in sparse_dir.iterdir():
        if d.is_dir():
            points_file = d / "points3D.bin"
            if points_file.exists():
                size = points_file.stat().st_size
                models.append((d, size))
                print(f"  Found model {d.name}: {size} bytes")
    
    if not models:
        return None
    
    # Return path to best model
    best_model = max(models, key=lambda x: x[1])
    print(f"  ✓ Best model: {best_model[0].name} ({best_model[1]} bytes)")
    return best_model[0]

def export_to_ply(model_dir, output_path):
    """Export COLMAP model to PLY"""
    cmd = [
        "colmap", "model_converter",
        "--input_path", str(model_dir),
        "--output_path", str(output_path),
        "--output_type", "PLY"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ✗ Export failed: {result.stderr}")
        return False
    
    if output_path.exists():
        size = output_path.stat().st_size
        print(f"  ✓ Exported PLY: {size} bytes")
        return True
    return False

def main():
    results_dir = Path("data/results")
    
    if not results_dir.exists():
        print("❌ Results directory not found")
        return
    
    print("🔧 Re-exporting sparse reconstructions with best models\n")
    
    fixed_count = 0
    for job_dir in results_dir.iterdir():
        if not job_dir.is_dir():
            continue
        
        sparse_zip = job_dir / "sparse_model.zip"
        ply_file = job_dir / "point_cloud.ply"
        
        if not sparse_zip.exists():
            continue
        
        print(f"Processing: {job_dir.name}")
        
        # Get current PLY size
        current_size = ply_file.stat().st_size if ply_file.exists() else 0
        print(f"  Current PLY: {current_size} bytes")
        
        # Find best model
        best_model = find_best_sparse_model(sparse_zip)
        if not best_model:
            print(f"  ✗ No valid sparse model found")
            continue
        
        # Export to new PLY
        new_ply = job_dir / "point_cloud_new.ply"
        if export_to_ply(best_model, new_ply):
            new_size = new_ply.stat().st_size
            
            # Only replace if new version is significantly better
            if current_size == 0 or new_size > current_size * 1.5:  # At least 50% more points
                if ply_file.exists():
                    ply_file.rename(job_dir / "point_cloud_old.ply")
                new_ply.rename(ply_file)
                if current_size > 0:
                    print(f"  ✅ UPGRADED: {current_size} → {new_size} bytes ({new_size/current_size:.1f}x)")
                else:
                    print(f"  ✅ CREATED: {new_size} bytes (was missing)")
                fixed_count += 1
            else:
                new_ply.unlink()
                print(f"  ℹ️  No significant improvement")
        
        # Cleanup temp directory
        temp_dir = job_dir / "temp_sparse"
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir)
        
        print()
    
    print(f"\n✅ Fixed {fixed_count} reconstructions")

if __name__ == "__main__":
    main()

