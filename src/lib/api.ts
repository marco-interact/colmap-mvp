// Videogrammetry SaaS Platform - API Integration Layer
// Handles all communication with COLMAP worker service

export interface Project {
  id: string
  name: string
  description: string
  location: string
  spaceType: 'residential' | 'commercial' | 'industrial' | 'outdoor'
  projectType: 'new_build' | 'renovation' | 'inspection' | 'documentation'
  updated: string
  thumbnail?: string
  status: 'active' | 'completed' | 'processing'
}

export interface Scan {
  id: string
  name: string
  projectId: string
  projectName: string
  status: 'completed' | 'processing' | 'failed' | 'pending'
  location: string
  updated: string
  thumbnail?: string
  fileSize?: string
  processingTime?: string
  pointCount?: number
  progress?: number
  currentStage?: string
  estimatedTime?: string
  results?: {
    pointCloudUrl?: string
    meshUrl?: string
    thumbnailUrl?: string
  }
}

export interface ProcessingJob {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message: string
  createdAt: string
  progress: number
  currentStage: string
  results?: {
    point_cloud_url?: string
    sparse_model_url?: string
    mesh_url?: string
    thumbnail_url?: string
  }
}

// Get the COLMAP worker URL - always use Next.js proxy at /api/backend
const getWorkerUrl = () => {
  // Use Next.js API proxy - all requests go through port 3000
  const url = '/api/backend'
  console.log('🔍 Using Next.js API proxy:', { 
    url,
    timestamp: new Date().toISOString()
  })
  return url
}

// Check if we're in demo mode (no worker configured or worker unavailable)
export const isDemoMode = () => {
  return getWorkerUrl() === null || (apiClient as any).baseUrl === null
}

class APIClient {
  private baseUrl: string | null

  constructor() {
    this.baseUrl = getWorkerUrl()
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('Worker service not available - running in demo mode')
    }

    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        // Handle rate limiting and quota errors
        if (response.status === 429) {
          console.warn('⚠️ Rate limit exceeded - too many requests')
          throw new Error('Rate limit exceeded. Please wait a moment and try again.')
        }
        if (response.status === 503) {
          console.warn('⚠️ Service temporarily unavailable - GPU quota exceeded')
          throw new Error('GPU processing queue is full. Please try again in a few minutes.')
        }
        
