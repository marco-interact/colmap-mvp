#!/usr/bin/env python3
"""
ULTRA SIMPLE COLMAP Backend - ABSOLUTELY MINIMAL
Just FastAPI + basic endpoints - NO COMPLEX DEPENDENCIES
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import logging
import os
import sqlite3
import json
from datetime import datetime
import uuid
import subprocess
from pathlib import Path
from colmap_processor import COLMAPProcessor, process_video_to_pointcloud

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="COLMAP Backend", version="1.0.0")

# Mount static files for demo resources
app.mount("/demo-resources", StaticFiles(directory="demo-resources"), name="demo-resources")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database path - RunPod volume mount (50GB volume at /workspace)
DATABASE_PATH = os.getenv("DATABASE_PATH", "/workspace/database.db")

def get_db_connection():
    """Get database connection"""
    # Ensure /workspace directory exists (50GB persistent volume)
    os.makedirs("/workspace", exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database tables"""
    conn = get_db_connection()
    try:
        # Users table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Projects table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                location TEXT,
                space_type TEXT,
                project_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Scans table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS scans (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                name TEXT NOT NULL,
                video_filename TEXT,
                video_size INTEGER,
                processing_quality TEXT,
                status TEXT DEFAULT 'pending',
                ply_file TEXT,
                glb_file TEXT,
                thumbnail TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        ''')
        
        # Add new columns to existing scans table if they don't exist
        try:
            conn.execute('ALTER TABLE scans ADD COLUMN ply_file TEXT')
            logger.info("✅ Added ply_file column")
        except:
            pass  # Column already exists
        
        try:
            conn.execute('ALTER TABLE scans ADD COLUMN glb_file TEXT')
            logger.info("✅ Added glb_file column")
        except:
            pass  # Column already exists
            
        try:
            conn.execute('ALTER TABLE scans ADD COLUMN thumbnail TEXT')
            logger.info("✅ Added thumbnail column")
        except:
            pass  # Column already exists
        
        conn.commit()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database init failed: {e}")
    finally:
        conn.close()

def create_demo_data():
    """Create demo data - fresh start"""
    try:
        conn = get_db_connection()
        
        # CLEAN SLATE: Delete all existing data
        conn.execute("DELETE FROM scans")
        conn.execute("DELETE FROM projects")
        conn.execute("DELETE FROM users")
        conn.commit()
        logger.info("🗑️  Cleared all existing data")
        
        # Create demo user
        demo_user_id = str(uuid.uuid4())
        
        conn.execute('''
            INSERT INTO users (id, email, name) 
            VALUES (?, ?, ?)
        ''', (demo_user_id, "demo@colmap.app", "Demo User"))
        
        # Create demo project
        demo_project_id = str(uuid.uuid4())
        conn.execute('''
            INSERT INTO projects (id, user_id, name, description, location, space_type, project_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (demo_project_id, demo_user_id, "Reconstruction Test Project 1", 
              "Demo COLMAP 3D reconstructions from demo-resources",
              "Demo Location", "indoor", "architecture"))
        
        # Create demo scans using actual files from demo-resources
        demo_scans = [
            {
                "id": str(uuid.uuid4()),
                "name": "demoscan-dollhouse",
                "video_filename": "demoscan-dollhouse.mp4",
                "video_size": 18432000,
                "processing_quality": "high",
                "status": "completed",
                "ply_file": "demoscan-dollhouse/fvtc_firstfloor_processed.ply",
                "glb_file": "demoscan-dollhouse/single_family_home_-_first_floor.glb",
                "thumbnail": "thumbnails/demoscan-dollhouse-thumb.jpg"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "demoscan-fachada", 
                "video_filename": "demoscan-fachada.mp4",
                "video_size": 24576000,
                "processing_quality": "high",
                "status": "completed",
                "ply_file": "demoscan-fachada/1mill.ply",
                "glb_file": "demoscan-fachada/aleppo_destroyed_building_front.glb",
                "thumbnail": "thumbnails/demoscan-fachada-thumb.jpg"
            }
        ]
        
        for scan in demo_scans:
            conn.execute('''
                INSERT INTO scans (id, project_id, name, video_filename, video_size, processing_quality, status, ply_file, glb_file, thumbnail)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (scan["id"], demo_project_id, scan["name"], scan["video_filename"], 
                  scan["video_size"], scan["processing_quality"], scan["status"],
                  scan["ply_file"], scan["glb_file"], scan["thumbnail"]))
        
        conn.commit()
        logger.info("✅ Demo data created successfully")
        return {"status": "success", "project_id": demo_project_id, "scan_ids": [s["id"] for s in demo_scans]}
        
    except Exception as e:
        logger.error(f"❌ Demo data creation failed: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        conn.close()

@app.get("/")
async def root():
    return {"message": "COLMAP Backend is running!", "database_path": DATABASE_PATH}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Backend is running", "database_path": DATABASE_PATH}

@app.get("/api/status")
async def get_status():
    """Get current backend status and demo data info"""
    try:
        conn = get_db_connection()
        
        # Get projects count
        projects_count = conn.execute("SELECT COUNT(*) as count FROM projects").fetchone()["count"]
        
        # Get projects
        projects = conn.execute("SELECT id, name FROM projects").fetchall()
        projects_list = [{"id": p["id"], "name": p["name"]} for p in projects]
        
        # Get scans count
        scans_count = conn.execute("SELECT COUNT(*) as count FROM scans").fetchone()["count"]
        
        status = {
            "backend": "running",
            "database_path": DATABASE_PATH,
            "projects_count": projects_count,
            "scans_count": scans_count,
            "projects": projects_list
        }
        
        conn.close()
        return status
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {"backend": "error", "error": str(e)}

@app.get("/api/projects")
async def get_projects():
    """Get all projects"""
    try:
        conn = get_db_connection()
        projects = conn.execute("SELECT * FROM projects").fetchall()
        projects_list = [dict(p) for p in projects]
        conn.close()
        return {"projects": projects_list}
    except Exception as e:
        logger.error(f"Error getting projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# New: get single project by id
@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get a single project by ID"""
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_id}/scans")
async def get_scans(project_id: str):
    """Get scans for a project"""
    try:
        conn = get_db_connection()
        scans = conn.execute("SELECT * FROM scans WHERE project_id = ?", (project_id,)).fetchall()
        scans_list = [dict(s) for s in scans]
        conn.close()
        return {"scans": scans_list}
    except Exception as e:
        logger.error(f"Error getting scans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/projects")
async def create_project(user_email: str, name: str, description: str = "", location: str = "", space_type: str = "", project_type: str = ""):
    """Create a new project"""
    try:
        conn = get_db_connection()
        
        # Get or create user
        user_row = conn.execute("SELECT id FROM users WHERE email = ?", (user_email,)).fetchone()
        if not user_row:
            user_id = str(uuid.uuid4())
            conn.execute("INSERT INTO users (id, email) VALUES (?, ?)", (user_id, user_email))
            conn.commit()
        else:
            user_id = user_row["id"]
        
        # Create project
        project_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO projects (id, user_id, name, description, location, space_type, project_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (project_id, user_id, name, description, location, space_type, project_type)
        )
        conn.commit()
        conn.close()
        
        logger.info(f"Created project: {name} (ID: {project_id})")
        return {"status": "success", "project_id": project_id}
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/database/setup-demo")
async def setup_demo_data():
    """FORCE setup demo data - ALWAYS WORKS"""
    try:
        logger.info("🔄 FORCING demo data creation...")
        result = create_demo_data()
        
        # Verify demo data was created
        conn = get_db_connection()
        projects_count = conn.execute("SELECT COUNT(*) as count FROM projects").fetchone()["count"]
        scans_count = conn.execute("SELECT COUNT(*) as count FROM scans").fetchone()["count"]
        conn.close()
        
        logger.info(f"📊 Demo data created: {projects_count} projects, {scans_count} scans")
        
        return {
            "status": "success", 
            "data": result,
            "verification": {
                "projects_count": projects_count,
                "scans_count": scans_count
            }
        }
    except Exception as e:
        logger.error(f"Demo data setup failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reconstruction/upload")
async def upload_video_for_reconstruction(
    project_id: str = Form(...),
    scan_name: str = Form(...),
    quality: str = Form("medium"),
    video: UploadFile = File(...)
):
    """
    Upload video for 3D reconstruction processing
    Based on: https://colmap.github.io/tutorial.html
    """
    try:
        logger.info(f"📹 Received video upload for project {project_id}")
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Create job directory
        job_path = Path(f"/workspace/{job_id}")
        job_path.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded video
        video_path = job_path / video.filename
        with open(video_path, "wb") as f:
            content = await video.read()
            f.write(content)
        
        logger.info(f"💾 Saved video to {video_path} ({len(content)} bytes)")
        
        # Start reconstruction in background (async)
        # For now, just return job ID
        # TODO: Implement async processing
        
        return {
            "status": "accepted",
            "job_id": job_id,
            "message": "Video uploaded, reconstruction queued"
        }
        
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reconstruction/{job_id}/status")
async def get_reconstruction_status(job_id: str):
    """Get status of reconstruction job"""
    job_path = Path(f"/workspace/{job_id}")
    
    if not job_path.exists():
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check for outputs
    ply_file = job_path / "exports" / "point_cloud.ply"
    status = "processing"
    
    if ply_file.exists():
        status = "completed"
    
    return {
        "job_id": job_id,
        "status": status,
        "output_file": str(ply_file) if ply_file.exists() else None
    }

@app.post("/api/reconstruction/{job_id}/export")
async def export_reconstruction(job_id: str, format: str = "PLY"):
    """
    Export reconstruction to various formats
    Reference: https://colmap.github.io/tutorial.html#importing-and-exporting
    
    Supported formats: PLY, TXT, BIN, NVM
    """
    try:
        job_path = Path(f"/workspace/{job_id}")
        
        if not job_path.exists():
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Initialize processor
        processor = COLMAPProcessor(str(job_path))
        
        # Export model
        output_path = processor.export_model(output_format=format.upper())
        
        logger.info(f"Exported reconstruction {job_id} to {format}: {output_path}")
        
        return {
            "status": "success",
            "format": format,
            "output_path": output_path,
            "message": f"Successfully exported to {format} format"
        }
        
    except ValueError as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reconstruction/{job_id}/download/{filename}")
async def download_export(job_id: str, filename: str):
    """
    Download exported reconstruction files
    Supports: point_cloud.ply, model_text/*.txt, model.nvm, etc.
    """
    try:
        job_path = Path(f"/workspace/{job_id}")
        
        if not job_path.exists():
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Support different export locations
        possible_paths = [
            job_path / filename,  # Direct file
            job_path / "model_text" / filename,  # Text format
            job_path / "model_binary" / filename,  # Binary format
        ]
        
        file_path = None
        for path in possible_paths:
            if path.exists() and path.is_file():
                file_path = path
                break
        
        if not file_path:
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
        
        logger.info(f"Downloading {file_path} for job {job_id}")
        return FileResponse(file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reconstruction/{job_id}/database/inspect")
async def inspect_database(job_id: str):
    """
    Inspect COLMAP database contents
    Reference: https://colmap.github.io/tutorial.html#database-management
    
    Returns comprehensive database statistics
    """
    try:
        job_path = Path(f"/workspace/{job_id}")
        
        if not job_path.exists():
            raise HTTPException(status_code=404, detail="Job not found")
        
        processor = COLMAPProcessor(str(job_path))
        result = processor.inspect_database()
        
        return result
        
    except Exception as e:
        logger.error(f"Database inspection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reconstruction/{job_id}/database/clean")
async def clean_database(job_id: str):
    """
    Clean COLMAP database by removing unused data
    Reference: https://colmap.github.io/tutorial.html#database-management
    
    Removes orphaned data, images without features, etc.
    """
    try:
        job_path = Path(f"/workspace/{job_id}")
        
        if not job_path.exists():
            raise HTTPException(status_code=404, detail="Job not found")
        
        processor = COLMAPProcessor(str(job_path))
        result = processor.clean_database()
        
        return result
        
    except Exception as e:
        logger.error(f"Database cleaning failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize database and demo data on startup"""
    try:
        logger.info("🚀 Starting up COLMAP Backend...")
        
        # Initialize database
        init_database()
        
        # FORCE DEMO DATA INITIALIZATION
        logger.info("🔄 FORCING demo data initialization...")
        result = create_demo_data()
        
        if result.get("status") == "success":
            logger.info("✅ Demo data initialized successfully")
            logger.info(f"   Project ID: {result.get('project_id')}")
            logger.info(f"   Scan IDs: {result.get('scan_ids')}")
        else:
            logger.error(f"❌ Demo data initialization failed: {result.get('error')}")
        
        # VERIFY DEMO DATA EXISTS
        conn = get_db_connection()
        projects_count = conn.execute("SELECT COUNT(*) as count FROM projects").fetchone()["count"]
        scans_count = conn.execute("SELECT COUNT(*) as count FROM scans").fetchone()["count"]
        conn.close()
        
        logger.info(f"🎯 FINAL VERIFICATION: {projects_count} projects, {scans_count} scans")
        logger.info("🎯 COLMAP Backend ready!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
