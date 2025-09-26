"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  Scan,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: string
  name: string
  description: string
  location: string
  spaceType: string
  projectType: string
  createdAt: string
  status: 'active' | 'completed' | 'processing'
}

interface ScanData {
  id: string
  name: string
  projectId: string
  thumbnail?: string
  status: 'completed' | 'processing' | 'failed' | 'queued'
  location: string
  capturedAt: string
  fileSize?: string
  duration?: string
  pointCount?: number
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [scans, setScans] = useState<ScanData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    loadProjectData()
  }, [projectId, router])

  const loadProjectData = async () => {
    try {
      // Simulate API call - load project details
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Demo project data
      const demoProject: Project = {
        id: projectId,
        name: "Inspección Edificio Central",
        description: "Documentación 3D del edificio principal para análisis estructural y verificación de integridad",
        location: "Ciudad de México, CDMX",
        spaceType: "interior",
        projectType: "inspection",
        createdAt: "2024-01-15",
        status: "active"
      }
      
      // Demo scans data
      const demoScans: ScanData[] = [
        {
          id: "scan-1",
          name: "Planta Baja - Lobby Principal",
          projectId,
          thumbnail: "/api/assets/sample-scan-thumbnail.jpg",
          status: "completed",
          location: "Planta Baja, Sector A",
          capturedAt: "2024-01-20T10:30:00Z",
          fileSize: "245 MB",
          duration: "8 min",
          pointCount: 2850000
        },
        {
          id: "scan-2", 
          name: "Segundo Piso - Oficinas",
          projectId,
          status: "completed",
          location: "Segundo Piso, Sector B",
          capturedAt: "2024-01-21T14:15:00Z",
          fileSize: "189 MB",
          duration: "6 min",
          pointCount: 2100000
        },
        {
          id: "scan-3",
          name: "Azotea - Instalaciones",
          projectId,
          status: "processing",
          location: "Azotea, Sector C",
          capturedAt: "2024-01-22T09:45:00Z",
          fileSize: "156 MB",
          duration: "5 min"
        },
        {
          id: "scan-4",
          name: "Sótano - Estacionamiento",
          projectId,
          status: "queued",
          location: "Sótano, Nivel -1",
          capturedAt: "2024-01-22T16:20:00Z",
        }
      ]
      
      setProject(demoProject)
      setScans(demoScans)
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')
    }
  }

  const handleViewScan = (scanId: string) => {
    router.push(`/projects/${projectId}/scans/${scanId}`)
  }

  const getStatusIcon = (status: ScanData['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'queued': return <Clock className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getStatusText = (status: ScanData['status']) => {
    switch (status) {
      case 'completed': return 'Completado'
      case 'processing': return 'Procesando'
      case 'failed': return 'Error'
      case 'queued': return 'En cola'
      default: return 'Desconocido'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Proyecto no encontrado</h2>
          <p className="text-gray-400 mb-4">El proyecto que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              <p className="text-sm text-gray-400">{project.location}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => {/* Open scan modal */}}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Escaneo
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteProject}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Proyecto
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Project Info */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Ubicación</p>
                    <p className="text-sm text-white">{project.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Creado</p>
                    <p className="text-sm text-white">{formatDate(project.createdAt + 'T00:00:00Z')}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Scan className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Total Escaneos</p>
                    <p className="text-sm text-white">{scans.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Estado</p>
                    <p className="text-sm text-white capitalize">{project.status}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-300">{project.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scans Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Escaneos</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Escaneo
            </Button>
          </div>

          {/* Scans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scans.map((scan) => (
              <Card 
                key={scan.id}
                className="cursor-pointer hover:scale-105 transition-transform duration-200"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-800 rounded-t-xl overflow-hidden">
                  {scan.thumbnail ? (
                    <img 
                      src={scan.thumbnail} 
                      alt={scan.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Scan className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{scan.name}</CardTitle>
                    {getStatusIcon(scan.status)}
                  </div>
                  <p className="text-xs text-gray-400">{scan.location}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Estado</span>
                      <span className="text-white">{getStatusText(scan.status)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Capturado</span>
                      <span className="text-white">{formatDate(scan.capturedAt)}</span>
                    </div>
                    
                    {scan.fileSize && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Tamaño</span>
                        <span className="text-white">{scan.fileSize}</span>
                      </div>
                    )}
                    
                    {scan.pointCount && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Puntos</span>
                        <span className="text-white">{scan.pointCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {scan.status === 'completed' && (
                    <div className="flex items-center space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewScan(scan.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {scans.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Scan className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No hay escaneos</h3>
              <p className="text-gray-400 mb-6">
                Crea tu primer escaneo para comenzar la reconstrucción 3D
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Escaneo
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}