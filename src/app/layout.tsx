import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Colmap App - 3D Reconstruction Platform',
  description: 'Professional 3D reconstruction platform powered by COLMAP. Transform videos into detailed 3D models with advanced Structure-from-Motion and Multi-View Stereo algorithms.',
  keywords: ['3D reconstruction', 'COLMAP', 'photogrammetry', 'SfM', 'MVS', 'point cloud', 'mesh'],
  authors: [{ name: 'Colmap App Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#4ECDC4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
