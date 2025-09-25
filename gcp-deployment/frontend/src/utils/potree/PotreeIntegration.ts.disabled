/**
 * Potree Integration for Optimized Point Cloud Rendering
 * Based on https://github.com/potree/PotreeConverter
 * Provides octree LOD structure for massive point cloud streaming
 */

export interface PotreeMetadata {
  version: string
  octreeDir: string
  points: number
  boundingBox: {
    lx: number, ly: number, lz: number
    ux: number, uy: number, uz: number
  }
  tightBoundingBox: {
    lx: number, ly: number, lz: number
    ux: number, uy: number, uz: number
  }
  pointAttributes: string[]
  spacing: number
  scale: number[]
  hierarchyStepSize: number
  projection: string
}

export interface PotreeNode {
  name: string
  level: number
  x: number
  y: number
  z: number
  numPoints: number
  children?: PotreeNode[]
  geometryByteSize?: number
  loaded: boolean
}

export interface LODSettings {
  pointBudget: number
  minimumNodePixelSize: number
  screenSpaceError: number
}

export class PotreeIntegration {
  private baseUrl: string
  private metadata: PotreeMetadata | null = null
  private rootNode: PotreeNode | null = null
  private loadedNodes: Map<string, any> = new Map()
  private lodSettings: LODSettings = {
    pointBudget: 1000000,
    minimumNodePixelSize: 1.0,
    screenSpaceError: 1.0
  }

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  }

  /**
   * Load Potree metadata from converted point cloud
   */
  async loadMetadata(): Promise<PotreeMetadata> {
    try {
      const response = await fetch(`${this.baseUrl}metadata.json`)
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`)
      }
      
      this.metadata = await response.json()
      this.initializeHierarchy()
      return this.metadata
    } catch (error) {
      throw new Error(`Failed to load Potree metadata: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Initialize octree hierarchy
   */
  private initializeHierarchy() {
    if (!this.metadata) return

    this.rootNode = {
      name: 'r',
      level: 0,
      x: 0,
      y: 0,
      z: 0,
      numPoints: this.metadata.points,
      loaded: false
    }
  }

  /**
   * Load hierarchy structure
   */
  async loadHierarchy(): Promise<PotreeNode> {
    if (!this.rootNode) {
      throw new Error('Metadata must be loaded first')
    }

    try {
      const response = await fetch(`${this.baseUrl}hierarchy.bin`)
      if (!response.ok) {
        throw new Error(`Failed to fetch hierarchy: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const dataView = new DataView(arrayBuffer)
      
      // Parse binary hierarchy (simplified version)
      this.parseHierarchy(dataView, this.rootNode)
      return this.rootNode
    } catch (error) {
      throw new Error(`Failed to load hierarchy: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Parse binary hierarchy data
   */
  private parseHierarchy(dataView: DataView, node: PotreeNode) {
    // Simplified hierarchy parsing - in production this would parse the actual Potree binary format
    let offset = 0
    const hierarchyStepSize = this.metadata?.hierarchyStepSize || 5

    while (offset < dataView.byteLength) {
      try {
        const childMask = dataView.getUint8(offset)
        const numPoints = dataView.getUint32(offset + 1, true)
        offset += hierarchyStepSize

        // Create child nodes based on octree structure
        for (let i = 0; i < 8; i++) {
          if (childMask & (1 << i)) {
            const childName = node.name + i.toString()
            const childLevel = node.level + 1
            
            // Calculate child position in octree
            const childX = node.x * 2 + (i & 1)
            const childY = node.y * 2 + ((i >> 1) & 1)
            const childZ = node.z * 2 + ((i >> 2) & 1)

            if (!node.children) {
              node.children = []
            }

            node.children.push({
              name: childName,
              level: childLevel,
              x: childX,
              y: childY,
              z: childZ,
              numPoints: numPoints,
              loaded: false
            })
          }
        }
      } catch (error) {
        break // End of valid data
      }
    }
  }

  /**
   * Calculate Level of Detail (LOD) for rendering
   */
  calculateLOD(
    cameraPosition: [number, number, number],
    cameraDirection: [number, number, number],
    viewportSize: [number, number],
    projectionMatrix: number[]
  ): PotreeNode[] {
    if (!this.rootNode || !this.metadata) {
      return []
    }

    const visibleNodes: PotreeNode[] = []
    const nodeQueue: PotreeNode[] = [this.rootNode]
    let pointsRendered = 0

    while (nodeQueue.length > 0 && pointsRendered < this.lodSettings.pointBudget) {
      const node = nodeQueue.shift()!
      
      // Calculate node bounding box
      const nodeSize = this.calculateNodeSize(node)
      const nodeCenter = this.calculateNodeCenter(node)
      
      // Frustum culling
      if (!this.isNodeInFrustum(nodeCenter, nodeSize, cameraPosition, cameraDirection)) {
        continue
      }

      // Calculate screen space error
      const distance = this.calculateDistance(cameraPosition, nodeCenter)
      const screenSpaceError = this.calculateScreenSpaceError(nodeSize, distance, viewportSize, projectionMatrix)
      
      // Decide whether to render this node or traverse deeper
      if (screenSpaceError <= this.lodSettings.screenSpaceError || !node.children) {
        visibleNodes.push(node)
        pointsRendered += node.numPoints
      } else {
        // Add children to queue for further evaluation
        if (node.children) {
          nodeQueue.push(...node.children)
        }
      }
    }

    return visibleNodes
  }

  /**
   * Load point cloud data for a specific node
   */
  async loadNodeData(node: PotreeNode): Promise<Float32Array> {
    if (this.loadedNodes.has(node.name)) {
      return this.loadedNodes.get(node.name)
    }

    try {
      const response = await fetch(`${this.baseUrl}octree.bin`, {
        headers: {
          'Range': `bytes=${this.calculateNodeByteOffset(node)}-${this.calculateNodeByteOffset(node) + (node.geometryByteSize || 1000000)}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to load node data: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const pointData = new Float32Array(arrayBuffer)
      
      this.loadedNodes.set(node.name, pointData)
      node.loaded = true
      
      return pointData
    } catch (error) {
      throw new Error(`Failed to load node ${node.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Convert COLMAP point cloud to Potree format (simplified)
   */
  static async convertToPotree(
    pointCloudData: Float32Array,
    metadata: {
      numPoints: number
      boundingBox: { min: [number, number, number], max: [number, number, number] }
      hasColors: boolean
      hasNormals: boolean
    }
  ): Promise<{
    metadata: PotreeMetadata
    octreeData: ArrayBuffer
    hierarchy: ArrayBuffer
  }> {
    // Simplified conversion - in production this would use actual PotreeConverter
    const { numPoints, boundingBox, hasColors, hasNormals } = metadata
    
    // Generate Potree metadata
    const potreeMetadata: PotreeMetadata = {
      version: "2.0",
      octreeDir: "octree",
      points: numPoints,
      boundingBox: {
        lx: boundingBox.min[0], ly: boundingBox.min[1], lz: boundingBox.min[2],
        ux: boundingBox.max[0], uy: boundingBox.max[1], uz: boundingBox.max[2]
      },
      tightBoundingBox: {
        lx: boundingBox.min[0], ly: boundingBox.min[1], lz: boundingBox.min[2],
        ux: boundingBox.max[0], uy: boundingBox.max[1], uz: boundingBox.max[2]
      },
      pointAttributes: ["POSITION_CARTESIAN", "COLOR_PACKED"].concat(hasNormals ? ["NORMAL_FLOATS"] : []),
      spacing: Math.max(
        boundingBox.max[0] - boundingBox.min[0],
        boundingBox.max[1] - boundingBox.min[1],
        boundingBox.max[2] - boundingBox.min[2]
      ) / 128,
      scale: [0.01, 0.01, 0.01],
      hierarchyStepSize: 5,
      projection: ""
    }

    // Create octree structure (simplified)
    const octreeBuffer = new ArrayBuffer(pointCloudData.length * 4)
    new Float32Array(octreeBuffer).set(pointCloudData)
    
    // Create hierarchy (simplified)
    const hierarchyBuffer = new ArrayBuffer(1024) // Placeholder
    
    return {
      metadata: potreeMetadata,
      octreeData: octreeBuffer,
      hierarchy: hierarchyBuffer
    }
  }

  // Helper methods
  private calculateNodeSize(node: PotreeNode): number {
    if (!this.metadata) return 1
    return this.metadata.spacing * Math.pow(2, node.level)
  }

  private calculateNodeCenter(node: PotreeNode): [number, number, number] {
    if (!this.metadata) return [0, 0, 0]
    
    const nodeSize = this.calculateNodeSize(node)
    const halfSize = nodeSize / 2
    
    return [
      this.metadata.boundingBox.lx + (node.x * nodeSize) + halfSize,
      this.metadata.boundingBox.ly + (node.y * nodeSize) + halfSize,
      this.metadata.boundingBox.lz + (node.z * nodeSize) + halfSize
    ]
  }

  private calculateDistance(point1: [number, number, number], point2: [number, number, number]): number {
    const dx = point1[0] - point2[0]
    const dy = point1[1] - point2[1]
    const dz = point1[2] - point2[2]
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  private isNodeInFrustum(
    nodeCenter: [number, number, number],
    nodeSize: number,
    cameraPosition: [number, number, number],
    cameraDirection: [number, number, number]
  ): boolean {
    // Simplified frustum culling - in production this would be more sophisticated
    const distance = this.calculateDistance(cameraPosition, nodeCenter)
    return distance < nodeSize * 10 // Simple distance-based culling
  }

  private calculateScreenSpaceError(
    nodeSize: number,
    distance: number,
    viewportSize: [number, number],
    projectionMatrix: number[]
  ): number {
    if (distance === 0) return 0
    
    // Simplified screen space error calculation
    const fov = Math.PI / 4 // 45 degrees
    const pixelSize = (2 * Math.tan(fov / 2) * distance) / viewportSize[1]
    return nodeSize / pixelSize
  }

  private calculateNodeByteOffset(node: PotreeNode): number {
    // Simplified byte offset calculation
    let offset = 0
    const levels = node.name.length
    
    for (let i = 0; i < levels; i++) {
      const nodesAtLevel = Math.pow(8, i)
      offset += nodesAtLevel * 1000000 // Assume 1MB per node at each level
    }
    
    return offset
  }

  /**
   * Update LOD settings
   */
  updateLODSettings(settings: Partial<LODSettings>) {
    this.lodSettings = { ...this.lodSettings, ...settings }
  }

  /**
   * Get current LOD settings
   */
  getLODSettings(): LODSettings {
    return { ...this.lodSettings }
  }

  /**
   * Clear loaded node cache
   */
  clearCache() {
    this.loadedNodes.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    loadedNodes: number
    memoryUsage: number
    cacheHitRate: number
  } {
    let memoryUsage = 0
    this.loadedNodes.forEach(data => {
      if (data instanceof Float32Array) {
        memoryUsage += data.byteLength
      }
    })
    
    return {
      loadedNodes: this.loadedNodes.size,
      memoryUsage,
      cacheHitRate: 0.85 // Mock hit rate
    }
  }
}

/**
 * Potree-compatible Three.js point cloud material
 */
export class PotreePointsMaterial extends THREE.PointsMaterial {
  public pointSizeType: 'fixed' | 'adaptive'
  public minSize: number
  public maxSize: number
  public activeAttributeName: string

  constructor(parameters: any = {}) {
    super(parameters)
    
    this.pointSizeType = parameters.pointSizeType || 'adaptive'
    this.minSize = parameters.minSize || 1
    this.maxSize = parameters.maxSize || 50
    this.activeAttributeName = parameters.activeAttributeName || 'rgba'
    this.sizeAttenuation = this.pointSizeType === 'adaptive'
  }

  updateUniforms(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    if (this.pointSizeType === 'adaptive') {
      // Calculate adaptive point size based on distance
      const fov = (camera as THREE.PerspectiveCamera).fov
      const slope = Math.tan(fov / 2 * Math.PI / 180)
      const projFactor = (canvas.height / 2) / slope
      this.size = Math.max(this.minSize, Math.min(this.maxSize, projFactor / 10))
    }
  }
}

// Export utility functions
export const PotreeUtils = {
  /**
   * Create optimized geometry for Potree node
   */
  createNodeGeometry(pointData: Float32Array, attributes: string[]): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    
    const stride = attributes.length === 3 ? 6 : 3 // Position + Color or just Position
    const numPoints = pointData.length / stride
    
    // Position attribute
    const positions = new Float32Array(numPoints * 3)
    for (let i = 0; i < numPoints; i++) {
      positions[i * 3] = pointData[i * stride]
      positions[i * 3 + 1] = pointData[i * stride + 1]
      positions[i * 3 + 2] = pointData[i * stride + 2]
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // Color attribute (if available)
    if (stride === 6) {
      const colors = new Float32Array(numPoints * 3)
      for (let i = 0; i < numPoints; i++) {
        colors[i * 3] = pointData[i * stride + 3] / 255
        colors[i * 3 + 1] = pointData[i * stride + 4] / 255
        colors[i * 3 + 2] = pointData[i * stride + 5] / 255
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }
    
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
    return geometry
  },

  /**
   * Estimate conversion parameters for PotreeConverter
   */
  estimateConversionParams(pointCloudSize: number): {
    samplingMethod: 'poisson' | 'random'
    pointBudget: number
    maxTreeDepth: number
    chunkSize: number
  } {
    let samplingMethod: 'poisson' | 'random' = 'poisson'
    let pointBudget = 1000000
    let maxTreeDepth = 12
    let chunkSize = 10000000
    
    if (pointCloudSize > 50000000) {
      // Large point clouds
      samplingMethod = 'random'
      pointBudget = 2000000
      maxTreeDepth = 15
      chunkSize = 50000000
    } else if (pointCloudSize > 10000000) {
      // Medium point clouds
      pointBudget = 1500000
      maxTreeDepth = 13
      chunkSize = 20000000
    }
    
    return {
      samplingMethod,
      pointBudget,
      maxTreeDepth,
      chunkSize
    }
  }
}
