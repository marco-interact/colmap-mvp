import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Mock user database - replace with real database in production
const TEST_USER = {
  id: '1',
  email: 'test@colmap.app',
  password: 'password', // In production, this should be hashed
  name: 'Carlos Martinez',
  role: 'admin' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<User | null> {
  const { email, password } = credentials
  
  // Simple authentication check (replace with real auth in production)
  if (email === TEST_USER.email && password === TEST_USER.password) {
    const { password: _, ...userWithoutPassword } = TEST_USER
    return userWithoutPassword
  }
  
  return null
}

/**
 * Create a session token (simplified - use proper JWT in production)
 */
export function createSessionToken(user: User): string {
  // In production, use proper JWT signing
  return Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64')
}

/**
 * Verify session token and get user
 */
export async function verifySessionToken(token: string): Promise<User | null> {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    // In production, verify JWT signature and expiration
    if (decoded.userId === TEST_USER.id) {
      const { password: _, ...userWithoutPassword } = TEST_USER
      return userWithoutPassword
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Get current user from cookies
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('session-token')?.value
  
  if (!sessionToken) {
    return null
  }
  
  return verifySessionToken(sessionToken)
}

/**
 * Get current user from request (for API routes)
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  const sessionToken = request.cookies.get('session-token')?.value
  
  if (!sessionToken) {
    return null
  }
  
  return verifySessionToken(sessionToken)
}

/**
 * Set session cookie
 */
export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  
  cookieStore.set('session-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete('session-token')
}
