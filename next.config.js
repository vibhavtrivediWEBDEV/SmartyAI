/** @type {import('next').NextConfig} */const nextConfig = {
  distDir: process.env.NODE_ENV === 'production'
    ? '.next'
    : `.next-${process.env.PORT || '3001'}`,
   eslint: {
    ignoreDuringBuilds: true,
  },
   typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false, // Disable this to prevent double renders in dev

  images: {
    domains: ['i.pinimg.com','oaidalleapiprodscus.blob.core.windows.net','framerusercontent.com','images.unsplash.com','media.licdn.com'],
  },

  webpack: (config, { isServer }) => {
    // Handle maplibre-gl module resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig