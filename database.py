"""
SQLite Database Implementation for COLMAP App
Stores users, projects, scans, and technical details
"""

import sqlite3
import json
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid

logger = logging.getLogger(__name__)

class Database:
    """Simple SQLite database for storing COLMAP app data"""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = os.getenv("DATABASE_PATH", "/workspace/database.db")
        self.db_path = db_path
        # Ensure directory exists
        db_dir = Path(db_path).parent
        db_dir.mkdir(parents=True, exist_ok=True)
        self.init_database()
    
    def get_connection(self):
        """Get database connection with row factory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access to rows
        return conn
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_connection()
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
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Scans table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    video_filename TEXT,
                    video_size INTEGER,
                    video_duration REAL,
                    processing_quality TEXT DEFAULT 'medium',
                    thumbnail_path TEXT,
                    ply_file TEXT,
                    glb_file TEXT,
                    thumbnail TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects (id)
                )
            ''')
            
            # Technical details table (stores COLMAP processing results)
            conn.execute('''
                CREATE TABLE IF NOT EXISTS scan_technical_details (
                    scan_id TEXT PRIMARY KEY,
                    point_count INTEGER,
                    camera_count INTEGER,
                    feature_count INTEGER,
                    processing_time_seconds REAL,
                    resolution TEXT,
                    file_size_bytes INTEGER,
                    reconstruction_error REAL,
                    coverage_percentage REAL,
                    processing_stages TEXT, -- JSON array of processing stages
                    results TEXT, -- JSON object with file URLs
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (scan_id) REFERENCES scans (id)
                )
            ''')
            
            # Processing jobs table
            conn.execute('''
                CREATE TABLE IF NOT EXISTS processing_jobs (
                    job_id TEXT PRIMARY KEY,
                    scan_id TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    progress INTEGER DEFAULT 0,
                    current_stage TEXT,
                    message TEXT,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    FOREIGN KEY (scan_id) REFERENCES scans (id)
                )
            ''')
            
            conn.commit()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    # User methods
    def create_user(self, email: str, name: Optional[str] = None) -> str:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        conn = self.get_connection()
        try:
            conn.execute(
                'INSERT INTO users (id, email, name) VALUES (?, ?, ?)',
                (user_id, email, name)
            )
            conn.commit()
            logger.info(f"Created user: {email}")
            return user_id
        except sqlite3.IntegrityError:
            # User already exists, return existing user_id
            row = conn.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
            return row['id'] if row else user_id
        finally:
            conn.close()
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        conn = self.get_connection()
        try:
            row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    # Project methods
    def create_project(self, user_id: str, name: str, description: str = "", 
                      location: str = "", space_type: str = "", project_type: str = "") -> str:
        """Create a new project"""
        project_id = str(uuid.uuid4())
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT INTO projects (id, user_id, name, description, location, space_type, project_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (project_id, user_id, name, description, location, space_type, project_type))
            conn.commit()
            logger.info(f"Created project: {name}")
            return project_id
        finally:
            conn.close()
    
    def get_user_projects(self, user_id: str) -> List[Dict]:
        """Get all projects for a user"""
        conn = self.get_connection()
        try:
            rows = conn.execute('''
                SELECT p.*, COUNT(s.id) as scan_count
                FROM projects p
                LEFT JOIN scans s ON p.id = s.project_id
                WHERE p.user_id = ?
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            ''', (user_id,)).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    def get_project(self, project_id: str) -> Optional[Dict]:
        """Get a project by ID"""
        conn = self.get_connection()
        try:
            row = conn.execute('SELECT * FROM projects WHERE id = ?', (project_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    # Scan methods
    def create_scan(self, project_id: str, name: str, video_filename: str, 
                   video_size: int, processing_quality: str = "medium") -> str:
        """Create a new scan"""
        scan_id = str(uuid.uuid4())
        conn = self.get_connection()
        try:
            conn.execute('''
                INSERT INTO scans (id, project_id, name, video_filename, video_size, processing_quality)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (scan_id, project_id, name, video_filename, video_size, processing_quality))
            
            # Update project updated_at
            conn.execute(
                'UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (project_id,)
            )
            
            conn.commit()
            logger.info(f"Created scan: {name}")
            return scan_id
        finally:
            conn.close()
    
    def get_project_scans(self, project_id: str) -> List[Dict]:
        """Get all scans for a project"""
        conn = self.get_connection()
        try:
            rows = conn.execute('''
                SELECT s.*, 
                       std.point_count,
                       std.processing_time_seconds,
                       std.file_size_bytes
                FROM scans s
                LEFT JOIN scan_technical_details std ON s.id = std.scan_id
                WHERE s.project_id = ?
                ORDER BY s.created_at DESC
            ''', (project_id,)).fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    def get_scan(self, scan_id: str) -> Optional[Dict]:
        """Get a scan by ID"""
        conn = self.get_connection()
        try:
            row = conn.execute('SELECT * FROM scans WHERE id = ?', (scan_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    def update_scan_status(self, scan_id: str, status: str, thumbnail_path: str = None):
        """Update scan status and optionally thumbnail path"""
        conn = self.get_connection()
        try:
            if thumbnail_path:
                conn.execute(
                    'UPDATE scans SET status = ?, thumbnail_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    (status, thumbnail_path, scan_id)
                )
            else:
                conn.execute(
                    'UPDATE scans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    (status, scan_id)
                )
            conn.commit()
        finally:
            conn.close()
    
    def delete_scan(self, scan_id: str):
        """Delete a scan and its technical details"""
        conn = self.get_connection()
        try:
            # Delete technical details first (foreign key constraint)
            conn.execute('DELETE FROM scan_technical_details WHERE scan_id = ?', (scan_id,))
            
            # Delete processing jobs
            conn.execute('DELETE FROM processing_jobs WHERE scan_id = ?', (scan_id,))
            
            # Delete the scan
            conn.execute('DELETE FROM scans WHERE id = ?', (scan_id,))
            
            conn.commit()
            logger.info(f"Deleted scan and related data: {scan_id}")
        finally:
            conn.close()
    
    # Technical details methods
    def save_scan_technical_details(self, scan_id: str, technical_data: Dict[str, Any]):
        """Save technical details from COLMAP processing"""
        conn = self.get_connection()
        try:
            # Convert nested objects to JSON
            processing_stages = json.dumps(technical_data.get('processing_stages', []))
            results = json.dumps(technical_data.get('results', {}))
            
            conn.execute('''
                INSERT OR REPLACE INTO scan_technical_details 
                (scan_id, point_count, camera_count, feature_count, processing_time_seconds,
                 resolution, file_size_bytes, reconstruction_error, coverage_percentage,
                 processing_stages, results)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                scan_id,
                technical_data.get('point_count'),
                technical_data.get('camera_count'),
                technical_data.get('feature_count'),
                technical_data.get('processing_time_seconds'),
                technical_data.get('resolution'),
                technical_data.get('file_size_bytes'),
                technical_data.get('reconstruction_error'),
                technical_data.get('coverage_percentage'),
                processing_stages,
                results
            ))
            
            # Update scan status to completed
            conn.execute(
                'UPDATE scans SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ('completed', scan_id)
            )
            
            conn.commit()
            logger.info(f"Saved technical details for scan: {scan_id}")
        finally:
            conn.close()
    
    def get_scan_details(self, scan_id: str) -> Optional[Dict]:
        """Get complete scan details including technical data"""
        conn = self.get_connection()
        try:
            row = conn.execute('''
                SELECT s.*,
                       p.name as project_name,
                       p.location as project_location,
                       std.point_count,
                       std.camera_count,
                       std.feature_count,
                       std.processing_time_seconds,
                       std.resolution,
                       std.file_size_bytes,
                       std.reconstruction_error,
                       std.coverage_percentage,
                       std.processing_stages,
                       std.results
                FROM scans s
                LEFT JOIN projects p ON s.project_id = p.id
                LEFT JOIN scan_technical_details std ON s.id = std.scan_id
                WHERE s.id = ?
            ''', (scan_id,)).fetchone()
            
            if not row:
                return None
            
            data = dict(row)
            
            # Parse JSON fields
            if data.get('processing_stages'):
                data['processing_stages'] = json.loads(data['processing_stages'])
            if data.get('results'):
                data['results'] = json.loads(data['results'])
            
            return data
        finally:
            conn.close()
    
    def get_all_jobs(self) -> Dict:
        """Get all processing jobs"""
        conn = self.get_connection()
        try:
            rows = conn.execute('SELECT * FROM processing_jobs ORDER BY started_at DESC').fetchall()
            jobs = {}
            for row in rows:
                job_data = dict(row)
                jobs[job_data['job_id']] = {
                    'job_id': job_data['job_id'],
                    'scan_id': job_data['scan_id'],
                    'status': job_data['status'],
                    'progress': job_data['progress'],
                    'current_stage': job_data['current_stage'],
                    'message': job_data['message'],
                    'created_at': job_data['started_at']
                }
            return jobs
        finally:
            conn.close()
    
    def update_job_status(self, job_id: str, status: str, job_data: Dict = None):
        """Update or create job status"""
        conn = self.get_connection()
        try:
            # Check if job exists
            existing = conn.execute('SELECT job_id FROM processing_jobs WHERE job_id = ?', (job_id,)).fetchone()
            
            if existing:
                # Update existing job
                conn.execute('''
                    UPDATE processing_jobs 
                    SET status = ?, progress = ?, current_stage = ?, message = ?
                    WHERE job_id = ?
                ''', (
                    status, 
                    job_data.get('progress', 0) if job_data else 0,
                    job_data.get('current_stage', 'Unknown') if job_data else 'Unknown',
                    job_data.get('message', '') if job_data else '',
                    job_id
                ))
            else:
                # Insert new job
                conn.execute('''
                    INSERT INTO processing_jobs 
                    (job_id, scan_id, status, progress, current_stage, message)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    job_id,
                    job_data.get('scan_id', '') if job_data else '',
                    status,
                    job_data.get('progress', 0) if job_data else 0,
                    job_data.get('current_stage', 'Unknown') if job_data else 'Unknown',
                    job_data.get('message', '') if job_data else ''
                ))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_all_projects(self) -> List[Dict]:
        """Get all projects"""
        conn = self.get_connection()
        try:
            rows = conn.execute('''
                SELECT p.*, COUNT(s.id) as scan_count
                FROM projects p
                LEFT JOIN scans s ON p.id = s.project_id
                GROUP BY p.id
                ORDER BY p.updated_at DESC
            ''').fetchall()
            return [dict(row) for row in rows]
        finally:
            conn.close()
    
    def get_project_by_id(self, project_id: str) -> Optional[Dict]:
        """Get a project by ID with scan count"""
        conn = self.get_connection()
        try:
            row = conn.execute('''
                SELECT p.*, COUNT(s.id) as scan_count
                FROM projects p
                LEFT JOIN scans s ON p.id = s.project_id
                WHERE p.id = ?
                GROUP BY p.id
            ''', (project_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()
    
    def setup_demo_data(self) -> Dict:
        """Setup demo data with completed scans"""
        try:
            # Create demo user
            demo_email = "demo@colmap.app"
            user = self.get_user_by_email(demo_email)
            
            if not user:
                user_id = self.create_user(demo_email, "Demo User")
            else:
                user_id = user['id']
            
            # Check if demo project already exists
            conn = self.get_connection()
            try:
                existing_project = conn.execute(
                    'SELECT id FROM projects WHERE user_id = ? AND name = ?',
                    (user_id, "Demo Showcase Project")
                ).fetchone()
                
                if existing_project:
                    logger.info("Demo data already exists, skipping setup")
                    # Get scan IDs for existing project
                    scan_rows = conn.execute(
                        'SELECT id FROM scans WHERE project_id = ?',
                        (existing_project['id'],)
                    ).fetchall()
                    scan_ids = [row['id'] for row in scan_rows]
                    
                    return {
                        "status": "success",
                        "message": "Demo data already exists",
                        "user_id": user_id,
                        "project_id": existing_project['id'],
                        "scan_ids": scan_ids,
                        "skipped": True
                    }
            finally:
                conn.close()
            
            # Create demo project
            project_id = self.create_project(
                user_id=user_id,
                name="Demo Showcase Project",
                description="Sample 3D reconstructions demonstrating COLMAP capabilities",
                location="Demo Location",
                space_type="indoor",
                project_type="architecture"
            )
            
            # Demo scan configurations
            demo_scans = [
                {
                    "name": "Dollhouse Interior Scan",
                    "video_filename": "dollhouse-interior.mp4",
                    "video_size": 18432000,  # ~18MB
                    "ply_file": "demoscan-dollhouse/fvtc_firstfloor_processed.ply",
                    "glb_file": "demoscan-dollhouse/single_family_home_-_first_floor.glb",
                    "thumbnail": "thumbnails/demoscan-dollhouse-thumb.jpg",
                    "point_count": 1045892,
                    "camera_count": 48
                },
                {
                    "name": "Facade Architecture Scan",
                    "video_filename": "facade-exterior.mp4",
                    "video_size": 24576000,  # ~24MB
                    "ply_file": "demoscan-fachada/1mill.ply",
                    "glb_file": "demoscan-fachada/aleppo_destroyed_building_front.glb",
                    "thumbnail": "thumbnails/demoscan-fachada-thumb.jpg",
                    "point_count": 892847,
                    "camera_count": 36
                }
            ]
            
            scan_ids = []
            for scan_config in demo_scans:
                # Create scan
                scan_id = self.create_scan(
                    project_id=project_id,
                    name=scan_config["name"],
                    video_filename=scan_config["video_filename"],
                    video_size=scan_config["video_size"],
                    processing_quality="high"
                )
                
                # Save technical details
                self.save_scan_technical_details(scan_id, {
                    "point_count": scan_config["point_count"],
                    "camera_count": scan_config["camera_count"],
                    "feature_count": scan_config["point_count"] * 8,
                    "processing_time_seconds": 245.6,
                    "resolution": "1920x1080",
                    "file_size_bytes": scan_config["video_size"],
                    "reconstruction_error": 0.38,
                    "coverage_percentage": 96.4,
                    "processing_stages": [
                        {"name": "Frame Extraction", "status": "completed", "duration": "1.2s", "frames_extracted": scan_config["camera_count"]},
                        {"name": "Feature Detection", "status": "completed", "duration": "58.4s", "features_detected": scan_config["point_count"] * 8},
                        {"name": "Feature Matching", "status": "completed", "duration": "1.5m", "matches": scan_config["point_count"] * 3},
                        {"name": "Sparse Reconstruction", "status": "completed", "duration": "2.1m", "points": scan_config["point_count"]},
                        {"name": "Dense Reconstruction", "status": "completed", "duration": "0.6m", "points": scan_config["point_count"] * 3}
                    ],
                    "results": {
                        "point_cloud_url": f"/demo-resources/{scan_config['ply_file']}",
                        "mesh_url": f"/demo-resources/{scan_config['glb_file']}",
                        "thumbnail_url": f"/demo-resources/{scan_config['thumbnail']}"
                    }
                })
                
                scan_ids.append(scan_id)
            
            logger.info("✅ Demo data setup completed")
            return {
                "status": "success",
                "message": "Demo data setup completed",
                "user_id": user_id,
                "project_id": project_id,
                "scan_ids": scan_ids
            }
            
        except Exception as e:
            logger.error(f"Failed to setup demo data: {e}")
            raise
    
    def cleanup_duplicate_demos(self) -> Dict:
        """Remove duplicate demo projects, keeping only the most recent one"""
        conn = self.get_connection()
        try:
            # Find all demo projects
            demo_projects = conn.execute('''
                SELECT p.id, p.created_at 
                FROM projects p
                JOIN users u ON p.user_id = u.id
                WHERE u.email = 'demo@colmap.app' AND p.name = 'Demo Showcase Project'
                ORDER BY p.created_at DESC
            ''').fetchall()
            
            if len(demo_projects) <= 1:
                return {"status": "success", "message": "No duplicates to clean", "deleted": 0}
            
            # Keep the most recent, delete the rest
            keep_project_id = demo_projects[0]['id']
            delete_ids = [proj['id'] for proj in demo_projects[1:]]
            
            # Delete scans for duplicate projects
            for proj_id in delete_ids:
                conn.execute('DELETE FROM scan_technical_details WHERE scan_id IN (SELECT id FROM scans WHERE project_id = ?)', (proj_id,))
                conn.execute('DELETE FROM scans WHERE project_id = ?', (proj_id,))
                conn.execute('DELETE FROM projects WHERE id = ?', (proj_id,))
            
            conn.commit()
            
            logger.info(f"Cleaned up {len(delete_ids)} duplicate demo projects")
            return {
                "status": "success",
                "message": f"Removed {len(delete_ids)} duplicate projects",
                "deleted": len(delete_ids),
                "kept_project_id": keep_project_id
            }
        finally:
            conn.close()

# Global database instance
db = Database()
