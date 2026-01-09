
import type { NextConfig } from "next";
import withPWA from "next-pwa";
import path from "path"

const nextConfig: NextConfig = {
  images: {
  remotePatterns: [
    { hostname: 'localhost' },
    { hostname: 'app.achrams.com.ng' },
    { hostname: 'api.achrams.com.ng' },
    { hostname: 'ride.achrams.com.ng' },
    { hostname: 'book.achrams.com.ng' },
  ],
},
  typescript: {
    ignoreBuildErrors: true,
  },
   turbopack: {
    root: path.join(__dirname),
  },

  experimental: {
    // reactCompiler: false,
  },
 
};

// PWA Configuration
const withPWANextConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);

export default withPWANextConfig;
// export default nextConfig;
