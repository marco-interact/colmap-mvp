"""
Configuration settings for the 3D Visualization Platform
"""

from typing import List, Optional, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8000",
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "3d_platform"
    POSTGRES_PORT: str = "5432"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # File Storage Configuration
    UPLOAD_DIR: str = "/app/uploads"
    OUTPUT_DIR: str = "/app/output"
    TEMP_DIR: str = "/app/temp"
    MAX_FILE_SIZE: int = 500 * 1024 * 1024  # 500MB
    
    # COLMAP Configuration
    COLMAP_BINARY_PATH: str = "/usr/local/bin/colmap"
    COLMAP_WORKSPACE_DIR: str = "/app/colmap_workspace"
    COLMAP_MAX_IMAGE_SIZE: int = 1600
    COLMAP_QUALITY: str = "medium"  # low, medium, high, extreme
    
    # Processing Configuration
    FRAME_EXTRACTION_INTERVAL: float = 1.0  # seconds
    MAX_CONCURRENT_JOBS: int = 4
    JOB_TIMEOUT: int = 3600  # 1 hour
    
    # Security Configuration
    ALLOWED_VIDEO_FORMATS: List[str] = ["mp4", "avi", "mov", "mkv"]
    ALLOWED_IMAGE_FORMATS: List[str] = ["jpg", "jpeg", "png", "tiff"]
    
    # AWS Configuration (for production)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()




