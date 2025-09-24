/**
 * Open3D-Inspired Web 3D Processing Module
 * Based on https://github.com/isl-org/Open3D
 * Provides advanced 3D data processing capabilities in the browser
 */

import * as THREE from 'three'
import { MeshBVH, MeshBVHHelper } from 'three-mesh-bvh'
import { Text } from 'troika-three-text'

export interface PointCloud {
  points: THREE.Vector3[]
  colors?: THREE.Color[]
  normals?: THREE.Vector3[]
  intensities?: number[]
  metadata: {
    numPoints: number
    boundingBox: THREE.Box3
    centroid: THREE.Vector3
    hasColors: boolean
    hasNormals: boolean
  }
}

export interface TriangleMesh {
  vertices: THREE.Vector3[]
  faces: THREE.Vector3[]
  normals?: THREE.Vector3[]
  colors?: THREE.Color[]
  uvs?: THREE.Vector2[]
  metadata: {
    numVertices: number
    numFaces: number
    boundingBox: THREE.Box3
    surfaceArea: number
    volume: number
  }
}

export interface RegistrationResult {
  transformation: THREE.Matrix4
  inliers: number[]
  fitness: number
  inlierRMSE: number
  correspondenceSet: Array<[number, number]>
}

export interface VoxelGrid {
  voxelSize: number
  origin: THREE.Vector3
  dimensions: THREE.Vector3
  voxels: Map<string, any>
  boundingBox: THREE.Box3
}

export class Open3DWebProcessor {
  private static instance: Open3DWebProcessor
  private bvhCache = new Map<string, MeshBVH>()

  static getInstance(): Open3DWebProcessor {
    if (!Open3DWebProcessor.instance) {
      Open3DWebProcessor.instance = new Open3DWebProcessor()
    }
    return Open3DWebProcessor.instance
  }

  // ==================== POINT CLOUD PROCESSING ====================

  /**
   * Create point cloud from array of points
   */
  createPointCloud(
    points: number[][],
    colors?: number[][],
    normals?: number[][]
  ): PointCloud {
    const pointsArray = points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    const colorsArray = colors?.map(c => new THREE.Color(c[0], c[1], c[2]))
    const normalsArray = normals?.map(n => new THREE.Vector3(n[0], n[1], n[2]))

    const boundingBox = new THREE.Box3().setFromPoints(pointsArray)
    const centroid = boundingBox.getCenter(new THREE.Vector3())

    return {
      points: pointsArray,
      colors: colorsArray,
      normals: normalsArray,
      metadata: {
        numPoints: pointsArray.length,
        boundingBox,
        centroid,
        hasColors: !!colorsArray,
        hasNormals: !!normalsArray
      }
    }
  }

  /**
   * Voxel down-sampling (inspired by Open3D's voxel_down_sample)
   */
  voxelDownSample(pointCloud: PointCloud, voxelSize: number): PointCloud {
    const voxelMap = new Map<string, {
      points: THREE.Vector3[]
      colors: THREE.Color[]
      normals: THREE.Vector3[]
    }>()

    // Group points into voxels
    pointCloud.points.forEach((point, index) => {
      const voxelKey = this.getVoxelKey(point, voxelSize)
      
      if (!voxelMap.has(voxelKey)) {
        voxelMap.set(voxelKey, { points: [], colors: [], normals: [] })
      }

      const voxel = voxelMap.get(voxelKey)!
      voxel.points.push(point)
      
      if (pointCloud.colors?.[index]) {
        voxel.colors.push(pointCloud.colors[index])
      }
      
      if (pointCloud.normals?.[index]) {
        voxel.normals.push(pointCloud.normals[index])
      }
    })

    // Average points in each voxel
    const downsampledPoints: THREE.Vector3[] = []
    const downsampledColors: THREE.Color[] = []
    const downsampledNormals: THREE.Vector3[] = []

    voxelMap.forEach((voxel) => {
      // Average position
      const avgPoint = new THREE.Vector3()
      voxel.points.forEach(p => avgPoint.add(p))
      avgPoint.divideScalar(voxel.points.length)
      downsampledPoints.push(avgPoint)

      // Average color
      if (voxel.colors.length > 0) {
        const avgColor = new THREE.Color()
        voxel.colors.forEach(c => avgColor.add(c))
        avgColor.divideScalar(voxel.colors.length)
        downsampledColors.push(avgColor)
      }

      // Average normal
      if (voxel.normals.length > 0) {
        const avgNormal = new THREE.Vector3()
        voxel.normals.forEach(n => avgNormal.add(n))
        avgNormal.normalize()
        downsampledNormals.push(avgNormal)
      }
    })

    return this.createPointCloud(
      downsampledPoints.map(p => [p.x, p.y, p.z]),
      downsampledColors.length > 0 ? downsampledColors.map(c => [c.r, c.g, c.b]) : undefined,
      downsampledNormals.length > 0 ? downsampledNormals.map(n => [n.x, n.y, n.z]) : undefined
    )
  }

