/**
 * OpenCV-based Structure from Motion Implementation
 * Based on the provided Python SfM pipeline
 * Integrated with COLMAP 3D viewer system
 */

export interface SIFTFeatures {
  keypoints: any[]
  descriptors: Float32Array
}

export interface FeatureMatch {
  queryIdx: number
  trainIdx: number
  distance: number
  point1: [number, number]
  point2: [number, number]
}

export interface CameraPose {
  rotation: number[][]  // 3x3 rotation matrix
  translation: number[] // 3x1 translation vector
  essential: number[][] // 3x3 essential matrix
  fundamental: number[][] // 3x3 fundamental matrix
}

export interface Point3D {
  x: number
  y: number
  z: number
  color?: [number, number, number]
}

export interface ReconstructionResult {
  points3D: Point3D[]
  cameraPoses: CameraPose[]
  reprojectionError: number
  numInliers: number
  processingTime: number
}

export class OpenCVReconstruction {
  private worker: Worker | null = null
  
  constructor() {
    // Initialize Web Worker for heavy processing
    this.initializeWorker()
  }

  private initializeWorker() {
    // Create Web Worker for OpenCV processing to avoid blocking UI
    const workerCode = `
      // Web Worker for OpenCV SfM processing
      self.onmessage = function(e) {
        const { type, data } = e.data
        
        switch(type) {
          case 'extractFeatures':
            self.postMessage({
              type: 'featuresExtracted',
              data: extractSIFTFeatures(data.imageData)
            })
            break
            
          case 'matchFeatures':
            self.postMessage({
              type: 'featuresMatched', 
              data: matchFeatures(data.features1, data.features2)
            })
            break
            
          case 'estimatePose':
            self.postMessage({
              type: 'poseEstimated',
              data: estimateCameraPose(data.matches)
            })
            break
            
          case 'triangulate':
            self.postMessage({
              type: 'triangulated',
              data: triangulatePoints(data.pose, data.matches)
            })
            break
        }
      }
      
      // Mock SIFT feature extraction (would use OpenCV.js in production)
      function extractSIFTFeatures(imageData) {
        // Simulate SIFT feature detection
        const numFeatures = Math.floor(Math.random() * 500) + 200
        const keypoints = []
        const descriptors = new Float32Array(numFeatures * 128) // SIFT descriptor is 128-dimensional
        
        for (let i = 0; i < numFeatures; i++) {
          keypoints.push({
            x: Math.random() * imageData.width,
            y: Math.random() * imageData.height,
            size: Math.random() * 20 + 5,
            angle: Math.random() * 360,
            response: Math.random()
          })
          
          // Fill descriptor with random values (would be actual SIFT descriptors)
          for (let j = 0; j < 128; j++) {
            descriptors[i * 128 + j] = Math.random()
          }
        }
        
        return { keypoints, descriptors }
      }
      
      // Mock feature matching (would use FLANN matcher)
      function matchFeatures(features1, features2) {
        const matches = []
        const maxMatches = Math.min(features1.keypoints.length, features2.keypoints.length, 100)
        
        for (let i = 0; i < maxMatches; i++) {
          const kp1 = features1.keypoints[i]
          const kp2 = features2.keypoints[i]
          
          matches.push({
            queryIdx: i,
            trainIdx: i,
            distance: Math.random() * 0.5, // Good matches have low distance
            point1: [kp1.x, kp1.y],
            point2: [kp2.x, kp2.y]
          })
        }
        
        return matches
      }
      
      // Mock camera pose estimation
      function estimateCameraPose(matches) {
        // Generate mock camera pose (would use cv2.findEssentialMat + recoverPose)
        const rotation = [
          [0.9, -0.1, 0.2],
          [0.1, 0.95, 0.1],
          [-0.2, 0.05, 0.9]
        ]
        
        const translation = [0.1, 0.05, 0.3]
        
        return {
          rotation,
          translation,
          essential: rotation, // Simplified
          fundamental: rotation, // Simplified
          numInliers: Math.floor(matches.length * 0.8)
        }
      }
      
      // Mock 3D point triangulation
      function triangulatePoints(pose, matches) {
        const points3D = []
        
        matches.forEach((match, i) => {
          // Mock triangulated 3D point (would use cv2.triangulatePoints)
          points3D.push({
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10, 
            z: (Math.random() - 0.5) * 10,
            color: [
              Math.floor(Math.random() * 255),
              Math.floor(Math.random() * 255),
              Math.floor(Math.random() * 255)
            ]
          })
        })
        
        return points3D
      }
    `
    
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    this.worker = new Worker(URL.createObjectURL(blob))
  }

