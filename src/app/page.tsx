import Link from 'next/link'
import { ArrowRight, Box, Upload, Eye, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-brand-primary/10 rounded-full">
              <Box className="w-16 h-16 text-brand-primary" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-text-primary via-brand-primary to-text-primary bg-clip-text text-transparent">
            DoMapping
          </h1>
          
          <p className="text-xl text-text-secondary mb-8 leading-relaxed">
            Professional 3D reconstruction platform powered by COLMAP. Transform videos into 
            detailed 3D models with advanced Structure-from-Motion and Multi-View Stereo algorithms.
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Button asChild size="lg" className="px-8">
              <Link href="/auth/login">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/demo">
                View Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="card card-hover text-center">
            <div className="flex justify-center mb-4">
              <Upload className="w-12 h-12 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Video Upload</h3>
            <p className="text-text-secondary">
              Upload 360° videos and let our COLMAP pipeline extract frames 
              and process them for 3D reconstruction.
            </p>
          </div>

          <div className="card card-hover text-center">
            <div className="flex justify-center mb-4">
              <Zap className="w-12 h-12 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Processing</h3>
            <p className="text-text-secondary">
              Advanced COLMAP 3.12.6 algorithms for feature extraction, 
              matching, and dense reconstruction.
            </p>
          </div>

          <div className="card card-hover text-center">
            <div className="flex justify-center mb-4">
              <Eye className="w-12 h-12 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3D Viewer</h3>
            <p className="text-text-secondary">
              Interactive WebGL viewer with measurement tools and 
              collaborative features for exploring 3D models.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border-primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Creating?</h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of professionals using DoMapping for architectural 
            documentation, site surveys, and 3D model creation.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/register">
              Create Free Account
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
