'use client'

import { useState } from 'react'

interface ScanModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
  projectId: string
}

export function ScanModal({ onClose, onSubmit, projectId }: ScanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    file: null as File | null
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await onSubmit({ ...formData, projectId })
    } catch (error) {
      console.error('Failed to create scan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, file })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white font-mono mb-6">Nuevo Proyecto</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Scan Name */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Nombre del Scan
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Scan 2"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                required
              />
            </div>
            
            {/* Media Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-white font-mono text-sm font-bold">
                  Media Input
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-white rounded-lg p-8 text-center">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-white font-mono text-sm mb-2">Agregar o seleccionar archivo aquí</p>
                  <input
                    type="file"
                    accept="video/*,.mp4,.mov,.avi"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    required
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-mono font-bold px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Seleccionar Archivo
                  </label>
                </div>
              </div>
              
              <p className="text-gray-400 text-xs mt-2 font-mono">¿Qué tipos de archivos puedo utilizar?</p>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.file}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'GENERANDO...' : 'GENERAR SCAN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
