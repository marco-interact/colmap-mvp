// Type definitions for the 3D Visualization Platform

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  total_frames: number;
  processed_frames: number;
  reconstruction_quality: number;
  processing_time: number;
  created_at: string;
  updated_at: string;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

export interface ProcessingJob {
  id: number;
  job_type: JobType;
  status: JobStatus;
  progress: number;
  error_message?: string;
  parameters?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  duration?: number;
  cpu_usage?: number;
  memory_usage?: number;
  created_at: string;
  updated_at: string;
}

export enum JobType {
  FRAME_EXTRACTION = 'frame_extraction',
  FEATURE_EXTRACTION = 'feature_extraction',
  FEATURE_MATCHING = 'feature_matching',
  SPARSE_RECONSTRUCTION = 'sparse_reconstruction',
  DENSE_RECONSTRUCTION = 'dense_reconstruction',
  MESH_GENERATION = 'mesh_generation',
  TEXTURING = 'texturing'
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface FileUploadResponse {
  message: string;
  file_path: string;
  file_size: number;
  project_id: number;
}

export interface FrameExtractionResponse {
  message: string;
  frames_path: string;
  total_frames: number;
  interval: number;
}

export interface ReconstructionRequest {
  quality: 'low' | 'medium' | 'high' | 'extreme';
}

export interface ProjectStatusResponse {
  project_id: number;
  status: ProjectStatus;
  progress: {
    total_frames: number;
    processed_frames: number;
    percentage: number;
  };
  quality: number;
  processing_time: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  type: string;
  path: string;
  size: number;
  modified: number;
}

export interface ProjectFilesResponse {
  project_id: number;
  files: ProjectFile[];
}

// 3D Viewer Types
export interface ViewerControls {
  autoRotate: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  showGrid: boolean;
  showAxes: boolean;
  backgroundColor: string;
}

export interface Measurement {
  id: string;
  type: 'distance' | 'area' | 'volume';
  points: number[][];
  value: number;
  unit: string;
  color: string;
}

export interface ModelInfo {
  vertices: number;
  faces: number;
  materials: number;
  textures: number;
  boundingBox: {
    min: number[];
    max: number[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Error Types
export interface ApiError {
  detail: string;
  status_code: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
}




