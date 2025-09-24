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
  
  if (scan && scan.status === 'completed') {
    // Use the proper model URL based on scan data
    if (scan.models.dense_cloud) {
      modelUrl = getViewerModelUrl(scan.workspace_id, scan.user_id, params.id, params.scanId, 'dense')
    } else if (scan.models.mesh) {
      modelUrl = getViewerModelUrl(scan.workspace_id, scan.user_id, params.id, params.scanId, 'mesh')
    } else if (scan.models.sparse_cloud) {
      modelUrl = getViewerModelUrl(scan.workspace_id, scan.user_id, params.id, params.scanId, 'sparse')
    }
  }

  return (
    <div className="w-full h-screen">
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
