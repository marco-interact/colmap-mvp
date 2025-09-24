'use client'

import React, { useState, useEffect } from 'react'
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
        <div className="topbar" style={{ 
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
            Mis Proyectos
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
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
                placeholder="Search Project"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '25px',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  paddingLeft: '2.5rem',
                  color: 'var(--text-primary)',
                  width: '280px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              onClick={() => setIsProjectModalOpen(true)}
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
              NEW PROJECT
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
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--spacing-2xl)',
              color: 'var(--text-muted)'
            }}>
              <p>No se encontraron proyectos que coincidan con "{searchTerm}"</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: 'var(--spacing-xl)',
              marginTop: 'var(--spacing-xl)'
            }}>
              {filteredProjects.map((project) => (
                <Link href={`/projects/${project.id}`} key={project.id} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  className="project-card animate-fade-in"
                  >
                    <div style={{
                      width: '100%',
                      height: '180px',
                      background: 'var(--bg-tertiary)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} />
                      ) : (
                        // 3D Building Mockup matching Colmap App design
                        <div style={{
                          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {/* Industrial Building 3D Mockup */}
                          <div style={{
                            width: '85%',
                            height: '70%',
                            background: 'linear-gradient(45deg, #6a5d4a, #8a7a5a, #aa9a7a)',
                            borderRadius: '4px',
                            position: 'relative',
                            transform: 'perspective(120px) rotateX(20deg) rotateY(-15deg)',
                            boxShadow: '0 15px 25px rgba(0,0,0,0.4)'
                          }}>
                            {/* Main building structure */}
                            <div style={{
                              position: 'absolute',
                              top: '15%',
                              left: '15%',
                              right: '15%',
                              bottom: '25%',
                              background: 'linear-gradient(to bottom, #8a7a5a, #6a5a4a)',
                              borderRadius: '2px',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                            }} />
                            
                            {/* Side structures */}
                            <div style={{
                              position: 'absolute',
                              top: '20%',
                              left: '5%',
                              width: '12%',
                              height: '45%',
                              background: '#5a4a3a',
                              borderRadius: '1px'
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: '20%',
                              right: '5%',
                              width: '12%',
                              height: '45%',
                              background: '#5a4a3a',
                              borderRadius: '1px'
                            }} />
                            
                            {/* Ground/base */}
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '0',
                              right: '0',
                              height: '15%',
                              background: 'linear-gradient(to top, #2d5a2d, #3d6a3d)',
                              borderRadius: '0 0 4px 4px'
                            }} />
                            
                            {/* Vegetation spots */}
                            <div style={{
                              position: 'absolute',
                              bottom: '10%',
                              left: '20%',
                              width: '8px',
                              height: '8px',
                              background: '#4a7a4a',
                              borderRadius: '50%'
                            }} />
                            <div style={{
                              position: 'absolute',
                              bottom: '12%',
                              right: '25%',
                              width: '6px',
                              height: '6px',
                              background: '#5a8a5a',
                              borderRadius: '50%'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                      <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          Actualizado: {formatDate(project.updated_at)}
                        </div>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-xs)',
                          margin: 0
                        }}>
                          {project.name}
                        </h3>
                        <p style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          margin: 0
                        }}>
                          {project.description}
                        </p>
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
