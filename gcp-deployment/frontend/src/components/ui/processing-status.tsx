'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface ProcessingJob {
  job_id: string
  type: 'frame_extraction' | 'reconstruction'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  message?: string
}

interface ProcessingStatusProps {
  scanId: string
  projectId: string
  jobs: ProcessingJob[]
  onStatusUpdate?: (status: string, jobs: ProcessingJob[]) => void
}

export function ProcessingStatus({ scanId, projectId, jobs, onStatusUpdate }: ProcessingStatusProps) {
  const [currentJobs, setCurrentJobs] = useState<ProcessingJob[]>(jobs)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    // Start polling for updates if there are active jobs
    const hasActiveJobs = currentJobs.some(job => 
      job.status === 'pending' || job.status === 'running'
    )
    
    if (hasActiveJobs && !isPolling) {
      startPolling()
    }
  }, [currentJobs])

  const startPolling = () => {
    setIsPolling(true)
    const interval = setInterval(async () => {
      try {
        // Poll each active job
        const updatedJobs = await Promise.all(
          currentJobs.map(async (job) => {
            if (job.status === 'pending' || job.status === 'running') {
              const response = await fetch(`/api/colmap/jobs/${job.job_id}`)
              if (response.ok) {
                const data = await response.json()
                return {
                  ...job,
                  status: data.status,
                  progress: data.progress,
                  message: data.message
                }
              }
            }
            return job
          })
        )
        
        setCurrentJobs(updatedJobs)
        
        // Check if all jobs are done
        const hasActiveJobs = updatedJobs.some(job => 
          job.status === 'pending' || job.status === 'running'
        )
        
        if (!hasActiveJobs) {
          clearInterval(interval)
          setIsPolling(false)
          
          // Determine overall status
          const allCompleted = updatedJobs.every(job => job.status === 'completed')
          const anyFailed = updatedJobs.some(job => job.status === 'failed')
          
          const overallStatus = anyFailed ? 'failed' : allCompleted ? 'completed' : 'processing'
          onStatusUpdate?.(overallStatus, updatedJobs)
        }
        
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }, 2000) // Poll every 2 seconds
  }

  const getJobIcon = (job: ProcessingJob) => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle size={16} className="text-success" />
      case 'failed':
        return <AlertCircle size={16} className="text-error" />
      case 'running':
        return <Play size={16} className="text-info" />
      default:
        return <Clock size={16} className="text-warning" />
    }
  }

  const getJobLabel = (type: string) => {
    switch (type) {
      case 'frame_extraction':
        return 'Extrayendo frames'
      case 'reconstruction':
        return 'Reconstrucción 3D'
      default:
        return type
    }
  }

  const getOverallProgress = () => {
    if (currentJobs.length === 0) return 0
    
    const totalProgress = currentJobs.reduce((sum, job) => {
      return sum + (job.progress || 0)
    }, 0)
    
    return Math.round(totalProgress / currentJobs.length)
  }

  const overallProgress = getOverallProgress()

  return (
    <div className="processing-status">
      <div className="processing-header">
        <h4>Estado del Procesamiento</h4>
        <div className="processing-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="progress-text">{overallProgress}%</span>
        </div>
      </div>
      
      <div className="processing-jobs">
        {currentJobs.map((job) => (
          <div key={job.job_id} className="processing-job">
            <div className="job-info">
              {getJobIcon(job)}
              <span className="job-label">{getJobLabel(job.type)}</span>
            </div>
            <div className="job-status">
              {job.status === 'running' && job.progress && (
                <span className="job-progress">{job.progress}%</span>
              )}
              <span className={`status-badge ${job.status}`}>
                {job.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons for completed scans */}
      {currentJobs.every(job => job.status === 'completed') && (
        <div className="processing-actions">
          <button className="btn btn-ghost btn-sm">
            <Eye size={16} />
            Ver 3D
          </button>
          <button className="btn btn-ghost btn-sm">
            <Download size={16} />
            Descargar
          </button>
        </div>
      )}
    </div>
  )
}

// Add CSS for the processing status component
const processingStatusStyles = `
.processing-status {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.processing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.processing-header h4 {
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.processing-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-bar {
  width: 80px;
  height: 6px;
  background: var(--bg-primary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--brand-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 30px;
}

.processing-jobs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.processing-job {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
}

.job-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.job-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.job-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.job-progress {
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.processing-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-primary);
}

.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
}
`

// Inject styles (in a real app, this would be in your CSS file)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = processingStatusStyles
  document.head.appendChild(styleSheet)
}
