// API client for COLMAP Worker Cloud Run service

const API_BASE_URL = process.env.NEXT_PUBLIC_COLMAP_WORKER_URL || 'https://colmap-app-64102061337.us-central1.run.app'

export interface ProjectData {
  id: string
  name: string
  description: string
  location: string
  spaceType: string
  projectType: string
  createdAt: string
  status: 'active' | 'completed' | 'processing'
  scanCount?: number
  lastUpdate?: string
}

export interface ScanData {
  id: string
  name: string
  projectId: string
  status: 'completed' | 'processing' | 'failed' | 'queued'
  location: string
  capturedAt: string
  fileSize?: string
  duration?: string
  pointCount?: number
  thumbnailUrl?: string
  meshUrl?: string
  pointCloudUrl?: string
}

export interface ProcessingJob {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  message: string
  created_at: string
  results?: {
    point_cloud_url: string
    mesh_url: string
    thumbnail_url: string
  }
}

class ApiClient {
  private baseUrl: string
  private authToken: string | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
    
    // Initialize auth token from localStorage if available
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('auth_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }
    
    return headers
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    
    return response.text() as T
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }

  // Authentication
  setAuthToken(token: string) {
    this.authToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearAuthToken() {
    this.authToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // Projects API
  async getProjects(): Promise<ProjectData[]> {
    // Since the current worker doesn't have project endpoints,
    // we'll return demo data for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "1",
            name: "Inspección Edificio Central",
            description: "Documentación 3D del edificio principal para análisis estructural",
            location: "Ciudad de México, CDMX",
            spaceType: "interior",
            projectType: "inspection",
            createdAt: "2024-01-15T00:00:00Z",
            status: "active",
            scanCount: 12,
            lastUpdate: "Hace 2 días"
          }
        ])
      }, 500)
    })
  }

  async createProject(data: Omit<ProjectData, 'id' | 'createdAt' | 'status'>): Promise<ProjectData> {
    // Demo implementation - in production, this would call the backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...data,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          status: 'active',
          scanCount: 0
        })
      }, 1000)
    })
  }

  async getProject(id: string): Promise<ProjectData> {
    // Demo implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (id === "1") {
          resolve({
            id,
            name: "Inspección Edificio Central",
            description: "Documentación 3D del edificio principal para análisis estructural",
            location: "Ciudad de México, CDMX",
            spaceType: "interior",
            projectType: "inspection",
            createdAt: "2024-01-15T00:00:00Z",
            status: "active"
          })
        } else {
          reject(new Error('Project not found'))
        }
      }, 500)
    })
  }

  async deleteProject(id: string): Promise<void> {
    // Demo implementation
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }

  // Scans API
  async getScans(projectId: string): Promise<ScanData[]> {
    // Demo implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "scan-1",
            name: "Planta Baja - Lobby Principal",
            projectId,
            status: "completed",
            location: "Planta Baja, Sector A",
            capturedAt: "2024-01-20T10:30:00Z",
            fileSize: "245 MB",
            duration: "8 min",
            pointCount: 2850000,
            thumbnailUrl: "/api/assets/sample-scan-thumbnail.jpg"
          }
        ])
      }, 500)
    })
  }

  async getScan(projectId: string, scanId: string): Promise<ScanData> {
    // Demo implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (scanId === "scan-1") {
          resolve({
            id: scanId,
            name: "Planta Baja - Lobby Principal",
            projectId,
            status: "completed",
            location: "Planta Baja, Sector A",
            capturedAt: "2024-01-20T10:30:00Z",
            fileSize: "245 MB",
            duration: "8 min",
            pointCount: 2850000,
            thumbnailUrl: "/api/assets/sample-scan-thumbnail.jpg",
            meshUrl: "/models/sample.ply",
            pointCloudUrl: "/pointclouds/sample.las"
          })
        } else {
          reject(new Error('Scan not found'))
        }
      }, 500)
    })
  }

  // Video processing (integrates with existing worker endpoint)
  async uploadVideo(data: {
    project_id: string
    video_url: string
    quality?: string
    dense_reconstruction?: boolean
    meshing?: boolean
  }): Promise<ProcessingJob> {
    return this.request('/upload-video', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    return this.request(`/jobs/${jobId}`)
  }

  // File downloads
  async downloadFile(projectId: string, fileType: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/download/${projectId}/${fileType}`, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }
    
    return response.blob()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Utility functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export const formatPointCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  } else {
    return count.toString()
  }
}
