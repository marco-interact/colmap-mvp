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
  let modelUrl = '/models/sample.ply' // Fallback
  let isOptimized = false
  
  if (scan && scan.status === 'completed') {
    // Priority order: Open3D optimized > COLMAP dense > COLMAP mesh > COLMAP sparse
    const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
    
    // Try Open3D optimized models first
    const optimizedPointCloudUrl = `${colmapWorkerUrl}/optimized/${params.id}/pointcloud`
    const optimizedMeshUrl = `${colmapWorkerUrl}/optimized/${params.id}/mesh`
    
    // For demo purposes, we'll use the sample model but in production this would check
    // if optimized models exist and are available
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

  return (
    <div className="w-full h-screen relative">
      {/* Open3D Optimization Status Banner */}
      {!isOptimized && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-blue-600/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <div>
              <div className="font-medium">Open3D Optimization in Progress</div>
              <div className="text-sm opacity-90">Processing your 3D model for optimal web viewing...</div>
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
