'use client'

import { useState } from 'react'

interface ProjectModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
}

export function ProjectModal({ onClose, onSubmit }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    space_type: '',
    project_type: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white font-mono mb-6">Nuevo Proyecto</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Nombre
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del Proyecto"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                required
              />
            </div>
            
            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Descripción
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del Proyecto"
                rows={3}
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2 resize-none"
                required
              />
            </div>
            
            {/* Location */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Ubicación
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Buscar Ubicación"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                required
              />
              <p className="text-gray-400 text-xs mt-1 font-mono">¿No encuentras la ubicación?</p>
            </div>
            
            {/* Space Type */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Tipo de Espacio
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <select
                value={formData.space_type}
                onChange={(e) => setFormData({ ...formData, space_type: e.target.value })}
                className="w-full bg-transparent border-b border-white text-white focus:outline-none focus:border-green-500 py-2"
                required
              >
                <option value="">Selecciona el tipo de espacio a escanear</option>
                <option value="indoor">Interior</option>
                <option value="outdoor">Exterior</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>
            
            {/* Project Type */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Tipo de Proyecto
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full bg-transparent border-b border-white text-white focus:outline-none focus:border-green-500 py-2"
                required
              >
                <option value="">Selecciona el tipo de proyecto</option>
                <option value="architecture">Arquitectura</option>
                <option value="archaeology">Arqueología</option>
                <option value="industrial">Industrial</option>
                <option value="cultural">Patrimonio Cultural</option>
                <option value="research">Investigación</option>
              </select>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'CREANDO...' : 'CREAR PROYECTO'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}