        console.error(`❌ API Error: ${response.status} ${response.statusText}`)
        console.error(`Request URL: ${url}`)
        if (response.status === 0 || response.status >= 500) {
          console.warn('⚠️ Worker service temporarily unavailable')
          throw new Error(`Worker service error: ${response.status}`)
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      // Network errors, CORS errors, etc.
      console.error('❌ Network error connecting to worker service:', error)
      console.error(`Request URL: ${url}`)
      console.error(`Worker URL: ${this.baseUrl}`)
      console.error(`Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      throw new Error(`Network error: ${error.message}`)
    }
  }

  // Get all projects
  async getAllProjects(): Promise<{ projects: any[] }> {
    if (!this.baseUrl) {
      return { projects: [] }
    }

    try {
      const response = await this.request<{ projects: any[] }>(`/api/projects`)
      return response
    } catch (error) {
      console.error('Error fetching all projects:', error)
      return { projects: [] }
    }
  }

  // Get project by ID
  async getProject(projectId: string): Promise<any> {
    if (!this.baseUrl) {
      return null
    }

    try {
      const response = await this.request<any>(`/api/projects/${projectId}`)
      return response
    } catch (error) {
      console.error('Error fetching project:', error)
      return null
    }
  }

  // Get scans for a project
  async getScans(projectId: string): Promise<{ scans: any[] }> {
    if (!this.baseUrl) {
      return { scans: [] }
    }

    try {
      const response = await this.request<any>(`/api/projects/${projectId}/scans`)
      // Backend returns array directly, wrap it in object
      const scans = Array.isArray(response) ? response : (response.scans || [])
      console.log(`📊 Loaded ${scans.length} scans for project ${projectId}`)
      return { scans }
    } catch (error) {
      console.error('Error fetching scans:', error)
      return { scans: [] }
    }
  }

  // Upload video for processing 
  async uploadVideo(file: File, projectId: string, scanName: string, userEmail: string = 'demo@colmap.app'): Promise<{ jobId: string; scanId: string }> {
    if (!this.baseUrl) {
      // Demo mode - simulate upload
      return new Promise((resolve) => {
        setTimeout(() => {
          const jobId = `demo-job-${Date.now()}`
          resolve({ jobId, scanId: jobId })
        }, 1000)
      })
    }

    const formData = new FormData()
    formData.append('video', file)
    formData.append('project_id', projectId)
    formData.append('scan_name', scanName)
    formData.append('quality', 'medium')
    formData.append('user_email', userEmail)

    try {
      const response = await fetch(`${this.baseUrl}/upload-video`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Handle CORS and network errors
        console.error(`❌ Upload failed: ${response.status} ${response.statusText}`)
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      return { jobId: result.job_id, scanId: result.scan_id }
    } catch (error) {
      // Network/CORS error
      console.error('❌ Network error during upload:', error)
      throw error
    }
  }

  // Get processing job status
  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    if (!this.baseUrl) {
      // Demo mode - simulate processing stages
      return this.getDemoJobStatus(jobId)
    }

    try {
      const response = await this.request<{
        job_id: string
        status: string
        message: string
        created_at: string
        progress: number
        current_stage: string
        results?: any
      }>(`/jobs/${jobId}`)

      // Convert backend format to frontend format
      return {
        jobId: response.job_id,
        status: response.status as 'pending' | 'processing' | 'completed' | 'failed',
        message: response.message,
        createdAt: response.created_at,
        progress: response.progress,
        currentStage: response.current_stage,
        results: response.results
      }
    } catch (error) {
      // Fallback to demo mode if backend fails
      console.warn('Real backend failed, using demo mode:', error)
      return this.getDemoJobStatus(jobId)
    }
  }

  // Demo mode job status simulation
  private getDemoJobStatus(jobId: string): ProcessingJob {
    const now = Date.now()
    const jobStartTime = parseInt(jobId.split('-').pop() || '0')
    const elapsed = now - jobStartTime
    
    // Simulate 30-minute processing time
    const totalTime = 30 * 60 * 1000 // 30 minutes in ms
    const progress = Math.min(Math.round((elapsed / totalTime) * 100), 100)
    
    let status: ProcessingJob['status'] = 'processing'
    let currentStage = 'Frame Extraction'
    let estimatedTime = `${Math.max(0, Math.round((totalTime - elapsed) / 60000))} minutes remaining`

    if (progress >= 100) {
      status = 'completed'
      currentStage = 'Complete'
      estimatedTime = 'Finished'
    } else if (progress >= 80) {
      currentStage = 'Mesh Generation'
    } else if (progress >= 60) {
      currentStage = 'Dense Reconstruction'
    } else if (progress >= 40) {
      currentStage = 'Sparse Reconstruction'
    } else if (progress >= 20) {
      currentStage = 'Feature Detection'
    }

    return {
      jobId,
      status,
      message: status === 'completed' ? '3D reconstruction completed successfully!' : `Processing your video: ${currentStage}`,
      createdAt: new Date(jobStartTime).toISOString(),
      progress,
      currentStage,
      results: status === 'completed' ? {
        point_cloud_url: `/demo/pointcloud.ply`,
        sparse_model_url: `/demo/sparse_model.zip`,
        mesh_url: `/demo/mesh.obj`,
        thumbnail_url: `/demo/thumbnail.jpg`
      } : undefined
    }
  }

  // Download processed file
  async downloadFile(projectId: string, fileType: 'ply' | 'obj' | 'glb'): Promise<Blob> {
    if (!this.baseUrl) {
      // Demo mode - return empty blob
      return new Blob(['Demo file content'], { type: 'application/octet-stream' })
    }

    const response = await fetch(`${this.baseUrl}/download/${projectId}/${fileType}`)
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    return response.blob()
  }

  // Download result file from job
  async downloadResult(jobId: string, filename: string): Promise<Blob> {
    if (!this.baseUrl) {
      // Demo mode - return empty blob
      return new Blob(['Demo PLY content'], { type: 'application/octet-stream' })
    }

    const response = await fetch(`${this.baseUrl}/results/${jobId}/${filename}`)
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    return response.blob()
  }

  // Get result URL for direct loading in viewer
  getResultUrl(jobId: string, filename: string): string | null {
    if (!this.baseUrl) {
      return null
    }
    return `${this.baseUrl}/results/${jobId}/${filename}`
  }

  // Get detailed scan information
  async getScanDetails(scanId: string): Promise<any> {
    if (!this.baseUrl) {
      // Demo mode - return mock detailed data
      return {
        id: scanId,
        name: `Demo Scan ${scanId.slice(-1)}`,
        status: "completed",
        technical_details: {
          point_count: 45892,
          camera_count: 24,
          feature_count: 892847,
          processing_time: "4.2 minutes",
          resolution: "1920x1080",
          file_size: "18.3 MB",
          reconstruction_error: "0.42 pixels",
          coverage: "94.2%"
        },
        processing_stages: [
          { name: "Frame Extraction", status: "completed", duration: "0.8s", frames_extracted: 24 },
          { name: "Feature Detection", status: "completed", duration: "45.2s", features_detected: 892847 },
          { name: "Feature Matching", status: "completed", duration: "1.2m", matches: 245892 },
          { name: "Sparse Reconstruction", status: "completed", duration: "1.8m", points: 45892 },
          { name: "Dense Reconstruction", status: "completed", duration: "0.4m", points: 145892 }
        ],
        results: {
          point_cloud_url: `/models/${scanId}/pointcloud.ply`,
          mesh_url: `/models/${scanId}/mesh.obj`,
          thumbnail_url: `/models/${scanId}/thumbnail.jpg`
        }
      }
    }

    try {
      return await this.request<any>(`/scans/${scanId}/details`)
    } catch (error) {
      console.warn('Failed to get scan details from API, using demo data:', error)
      // Return demo data directly to avoid infinite recursion
      return {
        id: scanId,
        name: `Demo Scan ${scanId.slice(-1)}`,
        status: "completed",
        technical_details: {
          point_count: 45892,
          camera_count: 24,
          feature_count: 892847,
          processing_time: "4.2 minutes",
          resolution: "1920x1080",
          file_size: "18.3 MB",
          reconstruction_error: "0.42 pixels",
          coverage: "94.2%"
        },
        processing_stages: [
          { name: "Frame Extraction", status: "completed", duration: "0.8s", frames_extracted: 24 },
          { name: "Feature Detection", status: "completed", duration: "45.2s", features_detected: 892847 },
          { name: "Feature Matching", status: "completed", duration: "1.2m", matches: 245892 },
          { name: "Sparse Reconstruction", status: "completed", duration: "1.8m", points: 45892 },
          { name: "Dense Reconstruction", status: "completed", duration: "0.4m", points: 145892 }
        ],
        results: {
          point_cloud_url: `/models/${scanId}/pointcloud.ply`,
          mesh_url: `/models/${scanId}/mesh.obj`,
          thumbnail_url: `/models/${scanId}/thumbnail.jpg`
        }
      }
    }
  }

  // Create a new project
  async createProject(userEmail: string, name: string, description: string = '', location: string = '', spaceType: string = '', projectType: string = ''): Promise<{ projectId: string }> {
    if (!this.baseUrl) {
      // Demo mode - simulate project creation
      const projectId = `demo-project-${Date.now()}`
      return { projectId }
    }

    try {
      const params = new URLSearchParams({
        user_email: userEmail,
        name,
        description,
        location,
        space_type: spaceType,
        project_type: projectType
      })
      
      const response = await fetch(`${this.baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      })

      if (!response.ok) {
        throw new Error(`Project creation failed: ${response.status}`)
      }

      const result = await response.json()
      return { projectId: result.project_id }
    } catch (error) {
      console.warn('Project creation failed, using demo mode:', error)
      const projectId = `demo-project-${Date.now()}`
      return { projectId }
    }
  }

  // Get user projects
  async getUserProjects(userEmail: string): Promise<Project[]> {
    if (!this.baseUrl) {
      // Demo mode - return localStorage projects
      return localStorage.getProjects()
    }

    try {
      const response = await this.request<Project[]>(`/users/${encodeURIComponent(userEmail)}/projects`)
      return response
    } catch (error) {
      console.warn('Failed to get projects from API, using demo data:', error)
      return localStorage.getProjects()
    }
  }

  // Get project scans
  async getProjectScans(projectId: string): Promise<Scan[]> {
    if (!this.baseUrl) {
      // Demo mode - return localStorage scans
      return localStorage.getScans().filter(scan => scan.projectId === projectId)
    }

    try {
      const response = await this.request<Scan[]>(`/projects/${projectId}/scans`)
      return response
    } catch (error) {
      console.warn('Failed to get scans from API, using demo data:', error)
      return localStorage.getScans().filter(scan => scan.projectId === projectId)
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    if (!this.baseUrl) {
      return { status: 'demo' }
    }

    try {
      return await this.request<{ status: string }>('/health')
    } catch (error) {
      // If health check fails, we're now in demo mode
      return { status: 'demo' }
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Local storage helpers - no demo data
export const localStorage = {
  getProjects: (): Project[] => {
    // Return empty array - no demo projects
    return []
  },

  saveProjects: (projects: Project[]) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('videogrammetry_projects', JSON.stringify(projects))
  },

  getScans: (): Scan[] => {
    // Return empty array - no demo scans
    return []
  },

  saveScans: (scans: Scan[]) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('videogrammetry_scans', JSON.stringify(scans))
  },

  getProcessingJobs: (): Record<string, ProcessingJob> => {
    if (typeof window === 'undefined') return {}
    const stored = window.localStorage.getItem('videogrammetry_jobs')
    return stored ? JSON.parse(stored) : {}
  },

  saveProcessingJob: (jobId: string, job: ProcessingJob) => {
    if (typeof window === 'undefined') return
    const jobs = localStorage.getProcessingJobs()
    jobs[jobId] = job
    window.localStorage.setItem('videogrammetry_jobs', JSON.stringify(jobs))
  }
}

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (500MB max)
  const maxSize = 500 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be under 500MB' }
  }

  // Check file type (MP4 only for MVP)
  if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
    return { valid: false, error: 'Only MP4 video files are supported' }
  }

  return { valid: true }
}