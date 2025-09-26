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
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Scan {
  id: string
  name: string
  projectId: string
  projectName: string
  status: 'completed' | 'processing' | 'failed'
  location: string
  updated: string
  fileSize?: string
  processingTime?: string
  pointCount?: number
}

// Simple 3D Viewer Component (placeholder for now)
function Simple3DViewer({ className }: { className?: string }) {
  const [viewMode, setViewMode] = useState<'pointcloud' | 'mesh'>('pointcloud')
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* 3D Viewer Area */}
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        {/* Placeholder 3D content */}
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-400 to-blue-500 rounded-lg flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-lg transform rotate-45"></div>
          </div>
          <p className="text-gray-400">3D Model Preview</p>
          <p className="text-gray-500 text-sm">Point Cloud • 2.8M points</p>
        </div>
      </div>

      {/* 3D Viewer Controls */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setViewMode(viewMode === 'pointcloud' ? 'mesh' : 'pointcloud')}
          className="bg-gray-800/80 hover:bg-gray-700"
        >
          {viewMode === 'pointcloud' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          className="bg-gray-800/80 hover:bg-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-gray-800/80 hover:bg-gray-700"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-gray-800/80 px-3 py-1 rounded-lg">
          <span className="text-white text-sm capitalize">{viewMode} View</span>
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
  }, [projectId, scanId, router])

  const loadScanData = () => {
    // Demo scan data
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
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-400">Colmap App</h1>
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
        <header className="border-b border-gray-800 bg-gray-900/50">
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
              <h1 className="text-2xl font-bold text-white">
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
            </div>
          </div>
        </header>

        {/* Main Viewer Area */}
        <div className="flex-1 flex">
          {/* 3D Viewer */}
          <div className="flex-1 p-6">
            <Simple3DViewer className="w-full h-full min-h-[600px]" />
          </div>

          {/* Sidebar Info Panel */}
          <aside className="w-80 border-l border-gray-800 bg-gray-900/50 p-6">
            <div className="space-y-6">
              {/* Scan Information */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Scan Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Project</p>
                      <p className="text-sm text-white">{scan.projectName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm text-white">{scan.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Updated</p>
                      <p className="text-sm text-white">{scan.updated}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          scan.status === 'completed' ? 'bg-green-500' :
                          scan.status === 'processing' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-white capitalize">{scan.status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">File Size</span>
                      <span className="text-sm text-white">{scan.fileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Processing Time</span>
                      <span className="text-sm text-white">{scan.processingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Point Count</span>
                      <span className="text-sm text-white">
                        {scan.pointCount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Quality</span>
                      <span className="text-sm text-white">High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Options */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Downloads</h3>
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
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}