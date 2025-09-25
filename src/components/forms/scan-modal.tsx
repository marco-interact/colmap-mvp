'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const scanSchema = z.object({
  name: z.string().min(1, 'Nombre del scan requerido'),
  file: z.any().refine((file) => file && file.length > 0, 'Archivo requerido')
})

type ScanFormData = z.infer<typeof scanSchema>

interface ScanModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ScanFormData) => void
  projectId: string
}

export function ScanModal({ isOpen, onClose, onSubmit, projectId }: ScanModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema)
  })

  const handleFormSubmit = async (data: ScanFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      reset()
      setSelectedFile(null)
      onClose()
    } catch (error) {
      console.error('Failed to create scan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    onClose()
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      setValue('file', file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setValue('file', file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
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
                <h2 className="text-xl font-bold text-white font-mono">Nuevo Scan</h2>
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
                {/* Scan Name */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Nombre del Scan
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  <Input
                    {...register('name')}
                    placeholder="Scan 2"
                    className="bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Media Input */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-white font-mono text-sm font-bold">
                      Media Input
                    </label>
                    <span className="text-gray-400 text-xs font-mono">Mandatory</span>
                  </div>
                  
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                      dragActive 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-white hover:border-green-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-2">
                        <Camera className="w-12 h-12 text-green-500 mx-auto" />
                        <p className="text-white font-mono text-sm">
                          {selectedFile.name}
                        </p>
                        <p className="text-gray-400 font-mono text-xs">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-12 h-12 text-white mx-auto" />
                        <p className="text-white font-mono text-sm">
                          Agregar o seleccionar archivo aquí
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-400 text-xs mt-1 font-mono">
                    ¿Qué tipos de archivos puedo utilizar?
                  </p>
                  {errors.file && (
                    <p className="text-red-400 text-xs font-mono mt-1">{errors.file.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFile}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'GENERANDO...' : 'GENERAR SCAN'}
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}