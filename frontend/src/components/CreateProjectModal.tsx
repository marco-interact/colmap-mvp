import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { X } from 'lucide-react';
import { projectsApi } from '../services/api.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import toast from 'react-hot-toast';

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const createProjectMutation = useMutation(
    (data: { name: string; description?: string }) => 
      projectsApi.createProject(data),
    {
      onSuccess: () => {
        toast.success('Project created successfully!');
        onSuccess();
      },
      onError: () => {
        toast.error('Failed to create project');
      },
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    createProjectMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <div className="dm-modal-overlay">
      <div className="dm-modal">
        <div className="dm-modal-header">
          <div className="dm-flex dm-items-center dm-justify-between">
            <h2 className="dm-modal-title">Nuevo Proyecto</h2>
            <button
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--dm-text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dm-form-group">
            <label className="dm-form-label">
              Nombre
              <span className="dm-required">Mandatory</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="dm-input"
              placeholder="Nombre del Proyecto"
              disabled={createProjectMutation.isLoading}
            />
            <div className="dm-form-help">¿Olvidaste tu contraseña?</div>
          </div>

          <div className="dm-form-group">
            <label className="dm-form-label">
              Descripción
              <span className="dm-required">Mandatory</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="dm-input"
              placeholder="Descripción del Proyecto"
              rows={3}
              disabled={createProjectMutation.isLoading}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
            <div className="dm-form-help">¿Olvidaste tu contraseña?</div>
          </div>

          <div className="dm-form-group">
            <label className="dm-form-label">
              Ubicación
              <span className="dm-required">Mandatory</span>
            </label>
            <input
              type="text"
              className="dm-input"
              placeholder="Buscar Ubicación"
              disabled={createProjectMutation.isLoading}
            />
            <div className="dm-form-help">¿No encuentras la ubicación?</div>
          </div>

          <div className="dm-form-group">
            <label className="dm-form-label">
              Tipo de Espacio
              <span className="dm-required">Mandatory</span>
            </label>
            <select 
              className="dm-input"
              disabled={createProjectMutation.isLoading}
            >
              <option>Selecciona el tipo de espacio a escanear</option>
              <option>Interior</option>
              <option>Exterior</option>
              <option>Mixto</option>
            </select>
          </div>

          <div className="dm-form-group">
            <label className="dm-form-label">
              Tipo de Proyecto
              <span className="dm-required">Mandatory</span>
            </label>
            <select 
              className="dm-input"
              disabled={createProjectMutation.isLoading}
            >
              <option>Selecciona el tipo de proyecto</option>
              <option>Arquitectónico</option>
              <option>Industrial</option>
              <option>Patrimonial</option>
            </select>
          </div>

          <button
            type="submit"
            className="dm-btn dm-btn-primary"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={createProjectMutation.isLoading}
          >
            {createProjectMutation.isLoading && <LoadingSpinner />}
            CREAR PROYECTO
          </button>
        </form>
      </div>
    </div>
  );
};


