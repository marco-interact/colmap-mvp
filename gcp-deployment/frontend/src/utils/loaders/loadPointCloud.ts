import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'

export interface PointCloudLoadOptions {
  pointSize?: number
  maxPoints?: number
  color?: THREE.Color
  useVertexColors?: boolean
}

export interface LoadProgress {
  loaded: number
  total: number
  percentage: number
}

export class PointCloudLoader {
  private loader: PLYLoader
  private loadingManager: THREE.LoadingManager

  constructor() {
    this.loadingManager = new THREE.LoadingManager()
    this.loader = new PLYLoader(this.loadingManager)
  }

  async loadFromUrl(
    url: string,
    options: PointCloudLoadOptions = {},
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Points> {
    return new Promise((resolve, reject) => {
      // Setup progress tracking
      this.loadingManager.onProgress = (url, loaded, total) => {
        if (onProgress) {
          onProgress({
            loaded,
            total,
            percentage: total > 0 ? (loaded / total) * 100 : 0
          })
        }
      }

      this.loader.load(
        url,
        (geometry) => {
          try {
            const pointCloud = this.createPointCloud(geometry, options)
            resolve(pointCloud)
          } catch (error) {
            reject(error)
          }
        },
        (progress) => {
          if (onProgress && progress.total > 0) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: (progress.loaded / progress.total) * 100
            })
          }
        },
        (error) => {
          reject(new Error(`Failed to load point cloud: ${error instanceof Error ? error.message : String(error)}`))
        }
      )
    })
  }

  async loadFromFile(
    file: File,
    options: PointCloudLoadOptions = {},
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Points> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onprogress = (event) => {
        if (onProgress && event.total > 0) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: (event.loaded / event.total) * 100
          })
        }
      }

      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const geometry = this.loader.parse(arrayBuffer)
          const pointCloud = this.createPointCloud(geometry, options)
          resolve(pointCloud)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  private createPointCloud(
    geometry: THREE.BufferGeometry,
    options: PointCloudLoadOptions
  ): THREE.Points {
    const {
      pointSize = 1.0,
      maxPoints,
      color = new THREE.Color(0x888888),
      useVertexColors = true
    } = options

    // Optimize geometry if needed
    if (maxPoints && geometry.attributes.position.count > maxPoints) {
      geometry = this.decimatePointCloud(geometry, maxPoints)
    }

    // Compute bounding box for centering
    geometry.computeBoundingBox()
    const center = new THREE.Vector3()
    geometry.boundingBox?.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)

    // Create material
    const material = new THREE.PointsMaterial({
      size: pointSize,
      sizeAttenuation: true,
      vertexColors: useVertexColors && geometry.attributes.color ? true : false,
      color: useVertexColors ? undefined : color,
      transparent: true,
      opacity: 0.8,
      fog: false
    })

    // Create point cloud
    const pointCloud = new THREE.Points(geometry, material)
    pointCloud.name = 'PointCloud'
    
    return pointCloud
  }

  private decimatePointCloud(
    geometry: THREE.BufferGeometry,
    targetCount: number
  ): THREE.BufferGeometry {
    const originalCount = geometry.attributes.position.count
    const decimationRatio = targetCount / originalCount
    
    if (decimationRatio >= 1) return geometry

    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color?.array as Float32Array
    const normals = geometry.attributes.normal?.array as Float32Array

    const newPositions: number[] = []
    const newColors: number[] = []
    const newNormals: number[] = []

    // Simple uniform decimation
    const step = 1 / decimationRatio
    for (let i = 0; i < originalCount; i += step) {
      const index = Math.floor(i) * 3
      if (index + 2 < positions.length) {
        newPositions.push(
          positions[index],
          positions[index + 1],
          positions[index + 2]
        )

        if (colors) {
          newColors.push(
            colors[index],
            colors[index + 1],
            colors[index + 2]
          )
        }

        if (normals) {
          newNormals.push(
            normals[index],
            normals[index + 1],
            normals[index + 2]
          )
        }
      }
    }

    // Create new geometry
    const newGeometry = new THREE.BufferGeometry()
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3))
    
    if (newColors.length > 0) {
      newGeometry.setAttribute('color', new THREE.Float32BufferAttribute(newColors, 3))
    }
    
    if (newNormals.length > 0) {
      newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3))
    }

    return newGeometry
  }

  // Static utility method for quick loading
  static async load(
    url: string,
    options?: PointCloudLoadOptions,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Points> {
    const loader = new PointCloudLoader()
    return loader.loadFromUrl(url, options, onProgress)
  }
}
