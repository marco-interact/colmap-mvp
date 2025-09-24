# COLMAP Worker Service - Docker Container
# This container runs COLMAP 3.12.6 for 3D reconstruction processing

FROM python:3.11-slim

# Install system dependencies for COLMAP and OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libeigen3-dev \
    libopencv-dev \
    libceres-dev \
    libgoogle-glog-dev \
    libgflags-dev \
    libblas-dev \
    liblapack-dev \
    libatlas-base-dev \
    libsuitesparse-dev \
    qtbase5-dev \
    libqt5opengl5-dev \
    libcgal-dev \
    libcgal-qt5-dev \
    libboost-all-dev \
    libfreeimage-dev \
    libmetis-dev \
    libgmp-dev \
    libmpfr-dev \
    wget \
    unzip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Download and compile COLMAP 3.12.6
WORKDIR /tmp
RUN wget -q https://github.com/colmap/colmap/archive/refs/tags/3.12.tar.gz \
    && tar -xzf 3.12.tar.gz \
    && cd colmap-3.12 \
    && mkdir build && cd build \
    && cmake .. -DCMAKE_BUILD_TYPE=Release \
    && make -j$(nproc) \
    && make install \
    && cd / && rm -rf /tmp/colmap-3.12*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for processing
RUN mkdir -p /app/uploads /app/outputs /app/temp

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
