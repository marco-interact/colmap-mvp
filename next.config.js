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
      console.error('ERROR: No backend URL configured! Set API_URL or NEXT_PUBLIC_API_URL');
      return [];
    }
    console.log('Backend URL for rewrites:', backendUrl);
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
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
  
  // Optimization settings
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;
