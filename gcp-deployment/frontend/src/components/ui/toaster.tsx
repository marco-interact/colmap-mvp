'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

export const toast = {
  success: (message: string, duration = 5000) => addToast({ message, type: 'success', duration }),
  error: (message: string, duration = 5000) => addToast({ message, type: 'error', duration }),
  warning: (message: string, duration = 5000) => addToast({ message, type: 'warning', duration }),
  info: (message: string, duration = 5000) => addToast({ message, type: 'info', duration }),
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2)
  const newToast = { ...toast, id }
  toasts = [...toasts, newToast]
  
  listeners.forEach(listener => listener(toasts))
  
  if (toast.duration) {
    setTimeout(() => removeToast(id), toast.duration)
  }
}

function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id)
  listeners.forEach(listener => listener(toasts))
}

export function Toaster() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToastList)
    return () => {
      listeners = listeners.filter(listener => listener !== setToastList)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map(toast => (
        <div
          key={toast.id}
          className={cn(
            'toast flex items-center justify-between min-w-[300px] animate-slide-up',
            `toast-${toast.type}`
          )}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
