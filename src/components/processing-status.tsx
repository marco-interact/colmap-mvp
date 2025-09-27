"use client"

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient, isDemoMode, type ProcessingJob } from '@/lib/api'

interface ProcessingStatusProps {
  jobId: string
  onComplete?: (results: ProcessingJob['results']) => void
  className?: string
}

export function ProcessingStatus({ jobId, onComplete, className }: ProcessingStatusProps) {
  const [job, setJob] = useState<ProcessingJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    const pollStatus = async () => {
      try {
        const status = await apiClient.getJobStatus(jobId)
        setJob(status)
        setLoading(false)

        // Call onComplete when job finishes
        if (status.status === 'completed' && onComplete && status.results) {
          onComplete(status.results)
        }

        // Stop polling when job is done
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error)
        setLoading(false)
      }
    }

    // Initial fetch
    pollStatus()

    // Poll every 5 seconds if still processing
    pollInterval = setInterval(pollStatus, 5000)

    return () => clearInterval(pollInterval)
  }, [jobId, onComplete])

  if (loading) {
    return (
      <Card className={`bg-gray-900/50 border-gray-800 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            <span className="ml-2 text-gray-300">Loading status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!job) {
    return (
      <Card className={`bg-gray-900/50 border-gray-800 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Unable to load processing status</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'processing': return 'text-primary-400'
      case 'pending': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card className={`bg-gray-900/50 border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {getStatusIcon()}
          <span className={`ml-2 ${getStatusColor()}`}>
            Processing Status
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Stage */}
        {job.currentStage && (
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Stage</p>
            <p className="text-white font-medium">{job.currentStage}</p>
          </div>
        )}

        {/* Progress Bar */}
        {job.progress !== undefined && job.status === 'processing' && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Processing Stage Progress */}
        {job.status === 'processing' && (
          <div>
            <p className="text-sm text-gray-400 mb-1">Processing</p>
            <p className="text-white">Please wait...</p>
          </div>
        )}

        {/* Status Message */}
        <div>
          <p className="text-sm text-gray-400 mb-1">Status</p>
          <p className={`${getStatusColor()}`}>{job.message}</p>
        </div>

        {/* Demo Mode Indicator */}
        {isDemoMode() && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
            <p className="text-blue-300 text-sm">
              📋 <strong>Demo Mode:</strong> This is a simulated processing job. 
              In production, this would show real COLMAP processing progress.
            </p>
          </div>
        )}

        {/* Results (when completed) */}
        {job.status === 'completed' && job.results && (
          <div className="mt-4 p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
            <p className="text-green-300 font-medium mb-2">✅ Processing Complete!</p>
            <div className="space-y-2 text-sm">
              {job.results.point_cloud_url && (
                <p className="text-gray-300">• Point cloud generated</p>
              )}
              {job.results.mesh_url && (
                <p className="text-gray-300">• 3D mesh created</p>
              )}
              {job.results.thumbnail_url && (
                <p className="text-gray-300">• Preview thumbnail ready</p>
              )}
            </div>
          </div>
        )}

        {/* Error (when failed) */}
        {job.status === 'failed' && (
          <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
            <p className="text-red-300 font-medium">❌ Processing Failed</p>
            <p className="text-gray-300 text-sm mt-1">
              Please try uploading your video again or contact support if the issue persists.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
