FROM python:3.11-slim

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

# Install dependencies
COPY requirements-worker.txt .
RUN pip install --no-cache-dir -r requirements-worker.txt

# Copy application
COPY main_simple.py .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8080

# Run application
CMD ["uvicorn", "main_simple:app", "--host", "0.0.0.0", "--port", "8080"]
