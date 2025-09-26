"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token')
    
    if (token) {
      // Redirect to dashboard if authenticated
      router.push('/dashboard')
    } else {
      // Redirect to login if not authenticated
      router.push('/auth/login')
    }
  }, [router])

  // Show loading screen while redirecting
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mb-6 mx-auto">
          <div className="w-8 h-8 bg-white rounded-md"></div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">COLMAP Workspace</h1>
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto">
        </div>
        <p className="text-gray-400 mt-4">Cargando...</p>
      </div>
    </div>
  )
}