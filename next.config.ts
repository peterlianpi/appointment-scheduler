import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable experimental features if needed
  experimental: {
    // Server actions configuration if needed
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
 allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
};

export default nextConfig;
