import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, MapPin, FolderOpen } from 'lucide-react';
import { projectsApi } from '../services/api.ts';
import { Project, ProjectStatus } from '../types.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { CreateProjectModal } from '../components/CreateProjectModal.tsx';

export const ProjectsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery<Project[]>(
    'projects',
    projectsApi.getAll,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const deleteProjectMutation = useMutation(projectsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('projects');
    },
  });

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await deleteProjectMutation.mutateAsync(project.id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PROCESSING:
        return '⚡';
      case ProjectStatus.COMPLETED:
        return '✅';
      case ProjectStatus.FAILED:
        return '❌';
      default:
        return '⏳';
    }
  };

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="dm-flex dm-items-center dm-justify-center" style={{ minHeight: '60vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dm-text-center dm-py-12">
        <div style={{ color: 'var(--dm-error)', marginBottom: '16px' }}>
          <h3>Error loading projects</h3>
          <p>Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--dm-background)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="dm-header">
        <div className="dm-flex dm-items-center dm-justify-between" style={{ width: '100%' }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '600', 
              color: 'var(--dm-text-primary)', 
              margin: 0 
            }}>
              Mis Proyectos
            </h1>
          </div>
          <div className="dm-flex dm-items-center dm-gap-4">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Project"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dm-input"
                style={{ 
                  paddingLeft: '40px',
                  width: '280px',
                  backgroundColor: 'var(--dm-surface-elevated)',
                  border: '1px solid var(--dm-border)',
                  borderRadius: '24px'
                }}
              />
              <Search 
                className="w-5 h-5" 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--dm-text-tertiary)'
                }} 
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="dm-btn dm-btn-primary"
            >
              <Plus className="w-5 h-5" />
              NEW PROJECT
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ padding: '24px' }}>
        {filteredProjects && filteredProjects.length > 0 ? (
          <div className="dm-project-grid">
            {filteredProjects.map((project) => (
              <Link 
                key={project.id} 
                to={`/projects/${project.id}`}
                className="dm-project-card"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {/* Project Thumbnail */}
                <div className="dm-project-thumbnail">
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    opacity: 0.3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Placeholder for 3D model preview */}
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      backgroundColor: 'var(--dm-surface-container-high)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--dm-text-tertiary)'
                    }}>
                      3D
                    </div>
                  </div>
                </div>
                
                {/* Project Content */}
                <div className="dm-project-content">
                  <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--dm-text-tertiary)' }}>
                    Actualizado: {new Date(project.created_at).toLocaleDateString('es-ES')}
                  </div>
                  
                  <h3 className="dm-project-title">
                    {project.name}
                  </h3>
                  
                  {project.description && (
                    <p className="dm-project-description">
                      {project.description}
                    </p>
                  )}
                  
                  {/* Status Badge */}
                  <div style={{ marginBottom: '16px' }}>
                    <span className={`dm-status-badge ${project.status.toLowerCase()}`}>
                      <span>{getStatusIcon(project.status)}</span>
                      {project.status}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="dm-project-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin className="w-4 h-4" />
                      <span>Playa del Carmen</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="dm-text-center dm-py-12">
            <FolderOpen 
              className="dm-w-16 dm-h-16 dm-mx-auto dm-mb-4" 
              style={{ color: 'var(--dm-text-tertiary)' }}
            />
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '500', 
              color: 'var(--dm-text-primary)', 
              marginBottom: '8px' 
            }}>
              No projects yet
            </h3>
            <p style={{ 
              color: 'var(--dm-text-secondary)', 
              marginBottom: '24px' 
            }}>
              Create your first project to start building 3D models
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="dm-btn dm-btn-primary"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries('projects');
          }}
        />
      )}
    </div>
  );
};



