/** @type {import('next').NextConfig} */
const nextConfig = {
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
}

module.exports = nextConfig