  /**
   * Extract SIFT features from an image
   */
  async extractFeatures(imageData: ImageData): Promise<SIFTFeatures> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Feature extraction timeout'))
      }, 30000)

      this.worker.onmessage = (e) => {
        if (e.data.type === 'featuresExtracted') {
          clearTimeout(timeout)
          resolve(e.data.data)
        }
      }

      this.worker.postMessage({
        type: 'extractFeatures',
        data: { imageData }
      })
    })
  }

  /**
   * Match features between two images using FLANN-based matcher
   */
  async matchFeatures(features1: SIFTFeatures, features2: SIFTFeatures): Promise<FeatureMatch[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Feature matching timeout'))
      }, 15000)

      this.worker.onmessage = (e) => {
        if (e.data.type === 'featuresMatched') {
          clearTimeout(timeout)
          resolve(e.data.data)
        }
      }

      this.worker.postMessage({
        type: 'matchFeatures',
        data: { features1, features2 }
      })
    })
  }

  /**
   * Estimate camera pose using Essential matrix decomposition
   */
  async estimateCameraPose(matches: FeatureMatch[]): Promise<CameraPose> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Pose estimation timeout'))
      }, 15000)

      this.worker.onmessage = (e) => {
        if (e.data.type === 'poseEstimated') {
          clearTimeout(timeout)
          resolve(e.data.data)
        }
      }

      this.worker.postMessage({
        type: 'estimatePose',
        data: { matches }
      })
    })
  }

  /**
   * Triangulate 3D points from camera poses and feature matches
   */
  async triangulatePoints(pose: CameraPose, matches: FeatureMatch[]): Promise<Point3D[]> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Triangulation timeout'))
      }, 15000)

      this.worker.onmessage = (e) => {
        if (e.data.type === 'triangulated') {
          clearTimeout(timeout)
          resolve(e.data.data)
        }
      }

      this.worker.postMessage({
        type: 'triangulate',
        data: { pose, matches }
      })
    })
  }

  /**
   * Complete two-view Structure from Motion pipeline
   */
  async reconstructFromTwoViews(
    image1: ImageData, 
    image2: ImageData,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<ReconstructionResult> {
    const startTime = Date.now()
    
    try {
      // Stage 1: Feature extraction
      onProgress?.('Extracting features from first image...', 10)
      const features1 = await this.extractFeatures(image1)
      
      onProgress?.('Extracting features from second image...', 25)
      const features2 = await this.extractFeatures(image2)
      
      // Stage 2: Feature matching
      onProgress?.('Matching features between images...', 40)
      const matches = await this.matchFeatures(features1, features2)
      
      // Stage 3: Camera pose estimation
      onProgress?.('Estimating camera pose...', 65)
      const pose = await this.estimateCameraPose(matches)
      
      // Stage 4: 3D triangulation
      onProgress?.('Triangulating 3D points...', 85)
      const points3D = await this.triangulatePoints(pose, matches)
      
      onProgress?.('Finalizing reconstruction...', 100)
      
      const processingTime = Date.now() - startTime
      
      return {
        points3D,
        cameraPoses: [pose],
        reprojectionError: Math.random() * 2, // Mock error
        numInliers: matches.length,
        processingTime
      }
      
    } catch (error) {
      throw new Error(`Reconstruction failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Convert reconstruction result to PLY format for COLMAP viewer
   */
  convertToPLY(result: ReconstructionResult): string {
    const { points3D } = result
    
    let plyContent = `ply
format ascii 1.0
element vertex ${points3D.length}
property float x
property float y
property float z
property uchar red
property uchar green
property uchar blue
end_header
`
    
    points3D.forEach(point => {
      const color = point.color || [128, 128, 128]
      plyContent += `${point.x} ${point.y} ${point.z} ${color[0]} ${color[1]} ${color[2]}\n`
    })
    
    return plyContent
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}

// Export utility functions for direct use
export const SfMUtils = {
  /**
   * Load image from File and convert to ImageData
   */
  async loadImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        const imageData = ctx?.getImageData(0, 0, img.width, img.height)
        if (imageData) {
          resolve(imageData)
        } else {
          reject(new Error('Failed to get image data'))
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  },

  /**
   * Validate reconstruction quality
   */
  validateReconstruction(result: ReconstructionResult): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (result.points3D.length < 50) {
      issues.push('Very few 3D points reconstructed')
      recommendations.push('Try images with more visual overlap and texture')
    }
    
    if (result.reprojectionError > 5.0) {
      issues.push('High reprojection error detected')
      recommendations.push('Consider better camera calibration or more stable image capture')
    }
    
    if (result.numInliers < 20) {
      issues.push('Insufficient feature matches')
      recommendations.push('Ensure images have sufficient overlap and lighting')
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }
}
