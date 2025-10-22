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
  Upload,
  RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Modal, ModalContent, ModalFooter } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { apiClient, localStorage as apiStorage, validateVideoFile, formatFileSize, isDemoMode, type Project as APIProject, type Scan as APIScan } from "@/lib/api"

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
  status: 'completed' | 'processing' | 'failed' | 'pending'
  location: string
  updated: string
  fileSize?: string
  processingTime?: string
  pointCount?: number
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
    file: null as File | null,
    quality: "medium" as "low" | "medium" | "high"
  })
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<Record<string, { progress: number; stage: string }>>({})
  const [activeJobIds, setActiveJobIds] = useState<Record<string, string>>({})

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

    // Reload data when page becomes visible (fixes disappearing scans)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadProjectData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [projectId, router])

  const loadProjectData = async () => {
    try {
      // Load project from API
      const projectData = await apiClient.getProject(projectId)
      if (projectData) {
        setProject({
          id: projectData.id,
          name: projectData.name,
          description: projectData.description || "",
          location: projectData.location || "",
          updated: new Date(projectData.updated_at || projectData.created_at).toLocaleDateString(),
          status: projectData.status as 'active' | 'completed' | 'processing'
        })
      }
      
      // Load scans from API
      const scansData = await apiClient.getScans(projectId)
      if (scansData && scansData.scans) {
        const formattedScans: Scan[] = scansData.scans.map((scan: any) => ({
          id: scan.id,
          name: scan.name,
          projectId: scan.project_id,
          projectName: projectData?.name || "",
          thumbnail: `/api/backend/api/scans/${scan.id}/thumbnail.jpg`,
          status: scan.status as 'completed' | 'processing' | 'failed' | 'pending',
          location: projectData?.location || "",
          updated: new Date(scan.updated_at || scan.created_at).toLocaleDateString(),
          fileSize: scan.video_size ? formatFileSize(scan.video_size) : undefined,
          processingTime: scan.processing_time_seconds ? `${scan.processing_time_seconds}s` : undefined,
          pointCount: scan.point_count
        }))
        setScans(formattedScans)

        // Resume polling for any processing scans
        formattedScans.forEach(scan => {
          if (scan.status === 'processing' || scan.status === 'pending') {
            // Check if we have a job ID for this scan
            const jobId = activeJobIds[scan.id] || scan.id // Use scan ID as fallback
            console.log(`🔄 Resuming polling for scan ${scan.name} (${scan.id})`)
            trackProcessingStatus(scan.id, jobId)
          }
        })
      }
    } catch (error) {
      console.error('Error loading project data:', error)
    }
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

    // Validate file before upload
    const validation = validateVideoFile(newScan.file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setIsUploading(true)
    
    try {
      // Upload video to COLMAP worker (or simulate in demo mode)
      if (isDemoMode()) {
        // Demo mode - simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i)
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        // Create demo scan with processing job
        const jobId = `demo-job-${Date.now()}`
        const scan: Scan = {
          id: Date.now().toString(),
          name: newScan.name,
          projectId,
          projectName: project?.name || "",
          status: "processing",
          location: project?.location || "",
          updated: new Date().toLocaleDateString('en-GB'),
          fileSize: formatFileSize(newScan.file.size)
        }
        
        // Save to localStorage for demo
        const existingScans = apiStorage.getScans()
        const updatedScans = [scan, ...existingScans]
        apiStorage.saveScans(updatedScans)
        setScans(prev => [scan, ...prev])
        
        // Start processing status tracking
        trackProcessingStatus(scan.id, jobId)
      } else {
        // Real API upload with user email and quality setting
        const userEmail = localStorage.getItem('user_email') || 'demo@colmap.app'
        
        // Simulate upload progress
        setUploadProgress(30)
        await new Promise(resolve => setTimeout(resolve, 500))
        setUploadProgress(60)
        
        const result = await apiClient.uploadVideo(newScan.file, projectId, newScan.name, userEmail)
        
        setUploadProgress(100)
        
        const scan: Scan = {
          id: result.scanId,
          name: newScan.name,
          projectId,
          projectName: project?.name || "",
          status: "pending",
          location: project?.location || "",
          updated: new Date().toLocaleDateString('en-GB'),
          fileSize: formatFileSize(newScan.file.size)
        }
        
        setScans(prev => [scan, ...prev])
        
        // Store job ID for this scan
        setActiveJobIds(prev => ({ ...prev, [scan.id]: result.jobId }))
        
        // Start polling for status updates
        trackProcessingStatus(scan.id, result.jobId)
        
        // Show success message
        console.log('✅ Upload successful! Processing started...')
        console.log(`Job ID: ${result.jobId}, Scan ID: ${result.scanId}`)
      }
      
      setNewScan({ name: "", file: null, quality: "medium" })
      setIsNewScanModalOpen(false)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Track processing status with real-time updates
  const trackProcessingStatus = (scanId: string, jobId: string) => {
    const pollStatus = async () => {
      try {
        const status = await apiClient.getJobStatus(jobId)
        
        // Update processing status for progress display
        setProcessingStatus(prev => ({
          ...prev,
          [scanId]: {
            progress: status.progress,
            stage: status.currentStage
          }
        }))
        
        // Update scan status
        setScans(prev => prev.map(scan => 
          scan.id === scanId ? {
            ...scan,
            status: status.status === 'completed' ? 'completed' : 
                   status.status === 'failed' ? 'failed' : 'processing',
            processingTime: status.status === 'completed' ? 
              `${Math.round((Date.now() - new Date(status.createdAt).getTime()) / 60000)} minutes` : undefined,
            pointCount: status.results?.point_count_url ? 
              parseInt(status.results.point_count_url) || undefined : undefined
          } : scan
        ))
        
        // Log progress
        console.log(`📊 Processing ${scanId}: ${status.progress}% - ${status.currentStage}`)
        
        // Continue polling if still processing
        if (status.status === 'processing' || status.status === 'pending') {
          setTimeout(pollStatus, 5000) // Poll every 5 seconds
        } else if (status.status === 'completed') {
          console.log('✅ Processing completed!', status.results)
          // Clean up processing status
          setProcessingStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[scanId]
            return newStatus
          })
        } else if (status.status === 'failed') {
          console.error('❌ Processing failed:', status.message)
          // Clean up processing status
          setProcessingStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[scanId]
            return newStatus
          })
        }
      } catch (error) {
        console.error('Status polling error:', error)
      }
    }
    
    // Start polling after 2 seconds
    setTimeout(pollStatus, 2000)
  }

  const handleRetryScan = async (scan: Scan) => {
    if (!scan.videoFilename || !newScan.file) {
      alert('Cannot retry: Original video file not found. Please re-upload the video.')
      return
    }

    try {
      console.log(`🔄 Retrying processing for scan: ${scan.name}`)
      
      // Update scan status to pending
      setScans(prev => prev.map(s => 
        s.id === scan.id ? { ...s, status: 'pending' as const } : s
      ))

      // Re-trigger the upload/processing
      const userEmail = localStorage.getItem('user_email') || 'demo@colmap.app'
      const result = await apiClient.uploadVideo(newScan.file, projectId, scan.name, userEmail)
      
      // Update job ID
      setActiveJobIds(prev => ({ ...prev, [scan.id]: result.jobId }))
      
      // Start polling for status updates
      trackProcessingStatus(scan.id, result.jobId)
      
      console.log('✅ Retry initiated successfully')
    } catch (error) {
      console.error('Retry failed:', error)
      alert('Failed to retry processing. Please upload the video again.')
      
      // Revert status back to failed
      setScans(prev => prev.map(s => 
        s.id === scan.id ? { ...s, status: 'failed' as const } : s
      ))
    }
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
      <main className="flex-1">
        {/* Header */}
        <header className="border-b border-gray-700/30 bg-[#000]">
          <div className="flex items-center justify-between px-8 py-6">
            <h1 className="text-2xl font-bold text-white font-mono">
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
                  {scan.thumbnail ? (
                    <img 
                      src={scan.thumbnail} 
                      alt={scan.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-gray-800 flex items-center justify-center"><div class="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center"><svg class="w-10 h-10 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg></div></div>'
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      {/* 3D Model Preview */}
                      <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary-400" />
                      </div>
                    </div>
                  )}
                  </div>

                  {/* Scan Info */}
                <CardContent className="p-4 bg-gray-900">
                  <div className="text-xs text-gray-400 mb-1">
                    {project.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    Updated: <span className="font-mono">{scan.updated}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
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
                  <div className="flex items-center mb-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      scan.status === 'completed' ? 'bg-green-500' :
                      scan.status === 'processing' ? 'bg-yellow-500' :
                      scan.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-xs text-gray-400 capitalize">
                      {scan.status}
                    </span>
                  </div>

                  {/* Progress bar for processing scans */}
                  {scan.status === 'processing' && (
                    <div className="mt-2">
                      <Progress 
                        value={processingStatus[scan.id]?.progress || 0} 
                        indicatorColor="bg-yellow-500"
                        className="h-1.5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {processingStatus[scan.id]?.stage || 'Initializing...'}
                      </p>
                    </div>
                  )}
                  
                  {/* Retry button for failed scans */}
                  {scan.status === 'failed' && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-red-400 mb-2">
                        Processing failed. Please re-upload your video.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsNewScanModalOpen(true)
                        }}
                        className="w-full text-xs"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Re-upload Video
                      </Button>
                    </div>
                  )}
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
                    <p className="text-white mb-2">Drag and drop media or click to browse</p>
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
              Only .mp4 files no larger than 500mb
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