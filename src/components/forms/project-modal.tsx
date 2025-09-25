'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

const projectSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().min(1, 'Descripción requerida'),
  location: z.string().min(1, 'Ubicación requerida'),
  space_type: z.string().min(1, 'Tipo de espacio requerido'),
  project_type: z.string().min(1, 'Tipo de proyecto requerido')
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormData) => void
}

export function ProjectModal({ isOpen, onClose, onSubmit }: ProjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema)
  })

  const handleFormSubmit = async (data: ProjectFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      reset()
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white font-mono">Nuevo Proyecto</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Project Name */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Nombre
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  <Input
                    {...register('name')}
                    placeholder="Nombre del Proyecto"
                    className="bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Descripción
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  <Textarea
                    {...register('description')}
                    placeholder="Descripción del Proyecto"
                    rows={3}
                    className="bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2 resize-none"
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Ubicación
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  <Input
                    {...register('location')}
                    placeholder="Buscar Ubicación"
                    className="bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                  />
                  <p className="text-gray-400 text-xs mt-1 font-mono">¿No encuentras la ubicación?</p>
                  {errors.location && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.location.message}</p>
                  )}
                </div>

                {/* Space Type */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Tipo de Espacio
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  <Select
                    {...register('space_type')}
                    className="bg-transparent border-b border-white text-white focus:outline-none focus:border-green-500 py-2"
                  >
                    <option value="">Selecciona el tipo de espacio a escanear</option>
                    <option value="indoor">Interior</option>
                    <option value="outdoor">Exterior</option>
                    <option value="mixed">Mixto</option>
                  </Select>
                  {errors.space_type && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.space_type.message}</p>
                  )}
                </div>

                {/* Project Type */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Tipo de Proyecto
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  <Select
                    {...register('project_type')}
                    className="bg-transparent border-b border-white text-white focus:outline-none focus:border-green-500 py-2"
                  >
                    <option value="">Selecciona el tipo de proyecto</option>
                    <option value="architecture">Arquitectura</option>
                    <option value="archaeology">Arqueología</option>
                    <option value="industrial">Industrial</option>
                    <option value="cultural">Patrimonio Cultural</option>
                    <option value="research">Investigación</option>
                  </Select>
                  {errors.project_type && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.project_type.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'CREANDO...' : 'CREAR PROYECTO'}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}