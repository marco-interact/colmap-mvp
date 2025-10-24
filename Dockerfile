# ========================================
# COLMAP Backend - COMPLETE REBUILD
# Includes: open3d_utils.py, demo-resources/
# Build: 2025-10-24T05:45:00Z
# ========================================

FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

# Set working directory
WORKDIR /app

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV FORCE_REBUILD=20251024_0545

# Install system dependencies (smaller, faster than building from source)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    python3-dev \
    colmap \
    libopencv-dev \
    python3-opencv \
    ffmpeg \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY database.py .
COPY open3d_utils.py .

# Copy demo resources (baked into image)
COPY demo-resources/ /app/demo-resources/

# Create data directories (will be overridden by persistent volume)
RUN mkdir -p /app/data/results /app/data/cache /app/data/uploads

# GPU environment variables
ENV CUDA_VISIBLE_DEVICES=0
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Expose port
EXPOSE 8000

# Run application
CMD ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
