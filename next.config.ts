
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'localhost', 
      'app.achrams.com.ng', 
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint errors during build (test deployments only!)
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    // reactCompiler: false,
  },
 
};

export default nextConfig;
