'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileVideo } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface ScanModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.video) {
      toast.error('Por favor selecciona un archivo de video')
      return
    }

    setIsLoading(true)

    try {
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
        toast.success('Scan creado exitosamente')
        onClose()
        onSuccess?.()
        // Reset form
        setFormData({
          name: 'Scan 2',
          video: null,
          quality: 'medium' as 'low' | 'medium' | 'high' | 'extreme',
          denseReconstruction: true,
          meshing: true,
          frameRate: 1
        })
      } else {
        toast.error(data.message || 'Error al crear el scan')
      }
    } catch (error) {
      toast.error('Error de conexión')
      console.error('Scan creation error:', error)
    } finally {
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
        toast.error('Por favor selecciona un archivo de video válido')
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
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Scan</h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 'var(--spacing-lg)',
              right: 'var(--spacing-lg)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-group">
            <label htmlFor="name" className="modal-form-label">
              Nombre del Scan
              <span className="mandatory">Mandatory</span>
            </label>
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
            />
          </div>

          <div className="modal-form-group">
            <label className="modal-form-label">
              Media Input
              <span className="mandatory">Mandatory</span>
            </label>
            
            {/* File Upload Area */}
            <div
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-all
                ${dragActive 
                  ? 'border-brand-primary bg-brand-primary/5' 
                  : 'border-border-primary bg-bg-tertiary'
                }
                ${formData.video ? 'border-success bg-success/5' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
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
                <div className="flex flex-col items-center gap-4">
                  <FileVideo size={48} style={{ color: 'var(--success)' }} />
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
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
                    className="btn btn-ghost"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload size={48} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                      Agregar o seleccionar archivo aquí
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Arrastra y suelta o haz clic para seleccionar
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="modal-form-hint">
              ¿Qué tipos de archivos puedo utilizar?
            </p>
          </div>

          {/* Processing Options */}
          <div className="modal-form-group">
            <label className="modal-form-label">
              Calidad de Procesamiento
            </label>
            <select
              value={formData.quality}
              onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value as any }))}
              className="modal-form-select"
              disabled={isLoading}
            >
              <option value="low">Baja (Rápido - 800px)</option>
              <option value="medium">Media (Equilibrado - 1200px)</option>
              <option value="high">Alta (Detallado - 1600px)</option>
              <option value="extreme">Extrema (Máximo detalle - 2400px)</option>
            </select>
          </div>

          <div className="modal-form-group">
            <label className="modal-form-label">
              Tasa de Extracción de Frames
            </label>
            <select
              value={formData.frameRate}
              onChange={(e) => setFormData(prev => ({ ...prev, frameRate: parseInt(e.target.value) }))}
              className="modal-form-select"
              disabled={isLoading}
            >
              <option value={1}>1 frame por segundo (Recomendado)</option>
              <option value={2}>1 frame cada 2 segundos</option>
              <option value={5}>1 frame cada 5 segundos</option>
              <option value={10}>1 frame cada 10 segundos</option>
            </select>
          </div>

          <div className="modal-form-group">
            <label className="modal-form-label">
              Opciones de Reconstrucción
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.denseReconstruction}
                  onChange={(e) => setFormData(prev => ({ ...prev, denseReconstruction: e.target.checked }))}
                  disabled={isLoading}
                  style={{
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                Reconstrucción densa (Más detalle, más tiempo)
              </label>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.meshing}
                  onChange={(e) => setFormData(prev => ({ ...prev, meshing: e.target.checked }))}
                  disabled={isLoading}
                  style={{
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                Generar malla 3D (Para visualización)
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isLoading || !formData.video}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Subiendo...
                </>
              ) : (
                'GENERAR SCAN'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
