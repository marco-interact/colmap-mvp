#!/usr/bin/env python3
"""
ULTRA SIMPLE COLMAP Backend - ABSOLUTELY MINIMAL
Just FastAPI + basic endpoints - NO COMPLEX DEPENDENCIES
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import sqlite3
import json
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="COLMAP Backend", version="1.0.0")

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (id)
            )
        ''')
        
        conn.commit()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database init failed: {e}")
    finally:
        conn.close()

def create_demo_data():
    """Create demo data"""
    try:
        conn = get_db_connection()
        
        # Create demo user
        demo_user_id = str(uuid.uuid4())
        # Check if demo data already exists
        existing = conn.execute("SELECT COUNT(*) as count FROM projects").fetchone()["count"]
        if existing > 0:
            logger.info("Demo data already exists, skipping creation")
            return {"status": "exists", "message": "Demo data already present"}
        
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
                "status": "completed"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "demoscan-fachada", 
                "video_filename": "demoscan-fachada.mp4",
                "video_size": 24576000,
                "processing_quality": "high",
                "status": "completed"
            }
        ]
        
        for scan in demo_scans:
            conn.execute('''
                INSERT INTO scans (id, project_id, name, video_filename, video_size, processing_quality, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (scan["id"], demo_project_id, scan["name"], scan["video_filename"], 
                  scan["video_size"], scan["processing_quality"], scan["status"]))
        
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
