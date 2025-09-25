'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'test@colmap.app',
    password: 'password'
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        router.push('/dashboard')
      } else {
        alert('Login failed')
      }
    } catch (error) {
      alert('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mono font-bold text-green-500">Colmap App</h1>
        </div>
        
        {/* Login Card */}
        <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="email" className="text-white font-mono text-sm">
                  Email
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="hola@correo.com"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                required
              />
            </div>
            
            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="text-white font-mono text-sm">
                  Contraseña
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Contraseña"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2"
                required
              />
            </div>
            
            {/* Forgot Password Link */}
            <div className="text-left">
              <a href="#" className="text-gray-400 text-sm font-mono hover:text-white transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'CONTINUANDO...' : 'CONTINUAR'}
            </button>
          </form>
        </div>
        
        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm font-mono">
            Demo: test@colmap.app / password
          </p>
        </div>
      </div>
    </div>
  )
}