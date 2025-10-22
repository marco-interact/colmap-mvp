"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap
} from "lucide-react"

interface ProcessingStatusProps {
  scanId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  onCancel?: () => void
  onRetry?: () => void
  className?: string
}

export function ProcessingStatus({
  scanId,
  status,
  progress,
  message,
  onCancel,
  onRetry,
  className = ""
}: ProcessingStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Calculate elapsed time
  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsedTime(0)
    }
  }, [status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing':
        return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500/20 bg-yellow-500/5'
      case 'processing':
        return 'border-blue-500/20 bg-blue-500/5'
      case 'completed':
        return 'border-green-500/20 bg-green-500/5'
      case 'failed':
        return 'border-red-500/20 bg-red-500/5'
      default:
        return 'border-gray-500/20 bg-gray-500/5'
    }
  }

  const getProgressColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className={`p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">
            {status === 'pending' && 'Waiting to start'}
            {status === 'processing' && 'Processing...'}
            {status === 'completed' && 'Completed'}
            {status === 'failed' && 'Failed'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {status === 'processing' && (
            <span className="text-xs text-gray-500">
              {formatTime(elapsedTime)}
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="text-sm text-gray-600 mb-3">
        {message}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Scan ID:</span>
              <span className="ml-2 font-mono">{scanId}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 capitalize">{status}</span>
            </div>
            {status === 'processing' && (
              <>
                <div>
                  <span className="text-gray-500">Elapsed:</span>
                  <span className="ml-2">{formatTime(elapsedTime)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <span className="ml-2">{Math.round(progress)}%</span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {status === 'processing' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                <Square className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            )}
            
            {status === 'failed' && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            
            {status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                View Results
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}