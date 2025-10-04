/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
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
}

module.exports = nextConfig