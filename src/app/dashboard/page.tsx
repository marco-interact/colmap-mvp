"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Grid3x3, List, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProjectModal, ProjectFormData } from "@/components/forms/project-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: string
  name: string
  description: string
  location: string
  spaceType: string
  projectType: string
  scanCount: number
  lastUpdate: string
  thumbnail?: string
  status: 'active' | 'completed' | 'processing'
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [userEmail, setUserEmail] = useState("")

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const email = localStorage.getItem('user_email')
    
    if (!token) {
      router.push('/auth/login')
      return
    }
    
    setUserEmail(email || "")
    
    // Load demo projects
    loadDemoProjects()
  }, [router])

  const loadDemoProjects = () => {
    const demoProjects: Project[] = [
      {
        id: "1",
        name: "Inspección Edificio Central",
        description: "Documentación 3D del edificio principal para análisis estructural",
        location: "Ciudad de México, CDMX",
        spaceType: "interior",
        projectType: "inspection",
        scanCount: 12,
        lastUpdate: "Hace 2 días",
        status: "active",
        thumbnail: "/api/assets/sample-scan-thumbnail.jpg"
      },
      {
        id: "2", 
        name: "Planta Industrial Norte",
        description: "Reconstrucción 3D completa de la planta de producción",
        location: "Monterrey, NL",
        spaceType: "industrial",
        projectType: "reconstruction",
        scanCount: 8,
        lastUpdate: "Hace 1 semana",
        status: "processing",
      },
      {
        id: "3",
        name: "Centro Histórico",
        description: "Monitoreo de fachadas históricas para conservación",
        location: "Puebla, PUE",
        spaceType: "exterior",
        projectType: "monitoring",
        scanCount: 24,
        lastUpdate: "Hace 3 días",
        status: "completed",
      }
    ]
    
    setProjects(demoProjects)
  }

  const handleCreateProject = async (data: ProjectFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newProject: Project = {
      id: Date.now().toString(),
      ...data,
      scanCount: 0,
      lastUpdate: "Ahora",
      status: "active"
    }
    
    setProjects(prev => [newProject, ...prev])
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
    router.push('/auth/login')
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-primary-500'
      case 'processing': return 'bg-yellow-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'processing': return 'Procesando'
      case 'completed': return 'Completado'
      default: return 'Desconocido'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-xl font-bold text-white">COLMAP Workspace</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{userEmail}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Proyectos</h2>
            <p className="text-gray-400">Administra tus proyectos de reconstrucción 3D</p>
          </div>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-800 rounded-t-xl overflow-hidden">
                {project.thumbnail ? (
                  <img 
                    src={project.thumbnail} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Grid3x3 className="w-8 h-8 text-gray-500" />
                    </div>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getStatusColor(project.status)
                  )} />
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                  {project.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{project.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {project.scanCount} escaneos
                    </span>
                    <span className="text-gray-400">
                      {project.lastUpdate}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs">
                    <span className={cn(
                      "px-2 py-1 rounded-full",
                      getStatusColor(project.status),
                      "text-white"
                    )}>
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Grid3x3 className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? "No se encontraron proyectos" : "No hay proyectos"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery 
                ? "Intenta con otros términos de búsqueda" 
                : "Crea tu primer proyecto para comenzar"
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Proyecto
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}

// Utility function for className concatenation
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}