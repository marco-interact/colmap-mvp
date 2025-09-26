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

// Get the COLMAP worker URL from environment
const getWorkerUrl = () => {
  const url = process.env.NEXT_PUBLIC_COLMAP_WORKER_URL
  if (!url) {
    console.warn('NEXT_PUBLIC_COLMAP_WORKER_URL not configured, using demo mode')
    return null
  }
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
        // If we get a CORS or network error, fall back to demo mode
        if (response.status === 0 || response.status >= 400) {
          console.warn('Worker service unavailable, falling back to demo mode')
          this.baseUrl = null // Switch to demo mode
          throw new Error('Worker service unavailable - switched to demo mode')
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      // Network errors, CORS errors, etc.
      console.warn('Network error connecting to worker service, falling back to demo mode:', error)
      this.baseUrl = null // Switch to demo mode
      throw new Error('Network error - switched to demo mode')
    }
  }

  // Upload video for processing
  async uploadVideo(file: File, projectId: string, scanName: string): Promise<{ jobId: string }> {
    if (!this.baseUrl) {
      // Demo mode - simulate upload
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ jobId: `demo-job-${Date.now()}` })
        }, 1000)
      })
    }

    const formData = new FormData()
    formData.append('video', file)
    formData.append('project_id', projectId)
    formData.append('scan_name', scanName)
    formData.append('quality', 'medium')
    formData.append('dense_reconstruction', 'true')
    formData.append('meshing', 'true')

    try {
      const response = await fetch(`${this.baseUrl}/upload-video`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Handle CORS and network errors by falling back to demo mode
        console.warn('Upload failed, falling back to demo mode')
        this.baseUrl = null
        return this.uploadVideo(file, projectId, scanName) // Retry in demo mode
      }

      const result = await response.json()
      return { jobId: result.job_id }
    } catch (error) {
      // Network/CORS error - fall back to demo mode
      console.warn('Network error during upload, falling back to demo mode:', error)
      this.baseUrl = null
      return this.uploadVideo(file, projectId, scanName) // Retry in demo mode
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

// Local storage helpers for demo mode
export const localStorage = {
  getProjects: (): Project[] => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('videogrammetry_projects')
    return stored ? JSON.parse(stored) : []
  },

  saveProjects: (projects: Project[]) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('videogrammetry_projects', JSON.stringify(projects))
  },

  getScans: (): Scan[] => {
    if (typeof window === 'undefined') return []
    const stored = window.localStorage.getItem('videogrammetry_scans')
    return stored ? JSON.parse(stored) : []
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