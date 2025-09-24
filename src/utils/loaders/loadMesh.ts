import * as THREE from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export interface MeshLoadOptions {
  wireframe?: boolean
  color?: THREE.Color
  opacity?: number
  metalness?: number
  roughness?: number
  enableShadows?: boolean
  computeNormals?: boolean
}

export interface LoadProgress {
  loaded: number
  total: number
  percentage: number
}

export class MeshLoader {
  private plyLoader: PLYLoader
  private objLoader: OBJLoader
  private gltfLoader: GLTFLoader
  private dracoLoader: DRACOLoader
  private loadingManager: THREE.LoadingManager

  constructor() {
    this.loadingManager = new THREE.LoadingManager()
    
    // Initialize loaders
    this.plyLoader = new PLYLoader(this.loadingManager)
    this.objLoader = new OBJLoader(this.loadingManager)
    this.gltfLoader = new GLTFLoader(this.loadingManager)
    
    // Setup Draco loader for compressed geometries
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  async loadFromUrl(
    url: string,
    options: MeshLoadOptions = {},
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Mesh> {
    const extension = this.getFileExtension(url)
    
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

    switch (extension) {
      case 'ply':
        return this.loadPLY(url, options, onProgress)
      case 'obj':
        return this.loadOBJ(url, options, onProgress)
      case 'gltf':
      case 'glb':
        return this.loadGLTF(url, options, onProgress)
      default:
        throw new Error(`Unsupported mesh format: ${extension}`)
    }
  }

  private async loadPLY(
    url: string,
    options: MeshLoadOptions,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Mesh> {
    return new Promise((resolve, reject) => {
      this.plyLoader.load(
        url,
        (geometry) => {
          try {
            const mesh = this.createMesh(geometry, options)
            resolve(mesh)
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
        (error) => reject(new Error(`Failed to load PLY mesh: ${error instanceof Error ? error.message : String(error)}`))
      )
    })
  }

  private async loadOBJ(
    url: string,
    options: MeshLoadOptions,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Mesh> {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (object) => {
          try {
            // Find the first mesh in the object
            let mesh: THREE.Mesh | null = null
            object.traverse((child) => {
              if (child instanceof THREE.Mesh && !mesh) {
                mesh = child
              }
            })
            
            if (!mesh) {
              throw new Error('No mesh found in OBJ file')
            }
            
            // Apply options to the mesh
            this.applyMeshOptions(mesh, options)
            resolve(mesh)
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
        (error) => reject(new Error(`Failed to load OBJ mesh: ${error instanceof Error ? error.message : String(error)}`))
      )
    })
  }

  private async loadGLTF(
    url: string,
    options: MeshLoadOptions,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Mesh> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          try {
            // Find the first mesh in the scene
            let mesh: THREE.Mesh | null = null
            gltf.scene.traverse((child) => {
              if (child instanceof THREE.Mesh && !mesh) {
                mesh = child
              }
            })
            
            if (!mesh) {
              throw new Error('No mesh found in GLTF file')
            }
            
            // Apply options to the mesh
            this.applyMeshOptions(mesh, options)
            resolve(mesh)
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
        (error) => reject(new Error(`Failed to load GLTF mesh: ${error instanceof Error ? error.message : String(error)}`))
      )
    })
  }

  private createMesh(
    geometry: THREE.BufferGeometry,
    options: MeshLoadOptions
  ): THREE.Mesh {
    // Optimize geometry
    this.optimizeGeometry(geometry, options)

    // Create material
    const material = this.createMaterial(options)

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'ReconstructedMesh'

    if (options.enableShadows) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }

    return mesh
  }

  private createMaterial(options: MeshLoadOptions): THREE.Material {
    const {
      wireframe = false,
      color = new THREE.Color(0x888888),
      opacity = 1.0,
      metalness = 0.1,
      roughness = 0.8
    } = options

    if (wireframe) {
      return new THREE.MeshBasicMaterial({
        color,
        wireframe: true,
        transparent: opacity < 1,
        opacity
      })
    }

    return new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide
    })
  }

  private applyMeshOptions(mesh: THREE.Mesh, options: MeshLoadOptions): void {
    if (options.wireframe && mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.wireframe = true
    }
    
    if (options.opacity !== undefined && mesh.material instanceof THREE.Material) {
      mesh.material.transparent = options.opacity < 1
      mesh.material.opacity = options.opacity
    }

    if (options.enableShadows) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  }

  private optimizeGeometry(
    geometry: THREE.BufferGeometry,
    options: MeshLoadOptions
  ): void {
    // Compute bounding box and center geometry
    geometry.computeBoundingBox()
    const center = new THREE.Vector3()
    geometry.boundingBox?.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)

    // Compute normals if needed
    if (options.computeNormals || !geometry.attributes.normal) {
      geometry.computeVertexNormals()
    }

    // Compute tangents if UV coordinates exist
    if (geometry.attributes.uv) {
      geometry.computeTangents()
    }
  }

  private getFileExtension(url: string): string {
    const urlParts = url.split('.')
    return urlParts[urlParts.length - 1].toLowerCase().split('?')[0]
  }

  dispose(): void {
    this.dracoLoader.dispose()
  }

  // Static utility method for quick loading
  static async load(
    url: string,
    options?: MeshLoadOptions,
    onProgress?: (progress: LoadProgress) => void
  ): Promise<THREE.Mesh> {
    const loader = new MeshLoader()
    return loader.loadFromUrl(url, options, onProgress)
  }
}
