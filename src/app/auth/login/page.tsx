'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'test@colmap.app',
      password: 'password'
    }
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
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
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-mono font-bold">
            <span className="text-green-500">Colmap</span>
            <span className="text-white"> App</span>
          </h1>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          className="bg-gray-800 rounded-lg p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="email" className="text-white font-mono text-sm font-bold">
                  Email
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="hola@correo.com"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2 font-mono"
              />
              {errors.email && (
                <p className="text-red-400 text-xs font-mono mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="text-white font-mono text-sm font-bold">
                  Contraseña
                </label>
                <span className="text-gray-400 text-xs font-mono">Mandatory</span>
              </div>
              <input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Contraseña"
                className="w-full bg-transparent border-b border-white text-white placeholder-gray-400 focus:outline-none focus:border-green-500 py-2 font-mono"
              />
              {errors.password && (
                <p className="text-red-400 text-xs font-mono mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-left">
              <a href="#" className="text-gray-400 text-sm font-mono hover:text-white transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-mono font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'CONTINUANDO...' : 'CONTINUAR'}
            </motion.button>
          </form>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div 
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-gray-400 text-sm font-mono">
            Demo: test@colmap.app / password
          </p>
        </motion.div>
      </div>
    </div>
  )
}