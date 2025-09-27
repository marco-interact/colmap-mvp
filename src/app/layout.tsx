import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  preload: true
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['monospace'],
  preload: true
})

export const metadata: Metadata = {
  title: 'COLMAP Workspace - 3D Reconstruction Platform',
  description: 'Professional 3D reconstruction and scanning platform powered by COLMAP and Open3D',
  keywords: ['3D reconstruction', 'COLMAP', 'photogrammetry', 'point cloud', 'mesh generation'],
  authors: [{ name: 'COLMAP Workspace Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-gray-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}