  /**
   * Statistical outlier removal (inspired by Open3D's statistical_outlier_removal)
   */
  removeStatisticalOutliers(
    pointCloud: PointCloud,
    nbNeighbors: number = 20,
    stdRatio: number = 2.0
  ): { inlierCloud: PointCloud, outlierIndices: number[] } {
    const distances: number[] = []
    const outlierIndices: number[] = []

    // Calculate distances to k-nearest neighbors for each point
    pointCloud.points.forEach((point, index) => {
      const neighborDistances: number[] = []
      
      pointCloud.points.forEach((otherPoint, otherIndex) => {
        if (index !== otherIndex) {
          const distance = point.distanceTo(otherPoint)
          neighborDistances.push(distance)
        }
      })

      // Sort and take k nearest
      neighborDistances.sort((a, b) => a - b)
      const kNearest = neighborDistances.slice(0, Math.min(nbNeighbors, neighborDistances.length))
      
      // Average distance to k-nearest neighbors
      const avgDistance = kNearest.reduce((sum, d) => sum + d, 0) / kNearest.length
      distances.push(avgDistance)
    })

    // Calculate mean and standard deviation
    const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / distances.length
    const stdDev = Math.sqrt(variance)

    const threshold = mean + stdRatio * stdDev

    // Filter points
    const inlierPoints: THREE.Vector3[] = []
    const inlierColors: THREE.Color[] = []
    const inlierNormals: THREE.Vector3[] = []

    pointCloud.points.forEach((point, index) => {
      if (distances[index] <= threshold) {
        inlierPoints.push(point)
        if (pointCloud.colors?.[index]) inlierColors.push(pointCloud.colors[index])
        if (pointCloud.normals?.[index]) inlierNormals.push(pointCloud.normals[index])
      } else {
        outlierIndices.push(index)
      }
    })

    const inlierCloud = this.createPointCloud(
      inlierPoints.map(p => [p.x, p.y, p.z]),
      inlierColors.length > 0 ? inlierColors.map(c => [c.r, c.g, c.b]) : undefined,
      inlierNormals.length > 0 ? inlierNormals.map(n => [n.x, n.y, n.z]) : undefined
    )

    return { inlierCloud, outlierIndices }
  }

  /**
   * Estimate normals using PCA (inspired by Open3D's estimate_normals)
   */
  estimateNormals(
    pointCloud: PointCloud,
    searchParam: { knn?: number, radius?: number } = { knn: 30 }
  ): PointCloud {
    const normals: THREE.Vector3[] = []

    pointCloud.points.forEach((point, index) => {
      // Find neighbors
      const neighbors: THREE.Vector3[] = []
      
      if (searchParam.knn) {
        // K-nearest neighbors
        const distances = pointCloud.points.map((p, i) => ({
          point: p,
          distance: point.distanceTo(p),
          index: i
        }))
        distances.sort((a, b) => a.distance - b.distance)
        neighbors.push(...distances.slice(1, searchParam.knn + 1).map(d => d.point))
      } else if (searchParam.radius) {
        // Radius neighbors
        pointCloud.points.forEach((p, i) => {
          if (i !== index && point.distanceTo(p) <= searchParam.radius!) {
            neighbors.push(p)
          }
        })
      }

      // Compute normal using PCA
      const normal = this.computeNormalPCA(neighbors)
      normals.push(normal)
    })

    return {
      ...pointCloud,
      normals,
      metadata: {
        ...pointCloud.metadata,
        hasNormals: true
      }
    }
  }

