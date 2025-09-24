'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ProjectModal({ isOpen, onClose, onSuccess }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    space_type: '',
    project_type: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Proyecto creado exitosamente')
        onClose()
        onSuccess?.()
        // Reset form
        setFormData({
          name: '',
          description: '',
          location: '',
          space_type: '',
          project_type: ''
        })
      } else {
        toast.error(data.message || 'Error al crear el proyecto')
      }
    } catch (error) {
      toast.error('Error de conexión')
      console.error('Project creation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Proyecto</h2>
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
              Nombre
              <span className="mandatory">Mandatory</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre del Proyecto"
              className="modal-form-input"
              required
              disabled={isLoading}
            />
            <p className="modal-form-hint">¿Olvidaste tu contraseña?</p>
          </div>

          <div className="modal-form-group">
            <label htmlFor="description" className="modal-form-label">
              Descripción
              <span className="mandatory">Mandatory</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Descripción del Proyecto"
              className="modal-form-textarea"
              required
              disabled={isLoading}
            />
            <p className="modal-form-hint">¿Olvidaste tu contraseña?</p>
          </div>

          <div className="modal-form-group">
            <label htmlFor="location" className="modal-form-label">
              Ubicación
              <span className="mandatory">Mandatory</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Buscar Ubicación"
              className="modal-form-input"
              required
              disabled={isLoading}
            />
            <p className="modal-form-hint">¿No encuentras la ubicación?</p>
          </div>

          <div className="modal-form-group">
            <label htmlFor="space_type" className="modal-form-label">
              Tipo de Espacio
              <span className="mandatory">Mandatory</span>
            </label>
            <select
              id="space_type"
              name="space_type"
              value={formData.space_type}
              onChange={handleInputChange}
              className="modal-form-select"
              required
              disabled={isLoading}
            >
              <option value="">Selecciona el tipo de espacio a escanear</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="industrial">Industrial</option>
              <option value="residential">Residencial</option>
              <option value="commercial">Comercial</option>
            </select>
          </div>

          <div className="modal-form-group">
            <label htmlFor="project_type" className="modal-form-label">
              Tipo de Proyecto
              <span className="mandatory">Mandatory</span>
            </label>
            <select
              id="project_type"
              name="project_type"
              value={formData.project_type}
              onChange={handleInputChange}
              className="modal-form-select"
              required
              disabled={isLoading}
            >
              <option value="">Selecciona el tipo de proyecto</option>
              <option value="reconstruction">Reconstrucción 3D</option>
              <option value="measurement">Medición</option>
              <option value="inspection">Inspección</option>
              <option value="modeling">Modelado</option>
              <option value="documentation">Documentación</option>
            </select>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Creando...
                </>
              ) : (
                'CREAR PROYECTO'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
