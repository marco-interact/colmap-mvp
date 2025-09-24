'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'test@domapping.com',
    password: 'password'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Inicio de sesión exitoso')
        router.push('/dashboard')
      } else {
        toast.error(data.message || 'Error en el inicio de sesión')
      }
    } catch (error) {
      toast.error('Error de conexión')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <h1 className="auth-logo">DoMapping</h1>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="email" className="auth-form-label">
              Email
              <span className="mandatory">Mandatory</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="hola@correo.com"
              className="auth-form-input"
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password" className="auth-form-label">
              Contraseña
              <span className="mandatory">Mandatory</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Contraseña"
                className="auth-form-input"
                required
                disabled={isLoading}
              />
            </div>
            <div className="auth-form-hint">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {showPassword ? '🙈 Ocultar' : '👁️ Mostrar'} contraseña
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large btn-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                Iniciando sesión...
              </>
            ) : (
              'CONTINUAR'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              ¿No tienes cuenta?{' '}
              <Link 
                href="/auth/register" 
                style={{ 
                  color: 'var(--brand-primary)', 
                  textDecoration: 'none' 
                }}
              >
                Crear cuenta
              </Link>
            </p>
          </div>

          {/* Demo credentials info */}
          <div style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-primary)'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
              <strong>Demo Credentials:</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Email: test@domapping.com<br />
              Password: password
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
