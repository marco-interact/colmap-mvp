/**
 * Scan Processing Mapper
 * Utility for mapping and triggering COLMAP processing actions
 */

export interface ScanProcessingConfig {
  projectId: string
  scanName: string
  videoFile: File
  quality: 'low' | 'medium' | 'high' | 'extreme'
  denseReconstruction: boolean
  meshing: boolean
  frameRate: number
}

export class ScanProcessingMapper {
  private static instance: ScanProcessingMapper
  private processingCallbacks: Map<string, (config: ScanProcessingConfig) => void> = new Map()

  static getInstance(): ScanProcessingMapper {
    if (!ScanProcessingMapper.instance) {
      ScanProcessingMapper.instance = new ScanProcessingMapper()
    }
    return ScanProcessingMapper.instance
  }

  /**
   * Register a callback for scan processing
   */
  registerCallback(id: string, callback: (config: ScanProcessingConfig) => void): void {
    this.processingCallbacks.set(id, callback)
  }

  /**
   * Trigger scan processing with the given configuration
   */
  triggerProcessing(config: ScanProcessingConfig): void {
    console.log('🚀 Triggering COLMAP processing:', config)
    
    // Notify all registered callbacks
    this.processingCallbacks.forEach((callback, id) => {
      try {
        callback(config)
        console.log(`✅ Processing callback executed: ${id}`)
      } catch (error) {
        console.error(`❌ Processing callback failed: ${id}`, error)
      }
    })
  }

  /**
   * Map DOM elements to processing actions
   */
  mapElements(): void {
    // Map the generate scan button
    const generateButton = document.getElementById('generate-scan-button')
    if (generateButton) {
      generateButton.setAttribute('data-trigger', 'colmap-processing')
      generateButton.setAttribute('data-action', 'start-reconstruction')
      console.log('✅ Mapped generate-scan-button to COLMAP processing')
    }

    // Map the scan creation form
    const scanForm = document.getElementById('scan-creation-form')
    if (scanForm) {
      scanForm.setAttribute('data-trigger', 'scan-creation')
      scanForm.setAttribute('data-action', 'create-scan')
      console.log('✅ Mapped scan-creation-form to scan creation')
    }

    // Map the video input
    const videoInput = document.getElementById('video-file-input')
    if (videoInput) {
      videoInput.setAttribute('data-trigger', 'video-upload')
      videoInput.setAttribute('data-action', 'file-selection')
      console.log('✅ Mapped video-file-input to file selection')
    }

    // Map processing state elements
    const processingElements = document.querySelectorAll('[data-processing-state]')
    processingElements.forEach(element => {
      element.setAttribute('data-trigger', 'processing-status')
      element.setAttribute('data-action', 'status-update')
    })
    console.log(`✅ Mapped ${processingElements.length} processing state elements`)
  }

  /**
   * Get processing configuration from form data
   */
  getProcessingConfig(): ScanProcessingConfig | null {
    const form = document.getElementById('scan-creation-form') as HTMLFormElement
    if (!form) return null

    const formData = new FormData(form)
    const videoFile = formData.get('video') as File
    
    if (!videoFile) return null

    return {
      projectId: form.getAttribute('data-project-id') || '',
      scanName: formData.get('name') as string || 'New Scan',
      videoFile,
      quality: (formData.get('quality') as any) || 'medium',
      denseReconstruction: formData.get('denseReconstruction') === 'true',
      meshing: formData.get('meshing') === 'true',
      frameRate: parseInt(formData.get('frameRate') as string) || 1
    }
  }

  /**
   * Initialize the mapper and set up event listeners
   */
  initialize(): void {
    console.log('🔧 Initializing Scan Processing Mapper...')
    
    // Map DOM elements
    this.mapElements()

    // Set up event listeners for the generate scan button
    const generateButton = document.getElementById('generate-scan-button')
    if (generateButton) {
      generateButton.addEventListener('click', (e) => {
        console.log('🎯 Generate Scan button clicked')
        const config = this.getProcessingConfig()
        if (config) {
          this.triggerProcessing(config)
        }
      })
    }

    console.log('✅ Scan Processing Mapper initialized')
  }
}

// Export singleton instance
export const scanProcessingMapper = ScanProcessingMapper.getInstance()

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scanProcessingMapper.initialize()
    })
  } else {
    scanProcessingMapper.initialize()
  }
}
