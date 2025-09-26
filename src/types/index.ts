export interface Project {
  id: string
  name: string
  description?: string
  location?: string
  space_type?: string
  project_type?: string
  created_at: string
  updated_at: string
  user_id: string
  scans?: Scan[]
}

export interface Scan {
  id: string
  name: string
  description?: string
  location?: string
  project_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  model_url?: string
  thumbnail_url?: string
  models?: {
    point_cloud_url?: string
    mesh_url?: string
    texture_url?: string
  }
  processing_jobs?: ProcessingJob[]
  processing_options?: ProcessingOptions
}

export interface ProcessingJob {
  id: string
  scan_id: string
  type: 'feature_extraction' | 'matching' | 'sparse_reconstruction' | 'dense_reconstruction' | 'meshing'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface ProcessingOptions {
  quality: 'low' | 'medium' | 'high' | 'extreme'
  dense_reconstruction: boolean
  meshing: boolean
  frame_rate: number
}

export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

export interface Asset3D {
  id: string
  scan_id: string
  type: 'point_cloud' | 'mesh' | 'texture'
  format: 'ply' | 'obj' | 'gltf' | 'las'
  url: string
  size: number
  created_at: string
}

export interface Collaboration {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  created_at: string
}