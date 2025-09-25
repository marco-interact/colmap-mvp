/**
 * Centralized mock data for the application
 * Now uses the new database infrastructure with proper storage hierarchy
 */

import { mockDB, type Project as DBProject, type Scan as DBScan } from './database/mockDatabase'
import { fileStorage, getViewerModelUrl } from './services/fileStorage'

// Legacy interfaces for backward compatibility
export interface Project {
  id: string
  name: string
  description: string
  location: string
  user_id: string
  status: 'active' | 'archived' | 'processing'
  settings: {
    space_type: string
    project_type: string
    quality: string
  }
  thumbnail?: string
  total_scans: number
  created_at: string
  updated_at: string
  last_processed_at?: string
}

export interface Scan {
  id: string
  name: string
  project_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  thumbnail?: string
  model_url?: string
  video_filename?: string
  video_size?: number
  processing_options?: {
    quality: string
    dense_reconstruction: boolean
    meshing: boolean
    frame_rate: number
  }
  processing_jobs?: Array<{
    job_id: string
    type: string
    status: string
    description: string
  }>
  created_at: string
  updated_at: string
}

// Helper function to convert DB scan to legacy format with proper model URLs
function dbScanToLegacy(dbScan: DBScan): any {
  const workspace = mockDB.getWorkspaceById(dbScan.workspace_id)
  const user = mockDB.getUserById(dbScan.user_id)
  
  // Get the appropriate model URL based on what's available
  let model_url = '/models/sample.ply' // Default fallback
  
  if (dbScan.status === 'completed') {
    // Prefer dense cloud, then mesh, then sparse cloud
    if (dbScan.models.dense_cloud) {
      model_url = getViewerModelUrl(dbScan.workspace_id, dbScan.user_id, dbScan.project_id, dbScan.id, 'dense')
    } else if (dbScan.models.mesh) {
      model_url = getViewerModelUrl(dbScan.workspace_id, dbScan.user_id, dbScan.project_id, dbScan.id, 'mesh')
    } else if (dbScan.models.sparse_cloud) {
      model_url = getViewerModelUrl(dbScan.workspace_id, dbScan.user_id, dbScan.project_id, dbScan.id, 'sparse')
    }
  }

  return {
    id: dbScan.id,
    name: dbScan.name,
    project_id: dbScan.project_id,
    status: dbScan.status,
    thumbnail: dbScan.models.thumbnails?.[0],
    model_url,
    video_filename: dbScan.video_filename,
    video_size: dbScan.video_size,
    processing_options: {
      quality: dbScan.processing_options.quality,
      dense_reconstruction: dbScan.processing_options.dense_reconstruction,
      meshing: dbScan.processing_options.meshing,
      frame_rate: dbScan.processing_options.frame_rate
    },
    processing_jobs: dbScan.processing_jobs.map(job => ({
      job_id: job.id,
      type: job.type,
      status: job.status,
      description: job.description
    })),
    created_at: dbScan.created_at,
    updated_at: dbScan.updated_at,
    
    // Additional metadata for the viewer
    workspace_id: dbScan.workspace_id,
    user_id: dbScan.user_id,
    models: dbScan.models,
    frame_count: dbScan.frame_count,
    point_count: dbScan.point_count,
    processing_time: dbScan.processing_time
  }
}

// Legacy compatibility - simulate the old scans array
export let scans: any[] = []

// Initialize scans from database
function initializeScans() {
  const dbScans = mockDB.getScans()
  scans = dbScans.map(dbScanToLegacy)
}
initializeScans()

// Helper functions for scan management (updated to use database)
export function addScan(scan: any) {
  const dbScan = mockDB.createScan({
    name: scan.name,
    project_id: scan.project_id,
    user_id: scan.user_id || 'user-1', 
    workspace_id: scan.workspace_id || 'workspace-1',
    status: scan.status || 'pending',
    video_filename: scan.video_filename,
    video_size: scan.video_size,
    video_path: scan.video_path,
    processing_options: {
      quality: scan.processing_options?.quality || 'medium',
      dense_reconstruction: scan.processing_options?.dense_reconstruction ?? true,
      meshing: scan.processing_options?.meshing ?? true,
      frame_rate: scan.processing_options?.frame_rate || 1,
      is_360: scan.processing_options?.is_360,
      viewpoints: scan.processing_options?.viewpoints,
      conversion_type: scan.processing_options?.conversion_type
    },
    processing_jobs: scan.processing_jobs?.map((job: any) => ({
      id: job.job_id || job.id,
      scan_id: scan.id || dbScan.id,
      type: job.type,
      status: job.status,
      progress: job.progress || 0,
      description: job.description,
      started_at: job.started_at,
      completed_at: job.completed_at,
      error_message: job.error_message,
      output_files: job.output_files
    })) || [],
    models: scan.models || {}
  })

  // Refresh the legacy scans array
  initializeScans()
  
  return dbScanToLegacy(dbScan)
}

export function getScansByProject(projectId: string) {
  const dbScans = mockDB.getScansByProject(projectId)
  return dbScans.map(dbScanToLegacy)
}

export function updateScan(scanId: string, updates: any) {
  const updatedDbScan = mockDB.updateScan(scanId, updates)
  if (updatedDbScan) {
    // Refresh the legacy scans array
    initializeScans()
    return dbScanToLegacy(updatedDbScan)
  }
  return null
}

export function getNextScanId(): string {
  return `scan-${Date.now()}`
}

// Additional helper functions for the new infrastructure
export function getProjects(): Project[] {
  const dbProjects = mockDB.getProjects()
  return dbProjects.map(dbProject => {
    const projectScans = mockDB.getScansByProject(dbProject.id)
    return {
      ...dbProject,
      total_scans: projectScans.length
    }
  })
}

export function getProjectById(id: string): Project | undefined {
  const dbProject = mockDB.getProjectById(id)
  if (!dbProject) return undefined
  
  const projectScans = mockDB.getScansByProject(id)
  return {
    ...dbProject,
    total_scans: projectScans.length
  }
}

export function getScanById(id: string) {
  const dbScan = mockDB.getScanById(id)
  return dbScan ? dbScanToLegacy(dbScan) : undefined
}

export function addProject(project: Omit<Project, 'id'>): Project {
  const dbProject = mockDB.createProject({
    name: project.name,
    description: project.description,
    location: project.location,
    user_id: project.user_id,
    workspace_id: 'workspace-1', // Default workspace
    status: project.status,
    settings: project.settings,
    thumbnail: project.thumbnail
  })
  
  const projectScans = mockDB.getScansByProject(dbProject.id)
  return {
    ...dbProject,
    total_scans: projectScans.length
  }
}
