"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Download, 
  Camera, 
  Settings, 
  BarChart3, 
  Target,
  Zap,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import open3dApi, { 
  PointCloudStats, 
  ColormapOptions, 
  DownsampleOptions,
  NormalEstimationOptions,
  OutlierRemovalOptions,
  MeshCreationOptions,
  RenderOptions
} from '@/lib/open3d-api'

interface Open3DToolsProps {
  scanId: string
  onStatsUpdate?: (stats: PointCloudStats) => void
  onImageGenerated?: (imageUrl: string) => void
  onMeshGenerated?: (meshUrl: string) => void
  className?: string
}

export function Open3DTools({ 
  scanId, 
  onStatsUpdate, 
  onImageGenerated, 
  onMeshGenerated,
  className = "" 
}: Open3DToolsProps) {
  const [stats, setStats] = useState<PointCloudStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'processing' | 'export'>('stats')

  // Load point cloud statistics
  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const statsData = await open3dApi.getPointCloudStats(scanId)
      setStats(statsData)
      onStatsUpdate?.(statsData)
    } catch (err) {
      setError('Failed to load point cloud statistics')
      console.error('Stats loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Apply colormap
  const applyColormap = async (type: ColormapOptions['type']) => {
    try {
      setLoading(true)
      const result = await open3dApi.applyColormap(scanId, { type })
      if (result.success) {
        await loadStats() // Refresh stats
      }
    } catch (err) {
      setError('Failed to apply colormap')
      console.error('Colormap error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Downsample point cloud
  const downsamplePointCloud = async (voxelSize: number) => {
    try {
      setLoading(true)
      const result = await open3dApi.downsamplePointCloud(scanId, { voxelSize })
      if (result.success) {
        await loadStats() // Refresh stats
      }
    } catch (err) {
      setError('Failed to downsample point cloud')
      console.error('Downsample error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Estimate normals
  const estimateNormals = async () => {
    try {
      setLoading(true)
      const result = await open3dApi.estimateNormals(scanId, { radius: 0.1, maxNeighbors: 30 })
      if (result.success) {
        await loadStats() // Refresh stats
      }
    } catch (err) {
      setError('Failed to estimate normals')
      console.error('Normal estimation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Remove outliers
  const removeOutliers = async () => {
    try {
      setLoading(true)
      const result = await open3dApi.removeOutliers(scanId, { nbNeighbors: 20, stdRatio: 2.0 })
      if (result.success) {
        await loadStats() // Refresh stats
      }
    } catch (err) {
      setError('Failed to remove outliers')
      console.error('Outlier removal error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create mesh
  const createMesh = async (method: 'poisson' | 'ball_pivoting') => {
    try {
      setLoading(true)
      const result = await open3dApi.createMesh(scanId, { method })
      if (result.success && result.meshUrl) {
        onMeshGenerated?.(result.meshUrl)
      }
    } catch (err) {
      setError('Failed to create mesh')
      console.error('Mesh creation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Render to image
  const renderToImage = async () => {
    try {
      setLoading(true)
      const result = await open3dApi.renderToImage(scanId, { 
        width: 1920, 
        height: 1080 
      })
      if (result.success && result.imageUrl) {
        onImageGenerated?.(result.imageUrl)
      }
    } catch (err) {
      setError('Failed to render image')
      console.error('Render error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load stats on mount
  useEffect(() => {
    if (scanId) {
      loadStats()
    }
  }, [scanId])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        <Button
          variant={activeTab === 'stats' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('stats')}
          className="flex-1"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Statistics
        </Button>
        <Button
          variant={activeTab === 'processing' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('processing')}
          className="flex-1"
        >
          <Settings className="w-4 h-4 mr-2" />
          Processing
        </Button>
        <Button
          variant={activeTab === 'export' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('export')}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Point Cloud Statistics
              <Button
                variant="ghost"
                size="sm"
                onClick={loadStats}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Points:</span>
                    <div className="font-mono">{stats.pointCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Density:</span>
                    <div className="font-mono">{stats.density.toFixed(2)} pts/m³</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Dimensions:</span>
                    <div className="font-mono text-xs">
                      {stats.dimensions.map(d => d.toFixed(2)).join(' × ')}m
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Centroid:</span>
                    <div className="font-mono text-xs">
                      {stats.centroid.map(c => c.toFixed(2)).join(', ')}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-4">
                {loading ? 'Loading statistics...' : 'No statistics available'}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Tab */}
      {activeTab === 'processing' && (
        <div className="space-y-4">
          {/* Colormap Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Colormap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {['jet', 'viridis', 'plasma', 'inferno', 'magma', 'turbo'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => applyColormap(type as ColormapOptions['type'])}
                    disabled={loading}
                    className="text-xs"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Processing Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downsamplePointCloud(0.05)}
                  disabled={loading}
                  className="w-full justify-start"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Downsample (0.05m)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={estimateNormals}
                  disabled={loading}
                  className="w-full justify-start"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Estimate Normals
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeOutliers}
                  disabled={loading}
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Outliers
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mesh Creation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Mesh Creation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => createMesh('poisson')}
                disabled={loading}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Poisson Reconstruction
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => createMesh('ball_pivoting')}
                disabled={loading}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Ball Pivoting
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                High-Resolution Screenshot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={renderToImage}
                disabled={loading}
                className="w-full justify-start"
              >
                <Camera className="w-4 h-4 mr-2" />
                Render 1920×1080 Image
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
