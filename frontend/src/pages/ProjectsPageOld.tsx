import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Eye, Trash2, Play, MoreVertical } from 'lucide-react';
import { projectsApi } from '../services/api.ts';
import { Project, ProjectStatus } from '../types/index.ts';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { CreateProjectModal } from '../components/CreateProjectModal.tsx';
import { getStatusColor, getStatusIcon, formatDuration } from '../services/api.ts';
import toast from 'react-hot-toast';

export const ProjectsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading, error } = useQuery(
    'projects',
    () => projectsApi.getProjects().then(res => res.data),
    {
      refetchInterval: 5000, // Refetch every 5 seconds to get updates
    }
  );

  // Delete project mutation
  const deleteProjectMutation = useMutation(
    (id: number) => projectsApi.deleteProject(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        toast.success('Project deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete project');
      },
    }
  );

  // Start reconstruction mutation
  const startReconstructionMutation = useMutation(
    ({ id, quality }: { id: number; quality: string }) => 
      projectsApi.startReconstruction(id, quality),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects');
        toast.success('Reconstruction started successfully');
      },
      onError: () => {
        toast.error('Failed to start reconstruction');
      },
    }
  );

  const handleDeleteProject = (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteProjectMutation.mutate(project.id);
    }
  };

  const handleStartReconstruction = (project: Project) => {
    startReconstructionMutation.mutate({ id: project.id, quality: 'medium' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading projects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <FolderOpen className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Failed to load projects</h3>
          <p className="text-sm">Please try refreshing the page</p>
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
        {projects && projects.length > 0 ? (
          <div className="dm-project-grid">
            {projects.map((project) => (
              <div key={project.id} className="dm-project-card">
                {/* Project Thumbnail */}
                <div className="dm-project-thumbnail">
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    opacity: 0.3
                  }} />
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

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Frames</p>
                    <p className="font-medium">
                      {project.processed_frames} / {project.total_frames}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quality</p>
                    <p className="font-medium">
                      {(project.reconstruction_quality * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {project.total_frames > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>
                        {((project.processed_frames / project.total_frames) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(project.processed_frames / project.total_frames) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/projects/${project.id}`}
                    className="btn btn-outline flex-1 text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Link>
                  
                  {project.status === ProjectStatus.COMPLETED && (
                    <Link
                      to={`/viewer/${project.id}`}
                      className="btn btn-primary flex-1 text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      3D View
                    </Link>
                  )}
                  
                  {project.status === ProjectStatus.DRAFT && (
                    <button
                      onClick={() => handleStartReconstruction(project)}
                      className="btn btn-success flex-1 text-sm"
                      disabled={startReconstructionMutation.isLoading}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteProject(project)}
                    className="btn btn-danger p-2"
                    disabled={deleteProjectMutation.isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              
                <div className="card-footer">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    {project.processing_time > 0 && (
                      <span>{formatDuration(project.processing_time)}</span>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first project to start building 3D models
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </button>
        </div>
      )}

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


