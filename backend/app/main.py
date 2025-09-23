"""
3D Visualization and Modeling Platform - FastAPI Application
Main application entry point with COLMAP integration
"""

from fastapi import FastAPI, HTTPException, Request  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from fastapi.staticfiles import StaticFiles  # pyright: ignore[reportMissingImports]
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
import os
import logging

from app.demo_auth import router as demo_auth_router
from app.api.api_v1 import projects, files, jobs
# from app.core.config import settings  # Disabled for local dev
# from app.core.database import init_db  # Disabled for local dev

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LargeFileMiddleware(BaseHTTPMiddleware):
    """Middleware to handle large file uploads up to 1GB."""
    
    async def dispatch(self, request: Request, call_next):
        # Set maximum content length to 1GB
        if hasattr(request, 'headers'):
            content_length = request.headers.get('content-length')
            if content_length and int(content_length) > 1024 * 1024 * 1024:  # 1GB
                return HTTPException(status_code=413, detail="File too large")
        
        response = await call_next(request)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting 3D Visualization Platform...")
    # await init_db()  # Disabled for local dev
    
    # Create necessary directories
    # os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    # os.makedirs(settings.TEMP_DIR, exist_ok=True)
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down 3D Visualization Platform...")


# Create FastAPI application
app = FastAPI(
    title="3D Visualization and Modeling Platform",
    description="A comprehensive 3D reconstruction platform using COLMAP",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",  # f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure maximum file upload size (1GB)
MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB

# Add large file middleware
app.add_middleware(LargeFileMiddleware)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],  # settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include demo authentication router
app.include_router(demo_auth_router, prefix="/api/v1")

# Include API routers for demo
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(files.router, prefix="/api/v1", tags=["files"])
app.include_router(jobs.router, prefix="/api/v1", tags=["jobs"])

# Mount static files for serving 3D models
# app.mount("/static", StaticFiles(directory=settings.OUTPUT_DIR), name="static")  # Disabled for local dev


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "3D Visualization and Modeling Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api/v1"  # settings.API_V1_STR
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "service": "3d-modeling-platform"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        # Configure for large file uploads
        limit_max_requests=1000,
        timeout_keep_alive=30,
        # Allow large request bodies (1GB)
        limit_concurrency=1000
    )
