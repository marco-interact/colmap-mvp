"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectItem } from "@/components/ui/select"
import { Modal, ModalContent, ModalFooter } from "@/components/ui/modal"
import { MapPin } from "lucide-react"

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormData) => void
}

export interface ProjectFormData {
  name: string
  description: string
  location: string
  spaceType: string
  projectType: string
}

const spaceTypes = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "mixed", label: "Mixto" },
  { value: "industrial", label: "Industrial" },
]

const projectTypes = [
  { value: "documentation", label: "Documentación" },
  { value: "inspection", label: "Inspección" },
  { value: "monitoring", label: "Monitoreo" },
  { value: "reconstruction", label: "Reconstrucción" },
  { value: "analysis", label: "Análisis" },
]

export function ProjectModal({ isOpen, onClose, onSubmit }: ProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    location: "",
    spaceType: "",
    projectType: "",
  })
  
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre del proyecto es requerido"
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida"
    }
    
    if (!formData.location.trim()) {
      newErrors.location = "La ubicación es requerida"
    }
    
    if (!formData.spaceType) {
      newErrors.spaceType = "Selecciona un tipo de espacio"
    }
    
    if (!formData.projectType) {
      newErrors.projectType = "Selecciona un tipo de proyecto"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      await onSubmit(formData)
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        location: "",
        spaceType: "",
        projectType: "",
      })
      setErrors({})
      onClose()
    } catch (error) {
      setErrors({ submit: "Error al crear el proyecto. Intenta nuevamente." })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      // Reset form when closing
      setFormData({
        name: "",
        description: "",
        location: "",
        spaceType: "",
        projectType: "",
      })
      setErrors({})
      onClose()
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Nuevo Proyecto"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit}>
        <ModalContent className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Proyecto *
            </label>
            <Input
              id="project-name"
              placeholder="Ej: Inspección Edificio Central"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={errors.name}
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-2">
              Descripción *
            </label>
            <Textarea
              id="project-description"
              placeholder="Describe el objetivo y alcance del proyecto..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              error={errors.description}
              className="w-full min-h-[100px]"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="project-location" className="block text-sm font-medium text-gray-300 mb-2">
              Ubicación *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="project-location"
                placeholder="Dirección o ubicación del proyecto"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                error={errors.location}
                className="pl-10"
              />
            </div>
          </div>

          {/* Space Type and Project Type in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Espacio *
              </label>
              <Select
                value={formData.spaceType}
                onValueChange={(value) => handleInputChange("spaceType", value)}
                placeholder="Seleccionar tipo"
                error={errors.spaceType}
              >
                {spaceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Proyecto *
              </label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => handleInputChange("projectType", value)}
                placeholder="Seleccionar tipo"
                error={errors.projectType}
              >
                {projectTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-400 text-sm">
              {errors.submit}
            </div>
          )}
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {loading ? "Creando..." : "CREAR PROYECTO"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}