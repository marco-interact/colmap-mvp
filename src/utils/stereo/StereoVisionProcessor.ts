/**
 * Stereo Vision Processing for 3D Reconstruction
 * Based on OpenCV stereo vision pipeline: cv2.StereoBM, cv2.StereoSGBM, cv2.reprojectImageTo3D
 * Generates dense point clouds from stereo image pairs
 */

export interface StereoCalibrationData {
  cameraMatrix1: number[][]  // 3x3 camera intrinsic matrix for left camera
  cameraMatrix2: number[][]  // 3x3 camera intrinsic matrix for right camera
  distCoeffs1: number[]      // Distortion coefficients for left camera
  distCoeffs2: number[]      // Distortion coefficients for right camera
  R: number[][]              // 3x3 rotation matrix between cameras
  T: number[]                // 3x1 translation vector between cameras
  E: number[][]              // 3x3 essential matrix
  F: number[][]              // 3x3 fundamental matrix
}

export interface StereoRectificationData {
  R1: number[][]             // 3x3 rectification transform for left camera
  R2: number[][]             // 3x3 rectification transform for right camera
  P1: number[][]             // 3x4 projection matrix for left camera
  P2: number[][]             // 3x4 projection matrix for right camera
  Q: number[][]              // 4x4 disparity-to-depth mapping matrix
  validROI1: number[]        // Valid region of interest for left image [x, y, w, h]
  validROI2: number[]        // Valid region of interest for right image [x, y, w, h]
}

export interface DisparityMapOptions {
  algorithm: 'BM' | 'SGBM'   // Block Matching or Semi-Global Block Matching
  blockSize: number          // Matched block size (odd number, typically 5-21)
  minDisparity: number       // Minimum possible disparity value
  numDisparities: number     // Maximum disparity minus minimum disparity
  preFilterCap: number       // Truncation value for prefiltered image pixels
  uniquenessRatio: number    // Margin in percentage by which the best match should win
  speckleWindowSize: number  // Maximum size of smooth disparity regions
  speckleRange: number       // Maximum disparity variation within connected component
  disp12MaxDiff: number      // Maximum allowed difference in left-right disparity check
}

export interface Point3DWithConfidence {
  x: number
  y: number
  z: number
  r: number
  g: number
  b: number
  confidence: number
  disparity: number
}

export class StereoVisionProcessor {
  private worker: Worker | null = null
  private calibrationData: StereoCalibrationData | null = null
  private rectificationData: StereoRectificationData | null = null

  constructor() {
    this.initializeWorker()
  }

