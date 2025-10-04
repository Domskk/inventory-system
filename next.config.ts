/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xcgpqgehoshlotwrzrwi.supabase.co',  // Your exact Supabase project hostname
        port: '',  // Empty for default (443)
        pathname: '/storage/v1/object/public/**',  // Matches all public Storage paths (e.g., /item-images/...)
      },
    ],
  },
}

module.exports = nextConfig