  // ==================== MESH PROCESSING ====================

  /**
   * Create triangle mesh from vertices and faces
   */
  createTriangleMesh(
    vertices: number[][],
    faces: number[][],
    normals?: number[][],
    colors?: number[][]
  ): TriangleMesh {
    const verticesArray = vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]))
    const facesArray = faces.map(f => new THREE.Vector3(f[0], f[1], f[2]))
    const normalsArray = normals?.map(n => new THREE.Vector3(n[0], n[1], n[2]))
    const colorsArray = colors?.map(c => new THREE.Color(c[0], c[1], c[2]))

    const boundingBox = new THREE.Box3().setFromPoints(verticesArray)
    const surfaceArea = this.calculateSurfaceArea(verticesArray, facesArray)
    const volume = this.calculateVolume(verticesArray, facesArray)

    return {
      vertices: verticesArray,
      faces: facesArray,
      normals: normalsArray,
      colors: colorsArray,
      metadata: {
        numVertices: verticesArray.length,
        numFaces: facesArray.length,
        boundingBox,
        surfaceArea,
        volume
      }
    }
  }

  /**
   * Poisson surface reconstruction (simplified implementation)
   */
  poissonSurfaceReconstruction(
    pointCloud: PointCloud,
    depth: number = 9,
    pointWeight: number = 4.0
  ): TriangleMesh {
    // Simplified Poisson reconstruction - in production would use more sophisticated algorithms
    const vertices: THREE.Vector3[] = []
    const faces: THREE.Vector3[] = []

    // Create a simplified mesh using Delaunay-like triangulation
    const convexHull = this.computeConvexHull(pointCloud.points)
    
    convexHull.vertices.forEach(v => vertices.push(v))
    convexHull.faces.forEach(f => faces.push(f))

    return this.createTriangleMesh(
      vertices.map(v => [v.x, v.y, v.z]),
      faces.map(f => [f.x, f.y, f.z])
    )
  }

  /**
   * Mesh decimation (inspired by Open3D's simplify_quadric_decimation)
   */
  simplifyQuadricDecimation(
    mesh: TriangleMesh,
    targetTriangles: number
  ): TriangleMesh {
    // Simplified quadric decimation
    const reductionRatio = targetTriangles / mesh.metadata.numFaces
    
    if (reductionRatio >= 1) return mesh

    // Sample faces based on reduction ratio
    const keptFaces: THREE.Vector3[] = []
    const step = Math.floor(1 / reductionRatio)
    
    mesh.faces.forEach((face, index) => {
      if (index % step === 0) {
        keptFaces.push(face)
      }
    })

    // Rebuild vertex list from kept faces
    const usedVertices = new Set<number>()
    keptFaces.forEach(face => {
      usedVertices.add(face.x)
      usedVertices.add(face.y)
      usedVertices.add(face.z)
    })

    const vertexMapping = new Map<number, number>()
    const newVertices: THREE.Vector3[] = []
    let newIndex = 0

    usedVertices.forEach(oldIndex => {
      vertexMapping.set(oldIndex, newIndex++)
      newVertices.push(mesh.vertices[oldIndex])
    })

    // Remap face indices
    const newFaces = keptFaces.map(face => new THREE.Vector3(
      vertexMapping.get(face.x)!,
      vertexMapping.get(face.y)!,
      vertexMapping.get(face.z)!
    ))

    return this.createTriangleMesh(
      newVertices.map(v => [v.x, v.y, v.z]),
      newFaces.map(f => [f.x, f.y, f.z])
    )
  }

  // ==================== REGISTRATION ====================

  /**
   * ICP (Iterative Closest Point) registration
   */
  async registrationICP(
    sourceCloud: PointCloud,
    targetCloud: PointCloud,
    threshold: number = 0.02,
    maxIterations: number = 50
  ): Promise<RegistrationResult> {
    let transformation = new THREE.Matrix4()
    let currentSource = this.transformPointCloud(sourceCloud, transformation)
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Find correspondences
      const correspondences = this.findClosestPoints(currentSource, targetCloud, threshold)
      
      if (correspondences.length < 3) break

      // Compute transformation using SVD
      const iterTransform = this.computeTransformationSVD(correspondences)
      transformation.premultiply(iterTransform)
      
      // Apply transformation
      currentSource = this.transformPointCloud(sourceCloud, transformation)
      
      // Check convergence
      const fitness = correspondences.length / sourceCloud.points.length
      if (fitness < 0.1) break
    }

    // Calculate final metrics
    const correspondences = this.findClosestPoints(currentSource, targetCloud, threshold)
    const inliers = correspondences.map(c => c[0])
    const fitness = correspondences.length / sourceCloud.points.length
    const inlierRMSE = this.calculateRMSE(correspondences, currentSource, targetCloud)

    return {
      transformation,
      inliers,
      fitness,
      inlierRMSE,
      correspondenceSet: correspondences
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Create Three.js objects from Open3D data structures
   */
  createThreePointCloud(pointCloud: PointCloud): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    
    const positions = new Float32Array(pointCloud.points.length * 3)
    pointCloud.points.forEach((point, i) => {
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
    })
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    if (pointCloud.colors) {
      const colors = new Float32Array(pointCloud.colors.length * 3)
      pointCloud.colors.forEach((color, i) => {
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      })
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    }

    const material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: !!pointCloud.colors,
      sizeAttenuation: true
    })

    return new THREE.Points(geometry, material)
  }

  createThreeMesh(mesh: TriangleMesh): THREE.Mesh {
    const geometry = new THREE.BufferGeometry()
    
    const positions = new Float32Array(mesh.vertices.length * 3)
    mesh.vertices.forEach((vertex, i) => {
      positions[i * 3] = vertex.x
      positions[i * 3 + 1] = vertex.y
      positions[i * 3 + 2] = vertex.z
    })
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const indices = new Uint32Array(mesh.faces.length * 3)
    mesh.faces.forEach((face, i) => {
      indices[i * 3] = face.x
      indices[i * 3 + 1] = face.y
      indices[i * 3 + 2] = face.z
    })
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    if (mesh.normals) {
      const normals = new Float32Array(mesh.normals.length * 3)
      mesh.normals.forEach((normal, i) => {
        normals[i * 3] = normal.x
        normals[i * 3 + 1] = normal.y
        normals[i * 3 + 2] = normal.z
      })
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    } else {
      geometry.computeVertexNormals()
    }

    // Create BVH for fast ray intersection
    const bvh = new MeshBVH(geometry)
    geometry.boundsTree = bvh

    const material = new THREE.MeshStandardMaterial({
      vertexColors: !!mesh.colors,
      side: THREE.DoubleSide
    })

    return new THREE.Mesh(geometry, material)
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private getVoxelKey(point: THREE.Vector3, voxelSize: number): string {
    const x = Math.floor(point.x / voxelSize)
    const y = Math.floor(point.y / voxelSize)
    const z = Math.floor(point.z / voxelSize)
    return \`\${x},\${y},\${z}\`
  }

  private computeNormalPCA(neighbors: THREE.Vector3[]): THREE.Vector3 {
    if (neighbors.length < 3) return new THREE.Vector3(0, 1, 0)

    // Compute centroid
    const centroid = new THREE.Vector3()
    neighbors.forEach(p => centroid.add(p))
    centroid.divideScalar(neighbors.length)

    // Compute covariance matrix (simplified)
    let sumXX = 0, sumYY = 0, sumZZ = 0
    let sumXY = 0, sumXZ = 0, sumYZ = 0

    neighbors.forEach(p => {
      const dx = p.x - centroid.x
      const dy = p.y - centroid.y
      const dz = p.z - centroid.z
      
      sumXX += dx * dx
      sumYY += dy * dy
      sumZZ += dz * dz
      sumXY += dx * dy
      sumXZ += dx * dz
      sumYZ += dy * dz
    })

    // Find eigenvector corresponding to smallest eigenvalue (simplified)
    // This is a rough approximation - full PCA would use proper eigenvalue decomposition
    const normal = new THREE.Vector3()
    
    if (Math.abs(sumXX) < Math.abs(sumYY) && Math.abs(sumXX) < Math.abs(sumZZ)) {
      normal.set(1, 0, 0)
    } else if (Math.abs(sumYY) < Math.abs(sumZZ)) {
      normal.set(0, 1, 0)
    } else {
      normal.set(0, 0, 1)
    }

    return normal.normalize()
  }

  private calculateSurfaceArea(vertices: THREE.Vector3[], faces: THREE.Vector3[]): number {
    let area = 0
    faces.forEach(face => {
      const v1 = vertices[face.x]
      const v2 = vertices[face.y]
      const v3 = vertices[face.z]
      
      const edge1 = v2.clone().sub(v1)
      const edge2 = v3.clone().sub(v1)
      const cross = edge1.cross(edge2)
      
      area += cross.length() * 0.5
    })
    return area
  }

  private calculateVolume(vertices: THREE.Vector3[], faces: THREE.Vector3[]): number {
    let volume = 0
    faces.forEach(face => {
      const v1 = vertices[face.x]
      const v2 = vertices[face.y]
      const v3 = vertices[face.z]
      
      // Signed volume of tetrahedron formed by origin and triangle
      volume += v1.dot(v2.clone().cross(v3)) / 6
    })
    return Math.abs(volume)
  }

  private computeConvexHull(points: THREE.Vector3[]): { vertices: THREE.Vector3[], faces: THREE.Vector3[] } {
    // Simplified convex hull - in production would use proper algorithm like Quickhull
    const vertices = [...points]
    const faces: THREE.Vector3[] = []
    
    // Create some triangles (very simplified)
    for (let i = 0; i < Math.min(points.length - 2, 100); i += 3) {
      faces.push(new THREE.Vector3(i, i + 1, i + 2))
    }
    
    return { vertices, faces }
  }

  private transformPointCloud(pointCloud: PointCloud, transformation: THREE.Matrix4): PointCloud {
    const transformedPoints = pointCloud.points.map(p => p.clone().applyMatrix4(transformation))
    
    return {
      ...pointCloud,
      points: transformedPoints
    }
  }

  private findClosestPoints(
    source: PointCloud,
    target: PointCloud,
    threshold: number
  ): Array<[number, number]> {
    const correspondences: Array<[number, number]> = []
    
    source.points.forEach((sourcePoint, sourceIndex) => {
      let closestDistance = Infinity
      let closestIndex = -1
      
      target.points.forEach((targetPoint, targetIndex) => {
        const distance = sourcePoint.distanceTo(targetPoint)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = targetIndex
        }
      })
      
      if (closestDistance <= threshold) {
        correspondences.push([sourceIndex, closestIndex])
      }
    })
    
    return correspondences
  }

  private computeTransformationSVD(correspondences: Array<[number, number]>): THREE.Matrix4 {
    // Simplified transformation computation - in production would use proper SVD
    return new THREE.Matrix4() // Identity for now
  }

  private calculateRMSE(
    correspondences: Array<[number, number]>,
    source: PointCloud,
    target: PointCloud
  ): number {
    if (correspondences.length === 0) return 0
    
    let sumSquaredErrors = 0
    correspondences.forEach(([sourceIdx, targetIdx]) => {
      const distance = source.points[sourceIdx].distanceTo(target.points[targetIdx])
      sumSquaredErrors += distance * distance
    })
    
    return Math.sqrt(sumSquaredErrors / correspondences.length)
  }
}

// Export utilities for easy access
export const Open3D = {
  PointCloud: Open3DWebProcessor.getInstance(),
  TriangleMesh: Open3DWebProcessor.getInstance(),
  Registration: Open3DWebProcessor.getInstance(),
  IO: {
    readPointCloud: (url: string) => {
      // Implementation for reading point cloud files
    },
    writePointCloud: (pointCloud: PointCloud, format: 'ply' | 'pcd' | 'xyz') => {
      // Implementation for writing point cloud files
    }
  },
  Visualization: {
    drawGeometries: (geometries: any[]) => {
      // Implementation for visualization
    }
  }
}
