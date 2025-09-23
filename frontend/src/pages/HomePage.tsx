import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Box, Zap, Users, ArrowRight, Play } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: 'Video Capture',
      description: 'Upload 360° videos or image sequences for 3D reconstruction',
    },
    {
      icon: Box,
      title: '3D Reconstruction',
      description: 'Advanced COLMAP pipeline for high-quality 3D models',
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Optimized algorithms reduce processing time by 60%',
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Share and collaborate on 3D models with your team',
    },
  ];

  const stats = [
    { label: 'Projects Created', value: '1,234' },
    { label: '3D Models Generated', value: '5,678' },
    { label: 'Processing Time Saved', value: '2,340h' },
    { label: 'Active Users', value: '890' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Create Stunning 3D Models
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                From Video
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Transform your videos into detailed 3D models with our advanced photogrammetry platform.
              Perfect for architecture, real estate, and manufacturing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/projects')}
                className="btn btn-primary text-lg px-8 py-4 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Creating
              </button>
              <button
                onClick={() => navigate('/viewer')}
                className="btn btn-outline text-lg px-8 py-4 flex items-center gap-2 border-white text-white hover:bg-white hover:text-blue-600"
              >
                View Examples
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create professional 3D models from video captures
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of users creating amazing 3D models
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Create your first 3D model in minutes
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="btn bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            Create New Project
          </button>
        </div>
      </section>
    </div>
  );
};




