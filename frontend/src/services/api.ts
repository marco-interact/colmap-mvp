import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 600000, // 10 minutes for large file uploads
  maxContentLength: 1024 * 1024 * 1024, // 1GB
  maxBodyLength: 1024 * 1024 * 1024, // 1GB
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),  // Updated to use demo login endpoint
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }) => api.post('/auth/register', userData),
  
  getMe: () => api.get('/auth/me'),
  
  updateMe: (userData: { full_name?: string }) => api.put('/auth/me', userData),
  
  // Demo endpoint to list available users
  getDemoUsers: () => api.get('/auth/demo-users'),
};

// Projects API
export const projectsApi = {
  getProjects: (params?: { skip?: number; limit?: number }) =>
    api.get('/projects', { params }),
  
  getProject: (id: number) => api.get(`/projects/${id}`),
  
  createProject: (projectData: { name: string; description?: string }) =>
    api.post('/projects', projectData),
  
  updateProject: (id: number, projectData: { name?: string; description?: string; status?: string }) =>
    api.put(`/projects/${id}`, projectData),
  
  deleteProject: (id: number) => api.delete(`/projects/${id}`),
  
  startReconstruction: (id: number, quality: string = 'medium') =>
    api.post(`/projects/${id}/start-reconstruction`, null, { params: { quality } }),
  
  getProjectStatus: (id: number) => api.get(`/projects/${id}/status`),
};

// Files API
export const filesApi = {
  uploadVideo: (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId.toString());
    return api.post('/files/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  extractFrames: (projectId: number, interval: number = 1.0) => {
    const formData = new FormData();
    formData.append('project_id', projectId.toString());
    formData.append('interval', interval.toString());
    return api.post('/files/extract-frames', formData);
  },
  
  downloadFile: (projectId: number, fileType: string) =>
    api.get(`/files/download/${projectId}/${fileType}`, { responseType: 'blob' }),
  
  listProjectFiles: (projectId: number) => api.get(`/files/list/${projectId}`),
};

// Jobs API
export const jobsApi = {
  getJobs: (params?: {
    project_id?: number;
    status?: string;
    job_type?: string;
    skip?: number;
    limit?: number;
  }) => api.get('/jobs', { params }),
  
  getJob: (id: number) => api.get(`/jobs/${id}`),
  
  cancelJob: (id: number) => api.post(`/jobs/${id}/cancel`),
  
  getJobLogs: (id: number) => api.get(`/jobs/${id}/logs`),
  
  getProjectJobsStatus: (projectId: number) => api.get(`/jobs/project/${projectId}/status`),
};

// Utility functions
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
    case 'success':
      return '#10b981';
    case 'processing':
    case 'running':
      return '#3b82f6';
    case 'failed':
    case 'error':
      return '#ef4444';
    case 'pending':
      return '#f59e0b';
    case 'cancelled':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'completed':
    case 'success':
      return '✓';
    case 'processing':
    case 'running':
      return '⟳';
    case 'failed':
    case 'error':
      return '✗';
    case 'pending':
      return '⏳';
    case 'cancelled':
      return '⏹';
    default:
      return '?';
  }
};

// File upload API with large file support
export const fileUploadApi = {
  uploadVideo: async (projectId: string, file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/projects/${projectId}/upload-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes
      maxContentLength: 1024 * 1024 * 1024, // 1GB
      maxBodyLength: 1024 * 1024 * 1024, // 1GB
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes
      maxContentLength: 1024 * 1024 * 1024, // 1GB
      maxBodyLength: 1024 * 1024 * 1024, // 1GB
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

export default api;


