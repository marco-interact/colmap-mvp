'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import { ProjectModal } from '@/components/forms/project-modal'
import { User } from '@/lib/auth'

interface Project {
  id: string
  name: string
  description: string
  location: string
  status: string
  thumbnail?: string
  updated_at: string
}

interface DashboardClientProps {
  user: User
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      const data = await response.json()
      
      if (data.success) {
        setProjects(data.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      
      <div className="main-content">
        <div className="topbar">
          <h1 className="topbar-title">Mis Proyectos</h1>
          <div className="topbar-actions">
            <div style={{ position: 'relative' }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: 'var(--spacing-md)', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                type="text"
                placeholder="Buscar Proyecto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={20} />
              NUEVO PROYECTO
            </button>
          </div>
        </div>

        <div className="content">
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
              <p style={{ color: 'var(--text-muted)' }}>Cargando proyectos...</p>
            </div>
          ) : filteredProjects.length === 0 && searchTerm === '' ? (
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
                Aún no tienes proyectos
              </h2>
              <p style={{ 
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-xl)',
                lineHeight: 1.6
              }}>
                Comienza creando tu primer proyecto de reconstrucción 3D.
                Sube un video y deja que COLMAP genere un modelo 3D detallado.
              </p>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="btn btn-primary btn-large"
              >
                <Plus size={20} />
                Crear Primer Proyecto
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            // No search results
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-2xl)',
              color: 'var(--text-muted)'
            }}>
              <p>No se encontraron proyectos que coincidan con "{searchTerm}"</p>
            </div>
          ) : (
            // Project grid
            <div className="projects-grid">
              {filteredProjects.map((project) => (
                <Link href={`/projects/${project.id}`} key={project.id}>
                  <div className="project-card animate-fade-in">
                  <div className="project-card-image">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} />
                    ) : (
                      // Sample 3D industrial building preview (CSS-generated)
                      <div style={{
                        background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: '80%',
                          height: '60%',
                          background: 'linear-gradient(45deg, #4a4a4a, #6a6a6a, #8a8a8a)',
                          borderRadius: '4px',
                          position: 'relative',
                          transform: 'perspective(100px) rotateX(15deg) rotateY(-10deg)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                        }}>
                          {/* Industrial building structure */}
                          <div style={{
                            position: 'absolute',
                            top: '10%',
                            left: '20%',
                            right: '20%',
                            bottom: '30%',
                            background: 'linear-gradient(to bottom, #8a7a5a, #6a5a4a)',
                            borderRadius: '2px'
                          }} />
                          <div style={{
                            position: 'absolute',
                            top: '15%',
                            left: '10%',
                            width: '15%',
                            height: '40%',
                            background: '#5a4a3a',
                            borderRadius: '1px'
                          }} />
                          <div style={{
                            position: 'absolute',
                            top: '15%',
                            right: '10%',
                            width: '15%',
                            height: '40%',
                            background: '#5a4a3a',
                            borderRadius: '1px'
                          }} />
                          {/* Green vegetation elements */}
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            height: '20%',
                            background: 'linear-gradient(to top, #2d5a2d, #3d6a3d)',
                            borderRadius: '0 0 4px 4px'
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="project-card-content">
                    <div className="project-card-header">
                      <h3 className="project-card-title">{project.name}</h3>
                      <p className="project-card-description">{project.description}</p>
                    </div>
                    
                    <div className="project-card-meta">
                      <div className="project-card-date">
                        Actualizado: {formatDate(project.updated_at)}
                      </div>
                      <div className="project-card-location">
                        <MapPin />
                        {project.location}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={() => {
          fetchProjects()
        }}
      />
    </div>
  )
}
