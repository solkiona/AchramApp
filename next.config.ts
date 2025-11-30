
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

  experimental: {
    // reactCompiler: false,
  },
 
};

export default nextConfig;
