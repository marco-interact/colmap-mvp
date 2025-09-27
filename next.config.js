/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Optimize static assets and fonts
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  generateEtags: false,
  poweredByHeader: false,
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
    NEXT_PUBLIC_COLMAP_WORKER_URL: process.env.NEXT_PUBLIC_COLMAP_WORKER_URL || null,
  },
  // Google Cloud Run specific configuration
  trailingSlash: false,
  compress: true,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Ensure proper HTML standards mode
  poweredByHeader: false,
  generateEtags: false
};

module.exports = nextConfig;
