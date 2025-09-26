"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Plus, 
  Trash2, 
  Clock,
  Settings,
  HelpCircle,
  Camera,
  Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Modal, ModalContent, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"

interface Project {
  id: string
  name: string
  description: string
  location: string
  updated: string
  status: 'active' | 'completed' | 'processing'
}

interface Scan {
  id: string
  name: string
  projectId: string
  projectName: string
  thumbnail?: string
  status: 'completed' | 'processing' | 'failed' | 'queued'
  location: string
  updated: string
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isNewScanModalOpen, setIsNewScanModalOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [newScan, setNewScan] = useState({
    name: "",
    file: null as File | null
  })
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

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

    loadProjectData()
  }, [projectId, router])

  const loadProjectData = async () => {
    // Demo project data
    const demoProject: Project = {
      id: projectId,
      name: `Demo Project ${projectId}`,
      description: "Render scan for construction site",
      location: "Monterrey",
      updated: "26-08-2025",
      status: "active"
    }
    
    // Demo scans data
    const demoScans: Scan[] = [
      {
        id: "scan-1",
        name: "Demo Scan 1",
        projectId,
        projectName: demoProject.name,
        status: "completed",
        location: "Monterrey",
        updated: "26-08-2025"
      }
    ]
    
    setProject(demoProject)
    setScans(demoScans)
  }

  const handleFileSelect = (file: File) => {
    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024 // 500MB in bytes
    if (file.size > maxSize) {
      alert('File size must be under 500MB')
      return
    }

    // Validate file type (MP4 only for MVP)
    if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
      alert('Only MP4 video files are supported')
      return
    }

    setNewScan(prev => ({ ...prev, file }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleCreateScan = async () => {
    if (!newScan.name.trim() || !newScan.file) return

    setIsUploading(true)
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const scan: Scan = {
      id: Date.now().toString(),
      name: newScan.name,
      projectId,
      projectName: project?.name || "",
      status: "processing",
      location: project?.location || "",
      updated: new Date().toLocaleDateString('en-GB')
    }
    
    setScans(prev => [scan, ...prev])
    setNewScan({ name: "", file: null })
    setIsNewScanModalOpen(false)
    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleDeleteProject = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      router.push('/dashboard')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
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
      <main className="flex-1">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between px-8 py-6">
            <h1 className="text-2xl font-bold text-white">
              {project.name} &gt; Scans
            </h1>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="destructive"
                onClick={handleDeleteProject}
                className="bg-gray-700 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                DELETE PROJECT
              </Button>
              
              <Button 
                onClick={() => setIsNewScanModalOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW SCAN
              </Button>
            </div>
          </div>
        </header>

        {/* Scans Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scans.map((scan) => (
              <Card 
                key={scan.id}
                className="cursor-pointer hover:scale-105 transition-transform duration-200 bg-gray-900/50 border-gray-800"
                onClick={() => router.push(`/projects/${projectId}/scans/${scan.id}`)}
              >
                {/* Scan Thumbnail */}
                <div className="aspect-[4/3] bg-gray-800 rounded-t-xl overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    {/* 3D Model Preview */}
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <Camera className="w-10 h-10 text-primary-400" />
                    </div>
                  </div>
                </div>

                {/* Scan Info */}
                <CardContent className="p-4 bg-gray-900">
                  <div className="text-xs text-gray-400 mb-1">
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    Updated: {scan.updated}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {scan.name}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <div className="w-3 h-3 mr-1">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    {scan.location}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      scan.status === 'completed' ? 'bg-green-500' :
                      scan.status === 'processing' ? 'bg-yellow-500' :
                      scan.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-xs text-gray-400 capitalize">
                      {scan.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {scans.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                No scans yet
              </h3>
              <p className="text-gray-400 mb-6">
                Upload your first 360° video to start 3D reconstruction
              </p>
              <Button 
                onClick={() => setIsNewScanModalOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Scan
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* New Scan Modal */}
      <Modal 
        isOpen={isNewScanModalOpen} 
        onClose={() => setIsNewScanModalOpen(false)}
        title="New Scan"
        className="max-w-2xl"
      >
        <ModalContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scan Name <span className="text-red-400">Mandatory</span>
            </label>
            <Input
              placeholder="Scan 2"
              value={newScan.name}
              onChange={(e) => setNewScan(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-800 border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Media Input <span className="text-red-400">Mandatory</span>
            </label>
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {newScan.file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-primary-500 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-medium">{newScan.file.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatFileSize(newScan.file.size)} • MP4 Video
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewScan(prev => ({ ...prev, file: null }))}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 mx-auto bg-gray-700 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white mb-2">Agregar o seleccionar archivo aquí</p>
                    <p className="text-gray-400 text-sm">
                      Maximum file size: 500MB • Supported format: MP4
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".mp4,video/mp4"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              ¿Qué tipos de archivos puedo utilizar?
            </p>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Uploading...</span>
                <span className="text-gray-300">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </ModalContent>

        <ModalFooter>
          <Button
            onClick={handleCreateScan}
            disabled={!newScan.name.trim() || !newScan.file || isUploading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50"
          >
            {isUploading ? 'PROCESSING...' : 'GENERATE SCAN'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}