import { create } from 'zustand'
import * as THREE from 'three'

export interface ModelAsset {
  id: string
  type: 'sparse' | 'dense' | 'mesh' | 'texture'
  url: string
  filename: string
  size: number
  status: 'available' | 'loading' | 'loaded' | 'error'
}

export interface MeasurementPoint {
  id: string
  position: THREE.Vector3
  label?: string
}

export interface Measurement {
  id: string
  type: 'distance' | 'area'
  points: MeasurementPoint[]
  value: number
  unit: string
  label?: string
}

export interface ViewerSettings {
  pointSize: number
  pointDensity: number
  backgroundColor: string
  showSparseCloud: boolean
  showDenseCloud: boolean
  showMesh: boolean
  showTexture: boolean
  showMeasurements: boolean
  autoRotate: boolean
  showStats: boolean
}

export interface CameraState {
  position: [number, number, number]
  target: [number, number, number]
  zoom: number
}

export interface ViewerState {
  // Assets
  assets: ModelAsset[]
  currentAsset: ModelAsset | null
  loadingProgress: number
  
  // Scene objects
  pointCloud: THREE.Points | null
  mesh: THREE.Mesh | null
  
  // Camera
  cameraState: CameraState
  
  // Measurements
  measurements: Measurement[]
  activeMeasurement: Measurement | null
  measurementMode: 'distance' | 'area' | null
  
  // UI State
  settings: ViewerSettings
  isLoading: boolean
  error: string | null
  
  // Performance
  stats: {
    fps: number
    memory: number
    triangles: number
    points: number
  }
}

export interface ViewerActions {
  // Asset management
  setAssets: (assets: ModelAsset[]) => void
  loadAsset: (asset: ModelAsset) => Promise<void>
  setLoadingProgress: (progress: number) => void
  
  // Scene management
  setPointCloud: (pointCloud: THREE.Points | null) => void
  setMesh: (mesh: THREE.Mesh | null) => void
  
  // Camera
  setCameraState: (state: Partial<CameraState>) => void
  resetCamera: () => void
  
  // Measurements
  startMeasurement: (type: 'distance' | 'area') => void
  addMeasurementPoint: (point: MeasurementPoint) => void
  completeMeasurement: () => void
  deleteMeasurement: (id: string) => void
  toggleMeasurements: () => void
  
  // Settings
  updateSettings: (settings: Partial<ViewerSettings>) => void
  
  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Performance
  updateStats: (stats: Partial<ViewerState['stats']>) => void
  
  // Reset
  reset: () => void
}

const defaultCameraState: CameraState = {
  position: [10, 10, 10],
  target: [0, 0, 0],
  zoom: 1
}

const defaultSettings: ViewerSettings = {
  pointSize: 2.0,
  pointDensity: 1.0,
  backgroundColor: '#1a1a1a',
  showSparseCloud: true,
  showDenseCloud: true,
  showMesh: true,
  showTexture: true,
  showMeasurements: true,
  autoRotate: false,
  showStats: false
}

const defaultStats = {
  fps: 60,
  memory: 0,
  triangles: 0,
  points: 0
}

export const useViewerStore = create<ViewerState & ViewerActions>((set, get) => ({
  // Initial state
  assets: [],
  currentAsset: null,
  loadingProgress: 0,
  pointCloud: null,
  mesh: null,
  cameraState: defaultCameraState,
  measurements: [],
  activeMeasurement: null,
  measurementMode: null,
  settings: defaultSettings,
  isLoading: false,
  error: null,
  stats: defaultStats,
  
  // Actions
  setAssets: (assets) => set({ assets }),
  
  loadAsset: async (asset) => {
    set({ isLoading: true, error: null, currentAsset: asset })
    try {
      // Update asset status to loading
      const updatedAssets = get().assets.map(a => 
        a.id === asset.id ? { ...a, status: 'loading' as const } : a
      )
      set({ assets: updatedAssets })
      
      // Asset loading logic will be implemented in the viewer component
      // This is just state management
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load asset',
        isLoading: false 
      })
    }
  },
  
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  setPointCloud: (pointCloud) => set({ pointCloud }),
  
  setMesh: (mesh) => set({ mesh }),
  
  setCameraState: (state) => set({ 
    cameraState: { ...get().cameraState, ...state } 
  }),
  
  resetCamera: () => set({ cameraState: defaultCameraState }),
  
  startMeasurement: (type) => set({ 
    measurementMode: type,
    activeMeasurement: {
      id: `measurement_${Date.now()}`,
      type,
      points: [],
      value: 0,
      unit: type === 'distance' ? 'm' : 'm²'
    }
  }),
  
  addMeasurementPoint: (point) => {
    const { activeMeasurement } = get()
    if (!activeMeasurement) return
    
    const updatedMeasurement = {
      ...activeMeasurement,
      points: [...activeMeasurement.points, point]
    }
    
    set({ activeMeasurement: updatedMeasurement })
  },
  
  completeMeasurement: () => {
    const { activeMeasurement, measurements } = get()
    if (!activeMeasurement || activeMeasurement.points.length < 2) return
    
    // Calculate measurement value
    let value = 0
    if (activeMeasurement.type === 'distance' && activeMeasurement.points.length >= 2) {
      const p1 = activeMeasurement.points[0].position
      const p2 = activeMeasurement.points[1].position
      value = p1.distanceTo(p2)
    }
    
    const completedMeasurement = {
      ...activeMeasurement,
      value
    }
    
    set({
      measurements: [...measurements, completedMeasurement],
      activeMeasurement: null,
      measurementMode: null
    })
  },
  
  deleteMeasurement: (id) => {
    const measurements = get().measurements.filter(m => m.id !== id)
    set({ measurements })
  },
  
  toggleMeasurements: () => {
    const settings = get().settings
    set({ 
      settings: { 
        ...settings, 
        showMeasurements: !settings.showMeasurements 
      }
    })
  },
  
  updateSettings: (newSettings) => {
    const settings = get().settings
    set({ settings: { ...settings, ...newSettings } })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  updateStats: (newStats) => {
    const stats = get().stats
    set({ stats: { ...stats, ...newStats } })
  },
  
  reset: () => set({
    assets: [],
    currentAsset: null,
    loadingProgress: 0,
    pointCloud: null,
    mesh: null,
    cameraState: defaultCameraState,
    measurements: [],
    activeMeasurement: null,
    measurementMode: null,
    settings: defaultSettings,
    isLoading: false,
    error: null,
    stats: defaultStats
  })
}))
