/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Enable webpack 5 polyfills for Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // Environment variables for build
  env: {
    COLMAP_WORKER_URL: process.env.COLMAP_WORKER_URL || 'https://colmap-app-525587424361.us-central1.run.app',
  },
  // Google Cloud Run specific configuration
  trailingSlash: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
};

module.exports = nextConfig;
