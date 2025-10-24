# ========================================
# NUCLEAR SOLUTION: Use Pre-built Image
# Avoids Northflank I/O errors completely
# Build: 2025-10-24T08:50:00Z - NUCLEAR REBUILD
# ========================================

# Use pre-built image from GitHub Container Registry
# This completely avoids Northflank build I/O errors
FROM ghcr.io/marco-interact/colmap-mvp:latest

# This image already contains:
# ✅ CUDA 12.2.0 runtime
# ✅ Python 3.11 + all dependencies
# ✅ COLMAP (pre-built from apt)
# ✅ Open3D with GPU acceleration
# ✅ All application code (main.py, database.py, open3d_utils.py)
# ✅ Demo resources (PLY and GLB files)
# ✅ Startup event that auto-initializes demo data
# ✅ GPU optimization for 40GB VRAM
# No additional setup needed - image is ready to run