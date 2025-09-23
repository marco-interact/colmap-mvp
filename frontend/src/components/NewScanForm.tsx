// components/NewScanForm.tsx
// Modal form for creating new scans with file upload functionality
// Includes drag and drop support and file validation

import React, { useState, useRef } from 'react';
import { X, Upload, File, AlertCircle } from 'lucide-react';

interface NewScanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScanFormData) => void;
  isLoading?: boolean;
}

interface ScanFormData {
  nombre: string;
  mediaFile: File | null;
}

export const NewScanForm: React.FC<NewScanFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ScanFormData>({
    nombre: '',
    mediaFile: null
  });

  const [errors, setErrors] = useState<{
    nombre?: string;
    mediaFile?: string;
  }>({});

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ScanFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing/uploading
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/quicktime',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (file.size > maxSize) {
      return 'El archivo no puede ser mayor a 100MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Formato no válido. Use MP4, AVI, MOV, JPG o PNG';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, mediaFile: error }));
      return;
    }

    handleInputChange('mediaFile', file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { nombre?: string; mediaFile?: string } = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del scan es obligatorio';
    }
    
    if (!formData.mediaFile) {
      newErrors.mediaFile = 'Debe seleccionar un archivo';
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
      mediaFile: null
    });
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-scan-title"
    >
      <div className="w-full max-w-md bg-gray-900 rounded-xl shadow-lg border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 id="new-scan-title" className="text-xl font-bold text-white">
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
          {/* Nombre del Scan */}
          <div>
            <label htmlFor="nombre-scan" className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Nombre del Scan <span className="text-red-400">Mandatory</span>
            </label>
            <input
              id="nombre-scan"
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={`
                w-full text-sm text-gray-300 bg-transparent border-b pb-2 focus:outline-none transition-colors
                ${errors.nombre ? 'border-red-400' : 'border-gray-600 focus:border-emerald-400'}
              `}
              placeholder="Scan 2"
              disabled={isLoading}
              aria-describedby={errors.nombre ? 'nombre-scan-error' : undefined}
            />
            {errors.nombre && (
              <p id="nombre-scan-error" className="mt-1 text-xs text-red-400" role="alert">
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Media Input */}
          <div>
            <label className="block text-sm uppercase text-gray-300 font-medium mb-2">
              Media Input <span className="text-red-400">Mandatory</span>
            </label>
            
            {/* File Upload Area */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive 
                  ? 'border-emerald-400 bg-emerald-400 bg-opacity-5' 
                  : errors.mediaFile 
                    ? 'border-red-400' 
                    : 'border-gray-600 hover:border-gray-500'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept="video/*,image/*"
                className="sr-only"
                id="media-file"
                disabled={isLoading}
                aria-describedby="media-hint"
              />

              {formData.mediaFile ? (
                /* File Selected State */
                <div className="space-y-3">
                  <File className="w-12 h-12 text-emerald-400 mx-auto" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-white truncate">
                      {formData.mediaFile.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(formData.mediaFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('mediaFile', null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-white underline"
                    disabled={isLoading}
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                /* Empty State */
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-500 mx-auto" aria-hidden="true" />
                  <div>
                    <label 
                      htmlFor="media-file"
                      className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                    >
                      Agregar o seleccionar archivo aquí
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      o arrastra y suelta
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errors.mediaFile && (
              <div className="mt-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-red-400" role="alert">
                  {errors.mediaFile}
                </p>
              </div>
            )}

            <p id="media-hint" className="mt-2 text-xs text-gray-500">
              ¿Qué tipos de archivos puedo utilizar?
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Generando...' : 'GENERAR SCAN'}
          </button>
        </form>
      </div>
    </div>
  );
};



