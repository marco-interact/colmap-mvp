"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email"
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    
    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Demo login - accept demo credentials or any valid email/password
      if ((formData.email === 'demo@colmap.app' && formData.password === 'demo123') || 
          (formData.email && formData.password.length >= 6)) {
        // Store user session (in production, handle this properly)
        localStorage.setItem('auth_token', 'demo_token')
        localStorage.setItem('user_email', formData.email)
        
        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      setErrors({ submit: "Error al iniciar sesión. Intenta nuevamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Title Area */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center mb-6">
            <div className="w-8 h-8 bg-white rounded-md"></div>
          </div>
          <h1 className="text-3xl font-bold text-primary-400">Colmap App</h1>
        </div>

        {/* Demo Credentials Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Demo Credentials</h3>
            <span className="text-xs text-primary-400 bg-primary-400/10 px-2 py-1 rounded">DEMO</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-800 rounded p-2">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-white font-mono">demo@colmap.app</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('demo@colmap.app')
                  setFormData(prev => ({ ...prev, email: 'demo@colmap.app' }))
                }}
                className="text-primary-400 hover:text-primary-300 text-xs px-2 py-1 rounded border border-primary-400/30 hover:border-primary-300/50"
              >
                Copy
              </button>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800 rounded p-2">
              <div>
                <p className="text-xs text-gray-400">Password</p>
                <p className="text-sm text-white font-mono">demo123</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('demo123')
                  setFormData(prev => ({ ...prev, password: 'demo123' }))
                }}
                className="text-primary-400 hover:text-primary-300 text-xs px-2 py-1 rounded border border-primary-400/30 hover:border-primary-300/50"
              >
                Copy
              </button>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setFormData({ email: 'demo@colmap.app', password: 'demo123' })
            }}
            className="w-full bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:border-primary-500/50 py-2 px-3 rounded text-xs font-medium transition-colors"
          >
            Fill Demo Credentials
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Click individual copy buttons or fill all at once
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="hello@email.com"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                className="w-full"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-400 text-sm text-center">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Iniciando sesión..." : "CONTINUAR"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact administrator
          </p>
        </div>
      </div>
    </div>
  )
}