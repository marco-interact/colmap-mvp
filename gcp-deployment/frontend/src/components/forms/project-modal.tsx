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
      <div className="modal animate-slide-up" style={{ maxWidth: '600px', borderRadius: '20px' }}>
        <div className="modal-header" style={{ position: 'relative', borderBottom: 'none', paddingBottom: 0 }}>
          <h2 className="modal-title" style={{ 
            fontSize: '1.75rem', 
            fontWeight: '300',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            New Project
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
                Name
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
              onChange={handleInputChange}
              placeholder="Project Name"
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
            <p className="modal-form-hint" style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
              ¿Olvidaste tu contraseña?
            </p>
          </div>

          <div className="modal-form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <label htmlFor="description" className="modal-form-label" style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>
                Description
              </label>
              <span className="mandatory" style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)',
                fontWeight: '300'
              }}>
                Mandatory
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Project Description"
              className="modal-form-textarea"
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
                fontSize: '1rem',
                minHeight: '60px',
                resize: 'none'
              }}
            />
            <p className="modal-form-hint" style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
              ¿Olvidaste tu contraseña?
            </p>
          </div>

          <div className="modal-form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <label htmlFor="location" className="modal-form-label" style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>
                Location
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
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Search Location"
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
            <p className="modal-form-hint" style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
              Can't find the location?
            </p>
          </div>

          <div className="modal-form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <label htmlFor="space_type" className="modal-form-label" style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>
                Space Type
              </label>
              <span className="mandatory" style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)',
                fontWeight: '300'
              }}>
                Mandatory
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                id="space_type"
                name="space_type"
                value={formData.space_type}
                onChange={handleInputChange}
                className="modal-form-select"
                required
                disabled={isLoading}
                style={{
                  background: 'transparent',
                  borderLeft: 'none',
                  borderRight: 'none', 
                  borderTop: 'none',
                  borderBottom: '1px solid var(--border-primary)',
                  borderRadius: 0,
                  padding: 'var(--spacing-md) var(--spacing-lg) var(--spacing-md) 0',
                  fontSize: '1rem',
                  width: '100%',
                  appearance: 'none',
                  cursor: 'pointer',
                  color: formData.space_type ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >
                <option value="">Select the type of space to scan</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="industrial">Industrial</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
              <div style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }}>
                ▼
              </div>
            </div>
          </div>

          <div className="modal-form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-sm)'
            }}>
              <label htmlFor="project_type" className="modal-form-label" style={{ fontSize: '1rem', fontWeight: '400', margin: 0 }}>
                Project Type
              </label>
              <span className="mandatory" style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)',
                fontWeight: '300'
              }}>
                Mandatory
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                id="project_type"
                name="project_type"
                value={formData.project_type}
                onChange={handleInputChange}
                className="modal-form-select"
                required
                disabled={isLoading}
                style={{
                  background: 'transparent',
                  borderLeft: 'none',
                  borderRight: 'none', 
                  borderTop: 'none',
                  borderBottom: '1px solid var(--border-primary)',
                  borderRadius: 0,
                  padding: 'var(--spacing-md) var(--spacing-lg) var(--spacing-md) 0',
                  fontSize: '1rem',
                  width: '100%',
                  appearance: 'none',
                  cursor: 'pointer',
                  color: formData.project_type ? 'var(--text-primary)' : 'var(--text-muted)'
                }}
              >
                <option value="">Select the type of project</option>
                <option value="reconstruction">3D Reconstruction</option>
                <option value="measurement">Measurement</option>
                <option value="inspection">Inspection</option>
                <option value="modeling">Modeling</option>
                <option value="documentation">Documentation</option>
              </select>
              <div style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }}>
                ▼
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-2xl)' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: 'var(--spacing-lg) var(--spacing-xl)',
                fontSize: '1rem',
                fontWeight: '500',
                borderRadius: '50px',
                background: 'var(--brand-primary)',
                border: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Creating...
                </>
              ) : (
                'CREATE PROJECT'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
