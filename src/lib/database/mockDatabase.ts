/**
 * Mock Database Infrastructure
 * Simulates a proper database structure for Workspace > User > Project > Scan > 3D viewer
 * This would be replaced with a real database (Prisma/Supabase) in production
 */

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  location: string
  user_id: string
  workspace_id: string
  status: 'active' | 'archived' | 'processing'
  settings: {
    space_type: string
    project_type: string
    quality: string
  }
  thumbnail?: string
  created_at: string
  updated_at: string
  last_processed_at?: string
}

export interface Scan {
  id: string
  name: string
  project_id: string
  user_id: string
  workspace_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  
  // File information
  video_filename?: string
  video_size?: number
  video_path?: string
  
  // Processing options
  processing_options: {
    quality: 'low' | 'medium' | 'high' | 'extreme'
    dense_reconstruction: boolean
    meshing: boolean
    frame_rate: number
    is_360?: boolean
    viewpoints?: number
    conversion_type?: string
  }
  
  // Processing results
  processing_jobs: ProcessingJob[]
  
  // 3D Model outputs
  models: {
    sparse_cloud?: string      // Path to sparse point cloud (.ply)
    dense_cloud?: string       // Path to dense point cloud (.ply)
    mesh?: string             // Path to 3D mesh (.obj, .ply, .gltf)
    texture?: string          // Path to texture files
    thumbnails?: string[]     // Path to preview images
  }
  
  // Metadata
  frame_count?: number
  point_count?: number
  processing_time?: number
  file_size?: number
  
  created_at: string
  updated_at: string
  processed_at?: string
}

export interface ProcessingJob {
  id: string
  scan_id: string
  type: 'frame_extraction' | 'sparse_reconstruction' | 'dense_reconstruction' | 'meshing' | 'texturing' | '360_conversion' | 'potree_conversion' | 'structure_from_motion'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  description: string
  started_at?: string
  completed_at?: string
  error_message?: string
  output_files?: string[]
}

// Mock Database Class
class MockDatabase {
  private workspaces: Map<string, Workspace> = new Map()
  private users: Map<string, User> = new Map()
  private projects: Map<string, Project> = new Map()
  private scans: Map<string, Scan> = new Map()
  private processing_jobs: Map<string, ProcessingJob> = new Map()

  constructor() {
    this.initializeDefaultData()
  }

