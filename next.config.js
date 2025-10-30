/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking and linting during build (for faster builds)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Proxy backend API calls through Next.js
  async rewrites() {
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!backendUrl) {
      // Don't error during build - just skip rewrites if URL not set
      console.warn('WARNING: No backend URL configured. Set NEXT_PUBLIC_API_URL for API rewrites.');
      return [];
    }
    console.log('Backend URL for rewrites:', backendUrl);
    return [
      {
        source: '/api/backend/demo-resources/:path*',
        destination: `${backendUrl}/demo-resources/:path*`,
      },
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
  
  // Enable webpack 5 polyfills for Node.js modules
  webpack: (config, { isServer }) => {
    // Add path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    
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
  
  // Optimization settings
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;
