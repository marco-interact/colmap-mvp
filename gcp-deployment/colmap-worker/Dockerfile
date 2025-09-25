FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install fastapi uvicorn pydantic python-multipart

# Copy application
COPY main_simple.py .

# Set environment
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8080

# Run application
CMD ["uvicorn", "main_simple:app", "--host", "0.0.0.0", "--port", "8080"]
