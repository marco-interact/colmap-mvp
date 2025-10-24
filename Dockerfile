# ========================================
# ULTIMATE SOLUTION: Minimal Dockerfile
# Just run the app - no building, no I/O errors
# ========================================

FROM python:3.11-slim

WORKDIR /app

# Install only essential dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY database.py .
COPY open3d_utils.py .

# Copy demo resources
COPY demo-resources/ /app/demo-resources/

# Create directories
RUN mkdir -p /app/data/results /app/data/cache /app/data/uploads

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV STORAGE_DIR=/app/data/results
ENV DATABASE_PATH=/app/data/database.db
ENV CACHE_DIR=/app/data/cache
ENV UPLOADS_DIR=/app/data/uploads

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]