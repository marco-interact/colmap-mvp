'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, FileVideo } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'

interface ScanModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

interface ScanProcessingState {
  stage: 'uploading' | 'processing' | 'generating' | 'completed'
  progress: number
  message: string
}

export function ScanModal({ isOpen, onClose, projectId, onSuccess }: ScanModalProps) {
  const [formData, setFormData] = useState({
    name: 'Scan 2',
    video: null as File | null,
    quality: 'medium' as 'low' | 'medium' | 'high' | 'extreme',
    denseReconstruction: true,
    meshing: true,
    frameRate: 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processingState, setProcessingState] = useState<ScanProcessingState>({
    stage: 'uploading',
    progress: 0,
    message: 'Preparando...'
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  if (!isOpen) return null

  const simulateProgress = (stage: ScanProcessingState['stage'], duration: number, endProgress: number) => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now()
      const startProgress = processingState.progress
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(startProgress + (endProgress - startProgress) * (elapsed / duration), endProgress)
        
        let message = ''
        switch (stage) {
            case 'uploading':
            message = 'Uploading video...'
            break
          case 'processing':
            message = 'Extracting frames...'
            break
          case 'generating':
            message = 'Generating 3D model...'
            break
          case 'completed':
            message = 'Processing completed'
            break
        }
        
        setProcessingState({ stage, progress, message })
        
        if (elapsed < duration) {
          requestAnimationFrame(updateProgress)
        } else {
          resolve()
        }
      }
      
      updateProgress()
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.video) {
      toast.error('Please select a video file')
      return
    }

    setIsLoading(true)
    setProcessingState({ stage: 'uploading', progress: 0, message: 'Preparando...' })

    try {
      // Stage 1: Upload simulation
      await simulateProgress('uploading', 2000, 30)
      
      const uploadFormData = new FormData()
      uploadFormData.append('name', formData.name)
      uploadFormData.append('projectId', projectId)
      uploadFormData.append('video', formData.video)
      uploadFormData.append('quality', formData.quality)
      uploadFormData.append('denseReconstruction', formData.denseReconstruction.toString())
      uploadFormData.append('meshing', formData.meshing.toString())
      uploadFormData.append('frameRate', formData.frameRate.toString())

      const response = await fetch('/api/scans', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        // Stage 2: Processing simulation
        await simulateProgress('processing', 3000, 70)
        
        // Stage 3: Generating 3D model simulation
        await simulateProgress('generating', 2000, 100)
        
        // Stage 4: Complete
        setProcessingState({ stage: 'completed', progress: 100, message: 'Redirecting to 3D viewer...' })
        
        toast.success('Scan processed successfully')
        
        // Wait a moment before navigating
        setTimeout(() => {
          onClose()
          // Navigate to 3D viewer with scan data
          console.log('Navigating to viewer:', `/projects/${projectId}/scans/${data.data.id}/viewer`)
          router.push(`/projects/${projectId}/scans/${data.data.id}/viewer`)
        }, 1000)
        
        onSuccess?.()
      } else {
        toast.error(data.message || 'Error creating scan')
        setIsLoading(false)
      }
    } catch (error) {
      toast.error('Connection error')
      console.error('Scan creation error:', error)
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, video: file }))
      } else {
        toast.error('Please select a valid video file')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, video: file }))
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal animate-slide-up" style={{ maxWidth: '600px', borderRadius: '20px' }}>
        <div className="modal-header" style={{ position: 'relative', borderBottom: 'none', paddingBottom: 0 }}>
          <h2 className="modal-title" style={{ 
            fontSize: '1.75rem', 
            fontWeight: '300',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            New Scan
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" style={{ gap: 'var(--spacing-xl)' }}>
          <div className="modal-form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <label htmlFor="name" className="modal-form-label" style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>
                Scan Name
              </label>
              <span className="mandatory" style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)',
                fontWeight: '300'
              }}>
                Mandatory
              </span>
            </div>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Scan 2"
              className="modal-form-input"
              required
              disabled={isLoading}
              style={{
                background: 'transparent',
                borderLeft: 'none',
                borderRight: 'none', 
                borderTop: 'none',
                borderBottom: '1px solid var(--border-primary)',
                borderRadius: 0,
                padding: 'var(--spacing-md) 0',
                fontSize: '1rem'
              }}
            />
          </div>

          <div className="modal-form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <label className="modal-form-label" style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>
                Media Input
              </label>
              <span className="mandatory" style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)',
                fontWeight: '300'
              }}>
                Mandatory
              </span>
            </div>
            
            {/* File Upload Area - Colmap App Style */}
            <div
              style={{
                border: '2px dotted var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-2xl)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: dragActive 
                  ? 'rgba(78, 205, 196, 0.05)' 
                  : 'var(--bg-tertiary)',
                borderColor: dragActive 
                  ? 'var(--brand-primary)' 
                  : (formData.video ? 'var(--success)' : 'var(--border-primary)')
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              
              {formData.video ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <FileVideo size={48} style={{ color: 'var(--success)' }} />
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>
                      {formData.video.name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {formatFileSize(formData.video.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFormData(prev => ({ ...prev, video: null }))
                    }}
                    style={{ 
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                  {/* Camera Icon */}
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%',
                    border: '2px solid var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    <Upload size={28} />
                  </div>
                  <div>
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '1rem',
                      marginBottom: 0,
                      fontWeight: '400'
                    }}>
                      Add or select file here
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="modal-form-hint" style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
              What file types can I use?
            </p>
          </div>

          <div style={{ marginTop: 'var(--spacing-2xl)' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !formData.video}
              style={{
                width: '100%',
                padding: 'var(--spacing-lg) var(--spacing-xl)',
                fontSize: '1rem',
                fontWeight: '500',
                borderRadius: '50px',
                background: isLoading ? '#3B9B94' : 'var(--brand-primary)', // Darker turquoise when loading
                border: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Progress fill animation */}
              {isLoading && (
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--brand-primary), #3B9B94)',
                    width: `${processingState.progress}%`,
                    transition: 'width 0.3s ease',
                    zIndex: 0
                  }}
                />
              )}
              
              {/* Button content */}
              <div style={{ 
                position: 'relative', 
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-sm)'
              }}>
                {isLoading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>{processingState.message}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        {Math.round(processingState.progress)}%
                      </span>
                    </div>
                  </>
                ) : (
                  'GENERATE SCAN'
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
