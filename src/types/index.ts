// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
  created_at: string
  updated_at: string
}

// Project Types
export interface Project {
  id: string
  name: string
  description: string
  location: string
  user_id: string
  status: 'created' | 'processing' | 'completed' | 'failed'
  settings: {
    space_type: 'interior' | 'exterior' | 'industrial' | 'residential' | 'commercial'
    project_type: 'reconstruction' | 'measurement' | 'inspection' | 'modeling' | 'documentation'
    quality: 'low' | 'medium' | 'high' | 'extreme'
  }
  thumbnail?: string
  total_scans: number
  created_at: string
  updated_at: string
  last_processed_at?: string
}

// Scan Types
export interface Scan {
  id: string
  name: string
  description: string
  project_id: string
  video_filename: string
  video_path: string
  video_size: number
  frames_extracted: number
  status: 'uploaded' | 'extracting' | 'processing' | 'completed' | 'failed'
  processing_results?: COLMAPResults
  model_path?: string
  thumbnail?: string
  created_at: string
  updated_at: string
}

// COLMAP Types
export interface COLMAPResults {
  sparse_model?: string
  dense_model?: string
  mesh?: string
  textured_mesh?: string
  features_extracted?: boolean
  features_matched?: boolean
  sparse_reconstruction?: boolean
  dense_reconstruction?: boolean
  meshing?: boolean
  texturing?: boolean
  stats?: {
    num_cameras: number
    num_images: number
    num_points: number
    processing_time: number
  }
}

export interface ProcessingJob {
  id: string
  job_id: string
  scan_id: string
  type: 'frame_extraction' | 'feature_extraction' | 'feature_matching' | 'sparse_reconstruction' | 'dense_reconstruction' | 'meshing' | 'texturing'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message: string
  results?: any
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// 3D Asset Types
export interface Asset3D {
  id: string
  project_id: string
  scan_id: string
  type: 'point_cloud' | 'mesh' | 'texture'
  format: 'ply' | 'obj' | 'gltf' | 'jpg' | 'png'
  path: string
  filename: string
  size: number
  metadata?: {
    vertices?: number
    faces?: number
    textures?: number
    resolution?: string
  }
  status: 'processing' | 'ready' | 'failed'
  thumbnail?: string
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form Types
export interface CreateProjectForm {
  name: string
  description: string
  location: string
  space_type: Project['settings']['space_type']
  project_type: Project['settings']['project_type']
}

export interface CreateScanForm {
  name: string
  description: string
  project_id: string
  video: File
}

// Upload Types
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUploadResponse {
  url: string
  path: string
  size: number
  type: string
}
