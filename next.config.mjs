/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['framer-motion', 'cedar-os', 'mastra'],
  experimental: {
    esmExternals: 'loose',
  },
}

export default nextConfig
