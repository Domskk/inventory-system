import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xcgpqgehoshlotwrzrwi.supabase.co',  // Supabase bucket
        port: '',  // Empty for default (443)
        pathname: '/storage/v1/object/public/**', // Path to images
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Stub Node.js modules for client bundles only (fixes 'fs' leak from Tailwind/fast-glob)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        os: false,
        util: false,
      };
    }
    return config;
  },
};

export default nextConfig;