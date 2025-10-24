"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft,
  Download,
  Settings,
  HelpCircle,
  Clock,
  RotateCcw,
  Maximize2,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProcessingStatus } from "@/components/processing-status"
import { SimpleViewer } from "@/components/3d/simple-viewer"
import { Open3DTools } from "@/components/3d/open3d-tools"
import { apiClient } from "@/lib/api"

interface Scan {
  id: string
  name: string
  projectId: string
  projectName: string
  status: 'completed' | 'processing' | 'failed' | 'pending'
  location: string
  updated: string
  fileSize?: string
  processingTime?: string
  pointCount?: number
  technicalDetails?: {
    point_count: number
    camera_count: number
    feature_count: number
    processing_time: string
    resolution: string
    file_size: string
    reconstruction_error: string
    coverage: string
  }
  processingStages?: Array<{
    name: string
    status: string
    duration: string
    frames_extracted?: number
    features_detected?: number
    matches?: number
    points?: number
  }>
}

// Enhanced 3D Viewer Component with Three.js
function Enhanced3DViewer({ className, scan }: { className?: string, scan: Scan }) {
  const [viewMode, setViewMode] = useState<'pointcloud' | 'mesh'>('pointcloud')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const resetCamera = () => {
    // Camera reset will be handled by Three.js controls
    console.log('Resetting camera view')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('3d-viewer')?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  // Determine the 3D model URL
  const getModelUrl = () => {
    // Priority 1: Use actual reconstruction results if available
    if (scan.results?.pointCloudUrl) {
      console.log('✅ Using actual reconstruction PLY:', scan.results.pointCloudUrl)
      return `http://localhost:8000${scan.results.pointCloudUrl}`
    }
    
    // Priority 2: Check technical_details for results
    if ((scan as any).technical_details?.results?.point_cloud_url) {
      console.log('✅ Using reconstruction PLY from technical_details:', (scan as any).technical_details.results.point_cloud_url)
      return `http://localhost:8000${(scan as any).technical_details.results.point_cloud_url}`
    }
    
    // Priority 3: Fallback to demo models based on scan name
    console.warn('⚠️ No reconstruction PLY found, using demo fallback for:', scan.name)
    if (scan.name?.toLowerCase().includes('dollhouse')) {
      return 'http://localhost:8000/demo-resources/demoscan-dollhouse/fvtc_firstfloor_processed.ply'
    }
    if (scan.name?.toLowerCase().includes('facade') || scan.name?.toLowerCase().includes('fachada')) {
      return 'http://localhost:8000/demo-resources/demoscan-fachada/1mill.ply'
    }
    
    // Priority 4: Default fallback
    return 'http://localhost:8000/demo-resources/demoscan-dollhouse/fvtc_firstfloor_processed.ply'
  }
  
  // Check if showing demo fallback
  const isShowingDemo = !scan.results?.pointCloudUrl && !(scan as any).technical_details?.results?.point_cloud_url

  return (
    <div id="3d-viewer" className={`relative bg-[#000] rounded-lg overflow-hidden ${className}`}>
      {/* 3D Canvas Area */}
      <div className="w-full h-full bg-[#000] flex items-center justify-center">
        {scan.status === 'completed' ? (
          <div className="relative w-full h-full">
            {/* Show demo fallback warning */}
            {isShowingDemo && (
              <div className="absolute top-4 left-4 z-10 bg-yellow-500/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">
                ⚠️ Showing demo model - Re-upload to generate actual 3D reconstruction
              </div>
            )}
            {/* Show actual 3D viewer when completed */}
            <SimpleViewer 
              modelUrl={getModelUrl()}
              className="w-full h-full" 
            />
          </div>
        ) : scan.status === 'processing' ? (
          // Show processing indicator with progress bar
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-lg flex items-center justify-center relative">
              <div className="w-16 h-16 bg-white/20 rounded-lg animate-spin"></div>
              <div className="absolute inset-0 border-2 border-yellow-300/50 rounded-lg animate-pulse"></div>
            </div>
            <p className="text-yellow-400 font-medium">Processing Video</p>
            <p className="text-gray-400 text-sm">COLMAP reconstruction in progress...</p>
            <div className="w-48 bg-gray-700 rounded-full h-2 mx-auto">
              <div className="bg-yellow-400 h-2 rounded-full w-3/4 animate-pulse"></div>
            </div>
            <ProcessingStatus
              scanId={scan.id}
              status="processing"
              progress={75}
              message="Feature extraction and matching in progress..."
              className="mt-4"
            />
          </div>
        ) : scan.status === 'failed' ? (
          // Show error state
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
            </div>
            <p className="text-red-400 font-medium">Processing Failed</p>
            <p className="text-gray-400 text-sm">Unable to reconstruct 3D model</p>
            <Button variant="outline" size="sm">
              Retry Processing
            </Button>
          </div>
        ) : (
          // Show queued state
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
            </div>
            <p className="text-gray-400 font-medium">Pending Processing</p>
            <p className="text-gray-500 text-sm">Waiting to start reconstruction...</p>
          </div>
        )}
      </div>

      {/* 3D Viewer Controls */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setViewMode(viewMode === 'pointcloud' ? 'mesh' : 'pointcloud')}
          className="bg-gray-800/80 hover:bg-gray-700"
          disabled={scan.status !== 'completed'}
        >
          {viewMode === 'pointcloud' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={resetCamera}
          className="bg-gray-800/80 hover:bg-gray-700"
          disabled={scan.status !== 'completed'}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-gray-800/80 hover:bg-gray-700"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-gray-800/80 px-3 py-1 rounded-lg">
          <span className="text-white text-sm capitalize">
            {scan.status === 'completed' ? `${viewMode} View` : `Status: ${scan.status}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ScanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const scanId = params.scanId as string
  
  const [scan, setScan] = useState<Scan | null>(null)
  const [userName, setUserName] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const email = localStorage.getItem('user_email')
    
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Extract name from email
    if (email) {
      const name = email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' '))
    }

    loadScanData()
  }, [router])

  const handleDeleteScan = async () => {
    if (!confirm(`Are you sure you want to delete "${scan?.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/backend/scans/${scanId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Redirect back to project page
        router.push(`/projects/${projectId}`)
      } else {
        alert('Failed to delete scan')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete scan')
    } finally {
      setDeleting(false)
    }
  }

  const loadScanData = async () => {
    try {
      // Try to get real scan details from API
      const scanDetails = await apiClient.getScanDetails(scanId)
      
      // Transform API response to our Scan interface
      const scan: Scan = {
        id: scanDetails.id,
        name: scanDetails.name,
        projectId,
        projectName: `Project ${projectId}`,
        status: scanDetails.status,
        location: "Monterrey", // Default location
        updated: new Date(scanDetails.created_at || Date.now()).toLocaleDateString('en-GB'),
        fileSize: scanDetails.technical_details?.file_size || "245 MB",
        processingTime: scanDetails.technical_details?.processing_time || "18 minutes",
        pointCount: scanDetails.technical_details?.point_count || 2850000,
        technicalDetails: {
          ...scanDetails.technical_details,
          results: scanDetails.results  // Include results from API
        },
        processingStages: scanDetails.processing_stages,
        results: scanDetails.results ? {
          pointCloudUrl: scanDetails.results.point_cloud_url,
          meshUrl: scanDetails.results.mesh_url,
          thumbnailUrl: scanDetails.results.thumbnail_url
        } : undefined
      }
      
      console.log('Loaded scan with results:', scan.results)
      setScan(scan)
    } catch (error) {
      console.error('Failed to load scan data:', error)
      
      // Fallback to demo scan data
      const demoScan: Scan = {
        id: scanId,
        name: `Demo Scan ${scanId}`,
        projectId,
        projectName: `Demo Project ${projectId}`,
        status: "completed",
        location: "Monterrey",
        updated: "26-08-2025",
        fileSize: "245 MB",
        processingTime: "18 minutes",
        pointCount: 2850000
      }
      
      setScan(demoScan)
    }
  }

  const handleDownload = (format: 'ply' | 'obj' | 'glb') => {
    // In production, this would trigger actual file download
    alert(`Downloading ${format.toUpperCase()} file...`)
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading scan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#000] border-r border-gray-700/30 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-400 font-mono">Colmap App</h1>
        </div>

        {/* User Profile */}
        <div className="px-6 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-white">
              {userName.substring(0, 2).toUpperCase() || "CM"}
            </div>
            <span className="text-sm text-gray-300">{userName || "Carlos Martinez"}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center px-4 py-2 text-sm text-white bg-primary-500 rounded-lg"
              >
                <div className="w-4 h-4 mr-3 bg-white rounded-sm"></div>
                My Projects
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <Clock className="w-4 h-4 mr-3" />
                Recent
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <HelpCircle className="w-4 h-4 mr-3" />
                Help
              </button>
            </li>
          </ul>
        </nav>

        {/* Bottom Version */}
        <div className="p-6">
          <span className="text-xs text-gray-500">Demo Version</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-700/30 bg-[#000]">
          <div className="flex items-center justify-between px-8 py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Scans
              </Button>
              <h1 className="text-2xl font-bold text-white font-mono">
                {scan.name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => handleDownload('ply')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline"
                onClick={handleDeleteScan}
                disabled={deleting}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Viewer Area */}
        <div className="flex-1 flex">
          {/* 3D Viewer */}
          <div className="flex-1 p-6">
            <Enhanced3DViewer scan={scan} className="w-full h-full min-h-[600px]" />
          </div>

          {/* Sidebar Info Panel */}
          <aside className="w-80 border-l border-gray-700/30 bg-[#111] p-6">
            <div className="space-y-6">
              {/* Scan Information */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 font-mono">Scan Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Project</p>
                      <p className="text-sm text-white font-mono">{scan.projectName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm text-white font-mono">{scan.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Updated</p>
                      <p className="text-sm text-white font-mono">{scan.updated}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          scan.status === 'completed' ? 'bg-green-500' :
                          scan.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-white capitalize font-mono">{scan.status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 font-mono">Technical Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">File Size</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.file_size || scan.fileSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Processing Time</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.processing_time || scan.processingTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Point Count</span>
                      <span className="text-sm text-white font-mono">
                        {(scan.technicalDetails?.point_count || scan.pointCount)?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Camera Count</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.camera_count || 24}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Feature Count</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.feature_count?.toLocaleString() || "892K"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Resolution</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.resolution || "1920x1080"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Coverage</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.coverage || "94.2%"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Error</span>
                      <span className="text-sm text-white font-mono">
                        {scan.technicalDetails?.reconstruction_error || "0.42px"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Stages */}
              {scan.processingStages && scan.processingStages.length > 0 && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-white mb-4 font-mono">Processing Stages</h3>
                    <div className="space-y-3">
                      {scan.processingStages.map((stage, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              stage.status === 'completed' ? 'bg-green-500' : 
                              stage.status === 'processing' ? 'bg-yellow-500' : 
                              'bg-gray-500'
                            }`} />
                            <span className="text-sm text-white font-mono">{stage.name}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{stage.duration}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Download Options */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 font-mono">Downloads</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleDownload('ply')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Point Cloud (.ply)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleDownload('obj')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Mesh (.obj)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleDownload('glb')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      3D Model (.glb)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Open3D Tools */}
              {scan.status === 'completed' && (
                <Open3DTools 
                  scanId={scanId}
                  onStatsUpdate={(stats) => {
                    console.log('Point cloud stats updated:', stats)
                  }}
                  onImageGenerated={(imageUrl) => {
                    console.log('High-res image generated:', imageUrl)
                    // You could show a modal or download the image
                  }}
                  onMeshGenerated={(meshUrl) => {
                    console.log('Mesh generated:', meshUrl)
                    // You could update the 3D viewer with the new mesh
                  }}
                />
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}