  private initializeDefaultData() {
    // Default workspace
    const defaultWorkspace: Workspace = {
      id: 'workspace-1',
      name: 'Colmap Workspace',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.workspaces.set(defaultWorkspace.id, defaultWorkspace)

    // Default user
    const defaultUser: User = {
      id: 'user-1',
      email: 'test@colmap.app',
      name: 'Carlos Martinez',
      role: 'admin',
      workspace_id: defaultWorkspace.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.users.set(defaultUser.id, defaultUser)

    // Default project
    const defaultProject: Project = {
      id: 'project-1',
      name: 'Demo Project',
      description: 'Sample project for testing COLMAP 3D reconstruction',
      location: 'San Francisco, CA',
      user_id: defaultUser.id,
      workspace_id: defaultWorkspace.id,
      status: 'active',
      settings: {
        space_type: 'industrial',
        project_type: 'reconstruction',
        quality: 'high'
      },
      thumbnail: '/api/assets/sample-industrial.jpg',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_processed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
    this.projects.set(defaultProject.id, defaultProject)

    // Default completed scan
    const defaultScan: Scan = {
      id: 'scan-1',
      name: 'Demo Scan',
      project_id: defaultProject.id,
      user_id: defaultUser.id,
      workspace_id: defaultWorkspace.id,
      status: 'completed',
      video_filename: 'demo_video.mp4',
      video_size: 50 * 1024 * 1024, // 50MB
      video_path: '/storage/workspace-1/user-1/project-1/scan-1/input/demo_video.mp4',
      processing_options: {
        quality: 'medium',
        dense_reconstruction: true,
        meshing: true,
        frame_rate: 1
      },
      processing_jobs: [
        {
          id: 'job-1',
          scan_id: 'scan-1',
          type: 'frame_extraction',
          status: 'completed',
          progress: 100,
          description: 'Frame extraction completed',
          started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          output_files: ['/storage/workspace-1/user-1/project-1/scan-1/frames/']
        },
        {
          id: 'job-2',
          scan_id: 'scan-1',
          type: 'sparse_reconstruction',
          status: 'completed',
          progress: 100,
          description: 'COLMAP sparse reconstruction completed',
          started_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          output_files: ['/storage/workspace-1/user-1/project-1/scan-1/sparse/']
        },
        {
          id: 'job-3',
          scan_id: 'scan-1',
          type: 'dense_reconstruction',
          status: 'completed',
          progress: 100,
          description: 'COLMAP dense reconstruction completed',
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          output_files: ['/storage/workspace-1/user-1/project-1/scan-1/dense/']
        }
      ],
      models: {
        sparse_cloud: '/storage/workspace-1/user-1/project-1/scan-1/sparse/points3D.ply',
        dense_cloud: '/storage/workspace-1/user-1/project-1/scan-1/dense/fused.ply',
        mesh: '/storage/workspace-1/user-1/project-1/scan-1/dense/meshed-poisson.ply',
        thumbnails: [
          '/storage/workspace-1/user-1/project-1/scan-1/thumbnails/sparse.jpg',
          '/storage/workspace-1/user-1/project-1/scan-1/thumbnails/dense.jpg',
          '/storage/workspace-1/user-1/project-1/scan-1/thumbnails/mesh.jpg'
        ]
      },
      frame_count: 120,
      point_count: 150000,
      processing_time: 45 * 60, // 45 minutes in seconds
      file_size: 25 * 1024 * 1024, // 25MB output
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      processed_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    }
    this.scans.set(defaultScan.id, defaultScan)

    // Add processing jobs to the jobs map
    defaultScan.processing_jobs.forEach(job => {
      this.processing_jobs.set(job.id, job)
    })
  }

  // Workspace methods
  getWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values())
  }

  getWorkspaceById(id: string): Workspace | undefined {
    return this.workspaces.get(id)
  }

  // User methods
  getUsers(): User[] {
    return Array.from(this.users.values())
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id)
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email)
  }

  // Project methods
  getProjects(): Project[] {
    return Array.from(this.projects.values())
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.get(id)
  }

  getProjectsByWorkspace(workspaceId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.workspace_id === workspaceId)
  }

  getProjectsByUser(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.user_id === userId)
  }

  createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Project {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.projects.set(newProject.id, newProject)
    return newProject
  }

  // Scan methods
  getScans(): Scan[] {
    return Array.from(this.scans.values())
  }

  getScanById(id: string): Scan | undefined {
    return this.scans.get(id)
  }

  getScansByProject(projectId: string): Scan[] {
    return Array.from(this.scans.values()).filter(s => s.project_id === projectId)
  }

  getScansByUser(userId: string): Scan[] {
    return Array.from(this.scans.values()).filter(s => s.user_id === userId)
  }

  createScan(scan: Omit<Scan, 'id' | 'created_at' | 'updated_at'>): Scan {
    const newScan: Scan = {
      ...scan,
      id: `scan-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.scans.set(newScan.id, newScan)
    return newScan
  }

  updateScan(id: string, updates: Partial<Scan>): Scan | undefined {
    const scan = this.scans.get(id)
    if (!scan) return undefined
    
    const updatedScan = {
      ...scan,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    this.scans.set(id, updatedScan)
    return updatedScan
  }

  // Processing job methods
  getProcessingJobsByScan(scanId: string): ProcessingJob[] {
    return Array.from(this.processing_jobs.values()).filter(j => j.scan_id === scanId)
  }

  createProcessingJob(job: Omit<ProcessingJob, 'id'>): ProcessingJob {
    const newJob: ProcessingJob = {
      ...job,
      id: `job-${Date.now()}`,
    }
    this.processing_jobs.set(newJob.id, newJob)
    return newJob
  }

  updateProcessingJob(id: string, updates: Partial<ProcessingJob>): ProcessingJob | undefined {
    const job = this.processing_jobs.get(id)
    if (!job) return undefined
    
    const updatedJob = {
      ...job,
      ...updates,
    }
    this.processing_jobs.set(id, updatedJob)
    return updatedJob
  }

  // Storage path helpers
  getStorageBasePath(workspaceId: string, userId: string, projectId: string, scanId: string): string {
    return `/storage/${workspaceId}/${userId}/${projectId}/${scanId}`
  }

  getModelPath(workspaceId: string, userId: string, projectId: string, scanId: string, type: 'sparse' | 'dense' | 'mesh'): string {
    const basePath = this.getStorageBasePath(workspaceId, userId, projectId, scanId)
    switch (type) {
      case 'sparse':
        return `${basePath}/sparse/points3D.ply`
      case 'dense':
        return `${basePath}/dense/fused.ply`
      case 'mesh':
        return `${basePath}/dense/meshed-poisson.ply`
      default:
        return `${basePath}/output/model.ply`
    }
  }
}

// Singleton instance
export const mockDB = new MockDatabase()

// Export helper functions
export function getStorageStructure() {
  return {
    workspace: 'workspace-1',
    user: 'user-1', 
    project: 'project-1',
    scan: 'scan-1',
    paths: {
      input: '/storage/workspace-1/user-1/project-1/scan-1/input/',
      frames: '/storage/workspace-1/user-1/project-1/scan-1/frames/',
      sparse: '/storage/workspace-1/user-1/project-1/scan-1/sparse/',
      dense: '/storage/workspace-1/user-1/project-1/scan-1/dense/',
      thumbnails: '/storage/workspace-1/user-1/project-1/scan-1/thumbnails/',
      output: '/storage/workspace-1/user-1/project-1/scan-1/output/'
    }
  }
}