  private initializeWorker() {
    const workerCode = `
      // Web Worker for stereo vision processing
      class StereoProcessor {
        static computeDisparityMap(leftImage, rightImage, options) {
          const { algorithm, blockSize, minDisparity, numDisparities } = options
          const width = leftImage.width
          const height = leftImage.height
          
          // Create disparity map array
          const disparityMap = new Float32Array(width * height)
          
          // Simulate stereo matching algorithm (in production, this would use actual OpenCV)
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x
              
              // Mock disparity calculation based on image gradients
              const leftIntensity = this.getGrayscaleIntensity(leftImage, x, y)
              const disparity = this.findBestMatch(leftImage, rightImage, x, y, options)
              
              // Apply validity checks
              if (disparity >= minDisparity && disparity < minDisparity + numDisparities) {
                disparityMap[idx] = disparity
              } else {
                disparityMap[idx] = -1 // Invalid disparity
              }
            }
          }
          
          return disparityMap
        }
        
        static findBestMatch(leftImage, rightImage, x, y, options) {
          const { blockSize, minDisparity, numDisparities } = options
          const halfBlock = Math.floor(blockSize / 2)
          
          let bestDisparity = minDisparity
          let bestScore = Infinity
          
          // Search along epipolar line (horizontal for rectified images)
          for (let d = minDisparity; d < minDisparity + numDisparities; d++) {
            const rightX = x - d
            
            if (rightX - halfBlock < 0 || rightX + halfBlock >= rightImage.width) {
              continue
            }
            
            // Compute correlation score between blocks
            let score = 0
            let count = 0
            
            for (let dy = -halfBlock; dy <= halfBlock; dy++) {
              for (let dx = -halfBlock; dx <= halfBlock; dx++) {
                const leftY = y + dy
                const leftX = x + dx
                const rightY = y + dy
                const rightXBlock = rightX + dx
                
                if (leftY >= 0 && leftY < leftImage.height && 
                    leftX >= 0 && leftX < leftImage.width &&
                    rightY >= 0 && rightY < rightImage.height &&
                    rightXBlock >= 0 && rightXBlock < rightImage.width) {
                  
                  const leftIntensity = this.getGrayscaleIntensity(leftImage, leftX, leftY)
                  const rightIntensity = this.getGrayscaleIntensity(rightImage, rightXBlock, rightY)
                  
                  score += Math.abs(leftIntensity - rightIntensity)
                  count++
                }
              }
            }
            
            if (count > 0) {
              score /= count
              if (score < bestScore) {
                bestScore = score
                bestDisparity = d
              }
            }
          }
          
          return bestDisparity
        }
        
        static getGrayscaleIntensity(imageData, x, y) {
          const idx = (y * imageData.width + x) * 4
          const r = imageData.data[idx]
          const g = imageData.data[idx + 1]
          const b = imageData.data[idx + 2]
          return (r * 0.299 + g * 0.587 + b * 0.114)
        }
        
        static reprojectTo3D(disparityMap, qMatrix, width, height) {
          const points3D = []
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const disparity = disparityMap[y * width + x]
              
              if (disparity > 0) {
                // Apply Q matrix transformation (simplified)
                const cx = qMatrix[0][3]  // Principal point x
                const cy = qMatrix[1][3]  // Principal point y
                const f = qMatrix[2][3]   // Focal length
                const Tx = 1.0 / qMatrix[3][2] // Baseline
                
                // 3D coordinates
                const X = (x - cx) * Tx
                const Y = (y - cy) * Tx
                const Z = f * Tx / disparity
                
                // Filter out points that are too close or too far
                if (Z > 0.1 && Z < 100.0) {
                  points3D.push({
                    x: X,
                    y: Y,
                    z: Z,
                    disparity: disparity
                  })
                }
              }
            }
          }
          
          return points3D
        }
        
        static rectifyImage(imageData, rectificationMatrix, width, height) {
          // Simplified rectification - in production would use full OpenCV cv::remap
          const rectified = new ImageData(width, height)
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              // Apply rectification transformation (simplified)
              const srcX = Math.round(x * rectificationMatrix[0][0] + y * rectificationMatrix[0][1] + rectificationMatrix[0][2])
              const srcY = Math.round(x * rectificationMatrix[1][0] + y * rectificationMatrix[1][1] + rectificationMatrix[1][2])
              
              if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                const srcIdx = (srcY * width + srcX) * 4
                const dstIdx = (y * width + x) * 4
                
                rectified.data[dstIdx] = imageData.data[srcIdx]
                rectified.data[dstIdx + 1] = imageData.data[srcIdx + 1]
                rectified.data[dstIdx + 2] = imageData.data[srcIdx + 2]
                rectified.data[dstIdx + 3] = imageData.data[srcIdx + 3]
              }
            }
          }
          
          return rectified
        }
      }
      
      self.onmessage = function(e) {
        const { type, data } = e.data
        const startTime = performance.now()
        
        try {
          switch (type) {
            case 'computeDisparity':
              const disparityMap = StereoProcessor.computeDisparityMap(
                data.leftImage, data.rightImage, data.options
              )
              self.postMessage({
                type: 'disparityComputed',
                data: { disparityMap, processingTime: performance.now() - startTime }
              }, [disparityMap.buffer])
              break
              
            case 'reprojectTo3D':
              const points3D = StereoProcessor.reprojectTo3D(
                data.disparityMap, data.qMatrix, data.width, data.height
              )
              self.postMessage({
                type: 'pointsGenerated',
                data: { points3D, processingTime: performance.now() - startTime }
              })
              break
              
            case 'rectifyImages':
              const rectifiedLeft = StereoProcessor.rectifyImage(
                data.leftImage, data.rectificationLeft, data.width, data.height
              )
              const rectifiedRight = StereoProcessor.rectifyImage(
                data.rightImage, data.rectificationRight, data.width, data.height
              )
              self.postMessage({
                type: 'imagesRectified',
                data: { 
                  rectifiedLeft, 
                  rectifiedRight, 
                  processingTime: performance.now() - startTime 
                }
              })
              break
          }
        } catch (error) {
          self.postMessage({
            type: 'error',
            data: { 
              error: error.message, 
              processingTime: performance.now() - startTime 
            }
          })
        }
      }
    `
    
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    this.worker = new Worker(URL.createObjectURL(blob))
  }

