import { ProductionViewer } from '@/components/viewer/ProductionViewer'

interface ViewerPageProps {
  params: {
    id: string
    scanId: string
  }
}

export default function ViewerPage({ params }: ViewerPageProps) {
  return (
    <div className="w-full h-screen">
      <ProductionViewer 
        projectId={params.id} 
        scanId={params.scanId}
        onClose={() => {
          window.history.back()
        }}
        enableAllFeatures={true}
        autoLoad={true}
      />
    </div>
  )
}
