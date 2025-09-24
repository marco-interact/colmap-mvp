'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, Plus, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import { ScanModal } from '@/components/forms/scan-modal'
import { ProcessingStatus } from '@/components/ui/processing-status'
import { ModelViewer } from '@/components/3d/model-viewer'
import { User } from '@/lib/auth'
import { toast } from '@/components/ui/toaster'

interface Project {
  id: string
  name: string
  description: string
  location: string
  status: string
  thumbnail?: string
  updated_at: string
}

interface Scan {
  id: string
  name: string
  project_id: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  thumbnail?: string
  updated_at: string
  processing_jobs?: Array<{
    job_id: string
    type: 'frame_extraction' | 'reconstruction'
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress?: number
    message?: string
  }>
  processing_options?: {
    quality: string
    dense_reconstruction: boolean
    meshing: boolean
    frame_rate: number
  }
  model_url?: string
}

interface ProjectDetailClientProps {
  user: User
  projectId: string
}

export function ProjectDetailClient({ user, projectId }: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProject()
    fetchScans()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      
      if (data.success) {
        setProject(data.data)
      } else {
        toast.error('Proyecto no encontrado')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Error al cargar el proyecto')
    }
  }

  const fetchScans = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/scans`)
      const data = await response.json()
      
      if (data.success) {
        setScans(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching scans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Proyecto eliminado exitosamente')
        window.location.href = '/dashboard'
      } else {
        toast.error(data.message || 'Error al eliminar el proyecto')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Error de conexión')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!project) {
    return (
      <div className="app-layout">
        <Sidebar user={user} />
        <div className="main-content">
          <div className="content">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              flexDirection: 'column',
              gap: 'var(--spacing-md)'
            }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Cargando proyecto...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      
      <div className="main-content">
        <div style={{ 
          background: 'var(--bg-primary)', 
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--spacing-lg) var(--spacing-2xl)',
          position: 'sticky',
          top: 0,
          zIndex: 5
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '400',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {project.name} &gt; Scans
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <button
              onClick={handleDeleteProject}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '25px',
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              <Trash2 size={18} />
              ELIMINAR PROYECTO
            </button>
            <button
              onClick={() => setIsScanModalOpen(true)}
              style={{
                background: 'var(--brand-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '25px',
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              <Plus size={18} />
              NEW SCAN
            </button>
          </div>
        </div>

        <div className="content">
          {/* Project Info */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: 'var(--spacing-sm)',
              color: 'var(--text-primary)'
            }}>
              {project.name}
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-md)',
              lineHeight: 1.5 
            }}>
              {project.description}
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-sm)',
              color: 'var(--text-muted)',
              fontSize: '0.875rem'
            }}>
              <MapPin size={16} />
              {project.location}
            </div>
          </div>

          {isLoading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '200px',
              flexDirection: 'column',
              gap: 'var(--spacing-md)'
            }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px' }} />
              <p style={{ color: 'var(--text-muted)' }}>Cargando scans...</p>
            </div>
          ) : scans.length === 0 ? (
            // Empty state
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-2xl)',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              <div style={{ 
                marginBottom: 'var(--spacing-xl)',
                opacity: 0.5
              }}>
                <Plus size={64} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h2 style={{ 
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: 'var(--spacing-md)',
                color: 'var(--text-primary)'
              }}>
                Aún no tienes scans
              </h2>
              <p style={{ 
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                lineHeight: 1.6
              }}>
                Sube un video para generar tu primer scan 3D con COLMAP.
              </p>
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="btn btn-primary btn-large"
              >
                <Plus size={20} />
                Crear Primer Scan
              </button>
            </div>
          ) : (
            // Scans grid - DoMapping style
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 'var(--spacing-xl)',
              marginTop: 'var(--spacing-xl)'
            }}>
              {scans.map((scan) => (
                <div key={scan.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} className="project-card animate-fade-in">
                  <div style={{
                    width: '100%',
                    height: '180px',
                    background: 'var(--bg-tertiary)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {scan.status === 'completed' && scan.model_url ? (
                      // Show 3D viewer for completed scans
                      <ModelViewer
                        modelUrl={scan.model_url}
                        modelType={scan.processing_options?.meshing ? 'mesh' : 'pointcloud'}
                        className="scan-viewer-preview"
                      />
                    ) : scan.thumbnail ? (
                      <img src={scan.thumbnail} alt={scan.name} style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }} />
                    ) : (
                      // Checkerboard placeholder matching DoMapping design
                      <div style={{
                        background: '#f0f0f0',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `
                          repeating-conic-gradient(
                            #e0e0e0 0% 25%, 
                            transparent 0% 50%
                          ) 50% 50% / 20px 20px
                        `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          background: 'rgba(0,0,0,0.1)',
                          width: '100%',
                          height: '100%',
                          position: 'absolute'
                        }} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        {project.name}
                      </div>
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        marginBottom: 'var(--spacing-sm)'
                      }}>
                        Actualizado: {formatDate(scan.updated_at)}
                      </div>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        {scan.name}
                      </h3>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem'
                    }}>
                      <MapPin size={14} />
                      {project.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        projectId={projectId}
        onSuccess={() => {
          fetchScans()
        }}
      />
    </div>
  )
}