  /**
   * Set stereo calibration data
   */
  setCalibrationData(calibration: StereoCalibrationData) {
    this.calibrationData = calibration
  }

  /**
   * Set stereo rectification data
   */
  setRectificationData(rectification: StereoRectificationData) {
    this.rectificationData = rectification
  }

  /**
   * Process stereo image pair to generate 3D point cloud
   */
  async processStereoImages(
    leftImage: ImageData,
    rightImage: ImageData,
    options: DisparityMapOptions
  ): Promise<{
    points3D: Point3DWithConfidence[]
    disparityMap: Float32Array
    processingTime: number
    statistics: {
      totalPixels: number
      validDisparities: number
      averageDisparity: number
      minDepth: number
      maxDepth: number
    }
  }> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    if (!this.rectificationData) {
      throw new Error('Rectification data not set. Call setRectificationData first.')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stereo processing timeout'))
      }, 120000) // 2 minute timeout

      let disparityMap: Float32Array | null = null
      let points3D: any[] = []
      let totalProcessingTime = 0

      this.worker!.onmessage = (e) => {
        const { type, data } = e.data

        switch (type) {
          case 'disparityComputed':
            disparityMap = data.disparityMap
            totalProcessingTime += data.processingTime
            
            // Now reproject to 3D
            this.worker!.postMessage({
              type: 'reprojectTo3D',
              data: {
                disparityMap,
                qMatrix: this.rectificationData!.Q,
                width: leftImage.width,
                height: leftImage.height
              }
            })
            break

          case 'pointsGenerated':
            clearTimeout(timeout)
            points3D = data.points3D
            totalProcessingTime += data.processingTime

            // Add color information from left image
            const coloredPoints = this.addColorInformation(points3D, leftImage)
            const statistics = this.calculateStatistics(disparityMap!, coloredPoints)

            resolve({
              points3D: coloredPoints,
              disparityMap: disparityMap!,
              processingTime: totalProcessingTime,
              statistics
            })
            break

          case 'error':
            clearTimeout(timeout)
            reject(new Error(`Stereo processing error: ${data.error}`))
            break
        }
      }

      // Start processing
      this.worker!.postMessage({
        type: 'computeDisparity',
        data: {
          leftImage,
          rightImage,
          options
        }
      })
    })
  }

  /**
   * Rectify stereo image pair
   */
  async rectifyStereoImages(
    leftImage: ImageData,
    rightImage: ImageData
  ): Promise<{
    rectifiedLeft: ImageData
    rectifiedRight: ImageData
    processingTime: number
  }> {
    if (!this.worker || !this.rectificationData) {
      throw new Error('Worker or rectification data not initialized')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Rectification timeout'))
      }, 30000)

      this.worker!.onmessage = (e) => {
        if (e.data.type === 'imagesRectified') {
          clearTimeout(timeout)
          resolve(e.data.data)
        } else if (e.data.type === 'error') {
          clearTimeout(timeout)
          reject(new Error(e.data.data.error))
        }
      }

      this.worker!.postMessage({
        type: 'rectifyImages',
        data: {
          leftImage,
          rightImage,
          rectificationLeft: this.rectificationData.R1,
          rectificationRight: this.rectificationData.R2,
          width: leftImage.width,
          height: leftImage.height
        }
      })
    })
  }

  /**
   * Generate default stereo parameters for testing
   */
  static generateDefaultStereoParams(): {
    calibration: StereoCalibrationData
    rectification: StereoRectificationData
    disparityOptions: DisparityMapOptions
  } {
    // Mock calibration data - in production this comes from cv2.stereoCalibrate
    const calibration: StereoCalibrationData = {
      cameraMatrix1: [[800, 0, 320], [0, 800, 240], [0, 0, 1]],
      cameraMatrix2: [[800, 0, 320], [0, 800, 240], [0, 0, 1]],
      distCoeffs1: [0.1, -0.2, 0, 0, 0],
      distCoeffs2: [0.1, -0.2, 0, 0, 0],
      R: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      T: [-0.1, 0, 0], // 10cm baseline
      E: [[0, 0, 0], [0, 0, 0.1], [0, -0.1, 0]],
      F: [[0, 0, 0], [0, 0, 1e-6], [0, -1e-6, 0]]
    }

    // Mock rectification data - in production this comes from cv2.stereoRectify
    const rectification: StereoRectificationData = {
      R1: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      R2: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      P1: [[800, 0, 320, 0], [0, 800, 240, 0], [0, 0, 1, 0]],
      P2: [[800, 0, 320, -80], [0, 800, 240, 0], [0, 0, 1, 0]], // -80 = focal * baseline
      Q: [[1, 0, 0, -320], [0, 1, 0, -240], [0, 0, 0, 800], [0, 0, 10, 0]], // 10 = 1/baseline
      validROI1: [0, 0, 640, 480],
      validROI2: [0, 0, 640, 480]
    }

    // Optimal disparity map parameters
    const disparityOptions: DisparityMapOptions = {
      algorithm: 'SGBM',
      blockSize: 11,
      minDisparity: 0,
      numDisparities: 64,
      preFilterCap: 31,
      uniquenessRatio: 15,
      speckleWindowSize: 100,
      speckleRange: 32,
      disp12MaxDiff: 1
    }

    return { calibration, rectification, disparityOptions }
  }

  // Helper methods
  private addColorInformation(points3D: any[], leftImage: ImageData): Point3DWithConfidence[] {
    return points3D.map(point => {
      // Project 3D point back to image coordinates to get color
      // Simplified projection - in production would use camera matrices
      const imageX = Math.round(point.x * 100 + leftImage.width / 2)
      const imageY = Math.round(point.y * 100 + leftImage.height / 2)

      let r = 128, g = 128, b = 128 // Default gray

      if (imageX >= 0 && imageX < leftImage.width && imageY >= 0 && imageY < leftImage.height) {
        const idx = (imageY * leftImage.width + imageX) * 4
        r = leftImage.data[idx]
        g = leftImage.data[idx + 1]
        b = leftImage.data[idx + 2]
      }

      return {
        ...point,
        r, g, b,
        confidence: Math.max(0, Math.min(1, 1 - Math.abs(point.disparity - 32) / 32))
      }
    })
  }

  private calculateStatistics(disparityMap: Float32Array, points3D: Point3DWithConfidence[]): any {
    const validDisparities = disparityMap.filter(d => d > 0).length
    const totalPixels = disparityMap.length
    
    let sumDisparity = 0
    let minDepth = Infinity
    let maxDepth = -Infinity

    points3D.forEach(point => {
      sumDisparity += point.disparity
      minDepth = Math.min(minDepth, point.z)
      maxDepth = Math.max(maxDepth, point.z)
    })

    return {
      totalPixels,
      validDisparities,
      averageDisparity: points3D.length > 0 ? sumDisparity / points3D.length : 0,
      minDepth: minDepth === Infinity ? 0 : minDepth,
      maxDepth: maxDepth === -Infinity ? 0 : maxDepth
    }
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
