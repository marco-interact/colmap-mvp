import { ColmapViewer } from '@/components/3d/ColmapViewer'

interface ViewerPageProps {
  params: {
    id: string
    scanId: string
  }
}

export default function ViewerPage({ params }: ViewerPageProps) {
  return (
    <div className="w-full h-screen">
      <ColmapViewer 
        projectId={params.id} 
        scanId={params.scanId}
        onClose={() => {
          window.history.back()
        }}
      />
    </div>
  )
}
