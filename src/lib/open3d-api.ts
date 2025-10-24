/**
 * Open3D API Integration
 * Connects frontend to backend Open3D processing features
 */

export interface PointCloudStats {
  pointCount: number
  boundingBox: {
    min: [number, number, number]
    max: [number, number, number]
  }
  centroid: [number, number, number]
  dimensions: [number, number, number]
  density: number
}

export interface PointInfo {
  index: number
  position: [number, number, number]
  color?: [number, number, number]
  normal?: [number, number, number]
}

export interface ColormapOptions {
  type: 'jet' | 'viridis' | 'plasma' | 'inferno' | 'magma' | 'turbo'
  minValue?: number
  maxValue?: number
}

export interface DownsampleOptions {
  voxelSize: number
}

export interface NormalEstimationOptions {
  radius: number
  maxNeighbors: number
}

export interface OutlierRemovalOptions {
  nbNeighbors: number
  stdRatio: number
}

export interface MeshCreationOptions {
  method: 'poisson' | 'ball_pivoting'
  depth?: number
  width?: number
  scale?: number
  linearFit?: boolean
}

export interface RenderOptions {
  width: number
  height: number
  cameraPosition?: [number, number, number]
  cameraTarget?: [number, number, number]
  cameraUp?: [number, number, number]
  fov?: number
}

class Open3DApi {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        throw new Error(`Open3D API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('Open3D API request failed:', error)
      throw error
    }
  }

  // Get point cloud statistics
  async getPointCloudStats(scanId: string): Promise<PointCloudStats> {
    return this.request<PointCloudStats>(`/api/point-cloud/${scanId}/stats`)
  }

  // Get information about a specific point
  async getPointInfo(scanId: string, pointIndex: number): Promise<PointInfo> {
    return this.request<PointInfo>(`/api/point-cloud/${scanId}/point/${pointIndex}`)
  }

  // Apply colormap to point cloud
  async applyColormap(scanId: string, options: ColormapOptions): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/point-cloud/${scanId}/colormap`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Downsample point cloud
  async downsamplePointCloud(scanId: string, options: DownsampleOptions): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/point-cloud/${scanId}/downsample`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Estimate normals for point cloud
  async estimateNormals(scanId: string, options: NormalEstimationOptions): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/point-cloud/${scanId}/estimate-normals`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Remove statistical outliers
  async removeOutliers(scanId: string, options: OutlierRemovalOptions): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/point-cloud/${scanId}/remove-outliers`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Create mesh from point cloud
  async createMesh(scanId: string, options: MeshCreationOptions): Promise<{ success: boolean; message: string; meshUrl?: string }> {
    return this.request<{ success: boolean; message: string; meshUrl?: string }>(`/api/point-cloud/${scanId}/create-mesh`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Render point cloud to high-resolution image
  async renderToImage(scanId: string, options: RenderOptions): Promise<{ success: boolean; message: string; imageUrl?: string }> {
    return this.request<{ success: boolean; message: string; imageUrl?: string }>(`/api/point-cloud/${scanId}/render`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  // Get default camera parameters
  async getCameraParameters(): Promise<{
    position: [number, number, number]
    target: [number, number, number]
    up: [number, number, number]
    fov: number
  }> {
    return this.request<{
      position: [number, number, number]
      target: [number, number, number]
      up: [number, number, number]
      fov: number
    }>('/api/camera/parameters')
  }
}

// Create singleton instance
const open3dApi = new Open3DApi(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

export default open3dApi
