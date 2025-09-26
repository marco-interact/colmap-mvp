FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Cloud Run optimization
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    procps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

# Install Python dependencies
COPY requirements-worker.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-worker.txt

# Copy application
COPY main.py .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables for Cloud Run
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Expose port (Cloud Run will inject PORT env var)
EXPOSE $PORT

# Run application with Cloud Run optimizations
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
