// Shared mock data for development and demo purposes

// Global scans array that both APIs will use
export let scans: any[] = [
  {
    id: '1',
    name: 'Demo Scan',
    project_id: '1',
    status: 'completed',
    thumbnail: null,
    model_url: '/models/sample.ply',
    processing_options: {
      quality: 'high',
      meshing: true,
      dense_reconstruction: true
    },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
]

// Helper functions for scan management
export function addScan(scan: any) {
  scans.push(scan)
  return scan
}

export function getScansByProject(projectId: string) {
  return scans.filter(scan => scan.project_id === projectId)
}

export function updateScan(scanId: string, updates: any) {
  const index = scans.findIndex(scan => scan.id === scanId)
  if (index !== -1) {
    scans[index] = { ...scans[index], ...updates }
    return scans[index]
  }
  return null
}

export function getNextScanId(): string {
  return (scans.length + 1).toString()
}
