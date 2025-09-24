/**
 * 360° Equirectangular to Perspective Conversion
 * Based on OpenCV remapping techniques for virtual camera simulation
 * Optimized for web browsers using Canvas API and Web Workers
 */

export interface VirtualCameraParams {
  outputWidth: number
  outputHeight: number
  horizontalFOV: number // degrees
  verticalFOV: number   // degrees
  yaw: number          // degrees (pan)
  pitch: number        // degrees (tilt)
  roll: number         // degrees
}

export interface ConversionResult {
  perspectiveImage: ImageData
  processingTime: number
  virtualCamera: VirtualCameraParams
}

export class EquirectangularConverter {
  private worker: Worker | null = null
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.initializeWorker()
  }

  private initializeWorker() {
    const workerCode = `
      // Web Worker for 360° to perspective conversion
      class EquirectangularProcessor {
        static convert360ToPerspective(
          equirectangularData,
          outputWidth,
          outputHeight,
          hFovRad,
          vFovRad,
          yawRad,
          pitchRad,
          rollRad
        ) {
          const inputWidth = equirectangularData.width
          const inputHeight = equirectangularData.height
          const inputData = equirectangularData.data
          
          // Create output image data
          const outputData = new Uint8ClampedArray(outputWidth * outputHeight * 4)
          
          // Create rotation matrices
          const cosY = Math.cos(yawRad), sinY = Math.sin(yawRad)
          const cosP = Math.cos(pitchRad), sinP = Math.sin(pitchRad)
          const cosR = Math.cos(rollRad), sinR = Math.sin(rollRad)
          
          // Combined rotation matrix (R_z * R_y * R_x)
          const R = [
            [cosY * cosR - sinY * sinP * sinR, -cosY * sinR - sinY * sinP * cosR, -sinY * cosP],
            [cosP * sinR, cosP * cosR, -sinP],
            [sinY * cosR + cosY * sinP * sinR, -sinY * sinR + cosY * sinP * cosR, cosY * cosP]
          ]
          
          // Process each output pixel
          for (let yOut = 0; yOut < outputHeight; yOut++) {
            for (let xOut = 0; xOut < outputWidth; xOut++) {
              // Normalize output coordinates to [-1, 1]
              const xNorm = (2 * xOut / (outputWidth - 1)) - 1
              const yNorm = (2 * yOut / (outputHeight - 1)) - 1
              
              // Calculate 3D ray in virtual camera coordinate system
              const tanHalfHFov = Math.tan(hFovRad / 2)
              const tanHalfVFov = Math.tan(vFovRad / 2)
              
              let rayX = xNorm * tanHalfHFov
              let rayY = yNorm * tanHalfVFov
              let rayZ = 1.0
              
              // Normalize the ray
              const rayLength = Math.sqrt(rayX * rayX + rayY * rayY + rayZ * rayZ)
              rayX /= rayLength
              rayY /= rayLength
              rayZ /= rayLength
              
              // Apply camera rotation
              const transformedX = R[0][0] * rayX + R[0][1] * rayY + R[0][2] * rayZ
              const transformedY = R[1][0] * rayX + R[1][1] * rayY + R[1][2] * rayZ
              const transformedZ = R[2][0] * rayX + R[2][1] * rayY + R[2][2] * rayZ
              
              // Convert to spherical coordinates
              const longitude = Math.atan2(transformedX, transformedZ)
              const latitude = Math.asin(Math.max(-1, Math.min(1, transformedY)))
              
              // Map to equirectangular image coordinates
              const srcX = (longitude + Math.PI) / (2 * Math.PI) * inputWidth
              const srcY = (Math.PI / 2 - latitude) / Math.PI * inputHeight
              
              // Bilinear interpolation
              const x1 = Math.floor(srcX) % inputWidth
              const x2 = (x1 + 1) % inputWidth
              const y1 = Math.max(0, Math.min(inputHeight - 1, Math.floor(srcY)))
              const y2 = Math.max(0, Math.min(inputHeight - 1, y1 + 1))
              
              const fx = srcX - Math.floor(srcX)
              const fy = srcY - Math.floor(srcY)
              
              // Get pixel values at the four corners
              const getPixel = (x, y, channel) => {
                return inputData[(y * inputWidth + x) * 4 + channel]
              }
              
              const outputIdx = (yOut * outputWidth + xOut) * 4
              
              // Interpolate each channel
              for (let c = 0; c < 4; c++) {
                const p11 = getPixel(x1, y1, c)
                const p12 = getPixel(x1, y2, c)
                const p21 = getPixel(x2, y1, c)
                const p22 = getPixel(x2, y2, c)
                
                const interpolated = 
                  p11 * (1 - fx) * (1 - fy) +
                  p21 * fx * (1 - fy) +
                  p12 * (1 - fx) * fy +
                  p22 * fx * fy
                
                outputData[outputIdx + c] = Math.round(interpolated)
              }
            }
          }
          
          return {
            data: outputData,
            width: outputWidth,
            height: outputHeight
          }
        }
      }
      
      self.onmessage = function(e) {
        const { equirectangularData, params } = e.data
        const startTime = performance.now()
        
        const result = EquirectangularProcessor.convert360ToPerspective(
          equirectangularData,
          params.outputWidth,
          params.outputHeight,
          params.horizontalFOV * Math.PI / 180,
          params.verticalFOV * Math.PI / 180,
          params.yaw * Math.PI / 180,
          params.pitch * Math.PI / 180,
          params.roll * Math.PI / 180
        )
        
        const processingTime = performance.now() - startTime
        
        self.postMessage({
          result,
          processingTime
        }, [result.data.buffer])
      }
    `
    
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    this.worker = new Worker(URL.createObjectURL(blob))
  }

  /**
   * Convert 360° equirectangular image to perspective view
   */
  async convert360ToPerspective(
    equirectangularImage: HTMLImageElement | HTMLCanvasElement | ImageData,
    params: VirtualCameraParams
  ): Promise<ConversionResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    // Convert input to ImageData if needed
    let imageData: ImageData
    if (equirectangularImage instanceof ImageData) {
      imageData = equirectangularImage
    } else {
      this.canvas.width = equirectangularImage.width
      this.canvas.height = equirectangularImage.height
      this.ctx.drawImage(equirectangularImage, 0, 0)
      imageData = this.ctx.getImageData(0, 0, equirectangularImage.width, equirectangularImage.height)
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('360° conversion timeout'))
      }, 30000)

      this.worker!.onmessage = (e) => {
        clearTimeout(timeout)
        const { result, processingTime } = e.data
        
        const perspectiveImageData = new ImageData(
          new Uint8ClampedArray(result.data),
          result.width,
          result.height
        )
        
        resolve({
          perspectiveImage: perspectiveImageData,
          processingTime,
          virtualCamera: params
        })
      }

      this.worker!.onerror = (error) => {
        clearTimeout(timeout)
        reject(new Error(`Worker error: ${error.message}`))
      }

      // Send data to worker
      this.worker!.postMessage({
        equirectangularData: {
          data: imageData.data,
          width: imageData.width,
          height: imageData.height
        },
        params
      })
    })
  }

  /**
   * Convert 360° video frame to multiple perspective views for COLMAP processing
   */
  async extract360VideoFrames(
    videoElement: HTMLVideoElement,
    extractionParams: {
      frameInterval: number // seconds
      perspectives: VirtualCameraParams[]
      outputFormat: 'canvas' | 'blob' | 'imagedata'
    }
  ): Promise<{
    frames: any[]
    totalFrames: number
    processingTime: number
  }> {
    const startTime = performance.now()
    const frames: any[] = []
    const { frameInterval, perspectives, outputFormat } = extractionParams
    
    const videoDuration = videoElement.duration
    const totalFramesPerView = Math.floor(videoDuration / frameInterval)
    
    // Create temporary canvas for video frame extraction
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = videoElement.videoWidth
    tempCanvas.height = videoElement.videoHeight

    for (let t = 0; t < videoDuration; t += frameInterval) {
      // Seek to time
      videoElement.currentTime = t
      await new Promise(resolve => {
        videoElement.addEventListener('seeked', resolve, { once: true })
      })

      // Draw current frame to canvas
      tempCtx.drawImage(videoElement, 0, 0)
      const equirectangularFrame = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

      // Convert to multiple perspective views
      for (const perspective of perspectives) {
        const conversionResult = await this.convert360ToPerspective(equirectangularFrame, perspective)
        
        let outputFrame: any
        switch (outputFormat) {
          case 'imagedata':
            outputFrame = conversionResult.perspectiveImage
            break
          case 'canvas':
            const outputCanvas = document.createElement('canvas')
            outputCanvas.width = perspective.outputWidth
            outputCanvas.height = perspective.outputHeight
            const outputCtx = outputCanvas.getContext('2d')!
            outputCtx.putImageData(conversionResult.perspectiveImage, 0, 0)
            outputFrame = outputCanvas
            break
          case 'blob':
            const blobCanvas = document.createElement('canvas')
            blobCanvas.width = perspective.outputWidth
            blobCanvas.height = perspective.outputHeight
            const blobCtx = blobCanvas.getContext('2d')!
            blobCtx.putImageData(conversionResult.perspectiveImage, 0, 0)
            outputFrame = await new Promise<Blob>(resolve => {
              blobCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
            })
            break
        }
        
        frames.push({
          frame: outputFrame,
          timeStamp: t,
          perspective: perspective,
          processingTime: conversionResult.processingTime
        })
      }
    }

    return {
      frames,
      totalFrames: frames.length,
      processingTime: performance.now() - startTime
    }
  }

  /**
   * Create optimal camera viewpoints for COLMAP reconstruction from 360° video
   */
  generateOptimalViewpoints(params: {
    numViews: number
    verticalLevels: number
    horizontalFOV: number
    verticalFOV: number
    outputWidth: number
    outputHeight: number
  }): VirtualCameraParams[] {
    const { numViews, verticalLevels, horizontalFOV, verticalFOV, outputWidth, outputHeight } = params
    const viewpoints: VirtualCameraParams[] = []
    
    const viewsPerLevel = Math.ceil(numViews / verticalLevels)
    
    for (let level = 0; level < verticalLevels; level++) {
      // Calculate pitch for this level (-30° to +30°)
      const pitch = -30 + (60 * level / (verticalLevels - 1))
      
      for (let i = 0; i < viewsPerLevel && viewpoints.length < numViews; i++) {
        const yaw = (360 * i / viewsPerLevel) - 180 // -180° to +180°
        
        viewpoints.push({
          outputWidth,
          outputHeight,
          horizontalFOV,
          verticalFOV,
          yaw,
          pitch,
          roll: 0
        })
      }
    }
    
    return viewpoints
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

// Utility functions
export const Video360Utils = {
  /**
   * Detect if video is 360° based on metadata or aspect ratio
   */
  detect360Video(video: HTMLVideoElement): {
    is360: boolean
    confidence: number
    metadata?: any
  } {
    const aspectRatio = video.videoWidth / video.videoHeight
    const typical360AspectRatio = 2.0 // 360° videos are typically 2:1
    
    const aspectRatioConfidence = Math.max(0, 1 - Math.abs(aspectRatio - typical360AspectRatio) / typical360AspectRatio)
    
    // Check for 360° metadata in video element (if available)
    const hasMetadata = video.dataset.projection === 'equirectangular' || 
                       video.dataset.stereo === '360' ||
                       video.src.includes('360')
    
    const confidence = hasMetadata ? 0.95 : aspectRatioConfidence * 0.7
    
    return {
      is360: confidence > 0.5,
      confidence,
      metadata: {
        aspectRatio,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
        hasMetadata
      }
    }
  },

  /**
   * Get recommended processing parameters for 360° video
   */
  getRecommendedParams(videoElement: HTMLVideoElement): {
    perspectives: VirtualCameraParams[]
    frameInterval: number
    quality: string
  } {
    const videoDuration = videoElement.duration
    const videoWidth = videoElement.videoWidth
    
    // Determine quality based on video resolution
    let outputSize: { width: number, height: number }
    let quality: string
    
    if (videoWidth >= 3840) {
      outputSize = { width: 1920, height: 1080 }
      quality = 'high'
    } else if (videoWidth >= 1920) {
      outputSize = { width: 1280, height: 720 }
      quality = 'medium' 
    } else {
      outputSize = { width: 854, height: 480 }
      quality = 'low'
    }
    
    // Frame interval based on video duration
    const frameInterval = Math.max(0.5, Math.min(2.0, videoDuration / 30))
    
    // Generate optimal viewpoints
    const converter = new EquirectangularConverter()
    const perspectives = converter.generateOptimalViewpoints({
      numViews: 12,
      verticalLevels: 2,
      horizontalFOV: 90,
      verticalFOV: 60,
      outputWidth: outputSize.width,
      outputHeight: outputSize.height
    })
    
    return {
      perspectives,
      frameInterval,
      quality
    }
  }
}
