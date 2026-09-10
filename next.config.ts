import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production"
    ? ".next"
    : `.next-${process.env.PORT || "3001"}`,
  allowedDevOrigins: ["2s24z27j-3001.inc1.devtunnels.ms"],

  // CRITICAL: Memory optimization for dev mode
  experimental: {
    serverActions: {
      allowedOrigins: [
        "2s24z27j-3001.inc1.devtunnels.ms",
        "localhost:3001",
      ],
    },
    // Reduce memory usage during compilation
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'recharts',
      'react-icons',
      'gsap',
      'ag-grid-react',
      'ag-grid-community',
      'ag-grid-enterprise'
    ],
    // Enable turbo mode for faster compilation (optional)
    // turbo: {
    //   resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    // }
  },

  // Reduce webpack memory usage
  webpack: (config, { isServer, dev }) => {
    // Disable source maps in dev to save memory
    if (dev) {
      config.devtool = false;
    }

    // Handle maplibre-gl module resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Reduce parallel processing to save memory
    if (isServer) {
      config.parallelism = 1;
    }

    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
