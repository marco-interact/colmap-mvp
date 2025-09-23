// components/NewProjectForm.tsx
// Modal form for creating new projects with validation and accessibility
// Includes all required fields with proper labeling and hints

import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';

interface NewProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
  isLoading?: boolean;
}

interface ProjectFormData {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  tipoEspacio: string;
  tipoProyecto: string;
}

export const NewProjectForm: React.FC<NewProjectFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    tipoEspacio: '',
    tipoProyecto: ''
  });

  const [errors, setErrors] = useState<Partial<ProjectFormData>>({});

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del proyecto es obligatorio';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    
    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es obligatoria';
    }
    
    if (!formData.tipoEspacio) {
      newErrors.tipoEspacio = 'Selecciona el tipo de espacio';
    }
    
    if (!formData.tipoProyecto) {
      newErrors.tipoProyecto = 'Selecciona el tipo de proyecto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      ubicacion: '',
      tipoEspacio: '',
      tipoProyecto: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
    >
      <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 id="new-project-title" className="text-xl font-bold text-white">
            Nuevo Proyecto
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Cerrar modal"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nombre del Proyecto */}
          <div>
            <label htmlFor="nombre" className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Nombre <span className="text-red-400">Mandatory</span>
            </label>
            <input
              id="nombre"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={`
                w-full text-sm text-gray-300 bg-transparent border-b pb-2 focus:outline-none transition-colors
                ${errors.nombre ? 'border-red-400' : 'border-gray-600 focus:border-emerald-400'}
              `}
              placeholder="Nombre del Proyecto"
              disabled={isLoading}
              aria-describedby={errors.nombre ? 'nombre-error' : 'nombre-hint'}
            />
            {errors.nombre && (
              <p id="nombre-error" className="mt-1 text-xs text-red-400" role="alert">
                {errors.nombre}
              </p>
            )}
            <p id="nombre-hint" className="mt-1 text-xs text-gray-500">
              ¿Olvidaste tu contraseña?
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Descripción <span className="text-red-400">Mandatory</span>
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
              className={`
                w-full text-sm text-gray-300 bg-transparent border-b pb-2 focus:outline-none transition-colors resize-none
                ${errors.descripcion ? 'border-red-400' : 'border-gray-600 focus:border-emerald-400'}
              `}
              placeholder="Descripción del Proyecto"
              disabled={isLoading}
              aria-describedby={errors.descripcion ? 'descripcion-error' : 'descripcion-hint'}
            />
            {errors.descripcion && (
              <p id="descripcion-error" className="mt-1 text-xs text-red-400" role="alert">
                {errors.descripcion}
              </p>
            )}
            <p id="descripcion-hint" className="mt-1 text-xs text-gray-500">
              ¿Olvidaste tu contraseña?
            </p>
          </div>

          {/* Ubicación */}
          <div>
            <label htmlFor="ubicacion" className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Ubicación <span className="text-red-400">Mandatory</span>
            </label>
            <div className="relative">
              <input
                id="ubicacion"
                type="text"
                value={formData.ubicacion}
                onChange={(e) => handleInputChange('ubicacion', e.target.value)}
                className={`
                  w-full text-sm text-gray-300 bg-transparent border-b pb-2 pl-6 focus:outline-none transition-colors
                  ${errors.ubicacion ? 'border-red-400' : 'border-gray-600 focus:border-emerald-400'}
                `}
                placeholder="Buscar Ubicación"
                disabled={isLoading}
                aria-describedby={errors.ubicacion ? 'ubicacion-error' : 'ubicacion-hint'}
              />
              <MapPin className="absolute left-0 bottom-2 w-4 h-4 text-gray-500" aria-hidden="true" />
            </div>
            {errors.ubicacion && (
              <p id="ubicacion-error" className="mt-1 text-xs text-red-400" role="alert">
                {errors.ubicacion}
              </p>
            )}
            <p id="ubicacion-hint" className="mt-1 text-xs text-gray-500">
              ¿No encuentras la ubicación?
            </p>
          </div>

          {/* Tipo de Espacio */}
          <div>
            <label htmlFor="tipoEspacio" className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Tipo de Espacio <span className="text-red-400">Mandatory</span>
            </label>
            <select
              id="tipoEspacio"
              value={formData.tipoEspacio}
              onChange={(e) => handleInputChange('tipoEspacio', e.target.value)}
              className={`
                w-full text-sm text-gray-300 bg-gray-800 border-b pb-2 focus:outline-none transition-colors
                ${errors.tipoEspacio ? 'border-red-400' : 'border-gray-600 focus:border-emerald-400'}
              `}
              disabled={isLoading}
              aria-describedby={errors.tipoEspacio ? 'tipoEspacio-error' : undefined}
            >
              <option value="">Selecciona el tipo de espacio a escanear</option>
              <option value="interior">Interior</option>
              <option value="exterior">Exterior</option>
              <option value="mixto">Mixto</option>
              <option value="industrial">Industrial</option>
            </select>
            {errors.tipoEspacio && (
              <p id="tipoEspacio-error" className="mt-1 text-xs text-red-400" role="alert">
                {errors.tipoEspacio}
              </p>
            )}
          </div>

          {/* Tipo de Proyecto */}
          <div>
            <label htmlFor="tipoProyecto" className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Tipo de Proyecto <span className="text-red-400">Mandatory</span>
            </label>
            <select
              id="tipoProyecto"
              value={formData.tipoProyecto}
              onChange={(e) => handleInputChange('tipoProyecto', e.target.value)}
              className={`
                w-full text-sm text-gray-300 bg-gray-800 border-b pb-2 focus:outline-none transition-colors
                ${errors.tipoProyecto ? 'border-red-400' : 'border-gray-600 focus:border-emerald-400'}
              `}
              disabled={isLoading}
              aria-describedby={errors.tipoProyecto ? 'tipoProyecto-error' : undefined}
            >
              <option value="">Selecciona el tipo de proyecto</option>
              <option value="arquitectonico">Arquitectónico</option>
              <option value="industrial">Industrial</option>
              <option value="patrimonial">Patrimonial</option>
              <option value="comercial">Comercial</option>
            </select>
            {errors.tipoProyecto && (
              <p id="tipoProyecto-error" className="mt-1 text-xs text-red-400" role="alert">
                {errors.tipoProyecto}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors"
            aria-describedby="submit-hint"
          >
            {isLoading ? 'Creando...' : 'CREAR PROYECTO'}
          </button>
          <p id="submit-hint" className="sr-only">
            Presiona Enter para enviar el formulario
          </p>
        </form>
      </div>
    </div>
  );
};



