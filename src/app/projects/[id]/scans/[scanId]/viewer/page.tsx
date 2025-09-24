import { SimpleThreeViewer } from '@/components/viewer/SimpleThreeViewer'
import { mockDB } from '@/lib/database/mockDatabase'
import { getViewerModelUrl } from '@/lib/services/fileStorage'

interface ViewerPageProps {
  params: {
    id: string
    scanId: string
  }
}

export default function ViewerPage({ params }: ViewerPageProps) {
  // Get scan data to determine the correct model URL
  const scan = mockDB.getScanById(params.scanId)
  let modelUrl = '/models/sample.ply' // Default fallback
  let isOptimized = false
  
  if (scan && scan.status === 'completed') {
    // For newly created scans, always use the sample model for immediate viewing
    // In production, this would check if actual COLMAP models exist
    const isNewScan = Date.now() - new Date(scan.created_at).getTime() < 5 * 60 * 1000 // Created within last 5 minutes
    
    if (isNewScan) {
      // Use sample model for immediate viewing of new scans
      modelUrl = '/models/sample.ply'
      isOptimized = false
    } else {
      // For older scans, try to use actual COLMAP models
      const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
      
      // Try Open3D optimized models first
      const optimizedPointCloudUrl = `${colmapWorkerUrl}/optimized/${params.id}/pointcloud`
      const optimizedMeshUrl = `${colmapWorkerUrl}/optimized/${params.id}/mesh`
      
      // Check if actual COLMAP models exist
      if (scan.models.dense_cloud) {
        modelUrl = getViewerModelUrl(scan.workspace_id, scan.user_id, params.id, params.scanId, 'dense')
        isOptimized = false // Will be optimized by Open3D in background
      } else if (scan.models.mesh) {
        modelUrl = getViewerModelUrl(scan.workspace_id, scan.user_id, params.id, params.scanId, 'mesh')
        isOptimized = false
      } else if (scan.models.sparse_cloud) {
        modelUrl = getViewerModelUrl(scan.workspace_id, scan.user_id, params.id, params.scanId, 'sparse')
        isOptimized = false
      }
    }
  }

  return (
    <div className="w-full h-screen relative">
      {/* Processing Status Banner */}
      {!isOptimized && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <div>
              <div className="font-medium">
                {scan && Date.now() - new Date(scan.created_at).getTime() < 5 * 60 * 1000 
                  ? 'COLMAP Processing in Progress' 
                  : 'Open3D Optimization in Progress'
                }
              </div>
              <div className="text-sm opacity-90">
                {scan && Date.now() - new Date(scan.created_at).getTime() < 5 * 60 * 1000
                  ? 'Generating 3D model from your video...'
                  : 'Processing your 3D model for optimal web viewing...'
                }
              </div>
            </div>
          </div>
        </div>
      )}
      
      <SimpleThreeViewer 
        projectId={params.id} 
        scanId={params.scanId}
        modelUrl={modelUrl}
        onClose={() => {
          window.history.back()
        }}
        className="w-full h-full"
      />
    </div>
  )
}
