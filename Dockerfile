# ========================================
# COLMAP Backend - USE NEW PRE-BUILT IMAGE
# Image includes: open3d_utils.py, demo-resources/
# Build: 2025-10-24T06:30:00Z
# ========================================

FROM ghcr.io/marco-interact/colmap-mvp@sha256:ef92def84a997ef34a5b23b99f427a05759f21277da8a99765d9b3cf79cfde65

# This image contains:
# ✅ CUDA 12.2.0 runtime
# ✅ Python 3.11 + all dependencies (Open3D, FastAPI, etc.)
# ✅ COLMAP (pre-built from apt)
# ✅ open3d_utils.py - Open3D processor functions
# ✅ demo-resources/ - All PLY and GLB files
# ✅ main.py - With startup handler that auto-creates demo data
# ✅ database.py - With demo setup functions
# ✅ Startup event that auto-initializes demo data

# No additional setup needed - image is ready to run