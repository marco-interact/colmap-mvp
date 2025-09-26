"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Info,
  Calendar,
  MapPin,
  Clock,
  HardDrive,
  Scan,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModelViewer } from "@/components/3d/model-viewer"

interface ScanData {
  id: string
  name: string
  projectId: string
  projectName: string
  status: 'completed' | 'processing' | 'failed' | 'queued'
  location: string
  capturedAt: string
  fileSize: string
  duration: string
  pointCount: number
  meshUrl?: string
  pointCloudUrl?: string
  thumbnailUrl?: string
  description?: string
  cameraPositions?: number
  processingTime?: string
  accuracy?: string
}

export default function ScanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const scanId = params.scanId as string
  
  const [scan, setScan] = useState<ScanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    loadScanData()
  }, [projectId, scanId, router])

  const loadScanData = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Demo scan data
      const demoScan: ScanData = {
        id: scanId,
        name: "Planta Baja - Lobby Principal",
        projectId,
        projectName: "Inspección Edificio Central",
        status: "completed",
        location: "Planta Baja, Sector A",
        capturedAt: "2024-01-20T10:30:00Z",
        fileSize: "245 MB",
        duration: "8 min",
        pointCount: 2850000,
        description: "Escaneo completo del lobby principal incluyendo recepción, área de espera y accesos principales. Capturado con alta resolución para análisis detallado de la estructura.",
        cameraPositions: 48,
        processingTime: "15 min",
        accuracy: "±2mm",
        meshUrl: "/models/sample.ply",
        pointCloudUrl: "/pointclouds/sample.las",
        thumbnailUrl: "/api/assets/sample-scan-thumbnail.jpg"
      }
      
      setScan(demoScan)
    } catch (error) {
      console.error('Error loading scan:', error)
    } finally {
      setLoading(false)
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

  const handleDownload = (type: 'mesh' | 'pointcloud' | 'all') => {
    // Implement download functionality
    console.log(`Downloading ${type}`)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: scan?.name,
        text: `Mira este escaneo 3D: ${scan?.name}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando escaneo...</p>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Escaneo no encontrado</h2>
          <p className="text-gray-400 mb-4">El escaneo que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push(`/projects/${projectId}`)}>
            Volver al Proyecto
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
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{scan.name}</h1>
              <p className="text-sm text-gray-400">{scan.projectName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-4 h-4 mr-2" />
              {showInfo ? "Ocultar Info" : "Mostrar Info"}
            </Button>
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
            
            <Button onClick={() => handleDownload('all')}>
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <ModelViewer 
            modelUrl={scan.meshUrl}
            pointCloudUrl={scan.pointCloudUrl}
            className="h-full w-full"
            showControls={true}
          />
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="w-80 border-l border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Escaneo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Ubicación</p>
                        <p className="text-sm text-white">{scan.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Capturado</p>
                        <p className="text-sm text-white">{formatDate(scan.capturedAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Duración</p>
                        <p className="text-sm text-white">{scan.duration}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <HardDrive className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Tamaño</p>
                        <p className="text-sm text-white">{scan.fileSize}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalles Técnicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Puntos</p>
                      <p className="text-sm text-white font-medium">
                        {scan.pointCount.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400">Precisión</p>
                      <p className="text-sm text-white font-medium">{scan.accuracy}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400">Posiciones</p>
                      <p className="text-sm text-white font-medium">{scan.cameraPositions}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400">Procesamiento</p>
                      <p className="text-sm text-white font-medium">{scan.processingTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {scan.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descripción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {scan.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Downloads */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Descargas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleDownload('mesh')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Malla 3D (.ply)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleDownload('pointcloud')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Nube de Puntos (.las)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleDownload('all')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Todo (.zip)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
